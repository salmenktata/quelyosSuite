# -*- coding: utf-8 -*-
"""
API Keys Management - Clés API pour intégrations tierces.
"""

from odoo import models, fields, api
from odoo.exceptions import AccessDenied
import secrets
import hashlib
import logging
from datetime import datetime

_logger = logging.getLogger(__name__)


class APIKey(models.Model):
    """Clés API pour intégrations externes"""
    _name = 'quelyos.api.key'
    _description = 'API Key'
    _order = 'create_date desc'

    name = fields.Char('Nom', required=True)
    description = fields.Text('Description')
    key_prefix = fields.Char(
        'Préfixe',
        readonly=True,
        help="Premiers caractères pour identification (qk_xxxxx)"
    )
    key_hash = fields.Char('Hash', readonly=True)

    # Propriétaire
    user_id = fields.Many2one(
        'res.users',
        string='Propriétaire',
        required=True,
        default=lambda self: self.env.user,
        ondelete='cascade',
    )
    tenant_id = fields.Many2one(
        'quelyos.tenant',
        string='Tenant',
        help="Si défini, limite l'accès à ce tenant"
    )

    # Permissions (scopes)
    scope = fields.Selection([
        ('read', 'Lecture seule'),
        ('write', 'Lecture + Écriture'),
        ('admin', 'Administration complète'),
    ], string='Scope', default='read', required=True)

    allowed_endpoints = fields.Text(
        'Endpoints autorisés',
        help="Liste des patterns d'endpoints autorisés (un par ligne). Vide = tous."
    )

    # Restrictions
    ip_restrictions = fields.Text(
        'Restrictions IP',
        help="Liste des IPs/CIDR autorisées (un par ligne). Vide = toutes."
    )
    rate_limit = fields.Integer(
        'Rate limit (req/min)',
        default=60,
        help="Nombre max de requêtes par minute"
    )

    # Statut
    is_active = fields.Boolean('Active', default=True)
    expires_at = fields.Datetime('Date d\'expiration')
    last_used_at = fields.Datetime('Dernière utilisation', readonly=True)
    usage_count = fields.Integer('Nombre d\'utilisations', default=0, readonly=True)

    # Audit
    created_by = fields.Many2one('res.users', string='Créé par', default=lambda self: self.env.user)
    revoked_at = fields.Datetime('Révoqué le')
    revoked_by = fields.Many2one('res.users', string='Révoqué par')

    _sql_constraints = [
        ('key_prefix_unique', 'UNIQUE(key_prefix)', 'Le préfixe de clé doit être unique'),
    ]

    @api.model
    def generate_key(self, name, user_id, scope='read', tenant_id=None, expires_days=None, **kwargs):
        """
        Génère une nouvelle clé API.

        Args:
            name: Nom descriptif
            user_id: ID du propriétaire
            scope: Niveau d'accès
            tenant_id: Restriction tenant (optionnel)
            expires_days: Jours avant expiration (optionnel)

        Returns:
            tuple: (api_key_record, plain_key) - La clé en clair n'est retournée qu'une fois!
        """
        # Générer clé sécurisée: qk_ + 32 bytes hex
        plain_key = f"qk_{secrets.token_hex(32)}"
        key_prefix = plain_key[:12]  # qk_xxxxxxxx
        key_hash = hashlib.sha256(plain_key.encode()).hexdigest()

        expires_at = None
        if expires_days:
            from datetime import timedelta
            expires_at = datetime.now() + timedelta(days=expires_days)

        record = self.sudo().create({
            'name': name,
            'key_prefix': key_prefix,
            'key_hash': key_hash,
            'user_id': user_id,
            'tenant_id': tenant_id,
            'scope': scope,
            'expires_at': expires_at,
            **kwargs
        })

        _logger.info(f"API key created: {key_prefix}... for user {user_id}")

        return record, plain_key

    @api.model
    def validate_key(self, api_key, endpoint=None, ip_address=None):
        """
        Valide une clé API.

        Args:
            api_key: Clé API en clair
            endpoint: Endpoint appelé (pour vérification permissions)
            ip_address: IP du client (pour vérification restrictions)

        Returns:
            dict: {valid, user_id, tenant_id, scope} ou {valid: False, error}

        Raises:
            AccessDenied: Si clé invalide ou restrictions non respectées
        """
        if not api_key or not api_key.startswith('qk_'):
            return {'valid': False, 'error': 'Invalid API key format'}

        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        key_prefix = api_key[:12]

        record = self.sudo().search([
            ('key_hash', '=', key_hash),
            ('key_prefix', '=', key_prefix),
            ('is_active', '=', True)
        ], limit=1)

        if not record:
            _logger.warning(f"Invalid API key attempt: {key_prefix}...")
            return {'valid': False, 'error': 'Invalid or inactive API key'}

        # Vérifier expiration
        if record.expires_at and record.expires_at < fields.Datetime.now():
            _logger.warning(f"Expired API key: {key_prefix}...")
            return {'valid': False, 'error': 'API key expired'}

        # Vérifier restrictions IP
        if record.ip_restrictions and ip_address:
            allowed_ips = [ip.strip() for ip in record.ip_restrictions.split('\n') if ip.strip()]
            if allowed_ips and not self._check_ip_allowed(ip_address, allowed_ips):
                _logger.warning(f"API key IP restriction violated: {key_prefix} from {ip_address}")
                return {'valid': False, 'error': 'IP not allowed'}

        # Vérifier endpoint
        if record.allowed_endpoints and endpoint:
            allowed = [e.strip() for e in record.allowed_endpoints.split('\n') if e.strip()]
            if allowed and not any(endpoint.startswith(e) for e in allowed):
                _logger.warning(f"API key endpoint restriction: {key_prefix} on {endpoint}")
                return {'valid': False, 'error': 'Endpoint not allowed'}

        # Mettre à jour usage
        record.sudo().write({
            'last_used_at': fields.Datetime.now(),
            'usage_count': record.usage_count + 1,
        })

        return {
            'valid': True,
            'key_id': record.id,
            'user_id': record.user_id.id,
            'tenant_id': record.tenant_id.id if record.tenant_id else None,
            'scope': record.scope,
            'rate_limit': record.rate_limit,
        }

    def _check_ip_allowed(self, ip_string, allowed_list):
        """Vérifie si une IP est dans la liste autorisée"""
        import ipaddress
        try:
            check_ip = ipaddress.ip_address(ip_string)
            for allowed in allowed_list:
                try:
                    if '/' in allowed:
                        if check_ip in ipaddress.ip_network(allowed, strict=False):
                            return True
                    else:
                        if check_ip == ipaddress.ip_address(allowed):
                            return True
                except ValueError:
                    continue
            return False
        except ValueError:
            return False

    def revoke(self):
        """Révoque la clé API"""
        self.write({
            'is_active': False,
            'revoked_at': fields.Datetime.now(),
            'revoked_by': self.env.user.id,
        })
        _logger.warning(f"API key revoked: {self.key_prefix}...")

    @api.model
    def get_user_keys(self, user_id):
        """Liste les clés API d'un utilisateur"""
        keys = self.sudo().search([('user_id', '=', user_id)])
        return [{
            'id': k.id,
            'name': k.name,
            'key_prefix': k.key_prefix,
            'scope': k.scope,
            'is_active': k.is_active,
            'created_at': k.create_date.isoformat() if k.create_date else None,
            'expires_at': k.expires_at.isoformat() if k.expires_at else None,
            'last_used_at': k.last_used_at.isoformat() if k.last_used_at else None,
            'usage_count': k.usage_count,
        } for k in keys]
