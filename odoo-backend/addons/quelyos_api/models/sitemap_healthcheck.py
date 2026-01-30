"""
Modèle Sitemap Healthcheck

Stocke l'historique des healthchecks effectués sur les routes des applications.
Permet de tracker la santé des routes dans le temps et détecter dégradations.
"""

from odoo import models, fields, api
import logging

_logger = logging.getLogger(__name__)


class SitemapHealthcheck(models.Model):
    """Historique healthchecks routes applications"""

    _name = 'quelyos.sitemap.healthcheck'
    _description = 'Sitemap Healthcheck History'
    _order = 'create_date desc'

    # Application
    app_id = fields.Char(
        string='App ID',
        required=True,
        index=True,
        help='ID application (vitrine-quelyos, dashboard-client, etc.)'
    )
    app_name = fields.Char(
        string='App Name',
        required=True,
        help='Nom lisible application'
    )

    # Statistiques healthcheck
    total_routes = fields.Integer(
        string='Total Routes',
        required=True,
        help='Nombre total routes checkées'
    )
    ok_routes = fields.Integer(
        string='OK Routes',
        required=True,
        help='Nombre routes OK (200-299)'
    )
    error_routes = fields.Integer(
        string='Error Routes',
        required=True,
        help='Nombre routes en erreur (4xx, 5xx, timeout)'
    )
    success_rate = fields.Float(
        string='Success Rate %',
        compute='_compute_success_rate',
        store=True,
        help='Taux de succès (ok / total * 100)'
    )

    # Temps de réponse
    avg_response_time = fields.Integer(
        string='Avg Response Time (ms)',
        help='Temps réponse moyen en millisecondes'
    )
    max_response_time = fields.Integer(
        string='Max Response Time (ms)',
        help='Temps réponse maximum'
    )

    # Détails JSON
    routes_details = fields.Text(
        string='Routes Details JSON',
        help='Détails complets healthcheck par route (JSON)'
    )

    # Metadata
    duration_ms = fields.Integer(
        string='Duration (ms)',
        help='Durée totale du healthcheck'
    )
    triggered_by = fields.Char(
        string='Triggered By',
        help='Qui a déclenché le healthcheck (auto, user, cron)'
    )

    @api.depends('total_routes', 'ok_routes')
    def _compute_success_rate(self):
        """Calculer taux de succès"""
        for record in self:
            if record.total_routes > 0:
                record.success_rate = (record.ok_routes / record.total_routes) * 100
            else:
                record.success_rate = 0.0

    def check_degradation_alert(self):
        """
        Vérifier si dégradation par rapport au dernier check.
        Si success_rate baisse de > 10%, déclencher alerte.
        """
        for record in self:
            # Récupérer check précédent
            previous = self.search([
                ('app_id', '=', record.app_id),
                ('id', '<', record.id)
            ], limit=1, order='id desc')

            if previous:
                drop = previous.success_rate - record.success_rate

                if drop > 10:  # Baisse de plus de 10%
                    _logger.warning(
                        f'[Sitemap Alert] {record.app_name} health degraded: '
                        f'{previous.success_rate:.1f}% → {record.success_rate:.1f}% '
                        f'({drop:.1f}% drop)'
                    )

                    # Créer notification/alerte
                    self.env['quelyos.sitemap.alert'].sudo().create({
                        'healthcheck_id': record.id,
                        'app_id': record.app_id,
                        'severity': 'warning',
                        'message': f'Health degraded: {previous.success_rate:.1f}% → {record.success_rate:.1f}%',
                    })


class SitemapAlert(models.Model):
    """Alertes dégradation healthcheck"""

    _name = 'quelyos.sitemap.alert'
    _description = 'Sitemap Health Alerts'
    _order = 'create_date desc'

    healthcheck_id = fields.Many2one(
        'quelyos.sitemap.healthcheck',
        string='Healthcheck',
        required=True,
        ondelete='cascade'
    )
    app_id = fields.Char(
        string='App ID',
        required=True,
        index=True
    )
    severity = fields.Selection([
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('critical', 'Critical')
    ], string='Severity', default='warning', required=True)

    message = fields.Text(
        string='Message',
        required=True
    )

    status = fields.Selection([
        ('new', 'New'),
        ('acknowledged', 'Acknowledged'),
        ('resolved', 'Resolved')
    ], string='Status', default='new', required=True, index=True)

    acknowledged_by = fields.Char(string='Acknowledged By')
    acknowledged_at = fields.Datetime(string='Acknowledged At')

    def action_acknowledge(self):
        """Marquer alerte comme vue"""
        self.write({
            'status': 'acknowledged',
            'acknowledged_at': fields.Datetime.now(),
            'acknowledged_by': self.env.user.name
        })

    def action_resolve(self):
        """Résoudre alerte"""
        self.write({'status': 'resolved'})
