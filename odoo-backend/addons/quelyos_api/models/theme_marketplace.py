# -*- coding: utf-8 -*-
"""
Modèles Marketplace Thèmes - Soumissions, Achats, Designers

Models:
- quelyos.theme.designer : Profils designers
- quelyos.theme.submission : Thèmes soumis par designers
- quelyos.theme.purchase : Achats de thèmes
- quelyos.theme.revenue : Suivi revenus designers
"""

import logging
from odoo import models, fields, api
from odoo.exceptions import ValidationError
from odoo.tools.translate import _

_logger = logging.getLogger(__name__)


class QuelyosThemeDesigner(models.Model):
    """Profil Designer pour marketplace thèmes"""
    _name = 'quelyos.theme.designer'
    _description = 'Designer de Thèmes'
    _order = 'create_date desc'

    # Identité
    user_id = fields.Many2one('res.users', string='Utilisateur', required=True, ondelete='cascade')
    display_name = fields.Char(string='Nom Public', required=True)
    bio = fields.Text(string='Bio')
    avatar = fields.Binary(string='Avatar', attachment=True)
    portfolio_url = fields.Char(string='Portfolio URL')

    # Contact
    email = fields.Char(string='Email', required=True)
    website = fields.Char(string='Site Web')
    social_links = fields.Json(string='Réseaux Sociaux')  # {twitter, behance, dribbble}

    # Statut
    status = fields.Selection([
        ('pending', 'En Attente'),
        ('approved', 'Approuvé'),
        ('suspended', 'Suspendu'),
        ('rejected', 'Rejeté'),
    ], string='Statut', default='pending', required=True)

    # Statistiques
    themes_count = fields.Integer(string='Nombre Thèmes', compute='_compute_stats', store=True)
    total_sales = fields.Integer(string='Ventes Totales', compute='_compute_stats', store=True)
    total_revenue = fields.Monetary(string='Revenus Totaux', currency_field='currency_id', compute='_compute_stats', store=True)
    average_rating = fields.Float(string='Note Moyenne', compute='_compute_stats', digits=(3, 2), store=True)

    # Paiement
    currency_id = fields.Many2one('res.currency', string='Devise', default=lambda self: self.env.company.currency_id)
    bank_account = fields.Char(string='Compte Bancaire')
    payment_method = fields.Selection([
        ('bank', 'Virement Bancaire'),
        ('paypal', 'PayPal'),
        ('stripe', 'Stripe Connect'),
    ], string='Méthode de Paiement', default='stripe')
    revenue_share_rate = fields.Float(string='Taux Commission (%)', default=70.0, help='Pourcentage que reçoit le designer (70% = 0.70)')

    # Stripe Connect
    stripe_connect_account_id = fields.Char(string='Stripe Connect Account ID', index=True)
    stripe_onboarding_completed = fields.Boolean(string='Onboarding Stripe Complété', default=False)
    stripe_payouts_enabled = fields.Boolean(string='Payouts Activés', default=False)
    stripe_charges_enabled = fields.Boolean(string='Charges Activées', default=False)
    last_payout_date = fields.Datetime(string='Dernier Payout')
    pending_balance = fields.Monetary(string='Solde En Attente', currency_field='currency_id', compute='_compute_pending_balance', store=True)

    # Relations
    submission_ids = fields.One2many('quelyos.theme.submission', 'designer_id', string='Soumissions')
    revenue_ids = fields.One2many('quelyos.theme.revenue', 'designer_id', string='Revenus')

    # Dates
    create_date = fields.Datetime(string='Date Inscription', readonly=True)
    approval_date = fields.Datetime(string='Date Approbation')

    active = fields.Boolean(string='Actif', default=True)
    @api.depends('submission_ids', 'submission_ids.sales_count', 'submission_ids.total_revenue', 'submission_ids.average_rating')

    @api.constrains('email')
    def _check_unique_email(self):
        """Contrainte: Cet email est déjà utilisé"""
        for record in self:
            # Chercher un doublon
            duplicate = self.search([
                ('email', '=', record.email),
                ('id', '!=', record.id)
            ], limit=1)

            if duplicate:
                raise ValidationError(_('Cet email est déjà utilisé'))


    def _compute_stats(self):
        for designer in self:
            approved_submissions = designer.submission_ids.filtered(lambda s: s.status == 'approved')
            designer.themes_count = len(approved_submissions)
            designer.total_sales = sum(approved_submissions.mapped('sales_count'))
            designer.total_revenue = sum(approved_submissions.mapped('designer_revenue'))
            if approved_submissions:
                ratings = approved_submissions.filtered(lambda s: s.average_rating > 0).mapped('average_rating')
                designer.average_rating = sum(ratings) / len(ratings) if ratings else 0.0
            else:
                designer.average_rating = 0.0

    @api.depends('revenue_ids', 'revenue_ids.amount', 'revenue_ids.payout_status')
    def _compute_pending_balance(self):
        """Calculer solde en attente (revenus non payés)"""
        for designer in self:
            pending_revenues = designer.revenue_ids.filtered(lambda r: r.payout_status == 'pending')
            designer.pending_balance = sum(pending_revenues.mapped('amount'))


