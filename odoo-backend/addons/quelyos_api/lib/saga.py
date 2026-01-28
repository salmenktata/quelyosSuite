# -*- coding: utf-8 -*-
"""
Saga Pattern pour Quelyos ERP

Gestion des transactions distribuées:
- Orchestration de plusieurs étapes
- Compensation automatique en cas d'échec
- Persistance de l'état
- Retry et recovery

Parfait pour: commandes multi-services, paiements, réservations.
"""

import logging
import uuid
import json
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass, field, asdict
from datetime import datetime
from enum import Enum
from abc import ABC, abstractmethod
import os

_logger = logging.getLogger(__name__)

REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
SAGA_PREFIX = 'quelyos:saga:'


# =============================================================================
# TYPES
# =============================================================================

class SagaStatus(Enum):
    """États d'une saga"""
    PENDING = 'pending'
    RUNNING = 'running'
    COMPLETED = 'completed'
    COMPENSATING = 'compensating'
    COMPENSATED = 'compensated'
    FAILED = 'failed'


class StepStatus(Enum):
    """États d'une étape"""
    PENDING = 'pending'
    RUNNING = 'running'
    COMPLETED = 'completed'
    FAILED = 'failed'
    COMPENSATED = 'compensated'
    SKIPPED = 'skipped'


@dataclass
class SagaStep:
    """Représente une étape de la saga"""
    name: str
    status: StepStatus = StepStatus.PENDING
    result: Optional[Dict] = None
    error: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    compensated_at: Optional[str] = None


@dataclass
class SagaState:
    """État complet d'une saga"""
    id: str
    name: str
    status: SagaStatus
    steps: List[SagaStep]
    context: Dict[str, Any]
    current_step: int
    created_at: str
    updated_at: str
    completed_at: Optional[str] = None
    error: Optional[str] = None

    def to_dict(self) -> Dict:
        return {
            'id': self.id,
            'name': self.name,
            'status': self.status.value,
            'steps': [
                {
                    'name': s.name,
                    'status': s.status.value,
                    'result': s.result,
                    'error': s.error,
                    'started_at': s.started_at,
                    'completed_at': s.completed_at,
                }
                for s in self.steps
            ],
            'context': self.context,
            'current_step': self.current_step,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'completed_at': self.completed_at,
            'error': self.error,
        }

    @classmethod
    def from_dict(cls, data: Dict) -> 'SagaState':
        return cls(
            id=data['id'],
            name=data['name'],
            status=SagaStatus(data['status']),
            steps=[
                SagaStep(
                    name=s['name'],
                    status=StepStatus(s['status']),
                    result=s.get('result'),
                    error=s.get('error'),
                    started_at=s.get('started_at'),
                    completed_at=s.get('completed_at'),
                )
                for s in data['steps']
            ],
            context=data['context'],
            current_step=data['current_step'],
            created_at=data['created_at'],
            updated_at=data['updated_at'],
            completed_at=data.get('completed_at'),
            error=data.get('error'),
        )


# =============================================================================
# SAGA DEFINITION
# =============================================================================

class SagaDefinition(ABC):
    """
    Définition abstraite d'une saga.

    Usage:
        class OrderSaga(SagaDefinition):
            name = 'create_order'

            def get_steps(self):
                return [
                    ('reserve_stock', self.reserve_stock, self.release_stock),
                    ('charge_payment', self.charge_payment, self.refund_payment),
                    ('create_order', self.create_order, self.cancel_order),
                    ('send_confirmation', self.send_confirmation, None),
                ]

            def reserve_stock(self, ctx, env):
                # Réserver le stock
                return {'reserved': True}

            def release_stock(self, ctx, env):
                # Libérer le stock (compensation)
                pass
    """

    name: str = 'unnamed_saga'

    @abstractmethod
    def get_steps(self) -> List[tuple]:
        """
        Retourne les étapes de la saga.

        Chaque étape est un tuple: (nom, action, compensation)
        - action: fonction(context, env) -> result
        - compensation: fonction(context, env) -> None (ou None si pas de compensation)
        """
        pass

    def on_complete(self, context: Dict, env) -> None:
        """Appelé quand la saga est terminée avec succès"""
        pass

    def on_fail(self, context: Dict, error: str, env) -> None:
        """Appelé quand la saga échoue"""
        pass


# =============================================================================
# SAGA ORCHESTRATOR
# =============================================================================

