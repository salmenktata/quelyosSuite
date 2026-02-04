# -*- coding: utf-8 -*-
"""
Modèle Accès Portail Expert-Comptable

Gère accès multi-clients pour experts-comptables externes :
- Assignation EC → clients (N-to-N)
- Permissions granulaires (lecture/écriture/validation)
- Dashboard agrégé (vue globale portefeuille clients)
- Notifications automatiques (nouvelles factures, anomalies)
- Tracking activité (logs consultation, exports)

Workflow :
1. PME invite son EC via email
2. EC crée compte Quelyos (ou existant)
3. EC accepte invitation → accès client activé
4. EC consulte dashboard agrégé tous ses clients
5. EC navigue entre clients sans re-login

Sécurité :
- Isolation stricte tenant (EC ne voit QUE ses clients assignés)
- Permissions configurables par client
- Logs accès complets (audit trail)
- Token révocable (désactivation immédiate)
"""

import logging
from datetime import datetime, timedelta
from odoo import models, fields, api
from odoo.exceptions import UserError, AccessError

_logger = logging.getLogger(__name__)


class AccountantPortalAccess(models.Model):
    """Accès portail EC pour un client"""

    _name = 'quelyos.accountant_portal_access'
    _description = 'Accès Portail Expert-Comptable'
    _order = 'create_date desc'
    _rec_name = 'accountant_id'

    # Relations
    tenant_id = fields.Many2one('quelyos.tenant', string='Client (Tenant)', required=True, index=True)
    accountant_id = fields.Many2one(
        'res.users',
        string='Expert-Comptable',
        required=True,
        index=True,
        help='Utilisateur Odoo avec rôle expert-comptable'
    )

    # Permissions
    permission_level = fields.Selection(
        [
            ('readonly', 'Lecture Seule'),
            ('comment', 'Lecture + Commentaires'),
            ('validate', 'Lecture + Validation'),
            ('edit', 'Lecture + Écriture'),
        ],
        string='Niveau permission',
        default='comment',
        required=True,
        help='Permissions accordées à cet EC pour ce client'
    )

    can_export_fec = fields.Boolean(string='Peut exporter FEC', default=True)
    can_access_bank = fields.Boolean(string='Peut voir comptes bancaires', default=True)
    can_validate_period = fields.Boolean(
        string='Peut valider période comptable',
        default=True,
        help='Permet de marquer un mois comme "vérifié et validé"'
    )

    # État
    state = fields.Selection(
        [
            ('pending', 'Invitation Envoyée'),
            ('active', 'Actif'),
            ('suspended', 'Suspendu'),
            ('revoked', 'Révoqué'),
        ],
        string='État',
        default='pending',
        required=True,
        index=True
    )

    # Invitation
    invitation_token = fields.Char(
        string='Token invitation',
        help='Token unique pour acceptation invitation',
        readonly=True,
        copy=False
    )
    invitation_sent_date = fields.Datetime(string='Invitation envoyée le', readonly=True)
    invitation_accepted_date = fields.Datetime(string='Invitation acceptée le', readonly=True)
    invitation_expires = fields.Datetime(
        string='Invitation expire le',
        compute='_compute_invitation_expires',
        store=True
    )

    # Notifications
    notify_new_invoice = fields.Boolean(
        string='Notifier nouvelles factures',
        default=True,
        help='Email quotidien récap nouvelles factures'
    )
    notify_anomaly = fields.Boolean(
        string='Notifier anomalies',
        default=True,
        help='Email immédiat si anomalie détectée (TVA incorrecte, etc.)'
    )

    # Statistiques
    last_access = fields.Datetime(string='Dernier accès', readonly=True)
    access_count = fields.Integer(string='Nombre accès', default=0, readonly=True)
    last_export_fec = fields.Datetime(string='Dernier export FEC', readonly=True)
    export_fec_count = fields.Integer(string='Nombre exports FEC', default=0, readonly=True)

    # Métadonnées
    notes = fields.Text(string='Notes internes')
    create_date = fields.Datetime(string='Créé le', readonly=True)

    # Contraintes
    _sql_constraints = [
        (
            'unique_accountant_tenant',
            'UNIQUE(tenant_id, accountant_id)',
            'Un EC ne peut avoir qu\'un seul accès par client'
        )
    ]

    @api.depends('invitation_sent_date')
    def _compute_invitation_expires(self):
        """Calcul date expiration invitation (7 jours)"""
        for record in self:
            if record.invitation_sent_date:
                record.invitation_expires = record.invitation_sent_date + timedelta(days=7)
            else:
                record.invitation_expires = False

    @api.model
    def create(self, vals):
        """Générer token invitation et envoyer email"""
        if not vals.get('invitation_token'):
            import secrets
            vals['invitation_token'] = secrets.token_urlsafe(32)
            vals['invitation_sent_date'] = fields.Datetime.now()

        access = super(AccountantPortalAccess, self).create(vals)

        # Envoyer email invitation
        if access.state == 'pending':
            access._send_invitation_email()

        return access

    def _send_invitation_email(self):
        """Envoyer email invitation EC"""
        self.ensure_one()

        # TODO: Créer template email avec lien invitation
        invitation_url = f"https://app.quelyos.com/accountant/accept-invitation?token={self.invitation_token}"

        _logger.info(
            f"Invitation EC envoyée : {self.accountant_id.email} → client {self.tenant_id.name}"
            f"\nURL invitation : {invitation_url}"
        )

        # Envoyer email via Odoo mail
        template = self.env.ref('quelyos_finance.mail_template_accountant_invitation', raise_if_not_found=False)
        if template:
            template.send_mail(self.id, force_send=True)

    def action_accept_invitation(self):
        """Accepter invitation (EC clique lien email)"""
        self.ensure_one()

        if self.state != 'pending':
            raise UserError("Invitation déjà acceptée ou révoquée")

        # Vérifier expiration
        if self.invitation_expires and self.invitation_expires < fields.Datetime.now():
            raise UserError("Invitation expirée (valide 7 jours)")

        # Activer accès
        self.write({
            'state': 'active',
            'invitation_accepted_date': fields.Datetime.now(),
        })

        _logger.info(
            f"Invitation acceptée : EC {self.accountant_id.name} → client {self.tenant_id.name}"
        )

        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'message': f'Accès activé pour {self.tenant_id.name} !',
                'type': 'success',
                'sticky': False,
            }
        }

    def action_revoke_access(self):
        """Révoquer accès EC (action client)"""
        self.ensure_one()

        self.write({'state': 'revoked'})

        _logger.warning(
            f"Accès révoqué : EC {self.accountant_id.name} → client {self.tenant_id.name}"
        )

        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'message': f'Accès révoqué pour {self.accountant_id.name}',
                'type': 'warning',
                'sticky': False,
            }
        }

    def action_suspend_access(self):
        """Suspendre temporairement accès"""
        self.ensure_one()
        self.write({'state': 'suspended'})

    def action_reactivate_access(self):
        """Réactiver accès suspendu"""
        self.ensure_one()
        if self.state == 'suspended':
            self.write({'state': 'active'})

    def log_access(self):
        """Logger accès EC (appelé à chaque connexion)"""
        self.ensure_one()
        self.sudo().write({
            'last_access': fields.Datetime.now(),
            'access_count': self.access_count + 1,
        })

    def log_export_fec(self):
        """Logger export FEC"""
        self.ensure_one()
        self.sudo().write({
            'last_export_fec': fields.Datetime.now(),
            'export_fec_count': self.export_fec_count + 1,
        })

    @api.model
    def get_accountant_clients(self, accountant_user_id):
        """
        Récupérer tous les clients d'un EC

        Args:
            accountant_user_id (int): ID utilisateur EC

        Returns:
            list: Liste accès actifs avec infos clients
        """
        accesses = self.search([
            ('accountant_id', '=', accountant_user_id),
            ('state', '=', 'active'),
        ])

        clients_data = []
        for access in accesses:
            tenant = access.tenant_id

            # Stats client
            invoice_count = self.env['account.move'].sudo().search_count([
                ('tenant_id', '=', tenant.id),
                ('move_type', '=', 'out_invoice'),
                ('state', '=', 'posted'),
            ])

            clients_data.append({
                'access_id': access.id,
                'tenant_id': tenant.id,
                'tenant_name': tenant.name,
                'company_name': tenant.company_id.name,
                'permission_level': access.permission_level,
                'can_export_fec': access.can_export_fec,
                'last_access': access.last_access.isoformat() if access.last_access else None,
                'invoice_count': invoice_count,
            })

        return clients_data

    @api.model
    def check_access(self, accountant_user_id, tenant_id, required_permission='readonly'):
        """
        Vérifier si EC a accès à un client

        Args:
            accountant_user_id (int): ID utilisateur EC
            tenant_id (int): ID client
            required_permission (str): Permission requise

        Returns:
            bool: True si accès autorisé

        Raises:
            AccessError: Si accès refusé
        """
        access = self.search([
            ('accountant_id', '=', accountant_user_id),
            ('tenant_id', '=', tenant_id),
            ('state', '=', 'active'),
        ], limit=1)

        if not access:
            raise AccessError(f"Accès refusé : EC non assigné à ce client")

        # Vérifier niveau permission
        permission_hierarchy = ['readonly', 'comment', 'validate', 'edit']
        if permission_hierarchy.index(access.permission_level) < permission_hierarchy.index(required_permission):
            raise AccessError(f"Permission insuffisante : {required_permission} requis")

        # Logger accès
        access.log_access()

        return True


