# -*- coding: utf-8 -*-
"""
CQRS - Command Query Responsibility Segregation pour Quelyos ERP

Séparation des responsabilités lecture/écriture:
- Commands: Opérations d'écriture (mutations)
- Queries: Opérations de lecture (requêtes)
- Handlers: Logique métier isolée
- Bus: Distribution des commandes/queries
"""

import logging
from typing import Dict, Any, Optional, Callable, Type, Generic, TypeVar
from dataclasses import dataclass, field
from abc import ABC, abstractmethod
from datetime import datetime
import uuid

_logger = logging.getLogger(__name__)

T = TypeVar('T')


# =============================================================================
# BASE CLASSES
# =============================================================================

@dataclass
class Command:
    """Classe de base pour les commandes (opérations d'écriture)"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    user_id: Optional[int] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Query:
    """Classe de base pour les queries (opérations de lecture)"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    user_id: Optional[int] = None


@dataclass
class CommandResult:
    """Résultat d'une commande"""
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    error_code: Optional[str] = None

    @classmethod
    def ok(cls, data: Any = None) -> 'CommandResult':
        return cls(success=True, data=data)

    @classmethod
    def fail(cls, error: str, error_code: str = 'ERROR') -> 'CommandResult':
        return cls(success=False, error=error, error_code=error_code)


class CommandHandler(ABC, Generic[T]):
    """Handler de commande"""

    @abstractmethod
    def handle(self, command: T, env) -> CommandResult:
        """Exécute la commande"""
        pass


class QueryHandler(ABC, Generic[T]):
    """Handler de query"""

    @abstractmethod
    def handle(self, query: T, env) -> Any:
        """Exécute la query"""
        pass


# =============================================================================
# COMMANDS - ORDERS
# =============================================================================

@dataclass
class CreateOrderCommand(Command):
    """Commande pour créer une commande"""
    customer_id: int = 0
    lines: list = field(default_factory=list)
    shipping_address: Dict = field(default_factory=dict)
    notes: Optional[str] = None


@dataclass
class ConfirmOrderCommand(Command):
    """Commande pour confirmer une commande"""
    order_id: int = 0
    payment_reference: Optional[str] = None


@dataclass
class CancelOrderCommand(Command):
    """Commande pour annuler une commande"""
    order_id: int = 0
    reason: str = ''


@dataclass
class ShipOrderCommand(Command):
    """Commande pour expédier une commande"""
    order_id: int = 0
    tracking_number: str = ''
    carrier: str = ''


# =============================================================================
# COMMANDS - PRODUCTS
# =============================================================================

@dataclass
class CreateProductCommand(Command):
    """Commande pour créer un produit"""
    name: str = ''
    sku: Optional[str] = None
    price: float = 0.0
    category_id: Optional[int] = None
    description: Optional[str] = None


@dataclass
class UpdateProductCommand(Command):
    """Commande pour mettre à jour un produit"""
    product_id: int = 0
    updates: Dict[str, Any] = field(default_factory=dict)


@dataclass
class UpdatePriceCommand(Command):
    """Commande pour changer le prix d'un produit"""
    product_id: int = 0
    new_price: float = 0.0
    reason: Optional[str] = None


@dataclass
class AdjustStockCommand(Command):
    """Commande pour ajuster le stock"""
    product_id: int = 0
    warehouse_id: int = 0
    quantity: int = 0
    reason: str = 'adjustment'
    reference: Optional[str] = None


# =============================================================================
# QUERIES
# =============================================================================

@dataclass
class GetOrderQuery(Query):
    """Query pour récupérer une commande"""
    order_id: int = 0


@dataclass
class ListOrdersQuery(Query):
    """Query pour lister les commandes"""
    customer_id: Optional[int] = None
    status: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    page: int = 1
    limit: int = 20


@dataclass
class GetProductQuery(Query):
    """Query pour récupérer un produit"""
    product_id: int = 0


@dataclass
class SearchProductsQuery(Query):
    """Query pour rechercher des produits"""
    search: Optional[str] = None
    category_id: Optional[int] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    in_stock: bool = False
    page: int = 1
    limit: int = 20


