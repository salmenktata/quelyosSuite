# -*- coding: utf-8 -*-
"""
Audit Dashboard API pour Quelyos ERP

Endpoints pour dashboard d'audit:
- Logs d'activité
- Statistiques d'utilisation
- Alertes de sécurité
- Rapports de conformité
"""

import os
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum

_logger = logging.getLogger(__name__)

REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
AUDIT_PREFIX = 'quelyos:audit:'


class AlertSeverity(Enum):
    """Niveaux de sévérité des alertes"""
    INFO = 'info'
    WARNING = 'warning'
    CRITICAL = 'critical'


@dataclass
class AuditAlert:
    """Alerte d'audit"""
    id: str
    severity: AlertSeverity
    title: str
    message: str
    source: str
    timestamp: datetime
    acknowledged: bool = False
    metadata: Dict[str, Any] = None


class AuditDashboardService:
    """Service pour le dashboard d'audit"""

    def __init__(self):
        self._redis = None
        self._init_redis()

    def _init_redis(self):
        try:
            import redis
            self._redis = redis.from_url(REDIS_URL)
            self._redis.ping()
        except Exception as e:
            _logger.warning(f"Redis not available for audit dashboard: {e}")

    # =========================================================================
    # ACTIVITY LOGS
    # =========================================================================

    def get_activity_logs(
        self,
        start_date: datetime = None,
        end_date: datetime = None,
        user_id: int = None,
        action: str = None,
        model: str = None,
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Récupère les logs d'activité.

        Returns:
            Dict avec logs, total, pagination
        """
        if not self._redis:
            return {'logs': [], 'total': 0}

        # Construire le pattern de recherche
        pattern = f"{AUDIT_PREFIX}log:*"

        logs = []
        for key in self._redis.scan_iter(pattern):
            data = self._redis.get(key)
            if not data:
                continue

            log = json.loads(data)

            # Filtrer
            if start_date and datetime.fromisoformat(log['timestamp']) < start_date:
                continue
            if end_date and datetime.fromisoformat(log['timestamp']) > end_date:
                continue
            if user_id and log.get('user_id') != user_id:
                continue
            if action and log.get('action') != action:
                continue
            if model and log.get('model') != model:
                continue

            logs.append(log)

        # Trier par date décroissante
        logs.sort(key=lambda x: x['timestamp'], reverse=True)

        total = len(logs)
        logs = logs[offset:offset + limit]

        return {
            'logs': logs,
            'total': total,
            'limit': limit,
            'offset': offset,
        }

    def get_activity_summary(
        self,
        period: str = 'day'  # day, week, month
    ) -> Dict[str, Any]:
        """Résumé de l'activité par période"""
        if not self._redis:
            return {}

        now = datetime.utcnow()

        if period == 'day':
            start = now - timedelta(days=1)
            bucket_format = '%H:00'
        elif period == 'week':
            start = now - timedelta(weeks=1)
            bucket_format = '%Y-%m-%d'
        else:
            start = now - timedelta(days=30)
            bucket_format = '%Y-%m-%d'

        # Agréger par bucket temporel
        buckets: Dict[str, Dict] = {}
        actions: Dict[str, int] = {}
        users: Dict[str, int] = {}

        pattern = f"{AUDIT_PREFIX}log:*"
        for key in self._redis.scan_iter(pattern):
            data = self._redis.get(key)
            if not data:
                continue

            log = json.loads(data)
            ts = datetime.fromisoformat(log['timestamp'])

            if ts < start:
                continue

            bucket = ts.strftime(bucket_format)
            if bucket not in buckets:
                buckets[bucket] = {'count': 0, 'actions': {}}

            buckets[bucket]['count'] += 1

            action = log.get('action', 'unknown')
            buckets[bucket]['actions'][action] = \
                buckets[bucket]['actions'].get(action, 0) + 1
            actions[action] = actions.get(action, 0) + 1

            user = str(log.get('user_id', 'anonymous'))
            users[user] = users.get(user, 0) + 1

        return {
            'period': period,
            'start': start.isoformat(),
            'end': now.isoformat(),
            'timeline': buckets,
            'actions_summary': actions,
            'top_users': sorted(
                users.items(),
                key=lambda x: x[1],
                reverse=True
            )[:10],
            'total_events': sum(actions.values()),
        }

    # =========================================================================
    # SECURITY ALERTS
    # =========================================================================

    def create_alert(
        self,
        severity: AlertSeverity,
        title: str,
        message: str,
        source: str,
        metadata: Dict[str, Any] = None
    ) -> AuditAlert:
        """Crée une alerte de sécurité"""
        import uuid

        alert = AuditAlert(
            id=str(uuid.uuid4()),
            severity=severity,
            title=title,
            message=message,
            source=source,
            timestamp=datetime.utcnow(),
            metadata=metadata or {},
        )

        if self._redis:
            key = f"{AUDIT_PREFIX}alert:{alert.id}"
            self._redis.setex(
                key,
                86400 * 30,  # 30 jours
                json.dumps({
                    'id': alert.id,
                    'severity': alert.severity.value,
                    'title': alert.title,
                    'message': alert.message,
                    'source': alert.source,
                    'timestamp': alert.timestamp.isoformat(),
                    'acknowledged': alert.acknowledged,
                    'metadata': alert.metadata,
                })
            )

            # Index par sévérité
            self._redis.sadd(
                f"{AUDIT_PREFIX}alerts:severity:{alert.severity.value}",
                alert.id
            )

        _logger.info(f"Created audit alert: {alert.title} ({alert.severity.value})")
        return alert

    def get_alerts(
        self,
        severity: AlertSeverity = None,
        acknowledged: bool = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Récupère les alertes"""
        if not self._redis:
            return []

        alerts = []

        if severity:
            # Récupérer par sévérité
            alert_ids = self._redis.smembers(
                f"{AUDIT_PREFIX}alerts:severity:{severity.value}"
            )
            for alert_id in alert_ids:
                key = f"{AUDIT_PREFIX}alert:{alert_id.decode()}"
                data = self._redis.get(key)
                if data:
                    alerts.append(json.loads(data))
        else:
            # Récupérer toutes
            pattern = f"{AUDIT_PREFIX}alert:*"
            for key in self._redis.scan_iter(pattern):
                if b'severity' in key:
                    continue
                data = self._redis.get(key)
                if data:
                    alerts.append(json.loads(data))

        # Filtrer par acknowledged
        if acknowledged is not None:
            alerts = [a for a in alerts if a['acknowledged'] == acknowledged]

        # Trier par date et sévérité
        severity_order = {'critical': 0, 'warning': 1, 'info': 2}
        alerts.sort(key=lambda x: (
            severity_order.get(x['severity'], 3),
            x['timestamp']
        ), reverse=True)

        return alerts[:limit]

    def acknowledge_alert(self, alert_id: str, user_id: int) -> bool:
        """Acquitte une alerte"""
        if not self._redis:
            return False

        key = f"{AUDIT_PREFIX}alert:{alert_id}"
        data = self._redis.get(key)

        if not data:
            return False

        alert = json.loads(data)
        alert['acknowledged'] = True
        alert['acknowledged_by'] = user_id
        alert['acknowledged_at'] = datetime.utcnow().isoformat()

        self._redis.set(key, json.dumps(alert))
        return True

    # =========================================================================
    # USAGE STATISTICS
    # =========================================================================

    def get_usage_stats(self) -> Dict[str, Any]:
        """Statistiques d'utilisation globales"""
        if not self._redis:
            return {}

        stats = {
            'api_calls': {},
            'errors': {},
            'response_times': {},
        }

        # Récupérer métriques depuis Redis
        now = datetime.utcnow()

        # API calls par endpoint (dernières 24h)
        for hour in range(24):
            ts = now - timedelta(hours=hour)
            hour_key = ts.strftime('%Y-%m-%d:%H')

            pattern = f"quelyos:metrics:api_calls:{hour_key}:*"
            for key in self._redis.scan_iter(pattern):
                endpoint = key.decode().split(':')[-1]
                count = int(self._redis.get(key) or 0)

                if endpoint not in stats['api_calls']:
                    stats['api_calls'][endpoint] = 0
                stats['api_calls'][endpoint] += count

        # Erreurs par type
        pattern = f"quelyos:metrics:errors:*"
        for key in self._redis.scan_iter(pattern):
            error_type = key.decode().split(':')[-1]
            count = int(self._redis.get(key) or 0)
            stats['errors'][error_type] = count

        return stats

    # =========================================================================
    # COMPLIANCE REPORTS
    # =========================================================================

    def generate_compliance_report(
        self,
        report_type: str,  # gdpr, security, access
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Génère un rapport de conformité"""
        report = {
            'type': report_type,
            'generated_at': datetime.utcnow().isoformat(),
            'period': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat(),
            },
            'findings': [],
            'summary': {},
        }

        if report_type == 'gdpr':
            report['summary'] = self._generate_gdpr_report(start_date, end_date)
        elif report_type == 'security':
            report['summary'] = self._generate_security_report(start_date, end_date)
        elif report_type == 'access':
            report['summary'] = self._generate_access_report(start_date, end_date)

        return report

    def _generate_gdpr_report(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Rapport GDPR"""
        logs = self.get_activity_logs(
            start_date=start_date,
            end_date=end_date,
            limit=10000
        )

        # Analyser les accès aux données personnelles
        personal_data_access = 0
        data_exports = 0
        data_deletions = 0

        for log in logs.get('logs', []):
            model = log.get('model', '')
            action = log.get('action', '')

            if model in ['res.partner', 'res.users', 'hr.employee']:
                personal_data_access += 1

            if action == 'export' and model in ['res.partner', 'res.users']:
                data_exports += 1

            if action == 'delete' and model in ['res.partner', 'res.users']:
                data_deletions += 1

        return {
            'personal_data_accesses': personal_data_access,
            'data_exports': data_exports,
            'data_deletions': data_deletions,
            'total_events': logs.get('total', 0),
        }

    def _generate_security_report(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Rapport de sécurité"""
        alerts = self.get_alerts(limit=1000)

        # Filtrer par période
        alerts_in_period = [
            a for a in alerts
            if start_date <= datetime.fromisoformat(a['timestamp']) <= end_date
        ]

        by_severity = {}
        for alert in alerts_in_period:
            sev = alert['severity']
            by_severity[sev] = by_severity.get(sev, 0) + 1

        return {
            'total_alerts': len(alerts_in_period),
            'by_severity': by_severity,
            'unacknowledged': sum(
                1 for a in alerts_in_period if not a['acknowledged']
            ),
        }

    def _generate_access_report(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Rapport des accès"""
        logs = self.get_activity_logs(
            start_date=start_date,
            end_date=end_date,
            limit=10000
        )

        users_activity: Dict[str, int] = {}
        sensitive_access = 0

        sensitive_models = [
            'account.move', 'account.payment',
            'hr.payslip', 'hr.contract',
        ]

        for log in logs.get('logs', []):
            user = str(log.get('user_id', 'anonymous'))
            users_activity[user] = users_activity.get(user, 0) + 1

            if log.get('model') in sensitive_models:
                sensitive_access += 1

        return {
            'unique_users': len(users_activity),
            'total_actions': logs.get('total', 0),
            'sensitive_data_access': sensitive_access,
            'top_users': sorted(
                users_activity.items(),
                key=lambda x: x[1],
                reverse=True
            )[:10],
        }


# Singleton
_audit_dashboard = None


def get_audit_dashboard() -> AuditDashboardService:
    """Retourne le service audit dashboard singleton"""
    global _audit_dashboard
    if _audit_dashboard is None:
        _audit_dashboard = AuditDashboardService()
    return _audit_dashboard
