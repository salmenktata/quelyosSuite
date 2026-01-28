# -*- coding: utf-8 -*-
"""
Event Sourcing pour Quelyos ERP

Stockage et replay des événements métier:
- Historique complet des changements
- Reconstruction d'état
- Audit trail immuable
- Projections personnalisées
"""

import json
import logging
import uuid
from typing import Dict, Any, List, Optional, Callable
from datetime import datetime
from dataclasses import dataclass, asdict
from enum import Enum

_logger = logging.getLogger(__name__)


# =============================================================================
# EVENT TYPES
# =============================================================================

class EventType(Enum):
    """Types d'événements métier"""
    # Orders
    ORDER_CREATED = 'order.created'
    ORDER_CONFIRMED = 'order.confirmed'
    ORDER_SHIPPED = 'order.shipped'
    ORDER_DELIVERED = 'order.delivered'
    ORDER_CANCELLED = 'order.cancelled'
    ORDER_REFUNDED = 'order.refunded'

    # Products
    PRODUCT_CREATED = 'product.created'
    PRODUCT_UPDATED = 'product.updated'
    PRODUCT_DELETED = 'product.deleted'
    PRODUCT_PRICE_CHANGED = 'product.price_changed'

    # Inventory
    STOCK_ADJUSTED = 'stock.adjusted'
    STOCK_RESERVED = 'stock.reserved'
    STOCK_RELEASED = 'stock.released'
    STOCK_TRANSFERRED = 'stock.transferred'

    # Customers
    CUSTOMER_CREATED = 'customer.created'
    CUSTOMER_UPDATED = 'customer.updated'
    CUSTOMER_DELETED = 'customer.deleted'

    # Payments
    PAYMENT_RECEIVED = 'payment.received'
    PAYMENT_FAILED = 'payment.failed'
    PAYMENT_REFUNDED = 'payment.refunded'

    # System
    USER_LOGGED_IN = 'user.logged_in'
    USER_LOGGED_OUT = 'user.logged_out'
    SETTINGS_CHANGED = 'settings.changed'


# =============================================================================
# EVENT MODEL
# =============================================================================

@dataclass
class Event:
    """Représente un événement immutable"""
    id: str
    type: str
    aggregate_type: str
    aggregate_id: str
    data: Dict[str, Any]
    metadata: Dict[str, Any]
    timestamp: str
    version: int

    def to_dict(self) -> Dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict) -> 'Event':
        return cls(**data)

    @classmethod
    def create(
        cls,
        event_type: EventType,
        aggregate_type: str,
        aggregate_id: str,
        data: Dict[str, Any],
        metadata: Optional[Dict] = None,
        version: int = 1
    ) -> 'Event':
        return cls(
            id=str(uuid.uuid4()),
            type=event_type.value if isinstance(event_type, EventType) else event_type,
            aggregate_type=aggregate_type,
            aggregate_id=str(aggregate_id),
            data=data,
            metadata=metadata or {},
            timestamp=datetime.utcnow().isoformat(),
            version=version
        )


# =============================================================================
# EVENT STORE
# =============================================================================

class EventStore:
    """
    Store d'événements persistent.

    Usage:
        store = EventStore()

        # Publier un événement
        event = Event.create(
            EventType.ORDER_CREATED,
            'order', order_id,
            {'customer_id': 1, 'total': 100.00}
        )
        store.append(event)

        # Récupérer l'historique
        events = store.get_events('order', order_id)

        # Reconstruire l'état
        order_state = store.replay('order', order_id, OrderProjection())
    """

    def __init__(self):
        self._redis = None
        self._handlers: Dict[str, List[Callable]] = {}
        self._init_redis()

    def _init_redis(self):
        """Initialise Redis pour le stockage"""
        try:
            import redis
            import os
            redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/2')
            self._redis = redis.from_url(redis_url)
            self._redis.ping()
            _logger.info("Event store connected to Redis")
        except Exception as e:
            _logger.warning(f"Redis not available for event store: {e}")

    def append(self, event: Event) -> bool:
        """
        Ajoute un événement au store.

        Args:
            event: Événement à persister

        Returns:
            True si succès
        """
        if not self._redis:
            _logger.warning("Event store not available")
            return False

        try:
            # Clé pour l'agrégat
            stream_key = f"events:{event.aggregate_type}:{event.aggregate_id}"

            # Ajouter au stream Redis
            self._redis.xadd(
                stream_key,
                {'data': json.dumps(event.to_dict())},
                id='*'
            )

            # Index global par type d'événement
            type_key = f"events:type:{event.type}"
            self._redis.zadd(type_key, {event.id: datetime.utcnow().timestamp()})

            # Publier pour les subscribers
            self._publish_event(event)

            _logger.debug(f"Event appended: {event.type} for {event.aggregate_type}:{event.aggregate_id}")
            return True

        except Exception as e:
            _logger.error(f"Failed to append event: {e}")
            return False

    def get_events(
        self,
        aggregate_type: str,
        aggregate_id: str,
        from_version: int = 0,
        to_version: int = None
    ) -> List[Event]:
        """
        Récupère les événements d'un agrégat.

        Args:
            aggregate_type: Type d'agrégat
            aggregate_id: ID de l'agrégat
            from_version: Version de départ
            to_version: Version de fin (optionnel)

        Returns:
            Liste d'événements ordonnés
        """
        if not self._redis:
            return []

        try:
            stream_key = f"events:{aggregate_type}:{aggregate_id}"
            raw_events = self._redis.xrange(stream_key, '-', '+')

            events = []
            for _, data in raw_events:
                event_data = json.loads(data[b'data'].decode())
                event = Event.from_dict(event_data)

                if event.version >= from_version:
                    if to_version is None or event.version <= to_version:
                        events.append(event)

            return events

        except Exception as e:
            _logger.error(f"Failed to get events: {e}")
            return []

    def get_events_by_type(
        self,
        event_type: EventType,
        limit: int = 100,
        offset: int = 0
    ) -> List[Event]:
        """Récupère les événements par type"""
        if not self._redis:
            return []

        try:
            type_key = f"events:type:{event_type.value}"
            event_ids = self._redis.zrevrange(type_key, offset, offset + limit - 1)

            events = []
            for event_id in event_ids:
                event_data = self._redis.get(f"event:{event_id.decode()}")
                if event_data:
                    events.append(Event.from_dict(json.loads(event_data)))

            return events

        except Exception as e:
            _logger.error(f"Failed to get events by type: {e}")
            return []

    def replay(
        self,
        aggregate_type: str,
        aggregate_id: str,
        projection: 'Projection'
    ) -> Any:
        """
        Reconstruit l'état en rejouant les événements.

        Args:
            aggregate_type: Type d'agrégat
            aggregate_id: ID de l'agrégat
            projection: Projection à utiliser

        Returns:
            État reconstruit
        """
        events = self.get_events(aggregate_type, aggregate_id)

        state = projection.initial_state()
        for event in events:
            state = projection.apply(state, event)

        return state

    def subscribe(self, event_type: EventType, handler: Callable[[Event], None]):
        """
        S'abonne à un type d'événement.

        Args:
            event_type: Type d'événement
            handler: Fonction de callback
        """
        key = event_type.value
        if key not in self._handlers:
            self._handlers[key] = []
        self._handlers[key].append(handler)

    def _publish_event(self, event: Event):
        """Publie l'événement aux subscribers"""
        handlers = self._handlers.get(event.type, [])
        for handler in handlers:
            try:
                handler(event)
            except Exception as e:
                _logger.error(f"Event handler error: {e}")