@dataclass
class GetStockQuery(Query):
    """Query pour récupérer le stock"""
    product_id: int = 0
    warehouse_id: Optional[int] = None


@dataclass
class GetDashboardStatsQuery(Query):
    """Query pour les stats du dashboard"""
    date_from: Optional[str] = None
    date_to: Optional[str] = None


# =============================================================================
# COMMAND HANDLERS
# =============================================================================

class CreateOrderHandler(CommandHandler[CreateOrderCommand]):
    """Handler pour la création de commande"""

    def handle(self, command: CreateOrderCommand, env) -> CommandResult:
        try:
            # Valider le client
            partner = env['res.partner'].browse(command.customer_id)
            if not partner.exists():
                return CommandResult.fail('Client non trouvé', 'CUSTOMER_NOT_FOUND')

            # Créer la commande
            order_vals = {
                'partner_id': command.customer_id,
                'note': command.notes,
            }

            order = env['sale.order'].create(order_vals)

            # Ajouter les lignes
            for line in command.lines:
                product = env['product.product'].browse(line['product_id'])
                if not product.exists():
                    continue

                env['sale.order.line'].create({
                    'order_id': order.id,
                    'product_id': line['product_id'],
                    'product_uom_qty': line['quantity'],
                    'price_unit': line.get('price', product.list_price),
                })

            # Émettre l'événement
            from .event_store import emit_event, EventType
            emit_event(
                EventType.ORDER_CREATED,
                'order', str(order.id),
                {
                    'customer_id': command.customer_id,
                    'total': order.amount_total,
                    'lines': command.lines,
                }
            )

            return CommandResult.ok({'order_id': order.id, 'name': order.name})

        except Exception as e:
            _logger.error(f"CreateOrder failed: {e}")
            return CommandResult.fail(str(e), 'CREATE_ORDER_ERROR')


class ConfirmOrderHandler(CommandHandler[ConfirmOrderCommand]):
    """Handler pour confirmation de commande"""

    def handle(self, command: ConfirmOrderCommand, env) -> CommandResult:
        try:
            order = env['sale.order'].browse(command.order_id)
            if not order.exists():
                return CommandResult.fail('Commande non trouvée', 'ORDER_NOT_FOUND')

            if order.state != 'draft':
                return CommandResult.fail('La commande ne peut pas être confirmée', 'INVALID_STATE')

            order.action_confirm()

            # Émettre l'événement
            from .event_store import emit_event, EventType
            emit_event(
                EventType.ORDER_CONFIRMED,
                'order', str(order.id),
                {'payment_reference': command.payment_reference}
            )

            return CommandResult.ok({'order_id': order.id, 'state': order.state})

        except Exception as e:
            _logger.error(f"ConfirmOrder failed: {e}")
            return CommandResult.fail(str(e), 'CONFIRM_ORDER_ERROR')


class AdjustStockHandler(CommandHandler[AdjustStockCommand]):
    """Handler pour ajustement de stock"""

    def handle(self, command: AdjustStockCommand, env) -> CommandResult:
        try:
            product = env['product.product'].browse(command.product_id)
            if not product.exists():
                return CommandResult.fail('Produit non trouvé', 'PRODUCT_NOT_FOUND')

            # Créer l'ajustement via stock.quant
            location = env['stock.location'].browse(command.warehouse_id)
            if not location.exists():
                location = env['stock.location'].search([('usage', '=', 'internal')], limit=1)

            quant = env['stock.quant'].search([
                ('product_id', '=', command.product_id),
                ('location_id', '=', location.id),
            ], limit=1)

            if quant:
                new_qty = quant.quantity + command.quantity
                quant.write({'quantity': new_qty})
            else:
                env['stock.quant'].create({
                    'product_id': command.product_id,
                    'location_id': location.id,
                    'quantity': command.quantity,
                })

            # Émettre l'événement
            from .event_store import emit_event, EventType
            emit_event(
                EventType.STOCK_ADJUSTED,
                'product', str(command.product_id),
                {
                    'quantity': command.quantity,
                    'reason': command.reason,
                    'reference': command.reference,
                    'warehouse_id': command.warehouse_id,
                }
            )

            return CommandResult.ok({
                'product_id': command.product_id,
                'adjustment': command.quantity,
            })

        except Exception as e:
            _logger.error(f"AdjustStock failed: {e}")
            return CommandResult.fail(str(e), 'ADJUST_STOCK_ERROR')


