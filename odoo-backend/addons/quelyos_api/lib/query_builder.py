# -*- coding: utf-8 -*-
"""
Query Builder Sécurisé pour Quelyos ERP

Construction sécurisée de requêtes Odoo:
- Prévention des injections SQL
- Validation des champs
- Pagination sécurisée
- Filtres typés

IMPORTANT: Ne jamais utiliser de concaténation de strings pour les requêtes!
"""

import logging
from typing import List, Dict, Any, Optional, Tuple, Union
from datetime import datetime, date
from enum import Enum

_logger = logging.getLogger(__name__)


# =============================================================================
# TYPES
# =============================================================================

class FilterOperator(Enum):
    """Opérateurs de filtre supportés"""
    EQUALS = '='
    NOT_EQUALS = '!='
    GREATER = '>'
    GREATER_EQUAL = '>='
    LESS = '<'
    LESS_EQUAL = '<='
    LIKE = 'like'
    ILIKE = 'ilike'
    IN = 'in'
    NOT_IN = 'not in'
    CHILD_OF = 'child_of'
    PARENT_OF = 'parent_of'


class SortOrder(Enum):
    """Ordres de tri"""
    ASC = 'asc'
    DESC = 'desc'


# =============================================================================
# VALIDATION
# =============================================================================

# Champs autorisés par modèle (whitelist)
ALLOWED_FIELDS = {
    'product.template': [
        'id', 'name', 'default_code', 'list_price', 'standard_price',
        'categ_id', 'type', 'active', 'qty_available', 'virtual_available',
        'create_date', 'write_date', 'description', 'barcode',
    ],
    'product.product': [
        'id', 'name', 'default_code', 'list_price', 'standard_price',
        'product_tmpl_id', 'active', 'qty_available', 'barcode',
    ],
    'sale.order': [
        'id', 'name', 'partner_id', 'date_order', 'state', 'amount_total',
        'amount_tax', 'amount_untaxed', 'create_date', 'write_date',
    ],
    'res.partner': [
        'id', 'name', 'email', 'phone', 'mobile', 'street', 'city',
        'zip', 'country_id', 'is_company', 'customer_rank', 'create_date',
    ],
    'stock.quant': [
        'id', 'product_id', 'location_id', 'quantity', 'reserved_quantity',
    ],
    'account.move': [
        'id', 'name', 'partner_id', 'invoice_date', 'state', 'amount_total',
        'amount_residual', 'payment_state', 'move_type',
    ],
}

# Limite de pagination maximale
MAX_LIMIT = 1000
DEFAULT_LIMIT = 50


def validate_field(model: str, field: str) -> bool:
    """
    Vérifie qu'un champ est autorisé pour un modèle.

    Args:
        model: Nom du modèle Odoo
        field: Nom du champ

    Returns:
        True si le champ est autorisé
    """
    # Autoriser les champs relationnels avec notation pointée
    base_field = field.split('.')[0]

    allowed = ALLOWED_FIELDS.get(model, [])
    if not allowed:
        _logger.warning(f"No allowed fields defined for model: {model}")
        return False

    return base_field in allowed


def sanitize_value(value: Any) -> Any:
    """
    Nettoie une valeur pour utilisation dans un domaine Odoo.

    Args:
        value: Valeur à nettoyer

    Returns:
        Valeur nettoyée
    """
    if value is None:
        return False

    if isinstance(value, str):
        # Limiter la longueur
        if len(value) > 10000:
            value = value[:10000]
        # Pas besoin d'échapper car Odoo utilise des paramètres
        return value

    if isinstance(value, (int, float, bool)):
        return value

    if isinstance(value, (datetime, date)):
        return value.isoformat()

    if isinstance(value, (list, tuple)):
        return [sanitize_value(v) for v in value]

    return str(value)


# =============================================================================
# QUERY BUILDER
# =============================================================================

