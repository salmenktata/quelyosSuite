# -*- coding: utf-8 -*-
"""
Modèle CORS Entry pour la gestion de la whitelist CORS dynamique
"""

from odoo import models, fields, api
import logging

_logger = logging.getLogger(__name__)


class QuelyosCorsEntry(models.Model):
    _name = 'quelyos.cors.entry'
    _description = 'CORS Whitelist Entry'
    _order = 'domain'

    domain = fields.Char(
        string='Domain',
        required=True,
        index=True,
        help='Domain pattern (e.g., example.com or *.example.com)',
    )

    tenant_id = fields.Many2one(
        'quelyos.tenant',
        string='Tenant',
        help='If set, this entry only applies to this tenant',
    )

    is_active = fields.Boolean(
        string='Active',
        default=True,
    )

    created_by = fields.Char(
        string='Created By',
        help='Username who created this entry',
    )

    _sql_constraints = [
        ('domain_unique', 'UNIQUE(domain)', 'Domain must be unique'),
    ]

    @api.model
    def get_allowed_origins(self, tenant_id=None):
        """
        Retourne la liste des origines autorisées
        Utilisé par config.py pour le CORS dynamique
        """
        domain = [('is_active', '=', True)]

        if tenant_id:
            domain.append('|')
            domain.append(('tenant_id', '=', False))
            domain.append(('tenant_id', '=', tenant_id))
        else:
            domain.append(('tenant_id', '=', False))

        entries = self.search(domain)
        return [e.domain for e in entries]

    @api.model
    def is_origin_allowed(self, origin, tenant_id=None):
        """
        Vérifie si une origine est autorisée
        Supporte les wildcards (*.example.com)
        """
        if not origin:
            return False

        # Nettoyer l'origine
        origin = origin.lower().rstrip('/')

        # Extraire le domaine de l'origine
        # https://example.com:3000 -> example.com
        from urllib.parse import urlparse
        parsed = urlparse(origin)
        origin_domain = parsed.netloc.split(':')[0]

        allowed_domains = self.get_allowed_origins(tenant_id)

        for pattern in allowed_domains:
            pattern = pattern.lower()

            # Wildcard match (*.example.com)
            if pattern.startswith('*.'):
                base_domain = pattern[2:]
                if origin_domain == base_domain or origin_domain.endswith('.' + base_domain):
                    return True
            # Exact match
            elif origin_domain == pattern:
                return True

        return False
