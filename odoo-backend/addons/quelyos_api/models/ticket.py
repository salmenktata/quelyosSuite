# -*- coding: utf-8 -*-
from odoo import models, fields, api, _


class SupportTicket(models.Model):
    _name = 'quelyos.ticket'
    _description = 'Ticket Support/Réclamation'
    _order = 'create_date desc'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    # Identification
    name = fields.Char(
        'Référence',
        required=True,
        readonly=True,
        default=lambda self: _('New'),
        copy=False
    )
    subject = fields.Char('Sujet', required=True)

    # Client
    partner_id = fields.Many2one(
        'res.partner',
        string='Client',
        required=True,
        index=True
    )
    email = fields.Char(related='partner_id.email', string='Email')
    phone = fields.Char(related='partner_id.phone', string='Téléphone')

    # Commande liée (optionnel)
    order_id = fields.Many2one('sale.order', string='Commande')
    product_id = fields.Many2one('product.template', string='Produit concerné')

    # Contenu
    description = fields.Html('Description', required=True)
    category = fields.Selection([
        # Catégories Store (existantes - compatibilité)
        ('order', 'Problème commande'),
        ('product', 'Problème produit'),
        ('delivery', 'Problème livraison'),
        ('return', 'Demande retour'),
        ('refund', 'Demande remboursement'),
        ('payment', 'Problème paiement'),
        ('account', 'Problème compte'),
        # Nouvelles catégories génériques
        ('technical', 'Support technique'),
        ('billing', 'Facturation/Abonnement'),
        ('feature_request', 'Demande fonctionnalité'),
        ('bug', 'Signalement bug'),
        ('question', 'Question générale'),
        ('other', 'Autre'),
    ], string='Catégorie', required=True, default='other')

    priority = fields.Selection([
        ('low', 'Basse'),
        ('medium', 'Moyenne'),
        ('high', 'Haute'),
        ('urgent', 'Urgente'),
    ], string='Priorité', default='medium', tracking=True)

    # Statut
    state = fields.Selection([
        ('new', 'Nouveau'),
        ('open', 'En cours'),
        ('pending', 'En attente client'),
        ('resolved', 'Résolu'),
        ('closed', 'Fermé'),
    ], string='Statut', default='new', tracking=True)

    # Assignation
    assigned_to = fields.Many2one('res.users', string='Assigné à', tracking=True)
    company_id = fields.Many2one(
        'res.company',
        string='Société',
        required=True,
        default=lambda self: self.env.company,
        index=True
    )

    # Résolution
    resolution = fields.Html('Résolution')
    resolution_date = fields.Datetime('Date résolution')

    # Pièces jointes
    attachment_ids = fields.Many2many(
        'ir.attachment',
        string='Pièces jointes'
    )

    # Messages/Réponses
    ticket_message_ids = fields.One2many(
        'quelyos.ticket.message',
        'ticket_id',
        string='Messages'
    )
    message_count = fields.Integer('Nb messages', compute='_compute_message_count', store=True)

    # Satisfaction
    satisfaction_rating = fields.Selection([
        ('1', 'Très insatisfait'),
        ('2', 'Insatisfait'),
        ('3', 'Neutre'),
        ('4', 'Satisfait'),
        ('5', 'Très satisfait'),
    ], string='Satisfaction')
    satisfaction_comment = fields.Text('Commentaire satisfaction')
    satisfaction_token = fields.Char(
        'Token satisfaction',
        copy=False,
        help='Token unique pour accès sécurisé au formulaire de satisfaction'
    )
    satisfaction_email_sent = fields.Boolean(
        'Email satisfaction envoyé',
        default=False,
        help='Indique si l\'email de demande de satisfaction a été envoyé'
    )
    satisfaction_email_sent_date = fields.Datetime(
        'Date envoi email satisfaction',
        help='Date d\'envoi de l\'email de demande de satisfaction'
    )

    # Relations entre tickets (parent/enfants)
    parent_ticket_id = fields.Many2one(
        'quelyos.ticket',
        string='Ticket parent',
        index=True,
        ondelete='cascade',
        help='Ticket parent si ce ticket est lié à un autre ticket'
    )
    child_ticket_ids = fields.One2many(
        'quelyos.ticket',
        'parent_ticket_id',
        string='Tickets liés',
        help='Tickets enfants liés à ce ticket'
    )
    child_ticket_count = fields.Integer(
        'Nombre de tickets liés',
        compute='_compute_child_ticket_count',
        store=True,
        help='Nombre de tickets liés à ce ticket'
    )
    has_parent = fields.Boolean(
        'A un parent',
        compute='_compute_has_parent',
        store=True,
        help='Indique si ce ticket est lié à un ticket parent'
    )

    # Champs Super Admin
    internal_notes = fields.Html(
        'Notes internes',
        help='Notes visibles uniquement par les administrateurs'
    )
    is_visible_to_customer = fields.Boolean(
        'Visible client',
        default=True,
        help='Si False, ticket uniquement visible par Super Admin'
    )
    source = fields.Selection([
        ('dashboard', 'Dashboard Client'),
        ('ecommerce', 'Site E-commerce'),
        ('store', 'Module Boutique'),
        ('other', 'Autre'),
    ], string='Source', default='dashboard')

    # Délais
    response_time = fields.Float('Temps première réponse (h)', compute='_compute_times', store=True)
    resolution_time = fields.Float('Temps résolution (h)', compute='_compute_times', store=True)

    # SLA (Service Level Agreement)
    sla_policy_id = fields.Many2one('quelyos.sla.policy', string='Politique SLA', compute='_compute_sla_policy', store=True)
    sla_first_response_deadline = fields.Datetime('SLA Deadline première réponse', compute='_compute_sla_deadlines', store=True)
    sla_resolution_deadline = fields.Datetime('SLA Deadline résolution', compute='_compute_sla_deadlines', store=True)
    sla_first_response_status = fields.Selection([
        ('ok', 'Respecté'),
        ('warning', 'Alerte'),
        ('breached', 'Dépassé'),
    ], string='Statut SLA première réponse', compute='_compute_sla_status')
    sla_resolution_status = fields.Selection([
        ('ok', 'Respecté'),
        ('warning', 'Alerte'),
        ('breached', 'Dépassé'),
    ], string='Statut SLA résolution', compute='_compute_sla_status')

    @api.model_create_multi
    def create(self, vals_list):
        """Surcharge create pour générer séquence et publier événement WebSocket"""
        # Générer séquences pour chaque ticket
        for vals in vals_list:
            if vals.get('name', _('New')) == _('New'):
                vals['name'] = self.env['ir.sequence'].next_by_code('quelyos.ticket') or _('New')

        tickets = super().create(vals_list)

        # Publier événement WebSocket pour chaque ticket
        for ticket in tickets:
            ticket._publish_ws_event('ticket.created', {
                'ticketId': ticket.id,
                'tenantId': ticket.company_id.id,
                'tenantName': ticket.company_id.name,
                'priority': ticket.priority,
                'subject': ticket.subject,
                'category': ticket.category,
            })

        return tickets

    @api.depends('ticket_message_ids')
    def _compute_message_count(self):
        for ticket in self:
            ticket.message_count = len(ticket.ticket_message_ids)

    @api.depends('child_ticket_ids')
    def _compute_child_ticket_count(self):
        """Calcule le nombre de tickets enfants"""
        for ticket in self:
            ticket.child_ticket_count = len(ticket.child_ticket_ids)

    @api.depends('parent_ticket_id')
    def _compute_has_parent(self):
        """Détermine si le ticket a un parent"""
        for ticket in self:
            ticket.has_parent = bool(ticket.parent_ticket_id)

    @api.depends('create_date', 'ticket_message_ids', 'resolution_date')
    def _compute_times(self):
        for ticket in self:
            ticket.response_time = 0
            ticket.resolution_time = 0

            if ticket.create_date:
                # Temps première réponse (premier message staff)
                staff_messages = ticket.ticket_message_ids.filtered(lambda m: m.is_staff)
                if staff_messages:
                    first_response = min(staff_messages, key=lambda m: m.create_date)
                    delta = first_response.create_date - ticket.create_date
                    ticket.response_time = round(delta.total_seconds() / 3600, 2)

                # Temps résolution
                if ticket.resolution_date:
                    delta = ticket.resolution_date - ticket.create_date
                    ticket.resolution_time = round(delta.total_seconds() / 3600, 2)

    @api.depends('priority', 'category')
    def _compute_sla_policy(self):
        """Détermine la politique SLA applicable"""
        for ticket in self:
            policy = self.env['quelyos.sla.policy'].get_policy_for_ticket(
                ticket.priority,
                ticket.category
            )
            ticket.sla_policy_id = policy.id if policy else False

    @api.depends('create_date', 'sla_policy_id')
    def _compute_sla_deadlines(self):
        """Calcule les deadlines SLA"""
        from datetime import timedelta
        for ticket in self:
            if ticket.create_date and ticket.sla_policy_id:
                # Deadline première réponse
                ticket.sla_first_response_deadline = ticket.create_date + timedelta(
                    hours=ticket.sla_policy_id.target_first_response
                )
                # Deadline résolution
                ticket.sla_resolution_deadline = ticket.create_date + timedelta(
                    hours=ticket.sla_policy_id.target_resolution
                )
            else:
                ticket.sla_first_response_deadline = False
                ticket.sla_resolution_deadline = False

    @api.depends('response_time', 'resolution_time', 'sla_policy_id', 'sla_first_response_deadline', 'sla_resolution_deadline', 'ticket_message_ids', 'state')
    def _compute_sla_status(self):
        """Calcule le statut SLA (ok/warning/breached)"""
        from datetime import datetime, timezone
        for ticket in self:
            # Statut SLA première réponse
            if ticket.response_time > 0:
                # Réponse déjà donnée
                if ticket.sla_policy_id and ticket.response_time <= ticket.sla_policy_id.target_first_response:
                    ticket.sla_first_response_status = 'ok'
                else:
                    ticket.sla_first_response_status = 'breached'
            elif ticket.sla_first_response_deadline:
                # Pas encore de réponse, vérifier si on approche
                now = datetime.now(timezone.utc)
                deadline = ticket.sla_first_response_deadline.replace(tzinfo=timezone.utc)
                if now >= deadline:
                    ticket.sla_first_response_status = 'breached'
                else:
                    elapsed = (now - ticket.create_date.replace(tzinfo=timezone.utc)).total_seconds()
                    total = (deadline - ticket.create_date.replace(tzinfo=timezone.utc)).total_seconds()
                    percentage = (elapsed / total * 100) if total > 0 else 0
                    if percentage >= ticket.sla_policy_id.warning_threshold:
                        ticket.sla_first_response_status = 'warning'
                    else:
                        ticket.sla_first_response_status = 'ok'
            else:
                ticket.sla_first_response_status = False

            # Statut SLA résolution
            if ticket.state in ('resolved', 'closed'):
                # Ticket résolu
                if ticket.sla_policy_id and ticket.resolution_time <= ticket.sla_policy_id.target_resolution:
                    ticket.sla_resolution_status = 'ok'
                else:
                    ticket.sla_resolution_status = 'breached'
            elif ticket.sla_resolution_deadline:
                # Pas encore résolu, vérifier si on approche
                now = datetime.now(timezone.utc)
                deadline = ticket.sla_resolution_deadline.replace(tzinfo=timezone.utc)
                if now >= deadline:
                    ticket.sla_resolution_status = 'breached'
                else:
                    elapsed = (now - ticket.create_date.replace(tzinfo=timezone.utc)).total_seconds()
                    total = (deadline - ticket.create_date.replace(tzinfo=timezone.utc)).total_seconds()
                    percentage = (elapsed / total * 100) if total > 0 else 0
                    if percentage >= ticket.sla_policy_id.warning_threshold:
                        ticket.sla_resolution_status = 'warning'
                    else:
                        ticket.sla_resolution_status = 'ok'
            else:
                ticket.sla_resolution_status = False

    def action_open(self):
        self.write({'state': 'open'})

    def action_pending(self):
        self.write({'state': 'pending'})

    def action_resolve(self):
        self.write({
            'state': 'resolved',
            'resolution_date': fields.Datetime.now(),
        })

    def action_close(self):
        self.write({'state': 'closed'})

    def action_reopen(self):
        self.write({
            'state': 'open',
            'resolution_date': False,
        })

    def write(self, vals):
        """Surcharge write pour publier changements WebSocket et envoyer email satisfaction"""
        # Mémoriser anciens états pour détecter changements
        old_states = {ticket.id: ticket.state for ticket in self}

        result = super().write(vals)

        if 'state' in vals or 'priority' in vals:
            for ticket in self:
                ticket._publish_ws_event('ticket.updated', {
                    'ticketId': ticket.id,
                    'state': ticket.state,
                    'priority': ticket.priority,
                })

        # Envoyer email satisfaction automatique lors résolution
        if 'state' in vals and vals['state'] == 'resolved':
            for ticket in self:
                # Envoyer seulement si ticket vient d'être résolu (pas déjà résolu)
                if old_states.get(ticket.id) != 'resolved' and not ticket.satisfaction_email_sent:
                    ticket._send_satisfaction_email()

        return result

    def _publish_ws_event(self, event, data):
        """Publier événement WebSocket via bus.bus"""
        self.env['bus.bus']._sendone(
            'tickets',  # channel
            event,      # event type
            data        # payload
        )

    def to_dict(self):
        """Sérialisation pour API client"""
        self.ensure_one()
        return {
            'id': self.id,
            'reference': self.name,
            'subject': self.subject,
            'description': self.description,
            'category': self.category,
            'priority': self.priority,
            'state': self.state,
            'assignedTo': self.assigned_to.name if self.assigned_to else None,
            'messageCount': self.message_count,
            'createdAt': self.create_date.isoformat() if self.create_date else None,
            'updatedAt': self.write_date.isoformat() if self.write_date else None,
            # Temps
            'responseTime': self.response_time,
            'resolutionTime': self.resolution_time,
            # SLA
            'slaFirstResponseDeadline': self.sla_first_response_deadline.isoformat() if self.sla_first_response_deadline else None,
            'slaResolutionDeadline': self.sla_resolution_deadline.isoformat() if self.sla_resolution_deadline else None,
            'slaFirstResponseStatus': self.sla_first_response_status or None,
            'slaResolutionStatus': self.sla_resolution_status or None,
        }

    def to_dict_super_admin(self):
        """Sérialisation enrichie pour Super Admin"""
        self.ensure_one()
        data = self.to_dict()
        data.update({
            'tenantId': self.company_id.id,
            'tenantName': self.company_id.name,
            'customerId': self.partner_id.id,
            'customerName': self.partner_id.name,
            'customerEmail': self.email,
            'internalNotes': self.internal_notes,
            'isVisibleToCustomer': self.is_visible_to_customer,
            'orderId': self.order_id.id if self.order_id else None,
            'orderName': self.order_id.name if self.order_id else None,
            'productId': self.product_id.id if self.product_id else None,
            'productName': self.product_id.name if self.product_id else None,
            'satisfactionRating': self.satisfaction_rating,
            'satisfactionComment': self.satisfaction_comment,
            'resolution': self.resolution,
            'responseTime': self.response_time,
            'resolutionTime': self.resolution_time,
            'resolvedAt': self.resolution_date.isoformat() if self.resolution_date else None,
        })
        return data

    def _send_satisfaction_email(self):
        """Envoyer email de demande de satisfaction au client"""
        self.ensure_one()

        # Ne pas envoyer si déjà envoyé
        if self.satisfaction_email_sent:
            return

        # Générer token unique si non existant
        if not self.satisfaction_token:
            import secrets
            self.satisfaction_token = secrets.token_urlsafe(32)

        # Trouver le template email
        template = self.env.ref('quelyos_api.email_template_satisfaction_request', raise_if_not_found=False)
        if not template:
            # Fallback : créer template basique
            return

        # URL formulaire satisfaction (frontend publique)
        base_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url')
        satisfaction_url = f"{base_url}/satisfaction/{self.satisfaction_token}"

        # Envoyer email
        template.with_context(
            satisfaction_url=satisfaction_url,
            ticket=self,
        ).send_mail(self.id, force_send=True)

        # Marquer comme envoyé
        self.write({
            'satisfaction_email_sent': True,
            'satisfaction_email_sent_date': fields.Datetime.now(),
        })


