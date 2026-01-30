# -*- coding: utf-8 -*-
from . import ir_http
from . import auth_refresh_token
from . import sitemap_healthcheck
from . import sitemap_service
from . import cache
from . import job_queue
from . import product_image
from . import product_template
from . import product_product
from . import stock_quant
from . import stock_location
from . import stock_scrap
from . import stock_reservation
from . import sale_order
from . import subscription_quota_mixin
from . import subscription_plan
from . import subscription
from . import tenant
from . import theme_preset
from . import theme
from . import theme_marketplace
from . import hero_slide
from . import promo_banner
from . import promo_message
from . import trust_badge
from . import menu
from . import seo_metadata
from . import marketing_popup
from . import static_page
from . import api_settings
from . import cycle_count
from . import country_state
from . import payment_provider
from . import payment_transaction
from . import email_config
from . import contact_list
from . import marketing_campaign
from . import marketing_campaign_variant
from . import marketing_blacklist
from . import link_tracker
from . import sms_template
from . import email_builder
# Store Extended Models
from . import product_review
from . import faq
from . import collection
from . import flash_sale
from . import bundle
from . import testimonial
from . import blog
from . import loyalty
from . import ticket
from . import support_template
from . import sla_policy
from . import live_event
# HR Models - TEMPORAIREMENT DÉSACTIVÉ (bug Odoo 19 hr_holidays)
# from . import hr_department
# from . import hr_job
# from . import hr_employee
# from . import hr_contract
# from . import hr_attendance
# from . import hr_leave_type
# from . import hr_leave
# from . import hr_leave_allocation
# HR V2 - Évaluations
# from . import hr_skill
# from . import hr_goal
# from . import hr_appraisal
# Wishlist Extension - Disabled (requires website_sale_wishlist module)
# from . import wishlist
# POS Models
from . import pos_payment_method
from . import pos_config
from . import pos_session
from . import pos_order
# CRM Multi-tenant
from . import crm_lead
# Multi-tenant pour tous les modèles custom
from . import tenant_mixin
# Finance multi-tenant
from . import account_move
# Contacts multi-tenant
from . import res_partner
# Users multi-tenant (tenant_id computed field)
from . import res_users
# Provisioning async
from . import provisioning_job
# Super Admin - Backups & CORS
from . import backup
from . import backup_schedule
from . import cors_entry
# Audit logging
from . import audit_log
# Password history
from . import password_history
# 2FA/TOTP
from . import user_totp
# Security P4 - Super Admin
from . import admin_session
from . import ip_whitelist
from . import api_key
from . import security_alert
# Dunning (payment collection)
from . import dunning
# Security P5 - Rate Limiting, WAF
from . import rate_limit
from . import waf_rule
# IA Configuration
from . import ai_config
from . import ai_unanswered
