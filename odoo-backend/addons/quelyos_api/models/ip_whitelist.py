# -*- coding: utf-8 -*-
"""
IP Whitelist - Restriction d'accès par adresse IP pour le super admin.
"""

from odoo import models, fields, api
from odoo.exceptions import AccessDenied
import ipaddress
import logging

_logger = logging.getLogger(__name__)


class IPWhitelist(models.Model):
    """Liste blanche des IPs autorisées pour le super admin"""
    _name = 'quelyos.ip.whitelist'
    _description = 'IP Whitelist'
    _order = 'sequence, id'

    name = fields.Char('Description', required=True)
    ip_address = fields.Char(
        'Adresse IP / CIDR',
        required=True,
        help="IP unique (192.168.1.1) ou plage CIDR (192.168.1.0/24)"
    )
    ip_type = fields.Selection([
        ('single', 'IP unique'),
        ('range', 'Plage CIDR'),
    ], string='Type', compute='_compute_ip_type', store=True)
    is_active = fields.Boolean('Actif', default=True)
    sequence = fields.Integer('Séquence', default=10)
    created_by = fields.Many2one('res.users', string='Créé par', default=lambda self: self.env.user)
    notes = fields.Text('Notes')

    # Restrictions optionnelles
    user_ids = fields.Many2many(
        'res.users',
        string='Utilisateurs spécifiques',
        help="Si vide, s'applique à tous les super admins"
    )
    valid_from = fields.Datetime('Valide à partir de')
    valid_until = fields.Datetime('Valide jusqu\'à')

    @api.depends('ip_address')
    def _compute_ip_type(self):
        for record in self:
            if record.ip_address and '/' in record.ip_address:
                record.ip_type = 'range'
            else:
                record.ip_type = 'single'

    @api.constrains('ip_address')
    def _check_ip_address(self):
        for record in self:
            try:
                if '/' in record.ip_address:
                    ipaddress.ip_network(record.ip_address, strict=False)
                else:
                    ipaddress.ip_address(record.ip_address)
            except ValueError as e:
                raise ValueError(f"Adresse IP invalide: {record.ip_address} - {e}")

    @api.model
    def is_ip_allowed(self, ip_string, user_id=None):
        """
        Vérifie si une IP est autorisée.

        Args:
            ip_string: Adresse IP à vérifier
            user_id: ID utilisateur (optionnel, pour restrictions par user)

        Returns:
            bool: True si autorisé
        """
        # Si pas de whitelist active, autoriser tout (mode permissif)
        active_rules = self.sudo().search([('is_active', '=', True)])
        if not active_rules:
            return True

        try:
            check_ip = ipaddress.ip_address(ip_string)
        except ValueError:
            _logger.warning(f"Invalid IP address format: {ip_string}")
            return False

        now = fields.Datetime.now()

        for rule in active_rules:
            # Vérifier validité temporelle
            if rule.valid_from and now < rule.valid_from:
                continue
            if rule.valid_until and now > rule.valid_until:
                continue

            # Vérifier restriction par utilisateur
            if rule.user_ids and user_id:
                if user_id not in rule.user_ids.ids:
                    continue

            # Vérifier l'IP
            try:
                if '/' in rule.ip_address:
                    network = ipaddress.ip_network(rule.ip_address, strict=False)
                    if check_ip in network:
                        return True
                else:
                    if check_ip == ipaddress.ip_address(rule.ip_address):
                        return True
            except ValueError:
                continue

        return False

    @api.model
    def check_access(self, ip_string, user_id=None):
        """
        Vérifie l'accès et lève une exception si non autorisé.

        Args:
            ip_string: Adresse IP
            user_id: ID utilisateur

        Raises:
            AccessDenied: Si l'IP n'est pas autorisée
        """
        if not self.is_ip_allowed(ip_string, user_id):
            _logger.warning(
                f"[SECURITY] IP access denied: {ip_string} for user {user_id}"
            )
            raise AccessDenied(f"Access denied from IP: {ip_string}")

    @api.model
    def get_whitelist_status(self):
        """Retourne le statut de la whitelist"""
        active_rules = self.sudo().search([('is_active', '=', True)])
        return {
            'enabled': len(active_rules) > 0,
            'rules_count': len(active_rules),
            'rules': [{
                'id': r.id,
                'name': r.name,
                'ip_address': r.ip_address,
                'ip_type': r.ip_type,
                'user_count': len(r.user_ids) if r.user_ids else 0,
            } for r in active_rules]
        }
