# -*- coding: utf-8 -*-
from odoo import models, fields, api
from odoo.exceptions import ValidationError
from odoo.tools.translate import _


class FAQCategory(models.Model):
    _name = 'quelyos.faq.category'
    _description = 'Catégorie FAQ'
    _order = 'sequence, name'

    name = fields.Char('Nom', required=True, translate=True)
    code = fields.Char('Code', required=True)
    icon = fields.Char('Icône', help="Nom de l'icône (ex: HelpCircle)")
    sequence = fields.Integer('Ordre', default=10)
    active = fields.Boolean('Actif', default=True)
    company_id = fields.Many2one(
        'res.company',
        string='Société',
        required=True,
        default=lambda self: self.env.company,
        index=True
    )
    faq_ids = fields.One2many('quelyos.faq', 'category_id', string='Questions')
    faq_count = fields.Integer('Nb questions', compute='_compute_faq_count', store=True)
    @api.depends('faq_ids')

    @api.constrains('code', 'company_id')
    def _check_unique_code_company(self):
        """Contrainte: Le code doit être unique par société"""
        for record in self:
            # Chercher un doublon
            duplicate = self.search([
                ('code', '=', record.code),
                ('company_id', '=', record.company_id),
                ('id', '!=', record.id)
            ], limit=1)

            if duplicate:
                raise ValidationError(_('Le code doit être unique par société'))


    def _compute_faq_count(self):
        for cat in self:
            cat.faq_count = len(cat.faq_ids.filtered(lambda f: f.is_published))

    def to_dict(self):
        self.ensure_one()
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'icon': self.icon,
            'faqCount': self.faq_count,
        }


class FAQ(models.Model):
    _name = 'quelyos.faq'
    _description = 'Question FAQ'
    _order = 'sequence, id'

    question = fields.Char('Question', required=True, translate=True)
    answer = fields.Html('Réponse', required=True, translate=True)
    category_id = fields.Many2one(
        'quelyos.faq.category',
        string='Catégorie',
        required=True,
        ondelete='cascade'
    )
    company_id = fields.Many2one(
        related='category_id.company_id',
        store=True,
        index=True
    )
    sequence = fields.Integer('Ordre', default=10)
    is_published = fields.Boolean('Publié', default=True)
    is_featured = fields.Boolean('Mise en avant', default=False)
    views_count = fields.Integer('Vues', default=0)
    helpful_yes = fields.Integer('Utile: Oui', default=0)
    helpful_no = fields.Integer('Utile: Non', default=0)

    def to_dict(self):
        self.ensure_one()
        return {
            'id': self.id,
            'question': self.question,
            'answer': self.answer,
            'categoryId': self.category_id.id,
            'categoryName': self.category_id.name,
            'isPublished': self.is_published,
            'isFeatured': self.is_featured,
            'viewsCount': self.views_count,
            'helpfulYes': self.helpful_yes,
            'helpfulNo': self.helpful_no,
        }

    def action_increment_view(self):
        """Incrémenter le compteur de vues"""
        self.sudo().write({'views_count': self.views_count + 1})

    def action_vote_helpful(self, is_helpful):
        """Vote utile ou non"""
        if is_helpful:
            self.sudo().write({'helpful_yes': self.helpful_yes + 1})
        else:
            self.sudo().write({'helpful_no': self.helpful_no + 1})
