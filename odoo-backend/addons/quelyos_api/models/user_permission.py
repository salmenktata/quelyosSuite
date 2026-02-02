# -*- coding: utf-8 -*-
import json
import logging
from odoo import api, fields, models

_logger = logging.getLogger(__name__)

# Pages disponibles par module (source de vérité backend)
MODULE_PAGES = {
    'home': ['dashboard', 'analytics', 'subscriptions', 'settings', 'security'],
    'finance': ['dashboard', 'accounts', 'portfolios', 'expenses', 'incomes', 'import',
                'budgets', 'forecast', 'scenarios', 'payment-planning',
                'reporting', 'categories', 'suppliers', 'charts', 'tva', 'settings'],
    'store': ['dashboard', 'orders', 'products', 'categories', 'attributes', 'collections',
              'bundles', 'import-export', 'coupons', 'flash-sales', 'featured',
              'promo-banners', 'hero-slides', 'marketing-popups', 'live-events',
              'trending-products', 'abandoned-carts', 'reviews', 'testimonials',
              'loyalty', 'faq', 'static-pages', 'blog', 'menus', 'promo-messages',
              'trust-badges', 'themes', 'tickets', 'sales-reports', 'stock-alerts', 'settings'],
    'stock': ['dashboard', 'inventory', 'physical-inventory', 'reordering-rules',
              'inventory-groups', 'moves', 'transfers', 'warehouses', 'locations',
              'valuation', 'turnover', 'warehouse-calendars', 'settings'],
    'crm': ['dashboard', 'pipeline', 'leads', 'customers', 'customer-categories',
            'pricelists', 'invoices', 'payments', 'settings'],
    'marketing': ['dashboard', 'email', 'email-templates', 'sms', 'sms-templates',
                  'lists', 'settings'],
    'hr': ['dashboard', 'employees', 'departments', 'jobs', 'contracts',
           'attendance', 'leaves', 'leaves-calendar', 'allocations',
           'leave-types', 'appraisals', 'skills', 'settings'],
    'pos': ['dashboard', 'terminal', 'rush', 'kiosk', 'mobile', 'kds',
            'customer-display', 'session-open', 'orders', 'sessions',
            'click-collect', 'reports-sales', 'reports-payments', 'analytics',
            'settings-terminals', 'settings-payments', 'settings-receipts', 'settings'],
    'support': ['dashboard', 'tickets', 'new-ticket', 'faq'],
    'maintenance': ['dashboard', 'equipment', 'equipment-critical', 'requests',
                    'emergency', 'calendar', 'reports', 'costs', 'categories', 'settings'],
}

# Mapping module_id -> groupes Odoo
MODULE_GROUP_MAP = {
    'home': {'user': 'Quelyos Home User', 'manager': 'Quelyos Home Manager'},
    'finance': {'user': 'Quelyos Finance User', 'manager': 'Quelyos Finance Manager'},
    'store': {'user': 'Quelyos Store User', 'manager': 'Quelyos Store Manager'},
    'stock': {'user': 'Quelyos Stock User', 'manager': 'Quelyos Stock Manager'},
    'crm': {'user': 'Quelyos CRM User', 'manager': 'Quelyos CRM Manager'},
    'marketing': {'user': 'Quelyos Marketing User', 'manager': 'Quelyos Marketing Manager'},
    'hr': {'user': 'Quelyos HR User', 'manager': 'Quelyos HR Manager'},
    'pos': {'user': 'Quelyos POS User', 'manager': 'Quelyos POS Manager'},
    'support': {'user': 'Quelyos Store User', 'manager': 'Quelyos Store Manager'},
    'maintenance': {'user': 'Quelyos Maintenance User', 'manager': 'Quelyos Maintenance Manager'},
}


