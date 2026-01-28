#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Job Worker - Quelyos ERP

Worker pour traiter les jobs en arrière-plan.

Usage:
    python scripts/job-worker.py [options]

Options:
    --queue QUEUE    File à traiter (default: default)
    --concurrency N  Nombre de workers parallèles (default: 4)
    --once           Traiter un seul job et quitter
"""

import os
import sys
import json
import time
import signal
import logging
import argparse
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from typing import Optional

# Ajouter le path Odoo
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'odoo-backend'))

# Configuration logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
_logger = logging.getLogger('job-worker')

# Configuration
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/1')
JOB_QUEUE_PREFIX = 'quelyos:jobs:'
POLL_INTERVAL = 1  # secondes


class JobWorker:
    """Worker pour traiter les jobs de la file"""

    def __init__(self, queue: str = 'default', concurrency: int = 4):
        self.queue = queue
        self.concurrency = concurrency
        self.running = True
        self._redis = None
        self._executor = None
        self._handlers = {}

        self._init_redis()
        self._load_handlers()

    def _init_redis(self):
        """Initialise la connexion Redis"""
        try:
            import redis
            self._redis = redis.from_url(REDIS_URL)
            self._redis.ping()
            _logger.info(f"Connected to Redis: {REDIS_URL}")
        except Exception as e:
            _logger.error(f"Redis connection failed: {e}")
            sys.exit(1)

    def _load_handlers(self):
        """Charge les handlers de jobs"""
        # Import du module job_queue pour charger les handlers
        try:
            # Essayer d'importer depuis le module Odoo
            sys.path.insert(0, os.path.join(
                os.path.dirname(__file__), '..',
                'odoo-backend', 'addons', 'quelyos_api', 'lib'
            ))
            from job_queue import JobRegistry
            self._handlers = JobRegistry._handlers
            _logger.info(f"Loaded {len(self._handlers)} job handlers")
        except ImportError as e:
            _logger.warning(f"Could not load handlers from job_queue: {e}")
            # Handlers par défaut
            self._handlers = {
                'send_email': self._default_handler,
                'generate_report': self._default_handler,
                'sync_inventory': self._default_handler,
            }

    def _default_handler(self, payload):
        """Handler par défaut"""
        _logger.info(f"Default handler processing: {payload}")
        return {'status': 'processed'}

    def start(self):
        """Démarre le worker"""
        _logger.info(f"Starting worker for queue '{self.queue}' with {self.concurrency} threads")

        # Gérer les signaux d'arrêt
        signal.signal(signal.SIGTERM, self._handle_shutdown)
        signal.signal(signal.SIGINT, self._handle_shutdown)

        self._executor = ThreadPoolExecutor(max_workers=self.concurrency)

        while self.running:
            try:
                job = self._fetch_job()
                if job:
                    self._executor.submit(self._process_job, job)
                else:
                    time.sleep(POLL_INTERVAL)
            except Exception as e:
                _logger.error(f"Worker error: {e}")
                time.sleep(POLL_INTERVAL)

        self._executor.shutdown(wait=True)
        _logger.info("Worker stopped")

    def process_one(self) -> bool:
        """Traite un seul job et retourne"""
        job = self._fetch_job()
        if job:
            self._process_job(job)
            return True
        return False

    def _fetch_job(self) -> Optional[dict]:
        """Récupère le prochain job de la file"""
        queue_key = f"{JOB_QUEUE_PREFIX}queue:{self.queue}"

        # Récupérer le job avec le score le plus bas (plus haute priorité)
        now = datetime.utcnow().timestamp()
        result = self._redis.zrangebyscore(queue_key, '-inf', now, start=0, num=1)

        if not result:
            return None

        job_id = result[0].decode() if isinstance(result[0], bytes) else result[0]

        # Retirer de la file
        removed = self._redis.zrem(queue_key, job_id)
        if not removed:
            return None  # Un autre worker l'a pris

        # Récupérer les données du job
        job_key = f"{JOB_QUEUE_PREFIX}{job_id}"
        job_data = self._redis.get(job_key)

        if not job_data:
            return None

        return json.loads(job_data)

    def _process_job(self, job: dict):
        """Traite un job"""
        job_id = job['id']
        job_type = job['type']

        _logger.info(f"Processing job {job_id} ({job_type})")

        # Mettre à jour le statut
        job['status'] = 'running'
        job['started_at'] = datetime.utcnow().isoformat()
        self._save_job(job)

        handler = self._handlers.get(job_type)
        if not handler:
            _logger.error(f"No handler for job type: {job_type}")
            job['status'] = 'failed'
            job['error'] = f"No handler for job type: {job_type}"
            self._save_job(job)
            return

        try:
            # Exécuter avec timeout
            payload = job.get('payload', {})

            # Si payload contient args/kwargs (via décorateur async_job)
            if 'args' in payload and 'kwargs' in payload:
                result = handler(*payload['args'], **payload['kwargs'])
            else:
                result = handler(payload)

            job['status'] = 'completed'
            job['result'] = result
            job['completed_at'] = datetime.utcnow().isoformat()

            _logger.info(f"Job {job_id} completed successfully")

        except Exception as e:
            _logger.error(f"Job {job_id} failed: {e}")
            job['error'] = str(e)

            if job['retry_count'] < job['max_retries']:
                job['status'] = 'retrying'
                job['retry_count'] += 1
                # Remettre en file avec délai exponentiel
                delay = 2 ** job['retry_count'] * 60  # 2, 4, 8 minutes...
                self._requeue_job(job, delay)
            else:
                job['status'] = 'failed'

        self._save_job(job)

    def _save_job(self, job: dict):
        """Sauvegarde l'état du job"""
        job_key = f"{JOB_QUEUE_PREFIX}{job['id']}"
        self._redis.setex(job_key, 86400 * 7, json.dumps(job))

    def _requeue_job(self, job: dict, delay: int):
        """Remet un job en file avec délai"""
        queue_key = f"{JOB_QUEUE_PREFIX}queue:{job['queue']}"
        score = datetime.utcnow().timestamp() + delay
        self._redis.zadd(queue_key, {job['id']: score})
        _logger.info(f"Job {job['id']} requeued with {delay}s delay (retry {job['retry_count']})")

    def _handle_shutdown(self, signum, frame):
        """Gère l'arrêt propre"""
        _logger.info("Shutdown signal received, finishing current jobs...")
        self.running = False


def main():
    parser = argparse.ArgumentParser(description='Quelyos Job Worker')
    parser.add_argument('--queue', default='default', help='Queue to process')
    parser.add_argument('--concurrency', type=int, default=4, help='Number of parallel workers')
    parser.add_argument('--once', action='store_true', help='Process one job and exit')

    args = parser.parse_args()

    worker = JobWorker(queue=args.queue, concurrency=args.concurrency)

    if args.once:
        success = worker.process_one()
        sys.exit(0 if success else 1)
    else:
        worker.start()


if __name__ == '__main__':
    main()
