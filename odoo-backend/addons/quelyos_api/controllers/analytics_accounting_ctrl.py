# -*- coding: utf-8 -*-
"""Contrôleur Comptabilité Analytique Avancée"""

import logging
from odoo import http
from odoo.http import request
from .base import BaseController

_logger = logging.getLogger(__name__)


class AnalyticsAccountingController(BaseController):
    """API Comptabilité Analytique Multi-Axes"""

    @http.route('/api/finance/analytics/axes', type='json', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_axes(self, **params):
        """
        Liste axes analytiques configurés
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            
            # TODO: Récupérer depuis account.analytic.plan
            axes = [
                {'id': 1, 'name': 'Projets', 'code': 'PROJ', 'active': True},
                {'id': 2, 'name': 'Départements', 'code': 'DEPT', 'active': True},
                {'id': 3, 'name': 'Produits', 'code': 'PROD', 'active': True},
                {'id': 4, 'name': 'Zones Géographiques', 'code': 'GEO', 'active': True},
            ]
            
            return self._success_response({'axes': axes})

        except Exception as e:
            _logger.error(f"Erreur get_axes: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/analytics/accounts', type='json', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_analytic_accounts(self, **params):
        """
        Liste comptes analytiques par axe
        
        Query params:
        - axis_id: int (filtrer par axe)
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            axis_id = params.get('axis_id')
            
            # TODO: Récupérer depuis account.analytic.account
            accounts = [
                {
                    'id': 1,
                    'name': 'Projet Alpha',
                    'code': 'PROJ-001',
                    'axisId': 1,
                    'balance': 125000.0,
                },
                {
                    'id': 2,
                    'name': 'Projet Beta',
                    'code': 'PROJ-002',
                    'axisId': 1,
                    'balance': 85000.0,
                },
                {
                    'id': 3,
                    'name': 'Commercial',
                    'code': 'DEPT-SALES',
                    'axisId': 2,
                    'balance': 200000.0,
                },
            ]
            
            if axis_id:
                accounts = [a for a in accounts if a['axisId'] == int(axis_id)]
            
            return self._success_response({'accounts': accounts})

        except Exception as e:
            _logger.error(f"Erreur get_analytic_accounts: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/analytics/distribution', type='json', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_distribution(self, **params):
        """
        Répartition montants par axe analytique
        
        Query params:
        - axis_id: int
        - date_from: YYYY-MM-DD
        - date_to: YYYY-MM-DD
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            
            distribution = [
                {
                    'accountId': 1,
                    'accountName': 'Projet Alpha',
                    'debit': 150000.0,
                    'credit': 25000.0,
                    'balance': 125000.0,
                    'percentage': 45.0,
                },
                {
                    'accountId': 2,
                    'accountName': 'Projet Beta',
                    'debit': 100000.0,
                    'credit': 15000.0,
                    'balance': 85000.0,
                    'percentage': 30.5,
                },
            ]
            
            return self._success_response({'distribution': distribution})

        except Exception as e:
            _logger.error(f"Erreur get_distribution: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/analytics/cross-analysis', type='json', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_cross_analysis(self, **params):
        """
        Analyse croisée multi-axes (ex: Projet x Département)
        
        Query params:
        - axis1_id: int
        - axis2_id: int
        - date_from: YYYY-MM-DD
        - date_to: YYYY-MM-DD
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            
            # Matrice croisée : lignes = axe 1, colonnes = axe 2
            cross_data = {
                'axis1': {'id': 1, 'name': 'Projets'},
                'axis2': {'id': 2, 'name': 'Départements'},
                'matrix': [
                    {
                        'axis1Account': 'Projet Alpha',
                        'commercial': 50000.0,
                        'marketing': 30000.0,
                        'technique': 45000.0,
                        'total': 125000.0,
                    },
                    {
                        'axis1Account': 'Projet Beta',
                        'commercial': 40000.0,
                        'marketing': 20000.0,
                        'technique': 25000.0,
                        'total': 85000.0,
                    },
                ],
            }
            
            return self._success_response(cross_data)

        except Exception as e:
            _logger.error(f"Erreur get_cross_analysis: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/accounting/export-fec', type='http', auth='public', methods=['POST'], csrf=False)
    def export_fec(self, **params):
        """
        Export FEC (Fichier des Écritures Comptables) conforme DGFIP

        Format: Texte délimité par pipes (|)
        Encodage: UTF-8 sans BOM
        Nom fichier: {SIREN}FEC{YYYYMMDD}.txt

        Body (JSON):
        {
          "date_from": "2026-01-01",
          "date_to": "2026-12-31"
        }
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return request.make_response(
                    "Unauthorized",
                    status=401,
                    headers={'Content-Type': 'text/plain'}
                )

            tenant_id = self._get_tenant_id(user)
            if not tenant_id:
                return request.make_response(
                    "Forbidden",
                    status=403,
                    headers={'Content-Type': 'text/plain'}
                )

            # Récupérer paramètres
            import json
            from datetime import datetime

            body = json.loads(request.httprequest.data.decode('utf-8'))
            date_from = body.get('date_from')
            date_to = body.get('date_to')

            if not date_from or not date_to:
                return request.make_response(
                    "date_from and date_to required",
                    status=400,
                    headers={'Content-Type': 'text/plain'}
                )

            # Récupérer tenant pour SIREN
            tenant = request.env['quelyos.tenant'].sudo().browse(tenant_id)
            siren = tenant.company_id.vat or "00000000000"  # Fallback si pas de SIREN
            # Nettoyer SIREN (enlever préfixe pays FR)
            if siren.startswith('FR'):
                siren = siren[2:]
            siren = siren[:9]  # SIREN = 9 chiffres

            # Nom fichier
            today = datetime.now().strftime('%Y%m%d')
            filename = f"{siren}FEC{today}.txt"

            # En-tête FEC (obligatoire)
            lines = []
            header = "JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|CompAuxNum|CompAuxLib|PieceRef|PieceDate|EcritureLib|Debit|Credit|EcritureLet|DateLet|ValidDate|Montantdevise|Idevise"
            lines.append(header)

            # Récupérer écritures comptables
            domain = [
                ('date', '>=', date_from),
                ('date', '<=', date_to),
                ('move_id.state', '=', 'posted'),  # Seulement écritures validées
                ('company_id', '=', tenant.company_id.id),
            ]

            MoveLine = request.env['account.move.line'].sudo()
            move_lines = MoveLine.search(domain, order='date asc, move_id asc')

            _logger.info(f"Export FEC: {len(move_lines)} lignes d'écriture trouvées")

            # Générer lignes FEC
            for line in move_lines:
                move = line.move_id
                journal = move.journal_id
                account = line.account_id
                partner = line.partner_id

                # Format dates
                ecriture_date = line.date.strftime('%Y%m%d') if line.date else ''
                piece_date = move.date.strftime('%Y%m%d') if move.date else ''
                valid_date = move.date.strftime('%Y%m%d') if move.date else ''
                date_let = line.date_maturity.strftime('%Y%m%d') if line.date_maturity else ''

                # Montants (en valeur absolue, débit/crédit séparés)
                debit = f"{abs(line.debit):.2f}" if line.debit else "0.00"
                credit = f"{abs(line.credit):.2f}" if line.credit else "0.00"

                # Devise
                currency = line.currency_id.name if line.currency_id else 'EUR'
                amount_currency = f"{abs(line.amount_currency):.2f}" if line.amount_currency else "0.00"

                # Lettrage (réconciliation)
                ecriture_let = line.full_reconcile_id.name if line.full_reconcile_id else ''

                # Construire ligne FEC
                fec_line = "|".join([
                    journal.code or '',                     # JournalCode
                    journal.name or '',                     # JournalLib
                    move.name or '',                        # EcritureNum
                    ecriture_date,                          # EcritureDate
                    account.code or '',                     # CompteNum
                    account.name or '',                     # CompteLib
                    partner.ref or '' if partner else '',   # CompAuxNum
                    partner.name or '' if partner else '',  # CompAuxLib
                    move.ref or '',                         # PieceRef
                    piece_date,                             # PieceDate
                    (line.name or '').replace('|', '-'),    # EcritureLib (enlever pipes)
                    debit,                                  # Debit
                    credit,                                 # Credit
                    ecriture_let,                           # EcritureLet
                    date_let,                               # DateLet
                    valid_date,                             # ValidDate
                    amount_currency,                        # Montantdevise
                    currency,                               # Idevise
                ])

                lines.append(fec_line)

            # Générer contenu fichier
            content = "\n".join(lines)

            _logger.info(f"Export FEC généré: {filename}, {len(lines)-1} lignes")

            # Retourner fichier
            return request.make_response(
                content.encode('utf-8'),
                headers=[
                    ('Content-Type', 'text/plain; charset=utf-8'),
                    ('Content-Disposition', f'attachment; filename="{filename}"'),
                ]
            )

        except Exception as e:
            _logger.error(f"Erreur export_fec: {e}", exc_info=True)
            return request.make_response(
                f"Error: {str(e)}",
                status=500,
                headers={'Content-Type': 'text/plain'}
            )

    @http.route('/api/finance/analytics/revenue-forecast', type='json', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_revenue_forecast(self, **params):
        """
        Prévision chiffre d'affaires par client

        Algorithme: Moyenne mobile sur 3/6/12 mois
        Détection tendance: hausse/baisse/stable
        Scoring fiabilité basé sur régularité paiements

        Query params:
        - period: 3|6|12 (mois historique, default: 6)
        - top_n: int (top N clients, default: 20)
        - min_invoices: int (minimum factures pour prédiction, default: 2)
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            if not tenant_id:
                return self._error_response("Tenant non trouvé", "FORBIDDEN", 403)

            # Paramètres
            period_months = int(params.get('period', 6))
            top_n = int(params.get('top_n', 20))
            min_invoices = int(params.get('min_invoices', 2))

            from datetime import datetime, timedelta
            from dateutil.relativedelta import relativedelta

            today = datetime.now().date()
            start_date = today - relativedelta(months=period_months)

            # Récupérer factures validées et payées de la période
            AccountMove = request.env['account.move'].sudo()
            invoices = AccountMove.search([
                ('tenant_id', '=', tenant_id),
                ('move_type', '=', 'out_invoice'),
                ('state', '=', 'posted'),
                ('invoice_date', '>=', start_date.isoformat()),
                ('invoice_date', '<=', today.isoformat()),
            ])

            _logger.info(f"Revenue forecast: {len(invoices)} factures trouvées sur {period_months} mois")

            # Grouper par client
            customer_data = {}

            for invoice in invoices:
                partner_id = invoice.partner_id.id
                if partner_id not in customer_data:
                    customer_data[partner_id] = {
                        'partner': invoice.partner_id,
                        'invoices': [],
                        'total_amount': 0.0,
                        'paid_count': 0,
                        'unpaid_count': 0,
                    }

                customer_data[partner_id]['invoices'].append({
                    'date': invoice.invoice_date,
                    'amount': float(invoice.amount_total),
                    'paid': invoice.payment_state == 'paid',
                })
                customer_data[partner_id]['total_amount'] += float(invoice.amount_total)

                if invoice.payment_state == 'paid':
                    customer_data[partner_id]['paid_count'] += 1
                else:
                    customer_data[partner_id]['unpaid_count'] += 1

            # Calculer prévisions par client
            forecasts = []

            for partner_id, data in customer_data.items():
                if len(data['invoices']) < min_invoices:
                    continue  # Pas assez de données

                # Moyenne mobile simple (total / nb mois)
                avg_monthly = data['total_amount'] / period_months

                # Prévision prochain mois
                forecast_next_month = avg_monthly

                # Prévision trimestre (3 mois)
                forecast_quarter = avg_monthly * 3

                # Prévision année (12 mois)
                forecast_year = avg_monthly * 12

                # Détection tendance (comparer première moitié vs deuxième moitié)
                mid_date = start_date + relativedelta(months=period_months // 2)
                first_half = sum(
                    inv['amount']
                    for inv in data['invoices']
                    if inv['date'] < mid_date
                )
                second_half = sum(
                    inv['amount']
                    for inv in data['invoices']
                    if inv['date'] >= mid_date
                )

                if second_half > first_half * 1.1:  # +10%
                    trend = 'up'
                    trend_label = 'Hausse'
                elif second_half < first_half * 0.9:  # -10%
                    trend = 'down'
                    trend_label = 'Baisse'
                else:
                    trend = 'stable'
                    trend_label = 'Stable'

                # Score fiabilité (% factures payées)
                total_invoices = data['paid_count'] + data['unpaid_count']
                reliability_score = (data['paid_count'] / total_invoices * 100) if total_invoices > 0 else 0

                forecasts.append({
                    'customerId': partner_id,
                    'customerName': data['partner'].name,
                    'historicalRevenue': round(data['total_amount'], 2),
                    'avgMonthly': round(avg_monthly, 2),
                    'forecastNextMonth': round(forecast_next_month, 2),
                    'forecastQuarter': round(forecast_quarter, 2),
                    'forecastYear': round(forecast_year, 2),
                    'trend': trend,
                    'trendLabel': trend_label,
                    'reliabilityScore': round(reliability_score, 1),
                    'invoiceCount': len(data['invoices']),
                    'paidCount': data['paid_count'],
                    'unpaidCount': data['unpaid_count'],
                })

            # Trier par CA historique décroissant
            forecasts.sort(key=lambda x: x['historicalRevenue'], reverse=True)

            # Limiter au top N
            forecasts = forecasts[:top_n]

            return self._success_response({
                'forecasts': forecasts,
                'periodMonths': period_months,
                'totalCustomers': len(forecasts),
            })

        except Exception as e:
            _logger.error(f"Erreur get_revenue_forecast: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)
