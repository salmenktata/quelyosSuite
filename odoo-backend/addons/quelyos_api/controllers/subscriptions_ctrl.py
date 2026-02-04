# -*- coding: utf-8 -*-
import json
import logging
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)


class SubscriptionsController(http.Controller):
    """
    Contrôleur Abonnements Récurrents
    Gestion subscriptions avec facturation automatique périodique
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

    @http.route('/api/finance/subscriptions', type='json', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_subscriptions(self, **params):
        """Liste abonnements client avec statut, période, prochain renouvellement"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            SaleSubscription = request.env['sale.subscription'].sudo()

            # Filtres
            customer_id = params.get('customerId')
            status = params.get('status')  # 'active', 'pending', 'closed', 'cancelled'

            domain = [('tenant_id', '=', tenant_id)]
            if customer_id:
                domain.append(('partner_id', '=', int(customer_id)))
            if status:
                if status == 'active':
                    domain.append(('stage_id.category', '=', 'progress'))
                elif status == 'closed':
                    domain.append(('stage_id.category', '=', 'closed'))

            subscriptions = SaleSubscription.search(domain, order='date_start desc', limit=100)

            results = []
            for sub in subscriptions:
                # Calculer prochain renouvellement
                next_renewal = None
                if sub.recurring_next_date:
                    next_renewal = str(sub.recurring_next_date)

                results.append({
                    'id': sub.id,
                    'name': sub.name,
                    'code': sub.code,
                    'customer': {
                        'id': sub.partner_id.id,
                        'name': sub.partner_id.name,
                        'email': sub.partner_id.email,
                    },
                    'startDate': str(sub.date_start) if sub.date_start else None,
                    'endDate': str(sub.date) if sub.date else None,
                    'nextRenewal': next_renewal,
                    'recurringInterval': sub.recurring_interval,
                    'recurringRule': sub.recurring_rule_type,  # 'daily', 'weekly', 'monthly', 'yearly'
                    'recurringAmount': float(sub.recurring_total),
                    'status': sub.stage_id.category if sub.stage_id else 'draft',
                    'stageName': sub.stage_id.name if sub.stage_id else 'Nouveau',
                    'template': {
                        'id': sub.template_id.id if sub.template_id else None,
                        'name': sub.template_id.name if sub.template_id else None,
                    },
                })

            return self._success_response({'subscriptions': results, 'total': len(results)})

        except Exception as e:
            _logger.error(f"Erreur get_subscriptions: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/subscriptions/create', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def create_subscription(self, **params):
        """Créer abonnement client avec facturation récurrente"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            data = request.jsonrequest

            # Données requises
            customer_id = data.get('customerId')
            template_id = data.get('templateId')  # Optionnel si lignes fournies
            recurring_rule = data.get('recurringRule', 'monthly')  # daily, weekly, monthly, yearly
            recurring_interval = data.get('recurringInterval', 1)

            if not customer_id:
                return self._error_response("customerId requis", "VALIDATION_ERROR", 400)

            SaleSubscription = request.env['sale.subscription'].sudo()
            Partner = request.env['res.partner'].sudo()

            partner = Partner.browse(int(customer_id))
            if not partner.exists() or partner.tenant_id.id != tenant_id:
                return self._error_response("Client introuvable", "NOT_FOUND", 404)

            # Calculer date prochain renouvellement
            start_date = data.get('startDate') or datetime.now().date()
            if recurring_rule == 'monthly':
                next_date = start_date + relativedelta(months=recurring_interval)
            elif recurring_rule == 'yearly':
                next_date = start_date + relativedelta(years=recurring_interval)
            elif recurring_rule == 'weekly':
                next_date = start_date + timedelta(weeks=recurring_interval)
            else:  # daily
                next_date = start_date + timedelta(days=recurring_interval)

            # Valeurs subscription
            sub_vals = {
                'partner_id': partner.id,
                'tenant_id': tenant_id,
                'date_start': start_date,
                'recurring_rule_type': recurring_rule,
                'recurring_interval': recurring_interval,
                'recurring_next_date': next_date,
            }

            # Template ou lignes manuelles
            if template_id:
                sub_vals['template_id'] = int(template_id)

            subscription = SaleSubscription.create(sub_vals)

            # Ajouter lignes si fournies (et pas de template)
            if not template_id:
                lines_data = data.get('lines', [])
                for line in lines_data:
                    subscription.write({
                        'recurring_invoice_line_ids': [(0, 0, {
                            'product_id': line.get('productId'),
                            'name': line.get('description', ''),
                            'quantity': line.get('quantity', 1.0),
                            'price_unit': line.get('unitPrice', 0.0),
                        })]
                    })

            return self._success_response({
                'subscription': {
                    'id': subscription.id,
                    'name': subscription.name,
                    'code': subscription.code,
                    'nextRenewal': str(subscription.recurring_next_date),
                    'recurringAmount': float(subscription.recurring_total),
                }
            }, message="Abonnement créé avec succès")

        except Exception as e:
            _logger.error(f"Erreur create_subscription: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/subscriptions/<int:subscription_id>', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def get_subscription_detail(self, subscription_id, **params):
        """Détail abonnement avec historique factures générées"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            SaleSubscription = request.env['sale.subscription'].sudo()

            subscription = SaleSubscription.browse(subscription_id)
            if not subscription.exists() or subscription.tenant_id.id != tenant_id:
                return self._error_response("Abonnement introuvable", "NOT_FOUND", 404)

            # Historique factures liées
            invoices_data = []
            for invoice in subscription.invoice_ids:
                invoices_data.append({
                    'id': invoice.id,
                    'name': invoice.name,
                    'invoiceDate': str(invoice.invoice_date),
                    'amountTotal': float(invoice.amount_total),
                    'state': invoice.state,
                    'paymentState': invoice.payment_state,
                })

            # Lignes abonnement
            lines_data = []
            for line in subscription.recurring_invoice_line_ids:
                lines_data.append({
                    'product': {
                        'id': line.product_id.id if line.product_id else None,
                        'name': line.product_id.name if line.product_id else line.name,
                    },
                    'description': line.name,
                    'quantity': float(line.quantity),
                    'unitPrice': float(line.price_unit),
                    'subtotal': float(line.price_subtotal),
                })

            return self._success_response({
                'subscription': {
                    'id': subscription.id,
                    'name': subscription.name,
                    'code': subscription.code,
                    'customer': {
                        'id': subscription.partner_id.id,
                        'name': subscription.partner_id.name,
                        'email': subscription.partner_id.email,
                    },
                    'startDate': str(subscription.date_start) if subscription.date_start else None,
                    'endDate': str(subscription.date) if subscription.date else None,
                    'nextRenewal': str(subscription.recurring_next_date) if subscription.recurring_next_date else None,
                    'recurringInterval': subscription.recurring_interval,
                    'recurringRule': subscription.recurring_rule_type,
                    'recurringAmount': float(subscription.recurring_total),
                    'status': subscription.stage_id.category if subscription.stage_id else 'draft',
                    'lines': lines_data,
                    'invoices': invoices_data,
                }
            })

        except Exception as e:
            _logger.error(f"Erreur get_subscription_detail: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/subscriptions/<int:subscription_id>/cancel', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def cancel_subscription(self, subscription_id, **params):
        """Annuler abonnement (stoppe facturation future)"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            SaleSubscription = request.env['sale.subscription'].sudo()

            subscription = SaleSubscription.browse(subscription_id)
            if not subscription.exists() or subscription.tenant_id.id != tenant_id:
                return self._error_response("Abonnement introuvable", "NOT_FOUND", 404)

            # Chercher stage "Cancelled" ou "Closed"
            SubscriptionStage = request.env['sale.subscription.stage'].sudo()
            closed_stage = SubscriptionStage.search([
                '|',
                ('category', '=', 'closed'),
                ('name', 'ilike', 'cancel')
            ], limit=1)

            if closed_stage:
                subscription.write({'stage_id': closed_stage.id})
            else:
                # Fallback : marquer date fin = aujourd'hui
                subscription.write({'date': datetime.now().date()})

            return self._success_response({
                'subscriptionId': subscription.id,
                'status': 'cancelled',
            }, message="Abonnement annulé")

        except Exception as e:
            _logger.error(f"Erreur cancel_subscription: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/subscriptions/<int:subscription_id>/renew-now', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def renew_subscription_now(self, subscription_id, **params):
        """Renouveler abonnement immédiatement (générer facture maintenant)"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            SaleSubscription = request.env['sale.subscription'].sudo()

            subscription = SaleSubscription.browse(subscription_id)
            if not subscription.exists() or subscription.tenant_id.id != tenant_id:
                return self._error_response("Abonnement introuvable", "NOT_FOUND", 404)

            # Générer facture récurrente
            try:
                invoice = subscription._recurring_create_invoice()
                if invoice:
                    return self._success_response({
                        'invoice': {
                            'id': invoice.id,
                            'name': invoice.name,
                            'amountTotal': float(invoice.amount_total),
                        }
                    }, message="Facture de renouvellement créée")
                else:
                    return self._error_response("Impossible de générer facture", "RENEWAL_ERROR", 500)
            except Exception as renewal_err:
                _logger.error(f"Erreur renewal: {renewal_err}")
                return self._error_response("Erreur génération facture", "RENEWAL_ERROR", 500)

        except Exception as e:
            _logger.error(f"Erreur renew_subscription_now: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)
