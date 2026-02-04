# -*- coding: utf-8 -*-
import json
import logging
from datetime import datetime
from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)


class MultiCurrencyController(http.Controller):
    """
    Contrôleur Multi-Devises
    Gestion factures multi-devises, taux change, conversion
    """

    def _authenticate_from_header(self):
        """Authentification depuis header Authorization"""
        auth_header = request.httprequest.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return None

        token = auth_header[7:]
        AuthToken = request.env['quelyos.auth_token'].sudo()
        auth_record = AuthToken.search([('token', '=', token), ('expires_at', '>', datetime.now())], limit=1)

        if auth_record and auth_record.user_id:
            return auth_record.user_id
        return None

    def _get_tenant_id(self, user):
        """Récupérer tenant_id de l'utilisateur"""
        if user and user.tenant_id:
            return user.tenant_id.id
        return None

    def _success_response(self, data, message=None):
        """Format réponse succès standardisé"""
        return json.dumps({'success': True, 'data': data, 'message': message})

    def _error_response(self, error, code="ERROR", status=400):
        """Format réponse erreur standardisé"""
        response = json.dumps({'success': False, 'error': error, 'code': code})
        return request.make_response(response, status=status, headers=[('Content-Type', 'application/json')])

    @http.route('/api/finance/currencies', type='json', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_currencies(self, **params):
        """Liste devises actives avec taux de change actuels"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            Currency = request.env['res.currency'].sudo()
            Company = request.env['res.company'].sudo()

            # Récupérer company tenant
            company = Company.search([('tenant_id', '=', tenant_id)], limit=1)
            base_currency = company.currency_id if company else Currency.browse(1)  # EUR par défaut

            # Toutes devises actives
            currencies = Currency.search([('active', '=', True)], order='name')

            results = []
            for currency in currencies:
                # Taux de change vs devise base
                rate = 1.0
                if currency.id != base_currency.id:
                    rate = float(currency.rate) if currency.rate else 1.0

                results.append({
                    'id': currency.id,
                    'name': currency.name,
                    'symbol': currency.symbol,
                    'rate': round(rate, 6),
                    'position': currency.position,  # 'before' ou 'after'
                    'decimalPlaces': currency.decimal_places,
                    'isBase': currency.id == base_currency.id,
                })

            return self._success_response({
                'currencies': results,
                'baseCurrency': {
                    'id': base_currency.id,
                    'name': base_currency.name,
                    'symbol': base_currency.symbol,
                },
            })

        except Exception as e:
            _logger.error(f"Erreur get_currencies: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/currencies/convert', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def convert_currency(self, **params):
        """Conversion montant entre deux devises avec taux jour"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            data = request.jsonrequest

            # Paramètres
            amount = float(data.get('amount', 0))
            from_currency_id = int(data.get('fromCurrencyId'))
            to_currency_id = int(data.get('toCurrencyId'))
            date = data.get('date')  # Optionnel, défaut aujourd'hui

            if not all([amount, from_currency_id, to_currency_id]):
                return self._error_response("amount, fromCurrencyId, toCurrencyId requis", "VALIDATION_ERROR", 400)

            Currency = request.env['res.currency'].sudo()

            from_currency = Currency.browse(from_currency_id)
            to_currency = Currency.browse(to_currency_id)

            if not from_currency.exists() or not to_currency.exists():
                return self._error_response("Devise introuvable", "NOT_FOUND", 404)

            # Conversion avec taux Odoo (gère historique taux si date fournie)
            conversion_date = datetime.strptime(date, '%Y-%m-%d').date() if date else datetime.now().date()

            converted_amount = from_currency._convert(
                amount,
                to_currency,
                request.env.company,
                conversion_date
            )

            # Taux de change appliqué
            rate = converted_amount / amount if amount != 0 else 1.0

            return self._success_response({
                'originalAmount': round(amount, 2),
                'convertedAmount': round(float(converted_amount), 2),
                'fromCurrency': from_currency.name,
                'toCurrency': to_currency.name,
                'rate': round(rate, 6),
                'date': str(conversion_date),
            })

        except Exception as e:
            _logger.error(f"Erreur convert_currency: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/currencies/rates-history', type='json', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_rates_history(self, **params):
        """Historique taux de change pour une devise sur une période"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            currency_id = params.get('currencyId')
            date_from = params.get('dateFrom')
            date_to = params.get('dateTo')

            if not currency_id:
                return self._error_response("currencyId requis", "VALIDATION_ERROR", 400)

            Currency = request.env['res.currency'].sudo()
            CurrencyRate = request.env['res.currency.rate'].sudo()

            currency = Currency.browse(int(currency_id))
            if not currency.exists():
                return self._error_response("Devise introuvable", "NOT_FOUND", 404)

            # Filtrer taux par période
            domain = [('currency_id', '=', currency.id)]
            if date_from:
                domain.append(('name', '>=', date_from))
            if date_to:
                domain.append(('name', '<=', date_to))

            rates = CurrencyRate.search(domain, order='name desc', limit=100)

            results = []
            for rate_record in rates:
                results.append({
                    'date': str(rate_record.name),
                    'rate': round(float(rate_record.rate), 6),
                    'inverseRate': round(float(rate_record.inverse_company_rate), 6) if rate_record.inverse_company_rate else None,
                    'companyId': rate_record.company_id.id if rate_record.company_id else None,
                })

            return self._success_response({
                'currency': {
                    'id': currency.id,
                    'name': currency.name,
                    'symbol': currency.symbol,
                },
                'rates': results,
            })

        except Exception as e:
            _logger.error(f"Erreur get_rates_history: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/invoices/<int:invoice_id>/set-currency', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def set_invoice_currency(self, invoice_id, **params):
        """Définir devise d'une facture (avant validation)"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            data = request.jsonrequest

            currency_id = int(data.get('currencyId'))

            if not currency_id:
                return self._error_response("currencyId requis", "VALIDATION_ERROR", 400)

            AccountMove = request.env['account.move'].sudo()
            Currency = request.env['res.currency'].sudo()

            invoice = AccountMove.browse(invoice_id)
            if not invoice.exists() or invoice.tenant_id.id != tenant_id:
                return self._error_response("Facture introuvable", "NOT_FOUND", 404)

            if invoice.state != 'draft':
                return self._error_response("Facture déjà validée (non modifiable)", "VALIDATION_ERROR", 400)

            currency = Currency.browse(currency_id)
            if not currency.exists():
                return self._error_response("Devise introuvable", "NOT_FOUND", 404)

            # Changer devise facture (recalcule automatiquement les montants)
            invoice.write({'currency_id': currency_id})

            return self._success_response({
                'invoiceId': invoice.id,
                'invoiceName': invoice.name,
                'newCurrency': currency.name,
                'newAmountTotal': float(invoice.amount_total),
            }, message=f"Devise changée vers {currency.name}")

        except Exception as e:
            _logger.error(f"Erreur set_invoice_currency: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/currencies/update-rates', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def update_currency_rates(self, **params):
        """
        Mise à jour automatique taux change depuis fournisseur externe
        Utilise service Odoo Currency Rate Update (ECB, Yahoo, etc.)
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            # Vérifier permissions admin
            if not user.has_group('base.group_system'):
                return self._error_response("Permission refusée (admin requis)", "FORBIDDEN", 403)

            # Appeler service Odoo de mise à jour taux
            try:
                Currency = request.env['res.currency'].sudo()
                currencies_to_update = Currency.search([('active', '=', True)])

                # Utiliser service natif Odoo (si configuré via Settings)
                # Note: Nécessite module currency_rate_live ou configuration manuelle
                currencies_to_update._get_rates(datetime.now().date())

                return self._success_response({
                    'updated': len(currencies_to_update),
                }, message="Taux de change mis à jour")

            except Exception as update_err:
                _logger.warning(f"Service auto-update non configuré: {update_err}")
                return self._error_response(
                    "Service mise à jour taux non configuré (installer module currency_rate_live)",
                    "SERVICE_UNAVAILABLE",
                    503
                )

        except Exception as e:
            _logger.error(f"Erreur update_currency_rates: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)
