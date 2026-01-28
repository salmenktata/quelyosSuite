# -*- coding: utf-8 -*-
"""
Extension multi-tenant pour tous les modèles Quelyos custom.

Ce fichier centralise l'ajout du champ tenant_id sur tous les modèles
Quelyos qui nécessitent une isolation par tenant.
"""

from odoo import models, fields, api


# ═══════════════════════════════════════════════════════════════════════════
# STORE / E-COMMERCE
# ═══════════════════════════════════════════════════════════════════════════

class ProductReviewTenant(models.Model):
    _inherit = 'quelyos.product.review'
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', index=True, ondelete='cascade')


class ReviewImageTenant(models.Model):
    _inherit = 'quelyos.review.image'
    tenant_id = fields.Many2one(
        'quelyos.tenant', string='Tenant',
        related='review_id.tenant_id', store=True, index=True
    )


class CollectionTenant(models.Model):
    _inherit = 'quelyos.collection'
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', index=True, ondelete='cascade')


class BundleTenant(models.Model):
    _inherit = 'quelyos.bundle'
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', index=True, ondelete='cascade')


class BundleLineTenant(models.Model):
    _inherit = 'quelyos.bundle.line'
    tenant_id = fields.Many2one(
        'quelyos.tenant', string='Tenant',
        related='bundle_id.tenant_id', store=True, index=True
    )


class FlashSaleTenant(models.Model):
    _inherit = 'quelyos.flash.sale'
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', index=True, ondelete='cascade')


class FlashSaleLineTenant(models.Model):
    _inherit = 'quelyos.flash.sale.line'
    tenant_id = fields.Many2one(
        'quelyos.tenant', string='Tenant',
        related='flash_sale_id.tenant_id', store=True, index=True
    )


class FAQCategoryTenant(models.Model):
    _inherit = 'quelyos.faq.category'
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', index=True, ondelete='cascade')


class FAQTenant(models.Model):
    _inherit = 'quelyos.faq'
    tenant_id = fields.Many2one(
        'quelyos.tenant', string='Tenant',
        related='category_id.tenant_id', store=True, index=True
    )


class TestimonialTenant(models.Model):
    _inherit = 'quelyos.testimonial'
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', index=True, ondelete='cascade')


# ═══════════════════════════════════════════════════════════════════════════
# LOYALTY
# ═══════════════════════════════════════════════════════════════════════════

class LoyaltyProgramTenant(models.Model):
    _inherit = 'quelyos.loyalty.program'
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', index=True, ondelete='cascade')


class LoyaltyLevelTenant(models.Model):
    _inherit = 'quelyos.loyalty.level'
    tenant_id = fields.Many2one(
        'quelyos.tenant', string='Tenant',
        related='program_id.tenant_id', store=True, index=True
    )


class LoyaltyMemberTenant(models.Model):
    _inherit = 'quelyos.loyalty.member'
    tenant_id = fields.Many2one(
        'quelyos.tenant', string='Tenant',
        related='program_id.tenant_id', store=True, index=True
    )


class LoyaltyTransactionTenant(models.Model):
    _inherit = 'quelyos.loyalty.transaction'
    tenant_id = fields.Many2one(
        'quelyos.tenant', string='Tenant',
        related='member_id.tenant_id', store=True, index=True
    )


# ═══════════════════════════════════════════════════════════════════════════
# BLOG / CMS
# ═══════════════════════════════════════════════════════════════════════════

class BlogCategoryTenant(models.Model):
    _inherit = 'quelyos.blog.category'
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', index=True, ondelete='cascade')


class BlogPostTenant(models.Model):
    _inherit = 'quelyos.blog.post'
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', index=True, ondelete='cascade')


class BlogTagTenant(models.Model):
    _inherit = 'quelyos.blog.tag'
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', index=True, ondelete='cascade')


class StaticPageTenant(models.Model):
    _inherit = 'quelyos.static.page'
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', index=True, ondelete='cascade')


class SEOMetadataTenant(models.Model):
    _inherit = 'quelyos.seo.metadata'
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', index=True, ondelete='cascade')


# ═══════════════════════════════════════════════════════════════════════════
# MARKETING
# ═══════════════════════════════════════════════════════════════════════════

class MarketingCampaignTenant(models.Model):
    _inherit = 'quelyos.marketing.campaign'
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', index=True, ondelete='cascade')


class EmailTemplateTenant(models.Model):
    _inherit = 'quelyos.email.template'
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', index=True, ondelete='cascade')


class MarketingPopupTenant(models.Model):
    _inherit = 'quelyos.marketing.popup'
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', index=True, ondelete='cascade')


class ContactListTenant(models.Model):
    _inherit = 'quelyos.contact.list'
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', index=True, ondelete='cascade')


# ═══════════════════════════════════════════════════════════════════════════
# SUPPORT / TICKETS
# ═══════════════════════════════════════════════════════════════════════════

class TicketTenant(models.Model):
    _inherit = 'quelyos.ticket'
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', index=True, ondelete='cascade')


class TicketMessageTenant(models.Model):
    _inherit = 'quelyos.ticket.message'
    tenant_id = fields.Many2one(
        'quelyos.tenant', string='Tenant',
        related='ticket_id.tenant_id', store=True, index=True
    )


# ═══════════════════════════════════════════════════════════════════════════
# STOCK
# ═══════════════════════════════════════════════════════════════════════════

class CycleCountTenant(models.Model):
    _inherit = 'quelyos.cycle.count'
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', index=True, ondelete='cascade')


class CycleCountLineTenant(models.Model):
    _inherit = 'quelyos.cycle.count.line'
    tenant_id = fields.Many2one(
        'quelyos.tenant', string='Tenant',
        related='cycle_count_id.tenant_id', store=True, index=True
    )


# ═══════════════════════════════════════════════════════════════════════════
# THEME / UI CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

class ThemePresetTenant(models.Model):
    _inherit = 'quelyos.theme.preset'
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', index=True, ondelete='cascade')


class HeroSlideTenant(models.Model):
    _inherit = 'quelyos.hero.slide'
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', index=True, ondelete='cascade')


class PromoBannerTenant(models.Model):
    _inherit = 'quelyos.promo.banner'
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', index=True, ondelete='cascade')


class PromoMessageTenant(models.Model):
    _inherit = 'quelyos.promo.message'
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', index=True, ondelete='cascade')


class TrustBadgeTenant(models.Model):
    _inherit = 'quelyos.trust.badge'
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', index=True, ondelete='cascade')


class MenuTenant(models.Model):
    _inherit = 'quelyos.menu'
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', index=True, ondelete='cascade')


# ═══════════════════════════════════════════════════════════════════════════
# SETTINGS
# ═══════════════════════════════════════════════════════════════════════════

class EmailConfigTenant(models.Model):
    _inherit = 'quelyos.email.config'
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', index=True, ondelete='cascade')


class APISettingsTenant(models.Model):
    _inherit = 'quelyos.api.settings'
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', index=True, ondelete='cascade')
