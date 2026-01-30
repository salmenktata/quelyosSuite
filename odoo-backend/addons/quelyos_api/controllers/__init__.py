# -*- coding: utf-8 -*-
from . import auth
from . import base
from . import main
# Domain Controllers (extracted from main.py)
from . import products_ctrl
from . import orders_ctrl
from . import customers_ctrl
from . import inventory_ctrl
from . import finance_ctrl
from . import cart_ctrl
from . import analytics_ctrl
from . import delivery_payment_ctrl
from . import crm_ctrl
from . import health
from . import cms
from . import checkout
from . import wishlist
from . import search
from . import seo
from . import marketing
from . import subscription
from . import tenant
from . import theme_preset
from . import theme
from . import api_settings
from . import finance
from . import payment
from . import email_settings
from . import marketing_campaigns
# Store Extended Controllers
from . import store_extended
# HR Controllers - TEMPORAIREMENT DÉSACTIVÉ (bug Odoo 19 hr_holidays)
# from . import hr_employees
# from . import hr_departments
# from . import hr_contracts
# from . import hr_attendance
# from . import hr_leaves
# from . import hr_appraisals
# POS Controller
from . import pos
# Stripe Billing
from . import stripe_billing
# Stripe Payments Marketplace
from . import payment_stripe
from . import payment_stripe_connect
# Theme Analytics
from . import theme_analytics
# Super Admin
from . import super_admin
# 2FA/TOTP
from . import totp
# Tickets Support
from . import ticket
# IA Configuration
from . import ai_public
from . import super_admin_ai
# Sitemap Dynamique V3
from . import sitemap