class UserPermission(models.Model):
    _name = 'quelyos.user.permission'
    _description = 'Permissions utilisateur par module'
    _order = 'module_id'

    user_id = fields.Many2one(
        'res.users',
        string='Utilisateur',
        required=True,
        ondelete='cascade',
        index=True,
    )
    tenant_id = fields.Many2one(
        'quelyos.tenant',
        string='Tenant',
        required=True,
        ondelete='cascade',
        index=True,
    )
    granted_by = fields.Many2one(
        'res.users',
        string='Accordé par',
        ondelete='set null',
    )
    module_id = fields.Char(
        string='Module',
        required=True,
        index=True,
    )
    access_level = fields.Selection([
        ('none', 'Aucun accès'),
        ('read', 'Lecture seule'),
        ('full', 'Accès complet'),
    ], string='Niveau d\'accès', required=True, default='none')
    page_permissions = fields.Text(
        string='Permissions par page (JSON)',
        default='{}',
    )
    created_at = fields.Datetime(default=fields.Datetime.now)
    updated_at = fields.Datetime(default=fields.Datetime.now)

    _sql_constraints = [
        ('unique_user_tenant_module',
         'UNIQUE(user_id, tenant_id, module_id)',
         'Une seule permission par utilisateur, tenant et module.'),
    ]

    @api.model
    def create(self, vals):
        if isinstance(vals, list):
            for v in vals:
                v['updated_at'] = fields.Datetime.now()
        else:
            vals['updated_at'] = fields.Datetime.now()
        records = super().create(vals)
        for record in records:
            record._sync_odoo_groups()
        return records

    def write(self, vals):
        if isinstance(vals, list):
            for v in vals:
                v['updated_at'] = fields.Datetime.now()
        else:
            vals['updated_at'] = fields.Datetime.now()
        result = super().write(vals)
        # Sync groupes Odoo si le niveau d'accès change
        if 'access_level' in vals:
            for record in self:
                record._sync_odoo_groups()
        return result

    def _sync_odoo_groups(self):
        """Synchronise les groupes Odoo en fonction du niveau d'accès."""
        group_map = MODULE_GROUP_MAP.get(self.module_id)
        if not group_map:
            return

        user = self.user_id
        IrModelData = self.env['ir.model.data'].sudo()

        # Chercher les groupes par nom
        user_group = self.env['res.groups'].sudo().search(
            [('name', 'ilike', group_map['user'])], limit=1
        )
        manager_group = self.env['res.groups'].sudo().search(
            [('name', 'ilike', group_map['manager'])], limit=1
        )

        if self.access_level == 'none':
            # Retirer les deux groupes
            if user_group and user_group in user.group_ids:
                user.sudo().write({'group_ids': [(3, user_group.id)]})
            if manager_group and manager_group in user.group_ids:
                user.sudo().write({'group_ids': [(3, manager_group.id)]})
        elif self.access_level == 'read':
            # Ajouter User, retirer Manager
            if user_group and user_group not in user.group_ids:
                user.sudo().write({'group_ids': [(4, user_group.id)]})
            if manager_group and manager_group in user.group_ids:
                user.sudo().write({'group_ids': [(3, manager_group.id)]})
        elif self.access_level == 'full':
            # Ajouter Manager (inclut User implicitement dans Odoo)
            if manager_group and manager_group not in user.group_ids:
                user.sudo().write({'group_ids': [(4, manager_group.id)]})

    def get_page_permissions_dict(self):
        """Retourne les permissions par page sous forme de dict."""
        try:
            return json.loads(self.page_permissions or '{}')
        except (json.JSONDecodeError, TypeError):
            return {}

    @api.model
    def get_user_permissions(self, user_id, tenant_id):
        """Retourne toutes les permissions d'un utilisateur pour un tenant.

        Returns:
            dict: {
                'modules': {
                    'finance': {'level': 'full', 'pages': {'dashboard': 'full', ...}},
                    'store': {'level': 'read', 'pages': {...}},
                    ...
                },
                'is_manager': bool
            }
        """
        permissions = self.sudo().search([
            ('user_id', '=', user_id),
            ('tenant_id', '=', tenant_id),
        ])

        # Vérifier si l'user est le manager du tenant
        tenant = self.env['quelyos.tenant'].sudo().browse(tenant_id)
        is_manager = False
        if tenant.exists():
            # Admin email match
            if tenant.admin_email:
                user = self.env['res.users'].sudo().browse(user_id)
                if user.exists() and user.login == tenant.admin_email:
                    is_manager = True
            # Premier utilisateur du tenant
            if not is_manager:
                first_user = self.env['res.users'].sudo().search([
                    ('company_id', '=', tenant.company_id.id),
                    ('active', '=', True),
                    ('share', '=', False),
                ], order='id asc', limit=1)
                if first_user and first_user.id == user_id:
                    is_manager = True

        modules = {}
        for perm in permissions:
            modules[perm.module_id] = {
                'level': perm.access_level,
                'pages': perm.get_page_permissions_dict(),
            }

        return {
            'modules': modules,
            'is_manager': is_manager,
        }

    @api.model
    def set_user_permissions(self, user_id, tenant_id, module_id, access_level, page_permissions=None, granted_by=None):
        """Définit les permissions d'un utilisateur pour un module."""
        existing = self.sudo().search([
            ('user_id', '=', user_id),
            ('tenant_id', '=', tenant_id),
            ('module_id', '=', module_id),
        ], limit=1)

        vals = {
            'access_level': access_level,
        }
        if page_permissions is not None:
            vals['page_permissions'] = json.dumps(page_permissions)
        if granted_by:
            vals['granted_by'] = granted_by

        if existing:
            existing.write(vals)
            return existing
        else:
            vals.update({
                'user_id': user_id,
                'tenant_id': tenant_id,
                'module_id': module_id,
            })
            return self.sudo().create(vals)
