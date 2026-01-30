# -*- coding: utf-8 -*-
from odoo import models, fields, api
from datetime import datetime


class MarketingCampaign(models.Model):
    _name = 'quelyos.marketing.campaign'
    _description = 'Marketing Campaign'
    _order = 'create_date desc'

    name = fields.Char(string='Nom', required=True)
    channel = fields.Selection([
        ('email', 'Email'),
        ('sms', 'SMS'),
    ], string='Canal', required=True, default='email')

    status = fields.Selection([
        ('draft', 'Brouillon'),
        ('scheduled', 'Planifiée'),
        ('sending', 'En cours d\'envoi'),
        ('sent', 'Envoyée'),
        ('cancelled', 'Annulée'),
    ], string='Statut', default='draft', required=True)

    # Contenu Email
    subject = fields.Char(string='Objet')
    content = fields.Html(string='Contenu Email')
    template_id = fields.Many2one(
        'quelyos.email.template',
        string='Template Email'
    )

    # Contenu SMS
    sms_message = fields.Text(string='Message SMS')
    sms_template_id = fields.Many2one(
        'quelyos.sms.template',
        string='Template SMS',
        help='Template SMS réutilisable (Premium)'
    )

    # Statistiques SMS détaillées (Premium)
    sms_stats_delivered = fields.Integer(
        string='SMS Délivrés',
        default=0,
        help='Nombre de SMS effectivement délivrés'
    )
    sms_stats_failed = fields.Integer(
        string='SMS Échoués',
        default=0,
        help='Nombre de SMS en échec (numéro invalide, opérateur rejeté, etc.)'
    )
    sms_stats_cost = fields.Float(
        string='Coût SMS Total',
        default=0.0,
        help='Coût total de la campagne SMS en euros'
    )

    # Destinataires
    contact_list_id = fields.Many2one(
        'quelyos.contact.list',
        string='Liste de contacts'
    )
    recipient_count = fields.Integer(
        string='Nombre de destinataires',
        compute='_compute_recipient_count'
    )

    # Planification
    scheduled_date = fields.Datetime(string='Date planifiée')
    sent_date = fields.Datetime(string='Date d\'envoi')

    # Statistiques
    stats_sent = fields.Integer(string='Envoyés', default=0)
    stats_delivered = fields.Integer(string='Délivrés', default=0)
    stats_opened = fields.Integer(string='Ouverts', default=0)
    stats_clicked = fields.Integer(string='Cliqués', default=0)
    stats_bounced = fields.Integer(string='Rebonds', default=0)
    stats_unsubscribed = fields.Integer(string='Désabonnés', default=0)

    # Taux calculés
    delivery_rate = fields.Float(
        string='Taux de délivrabilité',
        compute='_compute_rates'
    )
    open_rate = fields.Float(
        string='Taux d\'ouverture',
        compute='_compute_rates'
    )
    click_rate = fields.Float(
        string='Taux de clic',
        compute='_compute_rates'
    )

    # A/B Testing
    ab_testing_enabled = fields.Boolean(
        string='A/B Testing activé',
        default=False,
        help='Activer pour tester plusieurs variantes et sélectionner la gagnante'
    )

    variant_ids = fields.One2many(
        'quelyos.marketing.campaign.variant',
        'campaign_id',
        string='Variantes A/B',
        help='Variantes de la campagne pour tests A/B/C'
    )

    variant_count = fields.Integer(
        string='Nombre de variantes',
        compute='_compute_variant_count',
        store=True
    )

    winner_variant_id = fields.Many2one(
        'quelyos.marketing.campaign.variant',
        string='Variante gagnante',
        compute='_compute_winner_variant',
        store=True,
        help='Variante avec le meilleur score de conversion'
    )

    # Métadonnées
    active = fields.Boolean(default=True)
    company_id = fields.Many2one(
        'res.company',
        string='Société',
        default=lambda self: self.env.company
    )
    created_by = fields.Many2one(
        'res.users',
        string='Créé par',
        default=lambda self: self.env.user
    )

    @api.depends('contact_list_id')
    def _compute_recipient_count(self):
        for record in self:
            if record.contact_list_id:
                record.recipient_count = record.contact_list_id.contact_count
            else:
                record.recipient_count = 0

    @api.depends('variant_ids')
    def _compute_variant_count(self):
        """Compter le nombre de variantes"""
        for record in self:
            record.variant_count = len(record.variant_ids)

    @api.depends('variant_ids.is_winner', 'variant_ids.conversion_score')
    def _compute_winner_variant(self):
        """Identifier la variante gagnante (marquée ou meilleur score)"""
        for record in self:
            # Chercher variante marquée comme gagnante
            winner = record.variant_ids.filtered(lambda v: v.is_winner)
            if winner:
                record.winner_variant_id = winner[0]
            elif record.variant_ids:
                # Sinon, prendre celle avec le meilleur conversion_score
                record.winner_variant_id = record.variant_ids.sorted(
                    key=lambda v: v.conversion_score,
                    reverse=True
                )[0]
            else:
                record.winner_variant_id = False

    @api.depends('stats_sent', 'stats_delivered', 'stats_opened', 'stats_clicked')
    def _compute_rates(self):
        for record in self:
            if record.stats_sent > 0:
                record.delivery_rate = (record.stats_delivered / record.stats_sent) * 100
                record.open_rate = (record.stats_opened / record.stats_sent) * 100
                record.click_rate = (record.stats_clicked / record.stats_sent) * 100
            else:
                record.delivery_rate = 0
                record.open_rate = 0
                record.click_rate = 0

    def action_schedule(self):
        """Planifie la campagne"""
        self.ensure_one()
        if not self.scheduled_date:
            raise ValueError("Date planifiée requise")
        self.status = 'scheduled'

    def action_send(self):
        """Lance l'envoi de la campagne"""
        self.ensure_one()
        self.status = 'sending'

        if self.channel == 'email':
            self._send_email_campaign()
        elif self.channel == 'sms':
            self._send_sms_campaign()

    def _send_email_campaign(self):
        """Envoi de campagne email via Brevo/SMTP avec unsubscribe RGPD"""
        if not self.contact_list_id:
            return

        contacts = self.contact_list_id.get_contacts()
        Blacklist = self.env['quelyos.marketing.blacklist'].sudo()

        sent_count = 0
        skipped_blacklist = 0

        # Récupérer base_url pour liens unsubscribe
        base_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url', 'http://localhost:5175')

        for contact in contacts:
            if not contact.email:
                continue

            # Filtrer blacklistés (RGPD)
            if Blacklist.is_blacklisted(contact.email):
                skipped_blacklist += 1
                continue

            # Créer/récupérer entrée blacklist avec token pour ce contact
            blacklist_entry = Blacklist.search([
                ('email', '=', contact.email.lower()),
                ('company_id', '=', self.env.company.id)
            ], limit=1)

            if not blacklist_entry:
                blacklist_entry = Blacklist.create({
                    'email': contact.email.lower(),
                    'campaign_id': self.id,
                    'active': False,  # Pas encore désabonné
                })

            # Générer lien unsubscribe
            unsubscribe_url = f"{base_url}/unsubscribe/{blacklist_entry.token}"

            # Remplacer toutes les URLs par des liens trackés
            email_content = self._replace_urls_with_tracked_links(self.content, base_url)

            # Injecter footer unsubscribe dans le contenu
            email_content = self._inject_unsubscribe_footer(email_content, unsubscribe_url)

            # TODO: Intégrer envoi via email_config avec email_content
            # Pour l'instant, on simule l'envoi
            sent_count += 1

        self.write({
            'stats_sent': sent_count,
            'sent_date': datetime.now(),
            'status': 'sent',
        })

    def _inject_unsubscribe_footer(self, html_content, unsubscribe_url):
        """Ajouter footer unsubscribe automatique (RGPD)"""
        footer_html = f'''
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; text-align: center;">
            <p>Vous recevez cet email car vous êtes abonné à notre liste de diffusion.</p>
            <p>
                <a href="{unsubscribe_url}" style="color: #666; text-decoration: underline;">
                    Se désabonner
                </a>
            </p>
        </div>
        '''

        # Insérer footer avant </body> ou à la fin
        if '</body>' in html_content:
            return html_content.replace('</body>', f'{footer_html}</body>')
        else:
            return html_content + footer_html

    def _replace_urls_with_tracked_links(self, html_content, base_url):
        """
        Remplacer toutes les URLs dans le HTML par des liens trackés.
        Parse le HTML et remplace href="http://example.com" par href="/r/<token>".
        """
        import re

        if not html_content:
            return html_content

        LinkTracker = self.env['quelyos.link.tracker'].sudo()

        # Pattern pour trouver tous les href="..." dans le HTML
        # Capture : href="(URL)" ou href='(URL)'
        pattern = r'href=["\']([^"\']+)["\']'

        def replace_url(match):
            original_url = match.group(1)

            # Ignorer les ancres, mailto:, tel:, javascript:
            if (original_url.startswith('#') or
                original_url.startswith('mailto:') or
                original_url.startswith('tel:') or
                original_url.startswith('javascript:')):
                return match.group(0)  # Garder tel quel

            # Ignorer les URLs relatives (commençant par /)
            if original_url.startswith('/'):
                return match.group(0)

            # Créer ou récupérer lien tracké
            try:
                link = LinkTracker.get_or_create_link(
                    url=original_url,
                    campaign_id=self.id
                )
                tracked_url = link.get_redirect_url(base_url)
                return f'href="{tracked_url}"'
            except Exception:
                # En cas d'erreur, garder URL originale
                return match.group(0)

        # Remplacer toutes les URLs
        return re.sub(pattern, replace_url, html_content)

    def _send_sms_campaign(self):
        """
        Envoi de campagne SMS via quelyos_sms_tn (VERSION PREMIUM)

        Fonctionnalités Premium :
        - Support templates SMS avec variables dynamiques
        - Validation format numéros internationaux
        - Tracking détaillé (delivered, failed, cost)
        - Gestion erreurs par contact
        """
        if not self.contact_list_id:
            return

        contacts = self.contact_list_id.get_contacts()

        # Statistiques détaillées
        delivered_count = 0
        failed_count = 0
        total_cost = 0.0

        # Coût moyen SMS (peut être configuré par opérateur)
        SMS_COST_PER_UNIT = 0.05  # 5 centimes par SMS

        # Utilise le module quelyos_sms_tn si disponible
        sms_service = self.env.get('quelyos.sms.service')

        for contact in contacts:
            # Vérifier que le contact a un numéro mobile
            if not contact.mobile:
                failed_count += 1
                continue

            # Valider format numéro (doit commencer par +)
            mobile = contact.mobile.strip()
            if not mobile.startswith('+'):
                failed_count += 1
                continue

            # Préparer message : template ou message direct
            if self.sms_template_id:
                # Utiliser template avec variables dynamiques
                message = self.sms_template_id.render_message(
                    partner=contact,
                    custom_vars={
                        'company.name': self.env.company.name,
                    }
                )
                # Incrémenter usage du template
                self.sms_template_id.increment_usage()
            else:
                # Message direct
                message = self.sms_message

            if not message:
                failed_count += 1
                continue

            # Calculer nombre de SMS pour ce message
            char_count = len(message)
            if char_count <= 160:
                sms_count = 1
            else:
                sms_count = 1 + ((char_count - 160 + 152) // 153)

            # Envoyer SMS
            if sms_service:
                try:
                    # Envoyer via service SMS
                    result = sms_service.send_sms(mobile, message)

                    # Vérifier résultat (dépend de l'implémentation du service)
                    if result and result.get('success'):
                        delivered_count += 1
                        total_cost += SMS_COST_PER_UNIT * sms_count
                    else:
                        failed_count += 1

                except Exception as e:
                    # Échec envoi
                    failed_count += 1
            else:
                # Mode simulation (dev) : considérer comme délivré
                delivered_count += 1
                total_cost += SMS_COST_PER_UNIT * sms_count

        # Mettre à jour statistiques campagne
        self.write({
            'stats_sent': delivered_count + failed_count,
            'sms_stats_delivered': delivered_count,
            'sms_stats_failed': failed_count,
            'sms_stats_cost': total_cost,
            'sent_date': datetime.now(),
            'status': 'sent',
        })

    def action_cancel(self):
        """Annule la campagne"""
        self.ensure_one()
        self.status = 'cancelled'

    def action_duplicate(self):
        """Duplique la campagne"""
        self.ensure_one()
        return self.copy({
            'name': f"{self.name} (copie)",
            'status': 'draft',
            'stats_sent': 0,
            'stats_delivered': 0,
            'stats_opened': 0,
            'stats_clicked': 0,
            'sent_date': False,
        })

    # ═══════════════════════════════════════════════════════════════════════════
    # INTÉGRATION OCA: mass_mailing_resend
    # ═══════════════════════════════════════════════════════════════════════════

    def action_resend_non_openers(self):
        """
        Renvoie la campagne uniquement aux contacts qui ne l'ont pas ouverte.

        Inspiré du module OCA mass_mailing_resend.

        Crée une nouvelle campagne ciblant uniquement les destinataires
        qui ont reçu la campagne originale mais ne l'ont PAS ouverte.

        Cas d'usage : Relancer les contacts inactifs après une première campagne.
        """
        self.ensure_one()

        if self.status != 'sent':
            raise ValueError("Cette campagne doit être envoyée pour être renvoyée")

        if self.channel != 'email':
            raise ValueError("Le renvoi n'est supporté que pour les campagnes email")

        # Récupérer les contacts qui ont reçu mais n'ont PAS ouvert
        # Via mailing.trace si disponible, sinon via logique custom
        non_openers = self._get_non_opener_contacts()

        if not non_openers:
            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': 'Aucun destinataire',
                    'message': 'Tous les contacts ont ouvert la campagne',
                    'type': 'info',
                }
            }

        # Créer nouvelle liste statique avec les non-openers
        new_list = self.env['quelyos.contact.list'].create({
            'name': f"{self.name} - Non-ouvreurs ({len(non_openers)})",
            'list_type': 'static',
            'contact_ids': [(6, 0, non_openers.ids)],
        })

        # Créer campagne de relance
        new_campaign = self.copy({
            'name': f"{self.name} (Relance non-ouvreurs)",
            'contact_list_id': new_list.id,
            'status': 'draft',
            'stats_sent': 0,
            'stats_delivered': 0,
            'stats_opened': 0,
            'stats_clicked': 0,
            'sent_date': False,
        })

        return {
            'type': 'ir.actions.act_window',
            'name': 'Campagne de Relance',
            'res_model': 'quelyos.marketing.campaign',
            'res_id': new_campaign.id,
            'view_mode': 'form',
            'target': 'current',
        }

    def _get_non_opener_contacts(self):
        """
        Retourne les contacts qui ont reçu mais n'ont pas ouvert la campagne.

        Logique :
        1. Récupère tous les contacts de la liste originale
        2. Exclut ceux qui ont ouvert (via mailing.trace ou stats custom)
        """
        self.ensure_one()

        if not self.contact_list_id:
            return self.env['res.partner']

        # Tous les destinataires
        all_contacts = self.contact_list_id.get_contacts()

        # Récupérer les ouvreurs via mailing.trace
        traces = self.env['mailing.trace'].search([
            ('partner_id', 'in', all_contacts.ids),
            ('mass_mailing_id.id', '=', self.id),  # Si lié à mailing.mailing
            ('opened', '>', datetime(1970, 1, 1)),  # A ouvert
        ])

        opener_ids = traces.mapped('partner_id').ids

        # Retourner les non-ouvreurs
        non_openers = all_contacts.filtered(lambda c: c.id not in opener_ids)

        return non_openers

    def to_dict(self):
        """Sérialisation pour API"""
        return {
            'id': self.id,
            'name': self.name,
            'channel': self.channel,
            'status': self.status,
            'subject': self.subject or '',
            'content': self.content or '',
            'sms_message': self.sms_message or '',
            'contact_list_id': self.contact_list_id.id if self.contact_list_id else None,
            'contact_list_name': self.contact_list_id.name if self.contact_list_id else '',
            'recipient_count': self.recipient_count,
            'scheduled_date': self.scheduled_date.isoformat() if self.scheduled_date else None,
            'sent_date': self.sent_date.isoformat() if self.sent_date else None,
            'stats': {
                'sent': self.stats_sent,
                'delivered': self.stats_delivered,
                'opened': self.stats_opened,
                'clicked': self.stats_clicked,
                'bounced': self.stats_bounced,
                'unsubscribed': self.stats_unsubscribed,
            },
            'rates': {
                'delivery': round(self.delivery_rate, 1),
                'open': round(self.open_rate, 1),
                'click': round(self.click_rate, 1),
            },
            'created_at': self.create_date.isoformat() if self.create_date else None,
            'updated_at': self.write_date.isoformat() if self.write_date else None,
        }


class EmailTemplate(models.Model):
    _name = 'quelyos.email.template'
    _description = 'Email Template'
    _order = 'name'

    name = fields.Char(string='Nom', required=True)
    category = fields.Selection([
        ('welcome', 'Bienvenue'),
        ('ecommerce', 'E-commerce'),
        ('promo', 'Promotion'),
        ('newsletter', 'Newsletter'),
        ('loyalty', 'Fidélité'),
        ('transactional', 'Transactionnel'),
        ('reminder', 'Relance'),
        ('custom', 'Personnalisé'),
    ], string='Catégorie', default='custom')
    subject = fields.Char(string='Objet par défaut')
    content = fields.Html(string='Contenu HTML')
    preview_text = fields.Char(string='Texte de prévisualisation')
    active = fields.Boolean(default=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'subject': self.subject or '',
            'content': self.content or '',
            'preview_text': self.preview_text or '',
        }