class QuelyosThemeSubmission(models.Model):
    """Soumission de thème par un designer"""
    _name = 'quelyos.theme.submission'
    _description = 'Soumission Thème Designer'
    _order = 'create_date desc'

    # Thème
    theme_id = fields.Many2one('quelyos.theme', string='Thème', ondelete='cascade')
    designer_id = fields.Many2one('quelyos.theme.designer', string='Designer', required=True, ondelete='cascade')

    # Info Soumission
    name = fields.Char(string='Nom Thème', required=True)
    description = fields.Text(string='Description')
    category = fields.Selection([
        ('fashion', 'Mode'),
        ('tech', 'High-Tech'),
        ('food', 'Alimentaire'),
        ('beauty', 'Beauté'),
        ('sports', 'Sports'),
        ('home', 'Maison'),
        ('general', 'Général'),
    ], string='Catégorie', required=True)

    # Fichiers
    config_json = fields.Text(string='Configuration JSON', required=True)
    thumbnail = fields.Binary(string='Miniature', attachment=True)
    screenshots = fields.Json(string='Screenshots', help='Liste URLs screenshots')
    demo_url = fields.Char(string='URL Démo')

    # Prix
    is_premium = fields.Boolean(string='Premium', default=False)
    price = fields.Monetary(string='Prix', currency_field='currency_id', default=0.0)
    currency_id = fields.Many2one('res.currency', string='Devise', default=lambda self: self.env.company.currency_id)

    # Statut Validation
    status = fields.Selection([
        ('draft', 'Brouillon'),
        ('submitted', 'Soumis'),
        ('in_review', 'En Review'),
        ('approved', 'Approuvé'),
        ('rejected', 'Rejeté'),
        ('suspended', 'Suspendu'),
    ], string='Statut', default='draft', required=True)

    # Review
    reviewer_id = fields.Many2one('res.users', string='Reviewer')
    review_date = fields.Datetime(string='Date Review')
    review_notes = fields.Text(string='Notes Review')
    rejection_reason = fields.Text(string='Raison Rejet')

    # Statistiques
    sales_count = fields.Integer(string='Ventes', compute='_compute_sales_stats', store=True)
    total_revenue = fields.Monetary(string='Revenus Totaux', currency_field='currency_id', compute='_compute_sales_stats', store=True)
    designer_revenue = fields.Monetary(string='Revenus Designer', currency_field='currency_id', compute='_compute_sales_stats', store=True)
    platform_revenue = fields.Monetary(string='Revenus Plateforme', currency_field='currency_id', compute='_compute_sales_stats', store=True)
    average_rating = fields.Float(string='Note Moyenne', compute='_compute_rating', digits=(3, 2), store=True)
    reviews_count = fields.Integer(string='Nombre Avis')

    # Relations
    purchase_ids = fields.One2many('quelyos.theme.purchase', 'submission_id', string='Achats')
    review_ids = fields.One2many('quelyos.theme.review', 'theme_id', string='Avis')

    # Dates
    create_date = fields.Datetime(string='Date Création', readonly=True)
    submit_date = fields.Datetime(string='Date Soumission')
    approval_date = fields.Datetime(string='Date Approbation')

    active = fields.Boolean(string='Actif', default=True)

    @api.depends('purchase_ids', 'purchase_ids.amount', 'designer_id.revenue_share_rate')
    def _compute_sales_stats(self):
        for submission in self:
            purchases = submission.purchase_ids.filtered(lambda p: p.status == 'completed')
            submission.sales_count = len(purchases)
            submission.total_revenue = sum(purchases.mapped('amount'))

            revenue_share_rate = submission.designer_id.revenue_share_rate / 100.0 if submission.designer_id else 0.70
            submission.designer_revenue = submission.total_revenue * revenue_share_rate
            submission.platform_revenue = submission.total_revenue * (1 - revenue_share_rate)

    @api.depends('review_ids', 'review_ids.rating')
    def _compute_rating(self):
        for submission in self:
            if submission.theme_id and submission.theme_id.review_ids:
                ratings = submission.theme_id.review_ids.mapped('rating')
                submission.average_rating = sum(ratings) / len(ratings) if ratings else 0.0
                submission.reviews_count = len(ratings)
            else:
                submission.average_rating = 0.0
                submission.reviews_count = 0

    def action_submit(self):
        """Soumettre le thème pour review"""
        self.ensure_one()
        if self.status != 'draft':
            raise ValidationError('Seuls les thèmes en brouillon peuvent être soumis')

        self.write({
            'status': 'submitted',
            'submit_date': fields.Datetime.now(),
        })

    def action_approve(self):
        """Approuver le thème et créer quelyos.theme"""
        self.ensure_one()
        if self.status not in ('submitted', 'in_review'):
            raise ValidationError('Seuls les thèmes soumis ou en review peuvent être approuvés')

        # Créer theme officiel
        theme_vals = {
            'code': f"{self.designer_id.display_name.lower().replace(' ', '-')}-{self.name.lower().replace(' ', '-')}",
            'name': self.name,
            'description': self.description,
            'category': self.category,
            'config_json': self.config_json,
            'thumbnail': self.thumbnail,
            'is_premium': self.is_premium,
            'price': self.price,
            'is_public': True,
            'is_marketplace': True,
            'designer_id': self.designer_id.id,
        }

        if not self.theme_id:
            theme = self.env['quelyos.theme'].sudo().create(theme_vals)
            self.theme_id = theme.id
        else:
            self.theme_id.sudo().write(theme_vals)

        self.write({
            'status': 'approved',
            'approval_date': fields.Datetime.now(),
            'reviewer_id': self.env.user.id,
            'review_date': fields.Datetime.now(),
        })

        _logger.info(f"Theme submission approved: {self.name} by {self.designer_id.display_name}")

    def action_reject(self, reason):
        """Rejeter le thème"""
        self.ensure_one()
        self.write({
            'status': 'rejected',
            'rejection_reason': reason,
            'reviewer_id': self.env.user.id,
            'review_date': fields.Datetime.now(),
        })