class AccountantPortalValidation(models.Model):
    """Validation période comptable par EC"""

    _name = 'quelyos.accountant_portal_validation'
    _description = 'Validation Période Comptable EC'
    _order = 'validation_date desc'

    # Relations
    tenant_id = fields.Many2one('quelyos.tenant', string='Client', required=True, index=True)
    accountant_id = fields.Many2one('res.users', string='Expert-Comptable', required=True)
    access_id = fields.Many2one('quelyos.accountant_portal_access', string='Accès', required=True)

    # Période
    period_year = fields.Integer(string='Année', required=True, index=True)
    period_month = fields.Integer(string='Mois', required=True, index=True)
    period_label = fields.Char(
        string='Période',
        compute='_compute_period_label',
        store=True
    )

    # Validation
    is_validated = fields.Boolean(string='Période validée', default=False)
    validation_date = fields.Datetime(string='Date validation')
    validation_notes = fields.Text(string='Notes validation')

    # Checklist (items validés par EC)
    check_invoices_complete = fields.Boolean(string='✓ Factures complètes', default=False)
    check_payments_reconciled = fields.Boolean(string='✓ Paiements réconciliés', default=False)
    check_bank_reconciled = fields.Boolean(string='✓ Rapprochement bancaire OK', default=False)
    check_vat_correct = fields.Boolean(string='✓ TVA correcte', default=False)
    check_expenses_categorized = fields.Boolean(string='✓ Charges catégorisées', default=False)

    # Anomalies détectées
    anomaly_count = fields.Integer(string='Anomalies détectées', default=0)
    anomaly_description = fields.Text(string='Description anomalies')

    # Contraintes
    _sql_constraints = [
        (
            'unique_period_validation',
            'UNIQUE(tenant_id, period_year, period_month)',
            'Une seule validation par période/client'
        )
    ]

    @api.depends('period_year', 'period_month')
    def _compute_period_label(self):
        """Formater label période"""
        months = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
        for record in self:
            if record.period_month and record.period_year:
                record.period_label = f"{months[record.period_month]} {record.period_year}"
            else:
                record.period_label = ''

    def action_validate_period(self):
        """Valider période (toutes checks OK)"""
        self.ensure_one()

        if not all([
            self.check_invoices_complete,
            self.check_payments_reconciled,
            self.check_bank_reconciled,
            self.check_vat_correct,
            self.check_expenses_categorized,
        ]):
            raise UserError("Toutes les vérifications doivent être complétées avant validation")

        self.write({
            'is_validated': True,
            'validation_date': fields.Datetime.now(),
        })

        _logger.info(
            f"Période validée : {self.period_label} pour {self.tenant_id.name} "
            f"par EC {self.accountant_id.name}"
        )

        # Notifier client
        self.tenant_id.message_post(
            body=f"<p>✅ <b>Période {self.period_label} validée</b> par {self.accountant_id.name}</p>"
                 f"<p>Toutes les vérifications comptables sont complètes.</p>",
            subject=f"Validation comptable {self.period_label}"
        )
