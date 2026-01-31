# -*- coding: utf-8 -*-
import logging
import json
from datetime import datetime
from odoo import models, fields, api
from odoo.exceptions import ValidationError

_logger = logging.getLogger(__name__)


class SeedJob(models.Model):
    """Job queue pour génération de données seed"""
    _name = 'quelyos.seed.job'
    _description = 'Seed Data Generation Job'
    _order = 'create_date desc'

    job_id = fields.Char(
        string='Job ID',
        required=True,
        index=True,
        readonly=True,
        help='Identifiant unique du job (seed_YYYYMMDD_HHMMSS_random)'
    )
    tenant_id = fields.Many2one(
        'quelyos.tenant',
        string='Tenant',
        required=True,
        ondelete='cascade',
        index=True,
        help='Tenant cible pour la génération'
    )
    config_json = fields.Text(
        string='Configuration JSON',
        help='Configuration sérialisée (volumetry, modules, options)'
    )
    status = fields.Selection([
        ('pending', 'En attente'),
        ('running', 'En cours'),
        ('completed', 'Terminé'),
        ('error', 'Erreur')
    ], string='Statut', default='pending', required=True, index=True)

    progress_percent = fields.Integer(
        string='Progression (%)',
        default=0,
        help='Pourcentage de progression 0-100'
    )
    current_module = fields.Char(
        string='Module en cours',
        help='Module actuellement en cours de génération'
    )
    logs_json = fields.Text(
        string='Logs JSON',
        help='Logs progressifs au format JSON'
    )
    results_json = fields.Text(
        string='Résultats JSON',
        help='Résultats finaux par module au format JSON'
    )
    start_time = fields.Datetime(
        string='Heure de début',
        readonly=True
    )
    end_time = fields.Datetime(
        string='Heure de fin',
        readonly=True
    )
    error_message = fields.Text(
        string='Message d\'erreur',
        readonly=True
    )

    _sql_constraints = [
        ('job_id_unique', 'UNIQUE(job_id)', 'Le job_id doit être unique')
    ]

    @api.model
    def create_job(self, tenant_id, config):
        """Créer un nouveau job de génération seed

        Args:
            tenant_id (int): ID du tenant cible
            config (dict): Configuration (volumetry, modules, options)

        Returns:
            quelyos.seed.job: Job créé
        """
        # Valider tenant
        tenant = self.env['quelyos.tenant'].browse(tenant_id)
        if not tenant.exists():
            raise ValidationError("Tenant introuvable")
        if tenant.status != 'active':
            raise ValidationError("Tenant non actif")

        # Vérifier job en cours
        running_job = self.search([
            ('tenant_id', '=', tenant_id),
            ('status', 'in', ['pending', 'running'])
        ], limit=1)
        if running_job:
            raise ValidationError(f"Job seed déjà en cours : {running_job.job_id}")

        # Générer job_id unique
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        random_suffix = self.env['ir.sequence'].next_by_code('quelyos.seed.job') or '001'
        job_id = f"seed_{timestamp}_{random_suffix}"

        # Créer job
        job = self.create({
            'job_id': job_id,
            'tenant_id': tenant_id,
            'config_json': json.dumps(config),
            'status': 'pending',
            'progress_percent': 0,
            'logs_json': json.dumps([]),
        })

        _logger.info(f"Seed job created: {job_id} for tenant {tenant.name}")
        return job

    def update_progress(self, percent, module=None, log_message=None):
        """Mettre à jour la progression du job

        Args:
            percent (int): Pourcentage de progression (0-100)
            module (str, optional): Module en cours
            log_message (str, optional): Message de log à ajouter
        """
        self.ensure_one()

        values = {
            'progress_percent': min(max(percent, 0), 100),
        }

        if module:
            values['current_module'] = module

        if log_message:
            # Ajouter au logs existants
            try:
                logs = json.loads(self.logs_json or '[]')
            except (json.JSONDecodeError, TypeError):
                logs = []

            logs.append({
                'timestamp': datetime.now().isoformat(),
                'message': log_message,
                'module': module or self.current_module,
            })

            # Limiter à 500 derniers logs
            if len(logs) > 500:
                logs = logs[-500:]

            values['logs_json'] = json.dumps(logs)

        self.write(values)
        self.env.cr.commit()  # Commit immédiat pour polling

    def mark_running(self):
        """Marquer le job comme en cours d'exécution"""
        self.ensure_one()
        self.write({
            'status': 'running',
            'start_time': fields.Datetime.now(),
            'progress_percent': 0,
        })
        self.env.cr.commit()

    def mark_completed(self, results):
        """Marquer le job comme terminé

        Args:
            results (dict): Résultats finaux par module
        """
        self.ensure_one()
        self.write({
            'status': 'completed',
            'end_time': fields.Datetime.now(),
            'progress_percent': 100,
            'results_json': json.dumps(results),
            'current_module': None,
        })
        self.env.cr.commit()

        duration = (self.end_time - self.start_time).total_seconds()
        total_records = sum(r.get('count', 0) for r in results.values())

        _logger.info(
            f"Seed job {self.job_id} completed: {total_records} records "
            f"in {duration:.1f}s for tenant {self.tenant_id.name}"
        )

    def mark_error(self, error_message):
        """Marquer le job comme en erreur

        Args:
            error_message (str): Message d'erreur
        """
        self.ensure_one()
        self.write({
            'status': 'error',
            'end_time': fields.Datetime.now(),
            'error_message': error_message,
        })
        self.env.cr.commit()

        _logger.error(f"Seed job {self.job_id} failed: {error_message}")

    def get_status_data(self):
        """Récupérer les données de statut pour polling frontend

        Returns:
            dict: Données de statut
        """
        self.ensure_one()

        try:
            config = json.loads(self.config_json or '{}')
        except (json.JSONDecodeError, TypeError):
            config = {}

        try:
            logs = json.loads(self.logs_json or '[]')
        except (json.JSONDecodeError, TypeError):
            logs = []

        try:
            results = json.loads(self.results_json or '{}')
        except (json.JSONDecodeError, TypeError):
            results = {}

        data = {
            'job_id': self.job_id,
            'tenant_id': self.tenant_id.id,
            'tenant_name': self.tenant_id.name,
            'status': self.status,
            'progress_percent': self.progress_percent,
            'current_module': self.current_module,
            'config': config,
            'logs': logs[-50:],  # Derniers 50 logs
            'results': results,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'error_message': self.error_message,
        }

        # Calculer durée
        if self.start_time:
            if self.end_time:
                duration = (self.end_time - self.start_time).total_seconds()
            else:
                duration = (fields.Datetime.now() - self.start_time).total_seconds()
            data['duration_seconds'] = duration

        return data