class QuelyosThemePurchase(models.Model):
    """Achat de thème par un tenant"""
    _name = 'quelyos.theme.purchase'
    _description = 'Achat Thème'
    _order = 'create_date desc'

    # Relations
    submission_id = fields.Many2one('quelyos.theme.submission', string='Thème', required=True, ondelete='cascade')
    theme_id = fields.Many2one('quelyos.theme', string='Thème Officiel', related='submission_id.theme_id', store=True)
    designer_id = fields.Many2one('quelyos.theme.designer', string='Designer', related='submission_id.designer_id', store=True)
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', required=True, ondelete='cascade')
    user_id = fields.Many2one('res.users', string='Acheteur', required=True, ondelete='cascade')

    # Paiement
    amount = fields.Monetary(string='Montant', currency_field='currency_id', required=True)
    currency_id = fields.Many2one('res.currency', string='Devise', default=lambda self: self.env.company.currency_id)
    payment_method = fields.Selection([
        ('stripe', 'Stripe'),
        ('paypal', 'PayPal'),
        ('free', 'Gratuit'),
    ], string='Méthode Paiement', default='stripe')
    transaction_id = fields.Char(string='Transaction ID')
    stripe_payment_intent_id = fields.Char(string='Stripe Payment Intent ID', index=True)

    # Statut
    status = fields.Selection([
        ('pending', 'En Attente'),
        ('completed', 'Complété'),
        ('failed', 'Échoué'),
        ('refunded', 'Remboursé'),
    ], string='Statut', default='pending', required=True)

    # Dates
    create_date = fields.Datetime(string='Date Achat', readonly=True)
    completion_date = fields.Datetime(string='Date Complétion')

    # Revenue Split
    designer_share = fields.Monetary(string='Part Designer', currency_field='currency_id', compute='_compute_revenue_split', store=True)
    platform_share = fields.Monetary(string='Part Plateforme', currency_field='currency_id', compute='_compute_revenue_split', store=True)

    @api.depends('amount', 'designer_id.revenue_share_rate')
    def _compute_revenue_split(self):
        for purchase in self:
            revenue_share_rate = purchase.designer_id.revenue_share_rate / 100.0 if purchase.designer_id else 0.70
            purchase.designer_share = purchase.amount * revenue_share_rate
            purchase.platform_share = purchase.amount * (1 - revenue_share_rate)

    def action_complete(self):
        """Marquer achat comme complété et créer revenue entry"""
        self.ensure_one()
        if self.status != 'pending':
            raise ValidationError('Seuls les achats en attente peuvent être complétés')

        self.write({
            'status': 'completed',
            'completion_date': fields.Datetime.now(),
        })

        # Créer revenue entry pour designer
        if self.designer_id:
            self.env['quelyos.theme.revenue'].sudo().create({
                'designer_id': self.designer_id.id,
                'submission_id': self.submission_id.id,
                'purchase_id': self.id,
                'amount': self.designer_share,
                'currency_id': self.currency_id.id,
            })

        _logger.info(f"Theme purchase completed: {self.theme_id.name} by tenant {self.tenant_id.name}")


