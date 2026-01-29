# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request
import json
import csv
import io
import base64
from datetime import datetime, timedelta
from .base import BaseController


class MarketingCampaignController(BaseController):
    """API endpoints for marketing campaigns"""

    def _auth_check(self):
        """Vérification d'authentification commune"""
        return self._authenticate_from_header()

    # =========================================================================
    # CAMPAIGNS
    # =========================================================================

    @http.route('/api/marketing/campaigns', type='jsonrpc', auth='public', csrf=False, methods=['POST'])
    def get_campaigns(self, **kwargs):
        """Liste des campagnes avec filtres optionnels"""
        auth_error = self._auth_check()
        if auth_error:
            return auth_error
        try:
            channel = kwargs.get('channel')  # 'email', 'sms' ou None pour tous
            status = kwargs.get('status')
            limit = kwargs.get('limit', 50)
            offset = kwargs.get('offset', 0)

            domain = []
            if channel:
                domain.append(('channel', '=', channel))
            if status:
                domain.append(('status', '=', status))

            Campaign = request.env['quelyos.marketing.campaign'].sudo()
            total = Campaign.search_count(domain)
            campaigns = Campaign.search(domain, limit=limit, offset=offset, order='create_date desc')

            return {
                'success': True,
                'campaigns': [c.to_dict() for c in campaigns],
                'total': total,
                'limit': limit,
                'offset': offset,
            }
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/marketing/campaigns/create', type='jsonrpc', auth='public', csrf=False, methods=['POST'])
    def create_campaign(self, **kwargs):
        """Crée une nouvelle campagne"""
        try:
            required_fields = ['name', 'channel']
            for field in required_fields:
                if not kwargs.get(field):
                    return {'success': False, 'error': f'Champ requis: {field}'}

            values = {
                'name': kwargs['name'],
                'channel': kwargs['channel'],
                'status': 'draft',
            }

            # Champs optionnels
            if kwargs.get('subject'):
                values['subject'] = kwargs['subject']
            if kwargs.get('content'):
                values['content'] = kwargs['content']
            if kwargs.get('sms_message'):
                values['sms_message'] = kwargs['sms_message']
            if kwargs.get('contact_list_id'):
                values['contact_list_id'] = int(kwargs['contact_list_id'])
            if kwargs.get('scheduled_date'):
                values['scheduled_date'] = kwargs['scheduled_date']

            campaign = request.env['quelyos.marketing.campaign'].sudo().create(values)

            return {
                'success': True,
                'campaign': campaign.to_dict(),
            }
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/marketing/campaigns/<int:campaign_id>', type='jsonrpc', auth='public', csrf=False, methods=['POST'])
    def get_campaign(self, campaign_id, **kwargs):
        """Détail d'une campagne"""
        try:
            campaign = request.env['quelyos.marketing.campaign'].sudo().browse(campaign_id)
            if not campaign.exists():
                return {'success': False, 'error': 'Campagne introuvable'}

            return {
                'success': True,
                'campaign': campaign.to_dict(),
            }
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/marketing/campaigns/<int:campaign_id>/update', type='jsonrpc', auth='public', csrf=False, methods=['POST'])
    def update_campaign(self, campaign_id, **kwargs):
        """Met à jour une campagne"""
        try:
            campaign = request.env['quelyos.marketing.campaign'].sudo().browse(campaign_id)
            if not campaign.exists():
                return {'success': False, 'error': 'Campagne introuvable'}

            values = {}
            allowed_fields = ['name', 'subject', 'content', 'sms_message', 'contact_list_id', 'scheduled_date']

            for field in allowed_fields:
                if field in kwargs:
                    if field == 'contact_list_id' and kwargs[field]:
                        values[field] = int(kwargs[field])
                    else:
                        values[field] = kwargs[field]

            if values:
                campaign.write(values)

            return {
                'success': True,
                'campaign': campaign.to_dict(),
            }
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/marketing/campaigns/<int:campaign_id>/send', type='jsonrpc', auth='public', csrf=False, methods=['POST'])
    def send_campaign(self, campaign_id, **kwargs):
        """Envoie une campagne"""
        try:
            campaign = request.env['quelyos.marketing.campaign'].sudo().browse(campaign_id)
            if not campaign.exists():
                return {'success': False, 'error': 'Campagne introuvable'}

            if campaign.status not in ['draft', 'scheduled']:
                return {'success': False, 'error': 'Campagne non modifiable'}

            campaign.action_send()

            return {
                'success': True,
                'campaign': campaign.to_dict(),
            }
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/marketing/campaigns/<int:campaign_id>/schedule', type='jsonrpc', auth='public', csrf=False, methods=['POST'])
    def schedule_campaign(self, campaign_id, **kwargs):
        """Planifie une campagne"""
        try:
            campaign = request.env['quelyos.marketing.campaign'].sudo().browse(campaign_id)
            if not campaign.exists():
                return {'success': False, 'error': 'Campagne introuvable'}

            scheduled_date = kwargs.get('scheduled_date')
            if not scheduled_date:
                return {'success': False, 'error': 'Date planifiée requise'}

            campaign.write({'scheduled_date': scheduled_date})
            campaign.action_schedule()

            return {
                'success': True,
                'campaign': campaign.to_dict(),
            }
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/marketing/campaigns/<int:campaign_id>/duplicate', type='jsonrpc', auth='public', csrf=False, methods=['POST'])
    def duplicate_campaign(self, campaign_id, **kwargs):
        """Duplique une campagne"""
        try:
            campaign = request.env['quelyos.marketing.campaign'].sudo().browse(campaign_id)
            if not campaign.exists():
                return {'success': False, 'error': 'Campagne introuvable'}

            new_campaign = campaign.action_duplicate()

            return {
                'success': True,
                'campaign': new_campaign.to_dict(),
            }
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/marketing/campaigns/<int:campaign_id>/delete', type='jsonrpc', auth='public', csrf=False, methods=['POST'])
    def delete_campaign(self, campaign_id, **kwargs):
        """Supprime une campagne"""
        try:
            campaign = request.env['quelyos.marketing.campaign'].sudo().browse(campaign_id)
            if not campaign.exists():
                return {'success': False, 'error': 'Campagne introuvable'}

            campaign.unlink()

            return {'success': True}
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    # =========================================================================
    # CONTACT LISTS
    # =========================================================================

    @http.route('/api/marketing/contact-lists', type='jsonrpc', auth='public', csrf=False, methods=['POST'])
    def get_contact_lists(self, **kwargs):
        """Liste des listes de contacts"""
        try:
            limit = kwargs.get('limit', 50)
            offset = kwargs.get('offset', 0)

            ContactList = request.env['quelyos.contact.list'].sudo()
            total = ContactList.search_count([])
            lists = ContactList.search([], limit=limit, offset=offset, order='create_date desc')

            return {
                'success': True,
                'contact_lists': [l.to_dict() for l in lists],
                'total': total,
            }
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/marketing/contact-lists/create', type='jsonrpc', auth='public', csrf=False, methods=['POST'])
    def create_contact_list(self, **kwargs):
        """Crée une nouvelle liste de contacts"""
        try:
            if not kwargs.get('name'):
                return {'success': False, 'error': 'Nom requis'}

            values = {
                'name': kwargs['name'],
                'description': kwargs.get('description', ''),
                'list_type': kwargs.get('list_type', 'static'),
            }

            if kwargs.get('filter_domain'):
                values['filter_domain'] = kwargs['filter_domain']

            if kwargs.get('contact_ids'):
                values['contact_ids'] = [(6, 0, kwargs['contact_ids'])]

            contact_list = request.env['quelyos.contact.list'].sudo().create(values)

            return {
                'success': True,
                'contact_list': contact_list.to_dict(),
            }
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/marketing/contact-lists/<int:list_id>', type='jsonrpc', auth='public', csrf=False, methods=['POST'])
    def get_contact_list(self, list_id, **kwargs):
        """Détail d'une liste avec ses contacts"""
        try:
            contact_list = request.env['quelyos.contact.list'].sudo().browse(list_id)
            if not contact_list.exists():
                return {'success': False, 'error': 'Liste introuvable'}

            data = contact_list.to_dict()

            # Ajoute les contacts
            contacts = contact_list.get_contacts()
            data['contacts'] = [{
                'id': c.id,
                'name': c.name,
                'email': c.email or '',
                'mobile': c.mobile or '',
            } for c in contacts[:100]]  # Limite à 100 pour la performance

            return {
                'success': True,
                'contact_list': data,
            }
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/marketing/contact-lists/<int:list_id>/update', type='jsonrpc', auth='public', csrf=False, methods=['POST'])
    def update_contact_list(self, list_id, **kwargs):
        """Met à jour une liste de contacts"""
        try:
            contact_list = request.env['quelyos.contact.list'].sudo().browse(list_id)
            if not contact_list.exists():
                return {'success': False, 'error': 'Liste introuvable'}

            values = {}
            if 'name' in kwargs:
                values['name'] = kwargs['name']
            if 'description' in kwargs:
                values['description'] = kwargs['description']
            if 'filter_domain' in kwargs:
                values['filter_domain'] = kwargs['filter_domain']
            if 'contact_ids' in kwargs:
                values['contact_ids'] = [(6, 0, kwargs['contact_ids'])]

            if values:
                contact_list.write(values)

            return {
                'success': True,
                'contact_list': contact_list.to_dict(),
            }
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/marketing/contact-lists/<int:list_id>/delete', type='jsonrpc', auth='public', csrf=False, methods=['POST'])
    def delete_contact_list(self, list_id, **kwargs):
        """Supprime une liste de contacts"""
        try:
            contact_list = request.env['quelyos.contact.list'].sudo().browse(list_id)
            if not contact_list.exists():
                return {'success': False, 'error': 'Liste introuvable'}

            contact_list.unlink()

            return {'success': True}
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    # =========================================================================
    # EMAIL TEMPLATES
    # =========================================================================

    @http.route('/api/marketing/email-templates', type='jsonrpc', auth='public', csrf=False, methods=['POST'])
    def get_email_templates(self, **kwargs):
        """Liste des templates email"""
        auth_error = self._auth_check()
        if auth_error:
            return auth_error
        try:
            category = kwargs.get('category')

            domain = []
            if category:
                domain.append(('category', '=', category))

            templates = request.env['quelyos.email.template'].sudo().search(domain, order='name')

            return {
                'success': True,
                'templates': [t.to_dict() for t in templates],
            }
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    # =========================================================================
    # DASHBOARD
    # =========================================================================

    @http.route('/api/marketing/dashboard', type='jsonrpc', auth='public', csrf=False, methods=['POST'])
    def get_dashboard(self, **kwargs):
        """Statistiques dashboard marketing"""
        auth_error = self._auth_check()
        if auth_error:
            return auth_error
        try:
            Campaign = request.env['quelyos.marketing.campaign'].sudo()
            ContactList = request.env['quelyos.contact.list'].sudo()

            # Période
            today = datetime.now()
            month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            last_month_start = (month_start - timedelta(days=1)).replace(day=1)

            # Campagnes actives
            active_campaigns = Campaign.search_count([
                ('status', 'in', ['draft', 'scheduled', 'sending'])
            ])

            # Campagnes envoyées ce mois
            campaigns_this_month = Campaign.search([
                ('sent_date', '>=', month_start),
                ('status', '=', 'sent'),
            ])

            campaigns_last_month = Campaign.search([
                ('sent_date', '>=', last_month_start),
                ('sent_date', '<', month_start),
                ('status', '=', 'sent'),
            ])

            # Stats emails ce mois
            email_campaigns = campaigns_this_month.filtered(lambda c: c.channel == 'email')
            emails_sent = sum(email_campaigns.mapped('stats_sent'))
            emails_opened = sum(email_campaigns.mapped('stats_opened'))
            emails_clicked = sum(email_campaigns.mapped('stats_clicked'))

            # Stats SMS ce mois
            sms_campaigns = campaigns_this_month.filtered(lambda c: c.channel == 'sms')
            sms_sent = sum(sms_campaigns.mapped('stats_sent'))

            # Taux moyens
            total_sent = sum(campaigns_this_month.mapped('stats_sent'))
            avg_open_rate = 0
            avg_click_rate = 0

            if email_campaigns:
                rates = [(c.open_rate, c.click_rate) for c in email_campaigns if c.stats_sent > 0]
                if rates:
                    avg_open_rate = sum(r[0] for r in rates) / len(rates)
                    avg_click_rate = sum(r[1] for r in rates) / len(rates)

            # Contacts
            total_contacts = ContactList.search([]).mapped('contact_count')
            total_contacts_sum = sum(total_contacts)

            # Campagnes récentes
            recent_campaigns = Campaign.search([], limit=5, order='create_date desc')

            # Variation vs mois dernier
            emails_last_month = sum(c.stats_sent for c in campaigns_last_month if c.channel == 'email')
            sms_last_month = sum(c.stats_sent for c in campaigns_last_month if c.channel == 'sms')

            email_variation = 0
            if emails_last_month > 0:
                email_variation = round(((emails_sent - emails_last_month) / emails_last_month) * 100)

            sms_variation = 0
            if sms_last_month > 0:
                sms_variation = round(((sms_sent - sms_last_month) / sms_last_month) * 100)

            return {
                'success': True,
                'stats': {
                    'active_campaigns': active_campaigns,
                    'emails_sent': emails_sent,
                    'emails_opened': emails_opened,
                    'emails_clicked': emails_clicked,
                    'sms_sent': sms_sent,
                    'total_contacts': total_contacts_sum,
                    'avg_open_rate': round(avg_open_rate, 1),
                    'avg_click_rate': round(avg_click_rate, 1),
                    'email_variation': email_variation,
                    'sms_variation': sms_variation,
                },
                'recent_campaigns': [c.to_dict() for c in recent_campaigns],
            }
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    # =========================================================================
    # IMPORT CSV CONTACTS
    # =========================================================================

    @http.route('/api/marketing/contacts/import/preview', type='jsonrpc', auth='public', csrf=False, methods=['POST'])
    def preview_csv_import(self, **kwargs):
        """Parse CSV et retourne un aperçu des données"""
        try:
            csv_data = kwargs.get('csv_data')  # Base64 encoded
            if not csv_data:
                return {'success': False, 'error': 'Fichier CSV requis'}

            # Décoder le base64
            try:
                decoded = base64.b64decode(csv_data).decode('utf-8')
            except:
                decoded = base64.b64decode(csv_data).decode('latin-1')

            # Parser le CSV
            reader = csv.DictReader(io.StringIO(decoded), delimiter=';')

            # Si ; ne fonctionne pas, essayer avec ,
            rows = list(reader)
            if not rows or len(rows[0]) <= 1:
                reader = csv.DictReader(io.StringIO(decoded), delimiter=',')
                rows = list(reader)

            if not rows:
                return {'success': False, 'error': 'Fichier CSV vide'}

            # Détecter les colonnes
            headers = list(rows[0].keys()) if rows else []

            # Mapping automatique
            column_mapping = {}
            for header in headers:
                header_lower = header.lower().strip()
                if header_lower in ['nom', 'name', 'nom complet', 'full name']:
                    column_mapping['name'] = header
                elif header_lower in ['email', 'e-mail', 'mail', 'courriel']:
                    column_mapping['email'] = header
                elif header_lower in ['telephone', 'téléphone', 'phone', 'mobile', 'tel', 'portable']:
                    column_mapping['phone'] = header

            # Aperçu (10 premières lignes)
            preview_rows = []
            for row in rows[:10]:
                preview_rows.append({
                    'name': row.get(column_mapping.get('name', ''), ''),
                    'email': row.get(column_mapping.get('email', ''), ''),
                    'phone': row.get(column_mapping.get('phone', ''), ''),
                    '_raw': row,
                })

            return {
                'success': True,
                'headers': headers,
                'column_mapping': column_mapping,
                'total_rows': len(rows),
                'preview': preview_rows,
            }
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/marketing/contacts/import', type='jsonrpc', auth='public', csrf=False, methods=['POST'])
    def import_csv_contacts(self, **kwargs):
        """Importe les contacts depuis un CSV dans une liste"""
        try:
            csv_data = kwargs.get('csv_data')  # Base64 encoded
            list_id = kwargs.get('list_id')
            list_name = kwargs.get('list_name')
            column_mapping = kwargs.get('column_mapping', {})

            if not csv_data:
                return {'success': False, 'error': 'Fichier CSV requis'}

            # Décoder le base64
            try:
                decoded = base64.b64decode(csv_data).decode('utf-8')
            except:
                decoded = base64.b64decode(csv_data).decode('latin-1')

            # Parser le CSV
            reader = csv.DictReader(io.StringIO(decoded), delimiter=';')
            rows = list(reader)
            if not rows or len(rows[0]) <= 1:
                reader = csv.DictReader(io.StringIO(decoded), delimiter=',')
                rows = list(reader)

            if not rows:
                return {'success': False, 'error': 'Fichier CSV vide'}

            Partner = request.env['res.partner'].sudo()
            ContactList = request.env['quelyos.contact.list'].sudo()

            # Créer ou récupérer la liste
            contact_list = None
            if list_id:
                contact_list = ContactList.browse(list_id)
            elif list_name:
                contact_list = ContactList.create({
                    'name': list_name,
                    'list_type': 'static',
                    'description': f'Importé le {datetime.now().strftime("%d/%m/%Y %H:%M")}',
                })

            if not contact_list:
                return {'success': False, 'error': 'Liste non spécifiée'}

            # Colonnes mappées
            name_col = column_mapping.get('name', '')
            email_col = column_mapping.get('email', '')
            phone_col = column_mapping.get('phone', '')

            created = 0
            updated = 0
            errors = []
            contact_ids = list(contact_list.contact_ids.ids)

            for i, row in enumerate(rows):
                try:
                    name = row.get(name_col, '').strip() if name_col else ''
                    email = row.get(email_col, '').strip() if email_col else ''
                    phone = row.get(phone_col, '').strip() if phone_col else ''

                    # Skip si pas de nom ni email
                    if not name and not email:
                        continue

                    # Chercher contact existant par email
                    existing = None
                    if email:
                        existing = Partner.search([('email', '=ilike', email)], limit=1)

                    if existing:
                        # Mettre à jour si nécessaire
                        vals = {}
                        if name and not existing.name:
                            vals['name'] = name
                        if phone and not existing.mobile:
                            vals['mobile'] = phone
                        if vals:
                            existing.write(vals)
                        if existing.id not in contact_ids:
                            contact_ids.append(existing.id)
                        updated += 1
                    else:
                        # Créer nouveau contact
                        vals = {
                            'name': name or email,
                            'email': email,
                            'mobile': phone,
                            'is_company': False,
                        }
                        new_partner = Partner.create(vals)
                        contact_ids.append(new_partner.id)
                        created += 1

                except Exception as e:
                    errors.append(f"Ligne {i+2}: {str(e)}")

            # Mettre à jour la liste avec les contacts
            contact_list.write({
                'contact_ids': [(6, 0, contact_ids)]
            })

            return {
                'success': True,
                'created': created,
                'updated': updated,
                'total': created + updated,
                'errors': errors[:10],  # Max 10 erreurs
                'list_id': contact_list.id,
                'list_name': contact_list.name,
            }
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}
