# -*- coding: utf-8 -*-
"""
WebSocket Server pour Quelyos ERP

Serveur WebSocket pour communication temps réel:
- Notifications push
- Mises à jour de stock en temps réel
- Notifications de nouvelles commandes
- Présence utilisateur

Compatible avec l'infrastructure Odoo existante.
"""

import json
import logging
import asyncio
from typing import Dict, Set, Optional, Any
from datetime import datetime
import threading
import os

_logger = logging.getLogger(__name__)

# Configuration
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
WS_CHANNEL_PREFIX = 'quelyos:ws:'


# =============================================================================
# MESSAGE TYPES
# =============================================================================

class WSMessageType:
    """Types de messages WebSocket"""
    SUBSCRIBE = 'subscribe'
    UNSUBSCRIBE = 'unsubscribe'
    PUBLISH = 'publish'
    NOTIFICATION = 'notification'
    UPDATE = 'update'
    PING = 'ping'
    PONG = 'pong'


# =============================================================================
# PUBSUB MANAGER (Redis-based)
# =============================================================================

class PubSubManager:
    """
    Gestionnaire Pub/Sub basé sur Redis.

    Permet la communication entre plusieurs instances du serveur.
    """

    def __init__(self):
        self._redis = None
        self._pubsub = None
        self._subscribers: Dict[str, Set[callable]] = {}
        self._init_redis()

    def _init_redis(self):
        """Initialise la connexion Redis"""
        try:
            import redis
            self._redis = redis.from_url(REDIS_URL)
            self._pubsub = self._redis.pubsub()
            _logger.info("WebSocket PubSub connected to Redis")
        except Exception as e:
            _logger.warning(f"Redis not available for WebSocket PubSub: {e}")

    def subscribe(self, channel: str, callback: callable):
        """S'abonne à un channel"""
        full_channel = f"{WS_CHANNEL_PREFIX}{channel}"

        if channel not in self._subscribers:
            self._subscribers[channel] = set()

            # S'abonner sur Redis si disponible
            if self._pubsub:
                self._pubsub.subscribe(full_channel)

        self._subscribers[channel].add(callback)
        _logger.debug(f"Subscribed to channel: {channel}")

    def unsubscribe(self, channel: str, callback: callable):
        """Se désabonne d'un channel"""
        if channel in self._subscribers:
            self._subscribers[channel].discard(callback)

            if not self._subscribers[channel]:
                del self._subscribers[channel]

                # Se désabonner de Redis
                if self._pubsub:
                    self._pubsub.unsubscribe(f"{WS_CHANNEL_PREFIX}{channel}")

    def publish(self, channel: str, message: dict):
        """Publie un message sur un channel"""
        full_channel = f"{WS_CHANNEL_PREFIX}{channel}"

        # Publier localement
        if channel in self._subscribers:
            for callback in self._subscribers[channel]:
                try:
                    callback(message)
                except Exception as e:
                    _logger.error(f"Callback error on {channel}: {e}")

        # Publier via Redis pour les autres instances
        if self._redis:
            try:
                self._redis.publish(full_channel, json.dumps(message))
            except Exception as e:
                _logger.error(f"Redis publish error: {e}")


# Singleton
_pubsub_manager = None


def get_pubsub() -> PubSubManager:
    """Retourne le gestionnaire PubSub singleton"""
    global _pubsub_manager
    if _pubsub_manager is None:
        _pubsub_manager = PubSubManager()
    return _pubsub_manager


# =============================================================================
# NOTIFICATION SERVICE
# =============================================================================