class QuelyosThemeRevenue(models.Model):
    """Suivi revenus designers"""
    _name = 'quelyos.theme.revenue'
    _description = 'Revenus Designer'
    _order = 'create_date desc'

    # Relations
    designer_id = fields.Many2one('quelyos.theme.designer', string='Designer', required=True, ondelete='cascade')
    submission_id = fields.Many2one('quelyos.theme.submission', string='Thème', required=True)
    purchase_id = fields.Many2one('quelyos.theme.purchase', string='Achat', required=True)

    # Montant
    amount = fields.Monetary(string='Montant', currency_field='currency_id', required=True)
    currency_id = fields.Many2one('res.currency', string='Devise', default=lambda self: self.env.company.currency_id)

    # Paiement au designer
    payout_status = fields.Selection([
        ('pending', 'En Attente'),
        ('processing', 'En Traitement'),
        ('paid', 'Payé'),
        ('failed', 'Échoué'),
    ], string='Statut Paiement', default='pending', required=True)
    payout_date = fields.Date(string='Date Paiement')
    payout_reference = fields.Char(string='Référence Paiement')

    # Stripe Transfer
    stripe_transfer_id = fields.Char(string='Stripe Transfer ID', index=True)
    payout_error = fields.Text(string='Erreur Paiement')

    # Dates
    create_date = fields.Datetime(string='Date', readonly=True)

    active = fields.Boolean(string='Actif', default=True)