class SagaOrchestrator:
    """
    Orchestrateur de sagas.

    Usage:
        orchestrator = SagaOrchestrator()

        # Enregistrer une saga
        orchestrator.register(OrderSaga())

        # Exécuter une saga
        result = orchestrator.execute('create_order', {
            'customer_id': 123,
            'items': [...]
        }, env)
    """

    def __init__(self):
        self._redis = None
        self._sagas: Dict[str, SagaDefinition] = {}
        self._init_redis()

    def _init_redis(self):
        try:
            import redis
            self._redis = redis.from_url(REDIS_URL)
        except Exception as e:
            _logger.warning(f"Redis not available for saga: {e}")

    def register(self, saga: SagaDefinition):
        """Enregistre une définition de saga"""
        self._sagas[saga.name] = saga
        _logger.debug(f"Registered saga: {saga.name}")

    def execute(
        self,
        saga_name: str,
        context: Dict[str, Any],
        env,
        saga_id: str = None
    ) -> Dict:
        """
        Exécute une saga.

        Args:
            saga_name: Nom de la saga enregistrée
            context: Contexte initial
            env: Environnement Odoo
            saga_id: ID optionnel (pour reprise)

        Returns:
            Résultat de la saga
        """
        saga_def = self._sagas.get(saga_name)
        if not saga_def:
            raise ValueError(f"Unknown saga: {saga_name}")

        # Créer ou récupérer l'état
        if saga_id:
            state = self._load_state(saga_id)
            if not state:
                raise ValueError(f"Saga not found: {saga_id}")
        else:
            saga_id = str(uuid.uuid4())
            steps = [SagaStep(name=s[0]) for s in saga_def.get_steps()]
            state = SagaState(
                id=saga_id,
                name=saga_name,
                status=SagaStatus.PENDING,
                steps=steps,
                context=context,
                current_step=0,
                created_at=datetime.utcnow().isoformat(),
                updated_at=datetime.utcnow().isoformat(),
            )
            self._save_state(state)

        # Exécuter
        return self._run_saga(state, saga_def, env)

    def _run_saga(
        self,
        state: SagaState,
        saga_def: SagaDefinition,
        env
    ) -> Dict:
        """Exécute les étapes de la saga"""
        steps_def = saga_def.get_steps()
        state.status = SagaStatus.RUNNING
        self._save_state(state)

        try:
            # Exécuter chaque étape
            for i in range(state.current_step, len(steps_def)):
                step_name, action, compensation = steps_def[i]
                step = state.steps[i]

                step.status = StepStatus.RUNNING
                step.started_at = datetime.utcnow().isoformat()
                state.current_step = i
                self._save_state(state)

                try:
                    # Exécuter l'action
                    result = action(state.context, env)
                    step.result = result
                    step.status = StepStatus.COMPLETED
                    step.completed_at = datetime.utcnow().isoformat()

                    # Mettre à jour le contexte avec le résultat
                    if result:
                        state.context[f'{step_name}_result'] = result

                except Exception as e:
                    _logger.error(f"Saga step {step_name} failed: {e}")
                    step.status = StepStatus.FAILED
                    step.error = str(e)
                    state.error = str(e)
                    self._save_state(state)

                    # Compenser
                    self._compensate(state, saga_def, i - 1, env)
                    return state.to_dict()

                self._save_state(state)

            # Saga terminée avec succès
            state.status = SagaStatus.COMPLETED
            state.completed_at = datetime.utcnow().isoformat()
            self._save_state(state)

            saga_def.on_complete(state.context, env)

            return state.to_dict()

        except Exception as e:
            _logger.error(f"Saga {state.id} failed: {e}")
            state.status = SagaStatus.FAILED
            state.error = str(e)
            self._save_state(state)
            saga_def.on_fail(state.context, str(e), env)
            return state.to_dict()

    def _compensate(
        self,
        state: SagaState,
        saga_def: SagaDefinition,
        from_step: int,
        env
    ):
        """Exécute les compensations en ordre inverse"""
        state.status = SagaStatus.COMPENSATING
        self._save_state(state)

        steps_def = saga_def.get_steps()

        for i in range(from_step, -1, -1):
            step_name, action, compensation = steps_def[i]
            step = state.steps[i]

            if step.status != StepStatus.COMPLETED:
                continue

            if compensation is None:
                step.status = StepStatus.SKIPPED
                continue

            try:
                _logger.info(f"Compensating step: {step_name}")
                compensation(state.context, env)
                step.status = StepStatus.COMPENSATED
                step.compensated_at = datetime.utcnow().isoformat()
            except Exception as e:
                _logger.error(f"Compensation failed for {step_name}: {e}")
                # Continuer quand même avec les autres compensations

            self._save_state(state)

        state.status = SagaStatus.COMPENSATED
        self._save_state(state)

    def _save_state(self, state: SagaState):
        """Persiste l'état de la saga"""
        state.updated_at = datetime.utcnow().isoformat()

        if self._redis:
            key = f"{SAGA_PREFIX}{state.id}"
            self._redis.setex(key, 86400 * 7, json.dumps(state.to_dict()))

    def _load_state(self, saga_id: str) -> Optional[SagaState]:
        """Charge l'état d'une saga"""
        if not self._redis:
            return None

        key = f"{SAGA_PREFIX}{saga_id}"
        data = self._redis.get(key)

        if data:
            return SagaState.from_dict(json.loads(data))
        return None

    def get_saga(self, saga_id: str) -> Optional[Dict]:
        """Récupère l'état d'une saga"""
        state = self._load_state(saga_id)
        return state.to_dict() if state else None

    def retry(self, saga_id: str, env) -> Dict:
        """Réessaie une saga échouée"""
        state = self._load_state(saga_id)
        if not state:
            raise ValueError(f"Saga not found: {saga_id}")

        if state.status not in [SagaStatus.FAILED, SagaStatus.COMPENSATED]:
            raise ValueError(f"Saga cannot be retried (status: {state.status})")

        saga_def = self._sagas.get(state.name)
        if not saga_def:
            raise ValueError(f"Saga definition not found: {state.name}")

        # Reset les étapes échouées
        for step in state.steps:
            if step.status in [StepStatus.FAILED, StepStatus.COMPENSATED]:
                step.status = StepStatus.PENDING
                step.error = None

        state.status = SagaStatus.PENDING
        state.error = None
        self._save_state(state)

        return self._run_saga(state, saga_def, env)