class QueryBuilder:
    """
    Constructeur de requêtes sécurisé pour Odoo.

    Usage:
        query = QueryBuilder('product.template')
        query.filter('active', True)
        query.filter('list_price', '>=', 10)
        query.filter('categ_id', 'in', [1, 2, 3])
        query.order_by('list_price', 'desc')
        query.paginate(page=1, limit=20)

        products = query.execute(env)
    """

    def __init__(self, model: str):
        """
        Initialise le query builder.

        Args:
            model: Nom du modèle Odoo
        """
        self.model = model
        self._domain: List[Tuple] = []
        self._order: List[str] = []
        self._offset = 0
        self._limit = DEFAULT_LIMIT
        self._fields: Optional[List[str]] = None

    def filter(
        self,
        field: str,
        operator: Union[str, FilterOperator] = '=',
        value: Any = None
    ) -> 'QueryBuilder':
        """
        Ajoute un filtre.

        Args:
            field: Nom du champ
            operator: Opérateur de comparaison
            value: Valeur à comparer (si 2 args, operator est la valeur)

        Returns:
            self pour chaînage
        """
        # Syntaxe courte: filter('field', value)
        if value is None and not isinstance(operator, FilterOperator):
            value = operator
            operator = '='

        # Convertir l'enum si nécessaire
        if isinstance(operator, FilterOperator):
            operator = operator.value

        # Valider le champ
        if not validate_field(self.model, field):
            _logger.warning(f"Field '{field}' not allowed for model '{self.model}'")
            raise ValueError(f"Field '{field}' not allowed")

        # Valider l'opérateur
        valid_operators = [op.value for op in FilterOperator]
        if operator not in valid_operators:
            raise ValueError(f"Invalid operator: {operator}")

        # Nettoyer la valeur
        clean_value = sanitize_value(value)

        # Ajouter au domaine
        self._domain.append((field, operator, clean_value))

        return self

    def filter_or(self, *filters: Tuple[str, str, Any]) -> 'QueryBuilder':
        """
        Ajoute des filtres avec OR.

        Args:
            filters: Tuples (field, operator, value)

        Returns:
            self pour chaînage
        """
        if len(filters) < 2:
            raise ValueError("OR requires at least 2 filters")

        # Valider tous les filtres
        for f in filters:
            if not validate_field(self.model, f[0]):
                raise ValueError(f"Field '{f[0]}' not allowed")

        # Construire le domaine OR
        or_count = len(filters) - 1
        for _ in range(or_count):
            self._domain.append('|')

        for field, operator, value in filters:
            self._domain.append((field, operator, sanitize_value(value)))

        return self

    def filter_and(self, *filters: Tuple[str, str, Any]) -> 'QueryBuilder':
        """
        Ajoute des filtres avec AND (groupés).

        Args:
            filters: Tuples (field, operator, value)

        Returns:
            self pour chaînage
        """
        if len(filters) < 2:
            raise ValueError("AND requires at least 2 filters")

        # Valider tous les filtres
        for f in filters:
            if not validate_field(self.model, f[0]):
                raise ValueError(f"Field '{f[0]}' not allowed")

        # Construire le domaine AND
        and_count = len(filters) - 1
        for _ in range(and_count):
            self._domain.append('&')

        for field, operator, value in filters:
            self._domain.append((field, operator, sanitize_value(value)))

        return self

    def order_by(self, field: str, direction: Union[str, SortOrder] = 'asc') -> 'QueryBuilder':
        """
        Ajoute un tri.

        Args:
            field: Champ de tri
            direction: 'asc' ou 'desc'

        Returns:
            self pour chaînage
        """
        if not validate_field(self.model, field):
            raise ValueError(f"Field '{field}' not allowed for sorting")

        if isinstance(direction, SortOrder):
            direction = direction.value

        if direction.lower() not in ('asc', 'desc'):
            raise ValueError("Direction must be 'asc' or 'desc'")

        self._order.append(f"{field} {direction.lower()}")
        return self

    def paginate(self, page: int = 1, limit: int = DEFAULT_LIMIT) -> 'QueryBuilder':
        """
        Configure la pagination.

        Args:
            page: Numéro de page (1-based)
            limit: Nombre d'éléments par page

        Returns:
            self pour chaînage
        """
        # Valider les valeurs
        page = max(1, int(page))
        limit = min(max(1, int(limit)), MAX_LIMIT)

        self._offset = (page - 1) * limit
        self._limit = limit

        return self

    def select(self, *fields: str) -> 'QueryBuilder':
        """
        Spécifie les champs à retourner.

        Args:
            fields: Noms des champs

        Returns:
            self pour chaînage
        """
        valid_fields = []
        for field in fields:
            if validate_field(self.model, field):
                valid_fields.append(field)
            else:
                _logger.warning(f"Ignoring invalid field: {field}")

        self._fields = valid_fields if valid_fields else None
        return self

    def get_domain(self) -> List:
        """Retourne le domaine construit"""
        return self._domain.copy()

    def get_order(self) -> str:
        """Retourne la chaîne de tri"""
        return ', '.join(self._order) if self._order else 'id desc'

    def execute(self, env) -> List[Dict]:
        """
        Exécute la requête.

        Args:
            env: Environnement Odoo

        Returns:
            Liste de records
        """
        Model = env[self.model].sudo()

        # Recherche avec pagination
        records = Model.search(
            self._domain,
            offset=self._offset,
            limit=self._limit,
            order=self.get_order()
        )

        # Lire les champs demandés
        if self._fields:
            return records.read(self._fields)

        return records.read()

    def count(self, env) -> int:
        """
        Compte les résultats.

        Args:
            env: Environnement Odoo

        Returns:
            Nombre total de résultats
        """
        Model = env[self.model].sudo()
        return Model.search_count(self._domain)

    def execute_with_count(self, env) -> Tuple[List[Dict], int]:
        """
        Exécute et retourne les résultats avec le count total.

        Args:
            env: Environnement Odoo

        Returns:
            Tuple (résultats, total)
        """
        total = self.count(env)
        results = self.execute(env)
        return results, total


