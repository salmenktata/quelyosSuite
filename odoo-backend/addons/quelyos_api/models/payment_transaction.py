# -*- coding: utf-8 -*-
import json
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError


class PaymentTransaction(models.Model):
    _inherit = 'payment.transaction'

    # Multi-tenant support
    tenant_id = fields.Many2one(
        'quelyos.tenant',
        string='Tenant',
        index=True,
        ondelete='cascade',
        help='Tenant propriétaire de cette transaction'
    )

    # Additional fields for Tunisian payment providers
    provider_payment_id = fields.Char(
        string='Provider Payment ID',
        help='Unique payment identifier from provider (Flouci payment_id, Konnect paymentRef)',
        readonly=True,
        index=True
    )
    provider_request_payload = fields.Text(
        string='Request Payload',
        help='JSON payload sent to payment provider for audit',
        readonly=True
    )
    provider_response_payload = fields.Text(
        string='Response Payload',
        help='JSON response received from payment provider for audit',
        readonly=True
    )
    webhook_calls_count = fields.Integer(
        string='Webhook Calls',
        default=0,
        help='Number of times webhook was called (for idempotence tracking)',
        readonly=True
    )
    last_webhook_date = fields.Datetime(
        string='Last Webhook Date',
        readonly=True
    )
    customer_phone = fields.Char(
        string='Customer Phone',
        help='Customer phone number for payment notifications'
    )

    @api.model
    def _get_tx_from_provider_reference(self, provider_code, provider_payment_id):
        """
        Find transaction by provider payment ID

        :param provider_code: Provider code (flouci, konnect)
        :param provider_payment_id: Provider's payment identifier
        :return: payment.transaction recordset
        """
        return self.search([
            ('provider_code', '=', provider_code),
            ('provider_payment_id', '=', provider_payment_id)
        ], limit=1)

    def _log_webhook_call(self):
        """Increment webhook calls counter for idempotence tracking"""
        self.ensure_one()
        self.sudo().write({
            'webhook_calls_count': self.webhook_calls_count + 1,
            'last_webhook_date': fields.Datetime.now()
        })

    def _set_pending(self):
        """Override to log state change"""
        res = super()._set_pending()
        for tx in self:
            if tx.provider_code in ['flouci', 'konnect']:
                tx._log_state_message('pending', 'Payment initiated, waiting for customer action')
        return res

    def _set_authorized(self):
        """Override to log state change"""
        res = super()._set_authorized()
        for tx in self:
            if tx.provider_code in ['flouci', 'konnect']:
                tx._log_state_message('authorized', 'Payment authorized by provider')
        return res

    def _set_done(self):
        """Override to log state change"""
        res = super()._set_done()
        for tx in self:
            if tx.provider_code in ['flouci', 'konnect']:
                tx._log_state_message('done', 'Payment completed successfully')
        return res

    def _set_canceled(self):
        """Override to log state change"""
        res = super()._set_canceled()
        for tx in self:
            if tx.provider_code in ['flouci', 'konnect']:
                tx._log_state_message('cancel', 'Payment canceled by customer or timeout')
        return res

    def _set_error(self, state_message):
        """Override to log state change"""
        res = super()._set_error(state_message)
        for tx in self:
            if tx.provider_code in ['flouci', 'konnect']:
                tx._log_state_message('error', state_message)
        return res

    def _log_state_message(self, state, message):
        """
        Log payment state change message

        :param state: New transaction state
        :param message: State change message
        """
        self.ensure_one()
        self.message_post(
            body=_('Transaction state changed to <b>%s</b>: %s') % (state, message),
            subject=_('Payment Status Update')
        )

    def _process_flouci_webhook(self, webhook_data):
        """
        Process Flouci webhook callback

        :param webhook_data: Webhook JSON data
        """
        self.ensure_one()

        # Log webhook call for idempotence
        self._log_webhook_call()

        # Store webhook response
        self.sudo().write({
            'provider_response_payload': json.dumps(webhook_data, indent=2)
        })

        # Process payment status
        payment_status = webhook_data.get('result', {}).get('status')

        if payment_status == 'SUCCESS':
            self._set_done()
        elif payment_status == 'PENDING':
            self._set_pending()
        elif payment_status in ['CANCELED', 'EXPIRED']:
            self._set_canceled()
        else:
            self._set_error(_('Unknown payment status: %s') % payment_status)

    def _process_konnect_webhook(self, webhook_data):
        """
        Process Konnect webhook callback

        :param webhook_data: Webhook JSON data
        """
        self.ensure_one()

        # Log webhook call for idempotence
        self._log_webhook_call()

        # Store webhook response
        self.sudo().write({
            'provider_response_payload': json.dumps(webhook_data, indent=2)
        })

        # Process payment status
        payment_status = webhook_data.get('payment', {}).get('status')

        if payment_status == 'completed':
            self._set_done()
        elif payment_status == 'pending':
            self._set_pending()
        elif payment_status in ['cancelled', 'failed', 'expired']:
            self._set_canceled()
        else:
            self._set_error(_('Unknown payment status: %s') % payment_status)

    def to_frontend_config(self):
        """
        Convert transaction to frontend-friendly format (camelCase)

        :return: dict with transaction data for dashboard/checkout
        """
        self.ensure_one()

        return {
            'id': self.id,
            'reference': self.reference,
            'amount': self.amount,
            'currency': self.currency_id.name,
            'state': self.state,
            'providerCode': self.provider_code,
            'providerName': self.provider_id.name,
            'providerPaymentId': self.provider_payment_id,
            'webhookCallsCount': self.webhook_calls_count,
            'lastWebhookDate': self.last_webhook_date.isoformat() if self.last_webhook_date else None,
            'createdAt': self.create_date.isoformat() if self.create_date else None,
            'updatedAt': self.write_date.isoformat() if self.write_date else None,
            'stateMessage': self.state_message,
        }

    @api.model
    def create(self, vals):
        """Override to store request payload if provided"""
        if 'provider_request_payload' in vals and isinstance(vals['provider_request_payload'], dict):
            vals['provider_request_payload'] = json.dumps(vals['provider_request_payload'], indent=2)

        return super().create(vals)

    def write(self, vals):
        """Override to store request/response payload if provided as dict"""
        if 'provider_request_payload' in vals and isinstance(vals['provider_request_payload'], dict):
            vals['provider_request_payload'] = json.dumps(vals['provider_request_payload'], indent=2)

        if 'provider_response_payload' in vals and isinstance(vals['provider_response_payload'], dict):
            vals['provider_response_payload'] = json.dumps(vals['provider_response_payload'], indent=2)

        return super().write(vals)