class TicketMessage(models.Model):
    _name = 'quelyos.ticket.message'
    _description = 'Message Ticket'
    _order = 'create_date'

    ticket_id = fields.Many2one(
        'quelyos.ticket',
        string='Ticket',
        required=True,
        ondelete='cascade'
    )
    author_id = fields.Many2one(
        'res.partner',
        string='Auteur',
        required=True,
        default=lambda self: self.env.user.partner_id
    )
    content = fields.Html('Message', required=True)
    is_staff = fields.Boolean(
        'Message staff',
        compute='_compute_is_staff',
        store=True
    )
    attachment_ids = fields.Many2many('ir.attachment', string='Pièces jointes')

    @api.model
    def create(self, vals):
        """Surcharge create pour publier événement WebSocket"""
        message = super().create(vals)

        # Publier événement
        message.ticket_id._publish_ws_event('ticket.replied', {
            'ticketId': message.ticket_id.id,
            'messageId': message.id,
            'authorName': message.author_id.name,
            'isStaff': message.is_staff,
        })

        return message

    @api.depends('author_id')
    def _compute_is_staff(self):
        for msg in self:
            user = self.env['res.users'].search([
                ('partner_id', '=', msg.author_id.id)
            ], limit=1)
            msg.is_staff = bool(user) and not user._is_public()

    def to_dict(self):
        self.ensure_one()
        return {
            'id': self.id,
            'authorId': self.author_id.id,
            'authorName': self.author_id.name,
            'content': self.content,
            'isStaff': self.is_staff,
            'createdAt': self.create_date.isoformat() if self.create_date else None,
        }