# =============================================================================
# HELPERS
# =============================================================================

def build_product_query(filters: Dict[str, Any]) -> QueryBuilder:
    """
    Construit une requête produit à partir de filtres.

    Args:
        filters: Dict de filtres (search, category_id, min_price, max_price, etc.)

    Returns:
        QueryBuilder configuré
    """
    query = QueryBuilder('product.template')
    query.filter('active', True)

    if 'search' in filters and filters['search']:
        search = filters['search']
        query.filter_or(
            ('name', 'ilike', search),
            ('default_code', 'ilike', search),
            ('barcode', '=', search),
        )

    if 'category_id' in filters:
        query.filter('categ_id', 'child_of', filters['category_id'])

    if 'min_price' in filters:
        query.filter('list_price', '>=', filters['min_price'])

    if 'max_price' in filters:
        query.filter('list_price', '<=', filters['max_price'])

    if 'in_stock' in filters and filters['in_stock']:
        query.filter('qty_available', '>', 0)

    return query


def build_order_query(filters: Dict[str, Any]) -> QueryBuilder:
    """
    Construit une requête commande à partir de filtres.

    Args:
        filters: Dict de filtres

    Returns:
        QueryBuilder configuré
    """
    query = QueryBuilder('sale.order')

    if 'status' in filters:
        query.filter('state', filters['status'])

    if 'customer_id' in filters:
        query.filter('partner_id', filters['customer_id'])

    if 'date_from' in filters:
        query.filter('date_order', '>=', filters['date_from'])

    if 'date_to' in filters:
        query.filter('date_order', '<=', filters['date_to'])

    if 'min_amount' in filters:
        query.filter('amount_total', '>=', filters['min_amount'])

    return query
