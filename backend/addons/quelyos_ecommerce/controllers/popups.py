# -*- coding: utf-8 -*-
"""
Marketing Popups Controller
Provides endpoints for popup campaigns
"""

import logging
from odoo import http
from odoo.http import request
from .base_controller import BaseEcommerceController

_logger = logging.getLogger(__name__)


class PopupsController(BaseEcommerceController):
    """Controller for marketing popups"""

    @http.route('/api/ecommerce/popups/active', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_active_popup(self, page_url=None):
        """
        Get active popup campaign for current page

        Args:
            page_url: Current page URL (optional, for targeting)

        Returns:
            dict: Active popup campaign or null
        """
        try:
            campaign = request.env['popup.campaign'].sudo().get_active_campaign(page_url=page_url)

            if not campaign:
                return self._success_response({'popup': None})

            # Increment view count
            campaign.increment_views()

            return self._success_response({
                'popup': campaign.get_api_data()
            })

        except Exception as e:
            _logger.error(f"Error getting active popup: {str(e)}")
            return self._error_response(str(e), 500)

    @http.route('/api/ecommerce/popups/<int:popup_id>/click', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def track_popup_click(self, popup_id):
        """
        Track popup CTA click

        Args:
            popup_id: Popup campaign ID

        Returns:
            dict: Success response
        """
        try:
            campaign = request.env['popup.campaign'].sudo().browse(popup_id)

            if not campaign.exists():
                return self._error_response("Popup not found", 404)

            # Increment click count
            campaign.increment_clicks()

            return self._success_response({
                'success': True,
                'message': 'Click tracked'
            })

        except Exception as e:
            _logger.error(f"Error tracking popup click: {str(e)}")
            return self._error_response(str(e), 500)
