# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError
from datetime import datetime

class MarketingPopup(models.Model):
    _name = 'quelyos.marketing.popup'
    _description = 'Popups Marketing'
    _order = 'sequence, id'

    # Identification
    name = fields.Char('Nom interne', required=True, help='Usage interne uniquement')
    sequence = fields.Integer('Ordre priorité', default=10, help='Ordre si plusieurs popups actives')
    active = fields.Boolean('Actif', default=True, tracking=True)

    # Type de popup
    popup_type = fields.Selection([
        ('newsletter', 'Newsletter'),
        ('promotion', 'Promotion/Offre'),
        ('announcement', 'Annonce'),
        ('exit_intent', 'Exit Intent'),
        ('welcome', 'Bienvenue'),
    ], string='Type', required=True, default='promotion')

    # Contenu
    title = fields.Char('Titre', required=True, size=100, translate=True)
    subtitle = fields.Char('Sous-titre', size=150, translate=True)
    content = fields.Html('Contenu HTML', translate=True, help='Texte principal du popup')
    image_url = fields.Char('URL Image', help='Image en-tête du popup')

    # CTA (Call-to-Action)
    cta_text = fields.Char('Texte bouton CTA', required=True, size=50, translate=True)
    cta_link = fields.Char('Lien CTA', size=255, help='URL ou action (ex: /products, close)')
    cta_color = fields.Char('Couleur CTA', default='#01613a', help='Couleur bouton principal')
    
    # Bouton secondaire (optionnel)
    show_close_button = fields.Boolean('Afficher bouton fermer', default=True)
    close_text = fields.Char('Texte bouton fermer', default='Non merci', translate=True)

    # Conditions d'affichage
    trigger_type = fields.Selection([
        ('immediate', 'Immédiat (au chargement)'),
        ('delay', 'Après délai'),
        ('scroll', 'Après scroll %'),
        ('exit_intent', 'Exit Intent (souris quitte page)'),
    ], string='Déclencheur', required=True, default='delay')
    
    trigger_delay = fields.Integer('Délai (secondes)', default=3, help='Pour trigger_type=delay')
    trigger_scroll_percent = fields.Integer('Scroll %', default=50, help='Pour trigger_type=scroll (0-100)')

    # Ciblage pages
    target_pages = fields.Selection([
        ('all', 'Toutes les pages'),
        ('home', 'Homepage uniquement'),
        ('products', 'Pages produits uniquement'),
        ('cart', 'Panier uniquement'),
        ('custom', 'Pages spécifiques'),
    ], string='Pages ciblées', required=True, default='all')
    
    custom_pages = fields.Char('Pages spécifiques', help='Chemins séparés par virgules (ex: /about,/contact)')

    # Restrictions
    show_once_per_session = fields.Boolean('Afficher 1 fois par session', default=True)
    show_once_per_user = fields.Boolean('Afficher 1 fois par utilisateur (cookie)', default=False)
    cookie_duration_days = fields.Integer('Durée cookie (jours)', default=30, 
                                          help='Si show_once_per_user activé')

    # Planification
    start_date = fields.Datetime('Date début', default=fields.Datetime.now)
    end_date = fields.Datetime('Date fin', help='Laisser vide pour durée illimitée')

    # Design
    position = fields.Selection([
        ('center', 'Centre (modal)'),
        ('bottom_right', 'Bas droite'),
        ('bottom_left', 'Bas gauche'),
        ('top_banner', 'Bandeau haut'),
    ], string='Position', default='center')
    
    overlay_opacity = fields.Float('Opacité overlay', default=0.5, help='0-1 pour modal center')
    max_width = fields.Integer('Largeur max (px)', default=500, help='Pour modal center')
    
    # Couleurs
    background_color = fields.Char('Couleur fond', default='#ffffff')
    text_color = fields.Char('Couleur texte', default='#000000')

    # Statistiques (computed)
    views_count = fields.Integer('Vues', default=0, readonly=True)
    clicks_count = fields.Integer('Clics CTA', default=0, readonly=True)
    conversion_rate = fields.Float('Taux conversion %', compute='_compute_conversion_rate', 
                                    store=False, help='clicks/views * 100')

    @api.depends('views_count', 'clicks_count')
    def _compute_conversion_rate(self):
        for popup in self:
            if popup.views_count > 0:
                popup.conversion_rate = (popup.clicks_count / popup.views_count) * 100
            else:
                popup.conversion_rate = 0.0

    @api.constrains('start_date', 'end_date')
    def _check_dates(self):
        for popup in self:
            if popup.end_date and popup.start_date and popup.end_date < popup.start_date:
                raise ValidationError(_('La date de fin doit être après la date de début.'))

    @api.constrains('trigger_scroll_percent')
    def _check_scroll_percent(self):
        for popup in self:
            if popup.trigger_scroll_percent < 0 or popup.trigger_scroll_percent > 100:
                raise ValidationError(_('Le pourcentage de scroll doit être entre 0 et 100.'))

    @api.constrains('overlay_opacity')
    def _check_overlay_opacity(self):
        for popup in self:
            if popup.overlay_opacity < 0 or popup.overlay_opacity > 1:
                raise ValidationError(_('L\'opacité doit être entre 0 et 1.'))

    def increment_views(self):
        """Incrémenter compteur de vues"""
        self.ensure_one()
        self.sudo().write({'views_count': self.views_count + 1})

    def increment_clicks(self):
        """Incrémenter compteur de clics CTA"""
        self.ensure_one()
        self.sudo().write({'clicks_count': self.clicks_count + 1})

    @api.model
    def get_active_popups(self, page_path='/'):
        """Récupérer popups actives pour une page donnée"""
        now = fields.Datetime.now()
        
        # Filtres de base
        domain = [
            ('active', '=', True),
            ('start_date', '<=', now),
            '|', ('end_date', '=', False), ('end_date', '>=', now),
        ]
        
        # Filtre par page
        if page_path == '/':
            domain.append('|')
            domain.append(('target_pages', '=', 'all'))
            domain.append(('target_pages', '=', 'home'))
        elif '/product' in page_path:
            domain.append('|')
            domain.append(('target_pages', '=', 'all'))
            domain.append(('target_pages', '=', 'products'))
        elif '/cart' in page_path:
            domain.append('|')
            domain.append(('target_pages', '=', 'all'))
            domain.append(('target_pages', '=', 'cart'))
        else:
            domain.append(('target_pages', 'in', ['all', 'custom']))
        
        popups = self.search(domain, order='sequence ASC')
        
        result = []
        for popup in popups:
            # Vérifier custom_pages si applicable
            if popup.target_pages == 'custom':
                if not popup.custom_pages:
                    continue
                allowed_paths = [p.strip() for p in popup.custom_pages.split(',')]
                if page_path not in allowed_paths:
                    continue
            
            result.append({
                'id': popup.id,
                'name': popup.name,
                'popup_type': popup.popup_type,
                'title': popup.title,
                'subtitle': popup.subtitle,
                'content': popup.content,
                'image_url': popup.image_url,
                'cta_text': popup.cta_text,
                'cta_link': popup.cta_link,
                'cta_color': popup.cta_color,
                'show_close_button': popup.show_close_button,
                'close_text': popup.close_text,
                'trigger_type': popup.trigger_type,
                'trigger_delay': popup.trigger_delay,
                'trigger_scroll_percent': popup.trigger_scroll_percent,
                'show_once_per_session': popup.show_once_per_session,
                'show_once_per_user': popup.show_once_per_user,
                'cookie_duration_days': popup.cookie_duration_days,
                'position': popup.position,
                'overlay_opacity': popup.overlay_opacity,
                'max_width': popup.max_width,
                'background_color': popup.background_color,
                'text_color': popup.text_color,
            })
        
        return result