# =============================================================================
# SAGAS PRÉDÉFINIES
# =============================================================================

class CreateOrderSaga(SagaDefinition):
    """Saga pour la création d'une commande"""

    name = 'create_order'

    def get_steps(self):
        return [
            ('validate_order', self.validate_order, None),
            ('reserve_stock', self.reserve_stock, self.release_stock),
            ('process_payment', self.process_payment, self.refund_payment),
            ('create_order', self.create_order, self.cancel_order),
            ('send_confirmation', self.send_confirmation, None),
        ]

    def validate_order(self, ctx: Dict, env) -> Dict:
        """Valide les données de la commande"""
        customer_id = ctx.get('customer_id')
        items = ctx.get('items', [])

        if not customer_id:
            raise ValueError("Customer ID required")
        if not items:
            raise ValueError("Order must have at least one item")

        return {'valid': True}

    def reserve_stock(self, ctx: Dict, env) -> Dict:
        """Réserve le stock pour les articles"""
        items = ctx.get('items', [])
        reserved = []

        for item in items:
            product_id = item['product_id']
            quantity = item['quantity']

            # Vérifier et réserver le stock
            product = env['product.product'].browse(product_id)
            if product.qty_available < quantity:
                raise ValueError(f"Insufficient stock for product {product_id}")

            reserved.append({
                'product_id': product_id,
                'quantity': quantity,
            })

        return {'reserved_items': reserved}

    def release_stock(self, ctx: Dict, env):
        """Libère le stock réservé (compensation)"""
        reserved = ctx.get('reserve_stock_result', {}).get('reserved_items', [])
        for item in reserved:
            _logger.info(f"Releasing stock for product {item['product_id']}")
            # Logique de libération du stock

    def process_payment(self, ctx: Dict, env) -> Dict:
        """Traite le paiement"""
        amount = sum(item.get('price', 0) * item.get('quantity', 1) for item in ctx.get('items', []))
        payment_method = ctx.get('payment_method', 'card')

        # Simuler le traitement du paiement
        _logger.info(f"Processing payment of {amount} via {payment_method}")

        return {
            'payment_id': str(uuid.uuid4()),
            'amount': amount,
            'status': 'captured',
        }

    def refund_payment(self, ctx: Dict, env):
        """Rembourse le paiement (compensation)"""
        payment_result = ctx.get('process_payment_result', {})
        payment_id = payment_result.get('payment_id')
        if payment_id:
            _logger.info(f"Refunding payment {payment_id}")
            # Logique de remboursement

    def create_order(self, ctx: Dict, env) -> Dict:
        """Crée la commande dans Odoo"""
        customer_id = ctx['customer_id']
        items = ctx['items']

        order = env['sale.order'].create({
            'partner_id': customer_id,
        })

        for item in items:
            env['sale.order.line'].create({
                'order_id': order.id,
                'product_id': item['product_id'],
                'product_uom_qty': item['quantity'],
            })

        return {
            'order_id': order.id,
            'order_name': order.name,
        }

    def cancel_order(self, ctx: Dict, env):
        """Annule la commande (compensation)"""
        order_result = ctx.get('create_order_result', {})
        order_id = order_result.get('order_id')
        if order_id:
            order = env['sale.order'].browse(order_id)
            if order.exists():
                order.action_cancel()
                _logger.info(f"Cancelled order {order_id}")

    def send_confirmation(self, ctx: Dict, env) -> Dict:
        """Envoie l'email de confirmation"""
        order_result = ctx.get('create_order_result', {})
        _logger.info(f"Sending confirmation for order {order_result.get('order_name')}")
        return {'email_sent': True}


# =============================================================================
# SINGLETON & HELPERS
# =============================================================================

_orchestrator = None


def get_saga_orchestrator() -> SagaOrchestrator:
    """Retourne l'orchestrateur singleton"""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = SagaOrchestrator()
        # Enregistrer les sagas prédéfinies
        _orchestrator.register(CreateOrderSaga())
    return _orchestrator


def execute_saga(
    saga_name: str,
    context: Dict[str, Any],
    env
) -> Dict:
    """Helper pour exécuter une saga"""
    return get_saga_orchestrator().execute(saga_name, context, env)