# =============================================================================
# PROJECTIONS
# =============================================================================

class Projection:
    """Classe de base pour les projections"""

    def initial_state(self) -> Any:
        """Retourne l'état initial"""
        raise NotImplementedError

    def apply(self, state: Any, event: Event) -> Any:
        """Applique un événement à l'état"""
        raise NotImplementedError


class OrderProjection(Projection):
    """Projection pour reconstruire l'état d'une commande"""

    def initial_state(self) -> Dict:
        return {
            'id': None,
            'status': 'draft',
            'customer_id': None,
            'lines': [],
            'total': 0,
            'created_at': None,
            'updated_at': None,
        }

    def apply(self, state: Dict, event: Event) -> Dict:
        if event.type == EventType.ORDER_CREATED.value:
            state.update({
                'id': event.aggregate_id,
                'status': 'created',
                'customer_id': event.data.get('customer_id'),
                'lines': event.data.get('lines', []),
                'total': event.data.get('total', 0),
                'created_at': event.timestamp,
                'updated_at': event.timestamp,
            })

        elif event.type == EventType.ORDER_CONFIRMED.value:
            state['status'] = 'confirmed'
            state['updated_at'] = event.timestamp

        elif event.type == EventType.ORDER_SHIPPED.value:
            state['status'] = 'shipped'
            state['tracking_number'] = event.data.get('tracking_number')
            state['updated_at'] = event.timestamp

        elif event.type == EventType.ORDER_DELIVERED.value:
            state['status'] = 'delivered'
            state['delivered_at'] = event.timestamp
            state['updated_at'] = event.timestamp

        elif event.type == EventType.ORDER_CANCELLED.value:
            state['status'] = 'cancelled'
            state['cancel_reason'] = event.data.get('reason')
            state['updated_at'] = event.timestamp

        return state


class ProductStockProjection(Projection):
    """Projection pour l'historique de stock d'un produit"""

    def initial_state(self) -> Dict:
        return {
            'product_id': None,
            'quantity': 0,
            'reserved': 0,
            'available': 0,
            'movements': [],
        }

    def apply(self, state: Dict, event: Event) -> Dict:
        if event.type == EventType.STOCK_ADJUSTED.value:
            state['product_id'] = event.aggregate_id
            delta = event.data.get('quantity', 0)
            state['quantity'] += delta
            state['available'] = state['quantity'] - state['reserved']
            state['movements'].append({
                'type': 'adjustment',
                'quantity': delta,
                'timestamp': event.timestamp,
            })

        elif event.type == EventType.STOCK_RESERVED.value:
            reserved = event.data.get('quantity', 0)
            state['reserved'] += reserved
            state['available'] = state['quantity'] - state['reserved']

        elif event.type == EventType.STOCK_RELEASED.value:
            released = event.data.get('quantity', 0)
            state['reserved'] = max(0, state['reserved'] - released)
            state['available'] = state['quantity'] - state['reserved']

        return state


# =============================================================================
# SINGLETON
# =============================================================================

_event_store = None


def get_event_store() -> EventStore:
    """Retourne l'instance singleton du store"""
    global _event_store
    if _event_store is None:
        _event_store = EventStore()
    return _event_store


# =============================================================================
# HELPERS
# =============================================================================

def emit_event(
    event_type: EventType,
    aggregate_type: str,
    aggregate_id: str,
    data: Dict[str, Any],
    metadata: Optional[Dict] = None
) -> bool:
    """Helper pour émettre un événement rapidement"""
    store = get_event_store()
    event = Event.create(event_type, aggregate_type, aggregate_id, data, metadata)
    return store.append(event)
