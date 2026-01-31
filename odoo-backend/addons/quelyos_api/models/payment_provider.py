# -*- coding: utf-8 -*-
import hmac
import hashlib
import json
import requests
from odoo import models, fields, api, _
from odoo.exceptions import UserError, ValidationError


class PaymentProvider(models.Model):
    _inherit = 'payment.provider'

    x_code = fields.Selection(
        selection_add=[
            ('flouci', 'Flouci'),
            ('konnect', 'Konnect')
        ],
        ondelete={'flouci': 'set default', 'konnect': 'set default'}
    )

    # Flouci specific fields
    x_flouci_app_token = fields.Char(
        string='Flouci App Token',
        groups='base.group_system',
        help='API Token from Flouci dashboard'
    )
    x_flouci_app_secret = fields.Char(
        string='Flouci App Secret',
        groups='base.group_system',
        help='API Secret for webhook signature validation'
    )
    x_flouci_timeout = fields.Integer(
        string='Payment Timeout (minutes)',
        default=60,
        help='Payment session timeout in minutes'
    )
    x_flouci_accept_cards = fields.Boolean(
        string='Accept Credit Cards',
        default=True,
        help='Allow customers to pay with credit/debit cards'
    )

    # Konnect specific fields
    x_konnect_api_key = fields.Char(
        string='Konnect API Key',
        groups='base.group_system',
        help='API Key from Konnect dashboard'
    )
    x_konnect_wallet_id = fields.Char(
        string='Konnect Wallet ID',
        groups='base.group_system',
        help='Your Konnect wallet identifier'
    )
    x_konnect_lifespan = fields.Integer(
        string='Payment Link Lifespan (minutes)',
        default=10,
        help='Payment link expiration time in minutes'
    )
    x_konnect_theme = fields.Selection(
        [('light', 'Light'), ('dark', 'Dark')],
        string='Checkout Theme',
        default='light',
        help='Visual theme for Konnect checkout page'
    )

    @api.constrains('flouci_app_token', 'flouci_app_secret')
    def _check_flouci_credentials(self):
        """Validate Flouci credentials format"""
        for provider in self:
            if provider.x_code == 'flouci' and provider.state != 'disabled':
                if not provider.x_flouci_app_token or not provider.x_flouci_app_secret:
                    raise ValidationError(_('Flouci App Token and Secret are required when provider is enabled.'))

    @api.constrains('konnect_api_key', 'konnect_wallet_id')
    def _check_konnect_credentials(self):
        """Validate Konnect credentials format"""
        for provider in self:
            if provider.x_code == 'konnect' and provider.state != 'disabled':
                if not provider.x_konnect_api_key or not provider.x_konnect_wallet_id:
                    raise ValidationError(_('Konnect API Key and Wallet ID are required when provider is enabled.'))

    def _flouci_get_api_url(self):
        """Get Flouci API endpoint based on state (test/enabled)"""
        self.ensure_one()
        if self.state == 'test':
            return 'https://developers.flouci.com/api'
        return 'https://api.flouci.com/api'

    def _konnect_get_api_url(self):
        """Get Konnect API endpoint based on state (test/enabled)"""
        self.ensure_one()
        if self.state == 'test':
            return 'https://api.preprod.konnect.network/api/v2'
        return 'https://api.konnect.network/api/v2'

    def _flouci_initiate_payment(self, amount, currency, reference, return_url):
        """
        Initiate Flouci payment session

        :param amount: Payment amount
        :param currency: Currency code (should be TND for Flouci)
        :param reference: Unique transaction reference
        :param return_url: URL to redirect after payment
        :return: dict with payment_url and payment_id
        """
        self.ensure_one()

        if currency.name != 'TND':
            raise UserError(_('Flouci only accepts TND currency.'))

        api_url = self._flouci_get_api_url()

        payload = {
            'app_token': self.x_flouci_app_token,
            'app_secret': self.x_flouci_app_secret,
            'amount': int(amount * 1000),  # Convert to millimes
            'accept_card': 'true' if self.x_flouci_accept_cards else 'false',
            'session_timeout_secs': self.x_flouci_timeout * 60,
            'success_link': f'{return_url}?status=success',
            'fail_link': f'{return_url}?status=fail',
            'developer_tracking_id': reference,
        }

        try:
            response = requests.post(
                f'{api_url}/generate_payment',
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            data = response.json()

            if data.get('result', {}).get('success'):
                return {
                    'payment_url': data['result']['link'],
                    'payment_id': data['result']['payment_id'],
                }
            else:
                raise UserError(_('Flouci payment initialization failed: %s') % data.get('result', {}).get('message', 'Unknown error'))

        except requests.exceptions.RequestException as e:
            raise UserError(_('Flouci API connection error: %s') % str(e))

    def _konnect_initiate_payment(self, amount, currency, reference, return_url, customer_data):
        """
        Initiate Konnect payment session

        :param amount: Payment amount
        :param currency: Currency code (should be TND for Konnect)
        :param reference: Unique transaction reference
        :param return_url: URL to redirect after payment
        :param customer_data: dict with customer info (firstName, lastName, email, phoneNumber)
        :return: dict with payment_url and payment_ref
        """
        self.ensure_one()

        if currency.name != 'TND':
            raise UserError(_('Konnect only accepts TND currency.'))

        api_url = self._konnect_get_api_url()

        payload = {
            'receiverWalletId': self.x_konnect_wallet_id,
            'token': self.x_konnect_api_key,
            'amount': int(amount * 1000),  # Convert to millimes
            'type': 'immediate',
            'description': f'Order {reference}',
            'acceptedPaymentMethods': ['wallet', 'bank_card', 'd17'],
            'lifespan': self.x_konnect_lifespan,
            'checkoutForm': True,
            'addPaymentFeesToAmount': True,
            'firstName': customer_data.get('firstName', ''),
            'lastName': customer_data.get('lastName', ''),
            'phoneNumber': customer_data.get('phoneNumber', ''),
            'email': customer_data.get('email', ''),
            'orderId': reference,
            'webhook': f'{return_url.split("/checkout")[0]}/api/payment/konnect/webhook',
            'silentWebhook': True,
            'successUrl': f'{return_url}?status=success',
            'failUrl': f'{return_url}?status=fail',
            'theme': self.x_konnect_theme,
        }

        try:
            response = requests.post(
                f'{api_url}/payments/init-payment',
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            data = response.json()

            if data.get('payUrl'):
                return {
                    'payment_url': data['payUrl'],
                    'payment_ref': data.get('paymentRef'),
                }
            else:
                raise UserError(_('Konnect payment initialization failed: %s') % data.get('message', 'Unknown error'))

        except requests.exceptions.RequestException as e:
            raise UserError(_('Konnect API connection error: %s') % str(e))

    def _flouci_validate_webhook_signature(self, payload, signature):
        """
        Validate Flouci webhook signature using HMAC SHA256

        :param payload: Webhook JSON payload
        :param signature: Signature from webhook header
        :return: True if valid, False otherwise
        """
        self.ensure_one()

        expected_signature = hmac.new(
            self.x_flouci_app_secret.encode('utf-8'),
            json.dumps(payload, separators=(',', ':')).encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(expected_signature, signature)

    def _konnect_validate_webhook_signature(self, payload, signature):
        """
        Validate Konnect webhook signature using HMAC SHA256

        :param payload: Webhook JSON payload
        :param signature: Signature from webhook header
        :return: True if valid, False otherwise
        """
        self.ensure_one()

        expected_signature = hmac.new(
            self.x_konnect_api_key.encode('utf-8'),
            json.dumps(payload, sort_keys=True, separators=(',', ':')).encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(expected_signature, signature)

    def test_connection(self):
        """
        Test API connection for Flouci/Konnect

        :return: dict with success status and message
        """
        self.ensure_one()

        if self.x_code == 'flouci':
            return self._test_flouci_connection()
        elif self.x_code == 'konnect':
            return self._test_konnect_connection()
        else:
            return super().test_connection()

    def _test_flouci_connection(self):
        """Test Flouci API connectivity"""
        self.ensure_one()

        try:
            api_url = self._flouci_get_api_url()
            response = requests.get(f'{api_url}/verify_payment/test', timeout=10)

            if response.status_code in [200, 404]:  # 404 is expected for test payment
                return {
                    'success': True,
                    'message': _('Flouci API connection successful')
                }
            else:
                return {
                    'success': False,
                    'message': _('Flouci API returned status %s') % response.status_code
                }
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'message': _('Connection error: %s') % str(e)
            }

    def _test_konnect_connection(self):
        """Test Konnect API connectivity"""
        self.ensure_one()

        try:
            api_url = self._konnect_get_api_url()
            # Try to get wallet info as connection test
            headers = {'Authorization': f'Bearer {self.x_konnect_api_key}'}
            response = requests.get(f'{api_url}/payments/wallet-info', headers=headers, timeout=10)

            if response.status_code == 200:
                return {
                    'success': True,
                    'message': _('Konnect API connection successful')
                }
            else:
                return {
                    'success': False,
                    'message': _('Konnect API returned status %s') % response.status_code
                }
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'message': _('Connection error: %s') % str(e)
            }

    def to_frontend_config(self):
        """
        Convert provider to frontend-friendly format (camelCase)

        :return: dict with provider configuration for dashboard
        """
        self.ensure_one()

        config = {
            'id': self.id,
            'x_code': self.x_code,
            'name': self.name,
            'state': self.state,
            'imageUrl': f'/web/image/payment.provider/{self.id}/image_128' if self.image_128 else None,
        }

        if self.x_code == 'flouci':
            config.update({
                'appToken': self.x_flouci_app_token if self.env.user.has_group('base.group_system') else '***',
                'appSecret': '***',  # Never expose secret
                'timeout': self.x_flouci_timeout,
                'acceptCards': self.x_flouci_accept_cards,
            })
        elif self.x_code == 'konnect':
            config.update({
                'apiKey': '***',  # Never expose API key
                'walletId': self.x_konnect_wallet_id,
                'lifespan': self.x_konnect_lifespan,
                'theme': self.x_konnect_theme,
            })

        return config