class NotificationService:
    """
    Service de notifications temps réel.

    Usage:
        notifications = NotificationService()

        # Envoyer une notification à tous
        notifications.broadcast('New product available!')

        # Envoyer à un utilisateur spécifique
        notifications.send_to_user(user_id, 'Your order has shipped!')

        # Envoyer à un groupe
        notifications.send_to_group('admins', 'New order received')
    """

    def __init__(self):
        self._pubsub = get_pubsub()

    def broadcast(
        self,
        message: str,
        type: str = 'info',
        data: Optional[dict] = None
    ):
        """Envoie une notification à tous les utilisateurs connectés"""
        notification = {
            'type': WSMessageType.NOTIFICATION,
            'event': 'broadcast',
            'data': {
                'message': message,
                'type': type,
                'extra': data,
                'timestamp': datetime.utcnow().isoformat(),
            }
        }
        self._pubsub.publish('notifications', notification)

    def send_to_user(
        self,
        user_id: int,
        message: str,
        type: str = 'info',
        data: Optional[dict] = None
    ):
        """Envoie une notification à un utilisateur spécifique"""
        notification = {
            'type': WSMessageType.NOTIFICATION,
            'event': 'personal',
            'data': {
                'message': message,
                'type': type,
                'extra': data,
                'timestamp': datetime.utcnow().isoformat(),
            }
        }
        self._pubsub.publish(f'user:{user_id}', notification)

    def send_to_group(
        self,
        group: str,
        message: str,
        type: str = 'info',
        data: Optional[dict] = None
    ):
        """Envoie une notification à un groupe"""
        notification = {
            'type': WSMessageType.NOTIFICATION,
            'event': 'group',
            'data': {
                'message': message,
                'type': type,
                'group': group,
                'extra': data,
                'timestamp': datetime.utcnow().isoformat(),
            }
        }
        self._pubsub.publish(f'group:{group}', notification)


# Singleton
_notification_service = None


def get_notification_service() -> NotificationService:
    """Retourne le service de notifications singleton"""
    global _notification_service
    if _notification_service is None:
        _notification_service = NotificationService()
    return _notification_service


# =============================================================================
# REAL-TIME UPDATES
# =============================================================================

def publish_stock_update(product_id: int, quantity: float, warehouse_id: int = None):
    """Publie une mise à jour de stock en temps réel"""
    pubsub = get_pubsub()
    pubsub.publish('stock', {
        'type': WSMessageType.UPDATE,
        'event': 'stock_change',
        'data': {
            'product_id': product_id,
            'quantity': quantity,
            'warehouse_id': warehouse_id,
            'timestamp': datetime.utcnow().isoformat(),
        }
    })


def publish_order_update(order_id: int, status: str, user_id: int = None):
    """Publie une mise à jour de commande en temps réel"""
    pubsub = get_pubsub()

    # Broadcast sur le channel orders
    pubsub.publish('orders', {
        'type': WSMessageType.UPDATE,
        'event': 'order_status',
        'data': {
            'order_id': order_id,
            'status': status,
            'timestamp': datetime.utcnow().isoformat(),
        }
    })

    # Notifier l'utilisateur concerné
    if user_id:
        notifications = get_notification_service()
        notifications.send_to_user(
            user_id,
            f'Votre commande #{order_id} est maintenant: {status}',
            type='order',
            data={'order_id': order_id, 'status': status}
        )


def publish_new_order(order_data: dict):
    """Publie une nouvelle commande (pour les admins)"""
    pubsub = get_pubsub()
    pubsub.publish('orders', {
        'type': WSMessageType.UPDATE,
        'event': 'new_order',
        'data': {
            'order_id': order_data.get('id'),
            'customer': order_data.get('customer_name'),
            'total': order_data.get('total'),
            'timestamp': datetime.utcnow().isoformat(),
        }
    })

    # Notifier les admins
    notifications = get_notification_service()
    notifications.send_to_group(
        'admins',
        f"Nouvelle commande de {order_data.get('customer_name')}",
        type='success',
        data=order_data
    )


def publish_price_update(product_id: int, new_price: float):
    """Publie une mise à jour de prix"""
    pubsub = get_pubsub()
    pubsub.publish('products', {
        'type': WSMessageType.UPDATE,
        'event': 'price_change',
        'data': {
            'product_id': product_id,
            'price': new_price,
            'timestamp': datetime.utcnow().isoformat(),
        }
    })


# =============================================================================
# DÉCORATEUR POUR TRIGGERS AUTOMATIQUES
# =============================================================================

def realtime_update(channel: str, event: str):
    """
    Décorateur pour publier automatiquement les updates.

    Usage:
        @realtime_update('products', 'updated')
        def write(self, vals):
            result = super().write(vals)
            return result
    """
    def decorator(func):
        def wrapper(self, *args, **kwargs):
            result = func(self, *args, **kwargs)

            # Publier l'update
            pubsub = get_pubsub()
            pubsub.publish(channel, {
                'type': WSMessageType.UPDATE,
                'event': event,
                'data': {
                    'model': self._name if hasattr(self, '_name') else None,
                    'ids': self.ids if hasattr(self, 'ids') else None,
                    'timestamp': datetime.utcnow().isoformat(),
                }
            })

            return result
        return wrapper
    return decorator
