# -*- coding: utf-8 -*-
"""
Contrôleur WebSocket pour notifications temps réel

Gère les connexions WebSocket et la diffusion d'events :
- invoice.created : Nouvelle facture créée
- invoice.validated : Facture validée (draft → posted)
- invoice.paid : Paiement reçu
- invoice.overdue : Facture en retard (détection quotidienne)
- stock.low : Stock faible
- order.new : Nouvelle commande
"""

import logging
import json
from collections import defaultdict
from threading import Lock

from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)

# Stockage en mémoire des connexions WebSocket actives
# Structure: {tenant_id: {user_id: [connections]}}
_active_connections = defaultdict(lambda: defaultdict(list))
_connections_lock = Lock()


class WebSocketController(http.Controller):
    """
    Contrôleur WebSocket pour notifications temps réel

    Note: Odoo n'a pas de support natif WebSocket avancé.
    Cette implémentation utilise HTTP long-polling simulant WebSocket.
    Pour production, utiliser Nginx + WebSocket proxy ou solution externe.
    """

    @http.route('/websocket/connect', type='json', auth='public', methods=['POST'], csrf=False)
    def ws_connect(self, **params):
        """
        Simule connexion WebSocket via long-polling

        Body:
        {
          "session_id": "uuid"
        }

        Returns:
        {
          "success": true,
          "connection_id": "conn_xxx",
          "channels": ["notifications", "invoices"]
        }
        """
        try:
            user = self._authenticate()
            if not user:
                return {'success': False, 'error': 'Unauthorized'}

            session_id = params.get('session_id')
            if not session_id:
                return {'success': False, 'error': 'session_id required'}

            # Créer connexion
            connection_id = f"conn_{session_id[:12]}"

            with _connections_lock:
                tenant_id = user.tenant_id.id
                user_id = user.id

                # Ajouter connexion
                _active_connections[tenant_id][user_id].append({
                    'connection_id': connection_id,
                    'session_id': session_id,
                    'user_id': user_id,
                    'tenant_id': tenant_id,
                })

            _logger.info(f"[WS] User {user.login} connected (tenant {user.tenant_id.name})")

            return {
                'success': True,
                'connection_id': connection_id,
                'channels': ['notifications', 'invoices', 'orders', 'stock'],
            }

        except Exception as e:
            _logger.error(f"[WS] Connect error: {e}", exc_info=True)
            return {'success': False, 'error': str(e)}

    @http.route('/websocket/disconnect', type='json', auth='public', methods=['POST'], csrf=False)
    def ws_disconnect(self, **params):
        """
        Déconnexion WebSocket

        Body:
        {
          "connection_id": "conn_xxx"
        }
        """
        try:
            connection_id = params.get('connection_id')
            if not connection_id:
                return {'success': False, 'error': 'connection_id required'}

            with _connections_lock:
                for tenant_id, users in _active_connections.items():
                    for user_id, connections in users.items():
                        _active_connections[tenant_id][user_id] = [
                            c for c in connections if c['connection_id'] != connection_id
                        ]

            _logger.info(f"[WS] Connection {connection_id} disconnected")

            return {'success': True}

        except Exception as e:
            _logger.error(f"[WS] Disconnect error: {e}", exc_info=True)
            return {'success': False, 'error': str(e)}

    @http.route('/websocket/poll', type='json', auth='public', methods=['POST'], csrf=False)
    def ws_poll(self, **params):
        """
        Long-polling pour recevoir messages

        Body:
        {
          "connection_id": "conn_xxx",
          "last_message_id": 123  // optionnel
        }

        Returns:
        {
          "success": true,
          "messages": [
            {
              "id": 124,
              "channel": "invoices",
              "event": "invoice.created",
              "data": {...},
              "timestamp": "2026-02-04T23:30:00Z"
            }
          ]
        }
        """
        try:
            user = self._authenticate()
            if not user:
                return {'success': False, 'error': 'Unauthorized'}

            connection_id = params.get('connection_id')
            last_message_id = params.get('last_message_id', 0)

            # TODO: Implémenter file de messages par connexion
            # Pour l'instant, retourne vide (implémentation basique)

            return {
                'success': True,
                'messages': [],
            }

        except Exception as e:
            _logger.error(f"[WS] Poll error: {e}", exc_info=True)
            return {'success': False, 'error': str(e)}

    def _authenticate(self):
        """Authentifier via header Authorization"""
        auth_header = request.httprequest.headers.get('Authorization', '')

        if not auth_header.startswith('Bearer '):
            return None

        token = auth_header.replace('Bearer ', '')

        # Chercher le token
        AuthToken = request.env['quelyos.auth_token'].sudo()
        token_record = AuthToken.search([('token', '=', token), ('is_active', '=', True)], limit=1)

        if not token_record:
            return None

        # Vérifier expiration
        if not token_record.is_valid():
            return None

        return token_record.user_id


