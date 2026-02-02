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
from . import invoices_ctrl
from . import bills_ctrl
from . import chart_of_accounts_ctrl
from . import payments_ctrl
from . import fiscal_years_ctrl
from . import journals_ctrl
from . import tax_report_ctrl
from . import bank_statements_ctrl
from . import bank_reconciliation_ctrl
from . import financial_reports_ctrl
from . import oca_reports_ctrl
from . import ml_forecasting_ctrl
from . import open_banking_ctrl
from . import sepa_direct_debit_ctrl
from . import cfo_dashboards_ctrl
from . import consolidation_ctrl
from . import analytics_accounting_ctrl
from . import cost_centers_ctrl
from . import budgets_ctrl
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
# GMAO (Maintenance)
from . import maintenance_ctrl
# Stripe Billing
from . import stripe_billing
# Stripe Payments Marketplace
from . import payment_stripe
from . import payment_stripe_connect
# Theme Analytics
from . import theme_analytics
# Super Admin
from . import super_admin
from . import tenant_admin_ctrl
from . import billing_ctrl
from . import admin_analytics_ctrl
from . import admin_security_ctrl
from . import admin_backup_ctrl
from . import admin_legal_ctrl
from . import admin_tickets_ctrl
from . import admin_settings_ctrl
from . import admin_seed_ctrl
from . import admin_provisioning_ctrl
# 2FA/TOTP
from . import totp
# Tickets Support
from . import ticket
# IA Configuration
from . import ai_public
from . import super_admin_ai
# Sitemap Dynamique V3
from . import sitemap
from . import stock_oca
from . import inventory_groups_ctrl
from . import warehouse_calendar_ctrl
from . import hr_oca
from . import marketing_campaigns_ctrl
from . import marketing_lists_ctrl
# Planification Paiements Fournisseurs
from . import supplier_invoices_ctrl
from . import payment_planning_ctrl
# User Settings & Billing
from . import user_settings_ctrl
from . import user_billing_ctrl
