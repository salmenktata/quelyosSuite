# -*- coding: utf-8 -*-
"""
Commentaires Collaboratifs Expert-Comptable ↔ Client

Système commentaires contextuels sur factures/paiements/écritures :
- EC annote facture → notification client temps réel
- Client répond → notification EC
- Thread de discussion par document
- Résolution anomalies trackée
- Historique complet audit trail

Workflow :
1. EC consulte facture client
2. EC détecte anomalie TVA (20% au lieu 10%)
3. EC commente : "@Client TVA incorrecte, devrait être 10%"
4. Client reçoit notification email + in-app
5. Client corrige facture
6. Client répond : "Corrigé, merci !"
7. EC marque commentaire comme "résolu"

Features :
- Mentions @user (notifications ciblées)
- Tags priorité (info/warning/critical)
- Attachments (captures, documents)
- Statut résolution (open/resolved)
"""

import logging
from odoo import models, fields, api
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)


class AccountantComment(models.Model):
    """Commentaire collaboratif EC"""

    _name = 'quelyos.accountant_comment'
    _description = 'Commentaire Expert-Comptable'
    _order = 'create_date desc'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    # Relations
    tenant_id = fields.Many2one('quelyos.tenant', string='Client', required=True, index=True)
    author_id = fields.Many2one('res.users', string='Auteur', required=True, default=lambda self: self.env.user)
    is_accountant = fields.Boolean(
        string='Auteur est EC',
        compute='_compute_is_accountant',
        store=True,
        help='True si auteur est expert-comptable, False si client'
    )

    # Document cible (polymorphe)
    document_model = fields.Selection(
        [
            ('account.move', 'Facture/Écriture'),
            ('account.payment', 'Paiement'),
            ('quelyos.bank_transaction', 'Transaction Bancaire'),
        ],
        string='Type document',
        required=True,
        index=True
    )
    document_id = fields.Integer(string='ID Document', required=True, index=True)
    document_name = fields.Char(
        string='Nom document',
        compute='_compute_document_name',
        store=True
    )

    # Commentaire
    subject = fields.Char(string='Sujet', help='Titre court du commentaire')
    comment = fields.Html(string='Commentaire', required=True)

    # Priorité/Type
    priority = fields.Selection(
        [
            ('info', 'Information'),
            ('warning', 'Attention'),
            ('critical', 'Critique'),
        ],
        string='Priorité',
        default='info',
        required=True,
        index=True
    )
    category = fields.Selection(
        [
            ('question', 'Question'),
            ('anomaly', 'Anomalie Détectée'),
            ('suggestion', 'Suggestion'),
            ('validation', 'Demande Validation'),
            ('other', 'Autre'),
        ],
        string='Catégorie',
        default='question',
        required=True
    )

    # Thread
    parent_id = fields.Many2one('quelyos.accountant_comment', string='Commentaire parent', index=True)
    child_ids = fields.One2many('quelyos.accountant_comment', 'parent_id', string='Réponses')
    reply_count = fields.Integer(string='Nombre réponses', compute='_compute_reply_count', store=True)

    # Statut résolution
    state = fields.Selection(
        [
            ('open', 'Ouvert'),
            ('in_progress', 'En cours'),
            ('resolved', 'Résolu'),
            ('closed', 'Fermé'),
        ],
        string='Statut',
        default='open',
        required=True,
        index=True,
        tracking=True
    )
    resolved_by_id = fields.Many2one('res.users', string='Résolu par', readonly=True)
    resolved_date = fields.Datetime(string='Résolu le', readonly=True)

    # Mentions
    mentioned_user_ids = fields.Many2many(
        'res.users',
        string='Utilisateurs mentionnés',
        help='Utilisateurs @mention dans le commentaire'
    )

    # Attachments
    attachment_ids = fields.Many2many(
        'ir.attachment',
        string='Pièces jointes',
        help='Documents, captures, etc.'
    )

    # Métadonnées
    create_date = fields.Datetime(string='Créé le', readonly=True)
    is_internal = fields.Boolean(
        string='Note interne',
        default=False,
        help='Si True, visible uniquement par EC (pas par client)'
    )

    @api.depends('author_id')
    def _compute_is_accountant(self):
        """Déterminer si auteur est EC"""
        for record in self:
            # Vérifier si auteur a accès EC actif pour ce tenant
            access = self.env['quelyos.accountant_portal_access'].sudo().search([
                ('accountant_id', '=', record.author_id.id),
                ('tenant_id', '=', record.tenant_id.id),
                ('state', '=', 'active'),
            ], limit=1)
            record.is_accountant = bool(access)

    @api.depends('document_model', 'document_id')
    def _compute_document_name(self):
        """Récupérer nom du document cible"""
        for record in self:
            if record.document_model and record.document_id:
                doc = self.env[record.document_model].sudo().browse(record.document_id)
                if doc.exists():
                    record.document_name = doc.name if hasattr(doc, 'name') else f"#{doc.id}"
                else:
                    record.document_name = f"#{record.document_id}"
            else:
                record.document_name = ''

    @api.depends('child_ids')
    def _compute_reply_count(self):
        """Compter réponses"""
        for record in self:
            record.reply_count = len(record.child_ids)

    @api.model
    def create(self, vals):
        """Créer commentaire + notifications"""
        comment = super(AccountantComment, self).create(vals)

        # Extraire mentions @user
        comment._extract_mentions()

        # Envoyer notifications
        comment._send_notifications()

        return comment

    def _extract_mentions(self):
        """Extraire mentions @user du commentaire HTML"""
        self.ensure_one()

        if not self.comment:
            return

        # Regex pour @mentions
        import re
        mentions = re.findall(r'@(\w+)', self.comment)

        if not mentions:
            return

        # Chercher utilisateurs
        users = self.env['res.users'].sudo().search([
            ('login', 'in', mentions),
        ])

        if users:
            self.mentioned_user_ids = [(6, 0, users.ids)]

    def _send_notifications(self):
        """Envoyer notifications email + in-app"""
        self.ensure_one()

        # Liste destinataires
        recipients = []

        if self.is_accountant:
            # EC commente → notifier client (admin tenant)
            tenant_users = self.env['res.users'].sudo().search([
                ('tenant_id', '=', self.tenant_id.id),
                ('active', '=', True),
            ])
            recipients.extend(tenant_users)
        else:
            # Client commente → notifier EC
            access = self.env['quelyos.accountant_portal_access'].sudo().search([
                ('tenant_id', '=', self.tenant_id.id),
                ('state', '=', 'active'),
            ])
            recipients.extend([a.accountant_id for a in access])

        # Ajouter utilisateurs mentionnés
        recipients.extend(self.mentioned_user_ids)

        # Dédupliquer
        recipients = list(set(recipients))

        # Supprimer auteur
        recipients = [u for u in recipients if u.id != self.author_id.id]

        if not recipients:
            return

        # Créer activité pour chaque destinataire
        Activity = self.env['mail.activity'].sudo()
        for user in recipients:
            Activity.create({
                'res_model': self.document_model,
                'res_id': self.document_id,
                'summary': f"💬 Commentaire EC : {self.subject or 'Sans titre'}",
                'note': self.comment,
                'user_id': user.id,
                'date_deadline': fields.Date.today(),
            })

        _logger.info(
            f"Notifications envoyées : commentaire {self.id} → {len(recipients)} destinataires"
        )

    def action_reply(self, reply_comment):
        """Répondre à un commentaire"""
        self.ensure_one()

        reply = self.create({
            'tenant_id': self.tenant_id.id,
            'document_model': self.document_model,
            'document_id': self.document_id,
            'parent_id': self.id,
            'subject': f"Re: {self.subject or 'Commentaire'}",
            'comment': reply_comment,
            'priority': self.priority,
            'category': self.category,
        })

        return reply

    def action_resolve(self):
        """Marquer comme résolu"""
        self.ensure_one()

        self.write({
            'state': 'resolved',
            'resolved_by_id': self.env.user.id,
            'resolved_date': fields.Datetime.now(),
        })

        # Notifier participants
        self._send_resolution_notification()

        _logger.info(f"Commentaire {self.id} résolu par {self.env.user.name}")

    def action_reopen(self):
        """Rouvrir commentaire"""
        self.ensure_one()

        self.write({
            'state': 'open',
            'resolved_by_id': False,
            'resolved_date': False,
        })

    def _send_resolution_notification(self):
        """Notifier résolution"""
        self.ensure_one()

        # Notifier auteur original + participants thread
        participants = [self.author_id]
        if self.parent_id:
            participants.append(self.parent_id.author_id)
        for reply in self.child_ids:
            participants.append(reply.author_id)

        # Dédupliquer + supprimer celui qui a résolu
        participants = list(set(participants))
        participants = [u for u in participants if u.id != self.env.user.id]

        for user in participants:
            self.env['mail.activity'].sudo().create({
                'res_model': self.document_model,
                'res_id': self.document_id,
                'summary': f"✅ Commentaire résolu : {self.subject or 'Sans titre'}",
                'note': f"<p>Résolu par {self.env.user.name}</p>",
                'user_id': user.id,
                'date_deadline': fields.Date.today(),
            })

    @api.model
    def get_document_comments(self, document_model, document_id, include_internal=False):
        """
        Récupérer tous commentaires pour un document

        Args:
            document_model (str): Modèle document (account.move, etc.)
            document_id (int): ID document
            include_internal (bool): Inclure notes internes EC

        Returns:
            list: Commentaires avec threads
        """
        domain = [
            ('document_model', '=', document_model),
            ('document_id', '=', document_id),
            ('parent_id', '=', False),  # Seulement racines (threads)
        ]

        if not include_internal:
            domain.append(('is_internal', '=', False))

        comments = self.search(domain, order='create_date desc')

        # Sérialiser avec réponses
        comments_data = []
        for comment in comments:
            comments_data.append({
                'id': comment.id,
                'author_name': comment.author_id.name,
                'is_accountant': comment.is_accountant,
                'subject': comment.subject,
                'comment': comment.comment,
                'priority': comment.priority,
                'category': comment.category,
                'state': comment.state,
                'create_date': comment.create_date.isoformat() if comment.create_date else None,
                'reply_count': comment.reply_count,
                'replies': [{
                    'id': reply.id,
                    'author_name': reply.author_id.name,
                    'is_accountant': reply.is_accountant,
                    'comment': reply.comment,
                    'create_date': reply.create_date.isoformat() if reply.create_date else None,
                } for reply in comment.child_ids],
            })

        return comments_data