# =============================================================================
# QUERY HANDLERS
# =============================================================================

class GetOrderHandler(QueryHandler[GetOrderQuery]):
    """Handler pour récupérer une commande"""

    def handle(self, query: GetOrderQuery, env) -> Optional[Dict]:
        order = env['sale.order'].browse(query.order_id)
        if not order.exists():
            return None

        return {
            'id': order.id,
            'name': order.name,
            'customer_id': order.partner_id.id,
            'customer_name': order.partner_id.name,
            'status': order.state,
            'total': order.amount_total,
            'created_at': order.create_date.isoformat() if order.create_date else None,
            'lines': [{
                'product_id': line.product_id.id,
                'product_name': line.product_id.name,
                'quantity': line.product_uom_qty,
                'price': line.price_unit,
                'subtotal': line.price_subtotal,
            } for line in order.order_line],
        }


class SearchProductsHandler(QueryHandler[SearchProductsQuery]):
    """Handler pour recherche de produits"""

    def handle(self, query: SearchProductsQuery, env) -> Dict:
        from .query_builder import build_product_query

        filters = {
            'search': query.search,
            'category_id': query.category_id,
            'min_price': query.min_price,
            'max_price': query.max_price,
            'in_stock': query.in_stock,
        }

        qb = build_product_query(filters)
        qb.paginate(page=query.page, limit=query.limit)

        products, total = qb.execute_with_count(env)

        return {
            'items': products,
            'total': total,
            'page': query.page,
            'limit': query.limit,
            'pages': (total + query.limit - 1) // query.limit,
        }


# =============================================================================
# BUS
# =============================================================================

class CommandBus:
    """Bus de commandes"""

    _handlers: Dict[Type[Command], CommandHandler] = {}

    @classmethod
    def register(cls, command_type: Type[Command], handler: CommandHandler):
        """Enregistre un handler"""
        cls._handlers[command_type] = handler

    @classmethod
    def dispatch(cls, command: Command, env) -> CommandResult:
        """Dispatch une commande au handler approprié"""
        handler = cls._handlers.get(type(command))
        if not handler:
            return CommandResult.fail(
                f"No handler for {type(command).__name__}",
                'NO_HANDLER'
            )

        _logger.debug(f"Dispatching {type(command).__name__}")
        return handler.handle(command, env)


class QueryBus:
    """Bus de queries"""

    _handlers: Dict[Type[Query], QueryHandler] = {}

    @classmethod
    def register(cls, query_type: Type[Query], handler: QueryHandler):
        """Enregistre un handler"""
        cls._handlers[query_type] = handler

    @classmethod
    def dispatch(cls, query: Query, env) -> Any:
        """Dispatch une query au handler approprié"""
        handler = cls._handlers.get(type(query))
        if not handler:
            raise ValueError(f"No handler for {type(query).__name__}")

        _logger.debug(f"Dispatching {type(query).__name__}")
        return handler.handle(query, env)


# =============================================================================
# REGISTRATION
# =============================================================================

def register_handlers():
    """Enregistre tous les handlers"""
    # Commands
    CommandBus.register(CreateOrderCommand, CreateOrderHandler())
    CommandBus.register(ConfirmOrderCommand, ConfirmOrderHandler())
    CommandBus.register(AdjustStockCommand, AdjustStockHandler())

    # Queries
    QueryBus.register(GetOrderQuery, GetOrderHandler())
    QueryBus.register(SearchProductsQuery, SearchProductsHandler())


# Auto-register
register_handlers()
