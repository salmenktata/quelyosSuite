# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError
import re

class SeoMetadata(models.Model):
    _name = 'quelyos.seo.metadata'
    _description = 'SEO Metadata pour pages'
    _order = 'page_type, slug'

    # Identification
    name = fields.Char('Nom interne', required=True, help='Usage interne uniquement')
    page_type = fields.Selection([
        ('home', 'Homepage'),
        ('product', 'Page Produit'),
        ('category', 'Page Catégorie'),
        ('static', 'Page Statique'),
        ('collection', 'Collection'),
    ], string='Type de page', required=True, default='static')
    slug = fields.Char('Slug', required=True, help='URL slug (ex: /about-us)')
    active = fields.Boolean('Actif', default=True, tracking=True)

    # SEO Basique
    meta_title = fields.Char('Meta Title', required=True, size=60, 
                             help='Titre affiché dans les résultats Google (max 60 car)')
    meta_description = fields.Text('Meta Description', required=True, size=160,
                                   help='Description affichée dans Google (max 160 car)')
    
    # Open Graph (Facebook/LinkedIn)
    og_title = fields.Char('OG Title', size=60, help='Si vide, utilise meta_title')
    og_description = fields.Text('OG Description', size=160, help='Si vide, utilise meta_description')
    og_image_url = fields.Char('OG Image URL', help='URL image 1200x630px pour partage social')
    og_type = fields.Selection([
        ('website', 'Website'),
        ('article', 'Article'),
        ('product', 'Product'),
    ], string='OG Type', default='website')

    # Twitter Card
    twitter_card = fields.Selection([
        ('summary', 'Summary'),
        ('summary_large_image', 'Summary Large Image'),
        ('product', 'Product'),
    ], string='Twitter Card', default='summary_large_image')
    twitter_title = fields.Char('Twitter Title', size=60)
    twitter_description = fields.Text('Twitter Description', size=160)
    twitter_image_url = fields.Char('Twitter Image URL')

    # Schema.org
    schema_type = fields.Selection([
        ('WebPage', 'WebPage'),
        ('Product', 'Product'),
        ('Article', 'Article'),
        ('Organization', 'Organization'),
        ('FAQPage', 'FAQPage'),
    ], string='Schema Type', default='WebPage')
    
    # Indexation
    noindex = fields.Boolean('NoIndex', default=False, help='Exclure des moteurs de recherche')
    nofollow = fields.Boolean('NoFollow', default=False, help='Ne pas suivre les liens')
    canonical_url = fields.Char('Canonical URL', help='URL canonique si différente du slug')

    # Mots-clés
    keywords = fields.Char('Keywords', help='Mots-clés séparés par virgules (optionnel, moins important en 2025)')
    focus_keyword = fields.Char('Focus Keyword', help='Mot-clé principal ciblé')

    # Audit
    title_length = fields.Integer('Longueur Title', compute='_compute_lengths', store=False)
    description_length = fields.Integer('Longueur Description', compute='_compute_lengths', store=False)
    seo_score = fields.Integer('Score SEO', compute='_compute_seo_score', store=False, help='Score sur 100')

    _sql_constraints = [
        ('unique_slug', 'UNIQUE(slug)', 'Le slug doit être unique'),
    ]

    @api.depends('meta_title', 'meta_description')
    def _compute_lengths(self):
        for record in self:
            record.title_length = len(record.meta_title) if record.meta_title else 0
            record.description_length = len(record.meta_description) if record.meta_description else 0

    @api.depends('meta_title', 'meta_description', 'og_image_url', 'focus_keyword')
    def _compute_seo_score(self):
        for record in self:
            score = 0
            
            # Title (30 points)
            if record.meta_title:
                if 30 <= len(record.meta_title) <= 60:
                    score += 30
                elif len(record.meta_title) < 30:
                    score += 15
                else:
                    score += 10
            
            # Description (30 points)
            if record.meta_description:
                if 120 <= len(record.meta_description) <= 160:
                    score += 30
                elif len(record.meta_description) < 120:
                    score += 15
                else:
                    score += 10
            
            # OG Image (20 points)
            if record.og_image_url:
                score += 20
            
            # Focus keyword présent dans title (10 points)
            if record.focus_keyword and record.meta_title:
                if record.focus_keyword.lower() in record.meta_title.lower():
                    score += 10
            
            # Focus keyword présent dans description (10 points)
            if record.focus_keyword and record.meta_description:
                if record.focus_keyword.lower() in record.meta_description.lower():
                    score += 10
            
            record.seo_score = score

    @api.constrains('meta_title')
    def _check_meta_title(self):
        for record in self:
            if record.meta_title and len(record.meta_title) > 60:
                raise ValidationError(_('Le meta title ne doit pas dépasser 60 caractères (actuellement: %d)') % len(record.meta_title))

    @api.constrains('meta_description')
    def _check_meta_description(self):
        for record in self:
            if record.meta_description and len(record.meta_description) > 160:
                raise ValidationError(_('La meta description ne doit pas dépasser 160 caractères (actuellement: %d)') % len(record.meta_description))

    @api.constrains('slug')
    def _check_slug(self):
        for record in self:
            if record.slug:
                # Vérifier format slug (lettres minuscules, chiffres, tirets uniquement)
                if not re.match(r'^[a-z0-9-/]+$', record.slug):
                    raise ValidationError(_('Le slug doit contenir uniquement des lettres minuscules, chiffres, tirets et slashes'))
                
                # Doit commencer par /
                if not record.slug.startswith('/'):
                    raise ValidationError(_('Le slug doit commencer par /'))

    @api.model
    def get_by_slug(self, slug):
        """Récupérer metadata par slug pour usage frontend"""
        record = self.search([('slug', '=', slug), ('active', '=', True)], limit=1)
        if record:
            return {
                'meta_title': record.meta_title,
                'meta_description': record.meta_description,
                'og_title': record.og_title or record.meta_title,
                'og_description': record.og_description or record.meta_description,
                'og_image_url': record.og_image_url,
                'og_type': record.og_type,
                'twitter_card': record.twitter_card,
                'twitter_title': record.twitter_title or record.meta_title,
                'twitter_description': record.twitter_description or record.meta_description,
                'twitter_image_url': record.twitter_image_url or record.og_image_url,
                'schema_type': record.schema_type,
                'noindex': record.noindex,
                'nofollow': record.nofollow,
                'canonical_url': record.canonical_url,
            }
        return None