def broadcast_event(tenant_id, channel, event, data):
    """
    Diffuser un event à tous les utilisateurs connectés d'un tenant

    Args:
        tenant_id (int): ID du tenant
        channel (str): Channel de diffusion ('invoices', 'orders', 'stock', 'notifications')
        event (str): Type d'event ('invoice.created', 'invoice.paid', etc.)
        data (dict): Données de l'event

    Usage:
        broadcast_event(
            tenant_id=1,
            channel='invoices',
            event='invoice.created',
            data={'invoice_id': 42, 'number': 'INV/2026/0042', 'amount': 1500.0}
        )
    """
    try:
        with _connections_lock:
            if tenant_id not in _active_connections:
                _logger.debug(f"[WS] No connections for tenant {tenant_id}")
                return

            # Construire message
            message = {
                'channel': channel,
                'event': event,
                'data': data,
                'timestamp': http.request.env.cr.now().isoformat() if http.request else None,
            }

            # Envoyer à tous les utilisateurs du tenant
            user_count = len(_active_connections[tenant_id])
            _logger.info(f"[WS] Broadcasting {event} to {user_count} users (tenant {tenant_id})")

            # TODO: Implémenter file de messages persistante
            # Pour l'instant, log uniquement (implémentation basique)
            _logger.debug(f"[WS] Message: {json.dumps(message)}")

    except Exception as e:
        _logger.error(f"[WS] Broadcast error: {e}", exc_info=True)


def notify_invoice_created(invoice):
    """
    Notifier création facture

    Args:
        invoice (account.move): Enregistrement facture
    """
    broadcast_event(
        tenant_id=invoice.tenant_id.id,
        channel='invoices',
        event='invoice.created',
        data={
            'invoice_id': invoice.id,
            'number': invoice.name,
            'partner_name': invoice.partner_id.name,
            'amount_total': invoice.amount_total,
            'currency': invoice.currency_id.name,
            'state': invoice.state,
        }
    )


def notify_invoice_validated(invoice):
    """
    Notifier validation facture (draft → posted)

    Args:
        invoice (account.move): Enregistrement facture
    """
    broadcast_event(
        tenant_id=invoice.tenant_id.id,
        channel='invoices',
        event='invoice.validated',
        data={
            'invoice_id': invoice.id,
            'number': invoice.name,
            'partner_name': invoice.partner_id.name,
            'amount_total': invoice.amount_total,
            'currency': invoice.currency_id.name,
        }
    )


def notify_invoice_paid(invoice):
    """
    Notifier paiement facture

    Args:
        invoice (account.move): Enregistrement facture
    """
    broadcast_event(
        tenant_id=invoice.tenant_id.id,
        channel='invoices',
        event='invoice.paid',
        data={
            'invoice_id': invoice.id,
            'number': invoice.name,
            'partner_name': invoice.partner_id.name,
            'amount_total': invoice.amount_total,
            'currency': invoice.currency_id.name,
        }
    )


def notify_invoice_overdue(invoice):
    """
    Notifier facture en retard

    Args:
        invoice (account.move): Enregistrement facture
    """
    broadcast_event(
        tenant_id=invoice.tenant_id.id,
        channel='invoices',
        event='invoice.overdue',
        data={
            'invoice_id': invoice.id,
            'number': invoice.name,
            'partner_name': invoice.partner_id.name,
            'amount_residual': invoice.amount_residual,
            'currency': invoice.currency_id.name,
            'invoice_date_due': invoice.invoice_date_due.isoformat() if invoice.invoice_date_due else None,
            'days_overdue': (http.request.env.cr.now().date() - invoice.invoice_date_due).days if invoice.invoice_date_due else 0,
        }
    )
