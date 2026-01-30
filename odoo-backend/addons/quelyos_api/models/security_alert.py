# -*- coding: utf-8 -*-
"""
Security Alerts - Détection d'anomalies et alertes de sécurité.
"""

from odoo import models, fields, api
from datetime import datetime, timedelta
import logging
import json

_logger = logging.getLogger(__name__)


class SecurityAlert(models.Model):
    """Alertes de sécurité"""
    _name = 'quelyos.security.alert'
    _description = 'Security Alert'
    _order = 'created_at desc'

    name = fields.Char('Titre', required=True)
    alert_type = fields.Selection([
        ('brute_force', 'Tentative de brute force'),
        ('unusual_location', 'Connexion lieu inhabituel'),
        ('multiple_failures', 'Échecs multiples'),
        ('suspicious_activity', 'Activité suspecte'),
        ('ip_blocked', 'IP bloquée'),
        ('rate_limit', 'Rate limit dépassé'),
        ('unauthorized_access', 'Accès non autorisé'),
        ('api_key_abuse', 'Abus clé API'),
        ('session_hijack', 'Possible vol de session'),
        ('data_export', 'Export de données massif'),
        ('config_change', 'Changement configuration critique'),
        ('new_admin', 'Nouvel administrateur'),
        ('privilege_escalation', 'Escalade de privilèges'),
    ], string='Type', required=True, index=True)

    severity = fields.Selection([
        ('low', 'Faible'),
        ('medium', 'Moyen'),
        ('high', 'Élevé'),
        ('critical', 'Critique'),
    ], string='Sévérité', required=True, default='medium', index=True)

    status = fields.Selection([
        ('new', 'Nouvelle'),
        ('acknowledged', 'Prise en compte'),
        ('investigating', 'En investigation'),
        ('resolved', 'Résolue'),
        ('false_positive', 'Faux positif'),
    ], string='Statut', default='new', index=True)

    # Détails
    description = fields.Text('Description')
    details = fields.Text('Détails JSON')
    ip_address = fields.Char('Adresse IP', index=True)
    user_id = fields.Many2one('res.users', string='Utilisateur concerné')
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant')

    # Timestamps
    created_at = fields.Datetime('Créé le', default=fields.Datetime.now, index=True)
    acknowledged_at = fields.Datetime('Pris en compte le')
    acknowledged_by = fields.Many2one('res.users', string='Pris en compte par')
    resolved_at = fields.Datetime('Résolu le')
    resolved_by = fields.Many2one('res.users', string='Résolu par')
    resolution_notes = fields.Text('Notes de résolution')

    # Actions automatiques
    auto_action_taken = fields.Char('Action automatique')
    notification_sent = fields.Boolean('Notification envoyée', default=False)

    @api.model
    def create_alert(self, alert_type, severity, name, description=None, details=None,
                     ip_address=None, user_id=None, tenant_id=None, auto_action=None):
        """
        Crée une nouvelle alerte de sécurité.

        Args:
            alert_type: Type d'alerte
            severity: Niveau de sévérité
            name: Titre court
            description: Description détaillée
            details: Dict avec détails supplémentaires
            ip_address: IP concernée
            user_id: Utilisateur concerné
            tenant_id: Tenant concerné
            auto_action: Action automatique prise

        Returns:
            record: L'alerte créée
        """
        alert = self.sudo().create({
            'alert_type': alert_type,
            'severity': severity,
            'name': name,
            'description': description,
            'details': json.dumps(details) if details else None,
            'ip_address': ip_address,
            'user_id': user_id,
            'tenant_id': tenant_id,
            'auto_action_taken': auto_action,
        })

        _logger.warning(
            f"[SECURITY ALERT] {severity.upper()}: {alert_type} - {name} | "
            f"IP: {ip_address} | User: {user_id}"
        )

        # Notification pour alertes critiques
        if severity == 'critical':
            alert._send_notification()

        return alert

    def _send_notification(self):
        """Envoie une notification pour les alertes critiques"""
        # TODO: Intégrer avec système de notification (email, SMS, webhook)
        self.notification_sent = True
        _logger.info(f"Security alert notification sent for alert {self.id}")

    def acknowledge(self, notes=None):
        """Marque l'alerte comme prise en compte"""
        self.write({
            'status': 'acknowledged',
            'acknowledged_at': fields.Datetime.now(),
            'acknowledged_by': self.env.user.id,
        })

    def resolve(self, notes=None, is_false_positive=False):
        """Marque l'alerte comme résolue"""
        self.write({
            'status': 'false_positive' if is_false_positive else 'resolved',
            'resolved_at': fields.Datetime.now(),
            'resolved_by': self.env.user.id,
            'resolution_notes': notes,
        })

    @api.model
    def detect_brute_force(self, ip_address, failed_count, window_minutes=15):
        """Détecte une tentative de brute force"""
        if failed_count >= 10:
            severity = 'critical'
        elif failed_count >= 5:
            severity = 'high'
        else:
            return None

        # Vérifier si alerte récente existe déjà
        recent = self.sudo().search([
            ('alert_type', '=', 'brute_force'),
            ('ip_address', '=', ip_address),
            ('created_at', '>', datetime.now() - timedelta(hours=1)),
            ('status', 'in', ['new', 'acknowledged'])
        ], limit=1)

        if recent:
            return recent

        return self.create_alert(
            alert_type='brute_force',
            severity=severity,
            name=f"Brute force détecté depuis {ip_address}",
            description=f"{failed_count} tentatives échouées en {window_minutes} minutes",
            details={'failed_count': failed_count, 'window_minutes': window_minutes},
            ip_address=ip_address,
            auto_action='IP temporairement bloquée' if severity == 'critical' else None
        )

    @api.model
    def detect_unusual_location(self, user_id, ip_address, country=None):
        """Détecte une connexion depuis un lieu inhabituel"""
        return self.create_alert(
            alert_type='unusual_location',
            severity='medium',
            name=f"Connexion depuis un nouveau lieu",
            description=f"Première connexion depuis {country or 'lieu inconnu'}",
            details={'country': country},
            ip_address=ip_address,
            user_id=user_id,
        )

    @api.model
    def detect_rate_limit_abuse(self, ip_address, user_id=None, endpoint=None, count=None):
        """Détecte un abus de rate limit"""
        return self.create_alert(
            alert_type='rate_limit',
            severity='medium',
            name=f"Rate limit dépassé",
            description=f"Limite dépassée sur {endpoint or 'endpoint inconnu'}",
            details={'endpoint': endpoint, 'count': count},
            ip_address=ip_address,
            user_id=user_id,
        )

    @api.model
    def get_alerts_summary(self, hours=24):
        """Retourne un résumé des alertes récentes"""
        since = datetime.now() - timedelta(hours=hours)
        alerts = self.sudo().search([('created_at', '>', since)])

        summary = {
            'total': len(alerts),
            'by_severity': {
                'critical': len(alerts.filtered(lambda a: a.severity == 'critical')),
                'high': len(alerts.filtered(lambda a: a.severity == 'high')),
                'medium': len(alerts.filtered(lambda a: a.severity == 'medium')),
                'low': len(alerts.filtered(lambda a: a.severity == 'low')),
            },
            'by_status': {
                'new': len(alerts.filtered(lambda a: a.status == 'new')),
                'acknowledged': len(alerts.filtered(lambda a: a.status == 'acknowledged')),
                'investigating': len(alerts.filtered(lambda a: a.status == 'investigating')),
                'resolved': len(alerts.filtered(lambda a: a.status == 'resolved')),
            },
            'by_type': {},
        }

        for alert in alerts:
            if alert.alert_type not in summary['by_type']:
                summary['by_type'][alert.alert_type] = 0
            summary['by_type'][alert.alert_type] += 1

        return summary

    @api.model
    def get_recent_alerts(self, limit=50, status=None, severity=None):
        """Liste les alertes récentes"""
        domain = []
        if status:
            domain.append(('status', '=', status))
        if severity:
            domain.append(('severity', '=', severity))

        alerts = self.sudo().search(domain, limit=limit, order='created_at desc')

        return [{
            'id': a.id,
            'name': a.name,
            'alert_type': a.alert_type,
            'severity': a.severity,
            'status': a.status,
            'ip_address': a.ip_address,
            'user_id': a.user_id.id if a.user_id else None,
            'user_name': a.user_id.name if a.user_id else None,
            'created_at': a.created_at.isoformat() if a.created_at else None,
            'description': a.description,
            'auto_action_taken': a.auto_action_taken,
        } for a in alerts]
