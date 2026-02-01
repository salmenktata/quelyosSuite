# -*- coding: utf-8 -*-
"""
Contrôleur Factures Fournisseurs - Planification Paiements
Endpoints : /api/ecommerce/supplier-invoices/*
"""

from odoo import http
from odoo.http import request
import json
from datetime import datetime, timedelta
import logging

_logger = logging.getLogger(__name__)


class SupplierInvoicesController(http.Controller):
    """Gestion factures fournisseurs pour planification paiements"""

    @http.route('/api/ecommerce/supplier-invoices/upcoming', type='http', auth='user', methods=['GET'], csrf=False)
    def get_upcoming_invoices(self, **params):
        """
        Liste factures fournisseurs à venir
        
        Paramètres :
            - days : nombre de jours dans le futur (défaut: 60)
            - tenant_id : ID tenant (optionnel)
        """
        try:
            days = int(params.get('days', 60))
            tenant_id = params.get('tenant_id')
            
            # Filtres de base
            domain = [
                ('move_type', '=', 'in_invoice'),  # Factures fournisseurs
                ('state', '=', 'posted'),  # Validées
                ('payment_state', '!=', 'paid'),  # Non payées
            ]
            
            # Filtre tenant si multi-tenant
            if tenant_id:
                domain.append(('tenant_id', '=', int(tenant_id)))
            
            # Filtre dates (échéance dans les X prochains jours)
            today = datetime.now().date()
            future_date = today + timedelta(days=days)
            domain.extend([
                ('invoice_date_due', '>=', today.isoformat()),
                ('invoice_date_due', '<=', future_date.isoformat()),
            ])
            
            # Recherche
            invoices = request.env['account.move'].sudo().search(domain, order='invoice_date_due asc')
            
            # Formatage
            result = []
            for inv in invoices:
                days_until_due = (inv.invoice_date_due - today).days if inv.invoice_date_due else None
                
                result.append({
                    'id': inv.id,
                    'name': inv.name,
                    'supplierName': inv.partner_id.name,
                    'supplierId': inv.partner_id.id,
                    'dueDate': inv.invoice_date_due.isoformat() if inv.invoice_date_due else None,
                    'amountTotal': inv.amount_total,
                    'amountResidual': inv.amount_residual,
                    'currencyId': inv.currency_id.id,
                    'currencySymbol': inv.currency_id.symbol,
                    'daysUntilDue': days_until_due,
                    'urgency': 'high' if days_until_due and days_until_due <= 7 else 'medium' if days_until_due and days_until_due <= 15 else 'low',
                })
            
            return request.make_json_response({
                'success': True,
                'invoices': result,
                'total_count': len(result),
            })
            
        except Exception as e:
            _logger.error("Error fetching upcoming supplier invoices: %s", str(e), exc_info=True)
            return request.make_json_response({
                'success': False,
                'error': str(e),
            }, status=500)


    @http.route('/api/ecommerce/supplier-invoices/overdue', type='http', auth='user', methods=['GET'], csrf=False)
    def get_overdue_invoices(self, **params):
        """
        Liste factures fournisseurs en retard
        
        Paramètres :
            - tenant_id : ID tenant (optionnel)
        """
        try:
            tenant_id = params.get('tenant_id')
            
            # Filtres de base
            domain = [
                ('move_type', '=', 'in_invoice'),
                ('state', '=', 'posted'),
                ('payment_state', '!=', 'paid'),
            ]
            
            # Filtre tenant
            if tenant_id:
                domain.append(('tenant_id', '=', int(tenant_id)))
            
            # Filtre retard (échéance passée)
            today = datetime.now().date()
            domain.append(('invoice_date_due', '<', today.isoformat()))
            
            # Recherche
            invoices = request.env['account.move'].sudo().search(domain, order='invoice_date_due asc')
            
            # Formatage
            result = []
            for inv in invoices:
                days_overdue = (today - inv.invoice_date_due).days if inv.invoice_date_due else None
                
                result.append({
                    'id': inv.id,
                    'name': inv.name,
                    'supplierName': inv.partner_id.name,
                    'supplierId': inv.partner_id.id,
                    'dueDate': inv.invoice_date_due.isoformat() if inv.invoice_date_due else None,
                    'amountTotal': inv.amount_total,
                    'amountResidual': inv.amount_residual,
                    'currencyId': inv.currency_id.id,
                    'currencySymbol': inv.currency_id.symbol,
                    'daysOverdue': days_overdue,
                    'urgency': 'critical' if days_overdue and days_overdue > 30 else 'high',
                    'isOverdue': True,
                })
            
            return request.make_json_response({
                'success': True,
                'invoices': result,
                'total_count': len(result),
            })
            
        except Exception as e:
            _logger.error("Error fetching overdue supplier invoices: %s", str(e), exc_info=True)
            return request.make_json_response({
                'success': False,
                'error': str(e),
            }, status=500)


    @http.route('/api/ecommerce/accounts', type='http', auth='user', methods=['GET'], csrf=False)
    def get_accounts(self, **params):
        """
        Liste comptes bancaires/caisses
        
        Paramètres :
            - tenant_id : ID tenant (optionnel)
        """
        try:
            tenant_id = params.get('tenant_id')
            
            # Filtres : comptes bancaires et caisse
            domain = [
                ('account_type', 'in', ['asset_cash', 'liability_credit_card']),
                ('deprecated', '=', False),
            ]
            
            if tenant_id:
                domain.append(('company_id.tenant_id', '=', int(tenant_id)))
            
            # Recherche
            accounts = request.env['account.account'].sudo().search(domain)
            
            # Formatage
            result = [{
                'id': acc.id,
                'name': acc.name,
                'code': acc.code,
                'accountType': acc.account_type,
                'currencyId': acc.currency_id.id if acc.currency_id else None,
                'currencySymbol': acc.currency_id.symbol if acc.currency_id else '€',
            } for acc in accounts]
            
            return request.make_json_response({
                'success': True,
                'accounts': result,
                'total_count': len(result),
            })
            
        except Exception as e:
            _logger.error("Error fetching accounts: %s", str(e), exc_info=True)
            return request.make_json_response({
                'success': False,
                'error': str(e),
            }, status=500)
