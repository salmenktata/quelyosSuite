# -*- coding: utf-8 -*-
"""
Data Validation Layer pour Quelyos API

Validation des données avec Pydantic:
- Schémas réutilisables
- Messages d'erreur en français
- Cohérence avec les schémas frontend (Zod)
"""

import re
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal
from functools import wraps
import logging

_logger = logging.getLogger(__name__)

# Essayer d'importer Pydantic v2, sinon v1
try:
    from pydantic import BaseModel, Field, field_validator, model_validator
    # EmailStr et HttpUrl nécessitent email-validator, on les remplace par str avec pattern
    PYDANTIC_V2 = True
except ImportError:
    try:
        from pydantic import BaseModel, Field, validator, root_validator
        PYDANTIC_V2 = False
    except ImportError:
        _logger.warning("Pydantic not installed. Validation will be minimal.")
        PYDANTIC_V2 = None


# =============================================================================
# PATTERNS
# =============================================================================

PHONE_PATTERN = r'^(\+33|0)[1-9](\d{2}){4}$'
SIRET_PATTERN = r'^\d{14}$'
SIREN_PATTERN = r'^\d{9}$'
VAT_PATTERN = r'^FR\d{11}$'
POSTAL_CODE_PATTERN = r'^\d{5}$'
SKU_PATTERN = r'^[A-Z0-9-]+$'


# =============================================================================
# MESSAGES D'ERREUR
# =============================================================================

class ErrorMessages:
    """Messages d'erreur en français"""
    REQUIRED = "Ce champ est requis"
    EMAIL = "Adresse email invalide"
    URL = "URL invalide"
    PHONE = "Numéro de téléphone invalide"
    POSITIVE = "La valeur doit être positive"
    MIN_LENGTH = "Minimum {min} caractères"
    MAX_LENGTH = "Maximum {max} caractères"
    MIN_VALUE = "La valeur doit être au moins {min}"
    MAX_VALUE = "La valeur ne doit pas dépasser {max}"
    POSTAL_CODE = "Code postal invalide"
    VAT_NUMBER = "Numéro TVA invalide"
    SKU = "Référence invalide"


# =============================================================================
# BASE MODELS
# =============================================================================

if PYDANTIC_V2 is not None:

    class BaseSchema(BaseModel):
        """Classe de base pour tous les schémas"""

        class Config:
            # Pydantic v1 style
            str_strip_whitespace = True
            extra = 'forbid'

            # Pour validation stricte
            validate_assignment = True

    class AddressSchema(BaseSchema):
        """Schéma d'adresse"""
        street: str = Field(..., min_length=1, description="Rue")
        street2: Optional[str] = Field(None, description="Complément d'adresse")
        city: str = Field(..., min_length=1, description="Ville")
        zip: str = Field(..., description="Code postal")
        country: str = Field(..., min_length=1, description="Pays")
        state: Optional[str] = Field(None, description="Région/État")

        if PYDANTIC_V2:
            @field_validator('zip')
            @classmethod
            def validate_zip(cls, v):
                if not re.match(POSTAL_CODE_PATTERN, v):
                    raise ValueError(ErrorMessages.POSTAL_CODE)
                return v
        else:
            @validator('zip')
            def validate_zip(cls, v):
                if not re.match(POSTAL_CODE_PATTERN, v):
                    raise ValueError(ErrorMessages.POSTAL_CODE)
                return v


    # =========================================================================
    # USER SCHEMAS
    # =========================================================================

    class LoginSchema(BaseSchema):
        """Schéma de connexion"""
        email: str = Field(..., min_length=3, pattern=r'^[^@]+@[^@]+\.[^@]+$')
        password: str = Field(..., min_length=1)

    class UserProfileSchema(BaseSchema):
        """Schéma de profil utilisateur"""
        first_name: str = Field(..., min_length=2, alias="firstName")
        last_name: str = Field(..., min_length=2, alias="lastName")
        email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')
        phone: Optional[str] = None
        avatar: Optional[str] = None

        if PYDANTIC_V2:
            @field_validator('phone')
            @classmethod
            def validate_phone(cls, v):
                if v and not re.match(PHONE_PATTERN, v):
                    raise ValueError(ErrorMessages.PHONE)
                return v
        else:
            @validator('phone')
            def validate_phone(cls, v):
                if v and not re.match(PHONE_PATTERN, v):
                    raise ValueError(ErrorMessages.PHONE)
                return v


    # =========================================================================
    # PRODUCT SCHEMAS
    # =========================================================================

    class ProductSchema(BaseSchema):
        """Schéma de produit"""
        name: str = Field(..., min_length=1, max_length=255)
        sku: Optional[str] = None
        description: Optional[str] = None
        price: Decimal = Field(..., ge=0)
        compare_at_price: Optional[Decimal] = Field(None, ge=0, alias="compareAtPrice")
        cost: Optional[Decimal] = Field(None, ge=0)
        category_id: Optional[int] = Field(None, gt=0, alias="categoryId")
        weight: Optional[Decimal] = Field(None, ge=0)
        track_inventory: bool = Field(True, alias="trackInventory")
        stock_quantity: int = Field(0, alias="stockQuantity")
        low_stock_threshold: int = Field(5, ge=0, alias="lowStockThreshold")
        is_active: bool = Field(True, alias="isActive")
        tags: List[str] = Field(default_factory=list)
        images: List[str] = Field(default_factory=list)

        if PYDANTIC_V2:
            @field_validator('sku')
            @classmethod
            def validate_sku(cls, v):
                if v and not re.match(SKU_PATTERN, v):
                    raise ValueError(ErrorMessages.SKU)
                return v
        else:
            @validator('sku')
            def validate_sku(cls, v):
                if v and not re.match(SKU_PATTERN, v):
                    raise ValueError(ErrorMessages.SKU)
                return v


    # =========================================================================
    # CUSTOMER SCHEMAS
    # =========================================================================

    class CustomerSchema(BaseSchema):
        """Schéma client"""
        first_name: str = Field(..., min_length=1, alias="firstName")
        last_name: str = Field(..., min_length=1, alias="lastName")
        email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')
        phone: Optional[str] = None
        company: Optional[str] = None
        vat_number: Optional[str] = Field(None, alias="vatNumber")
        billing_address: Optional[AddressSchema] = Field(None, alias="billingAddress")
        shipping_address: Optional[AddressSchema] = Field(None, alias="shippingAddress")
        tags: List[str] = Field(default_factory=list)
        notes: Optional[str] = None

        if PYDANTIC_V2:
            @field_validator('vat_number')
            @classmethod
            def validate_vat(cls, v):
                if v and not re.match(VAT_PATTERN, v):
                    raise ValueError(ErrorMessages.VAT_NUMBER)
                return v
        else:
            @validator('vat_number')
            def validate_vat(cls, v):
                if v and not re.match(VAT_PATTERN, v):
                    raise ValueError(ErrorMessages.VAT_NUMBER)
                return v


    # =========================================================================
    # ORDER SCHEMAS
    # =========================================================================

    class OrderLineSchema(BaseSchema):
        """Schéma ligne de commande"""
        product_id: int = Field(..., gt=0, alias="productId")
        variant_id: Optional[int] = Field(None, gt=0, alias="variantId")
        quantity: int = Field(..., ge=1)
        unit_price: Decimal = Field(..., ge=0, alias="unitPrice")
        discount: Decimal = Field(0, ge=0, le=100)

    class OrderSchema(BaseSchema):
        """Schéma commande"""
        customer_id: int = Field(..., gt=0, alias="customerId")
        lines: List[OrderLineSchema] = Field(..., min_length=1)
        shipping_address: AddressSchema = Field(..., alias="shippingAddress")
        billing_address: Optional[AddressSchema] = Field(None, alias="billingAddress")
        shipping_method_id: Optional[int] = Field(None, gt=0, alias="shippingMethodId")
        payment_method_id: Optional[int] = Field(None, gt=0, alias="paymentMethodId")
        notes: Optional[str] = None
        coupon_code: Optional[str] = Field(None, alias="couponCode")


    # =========================================================================
    # INVENTORY SCHEMAS
    # =========================================================================

    class InventoryAdjustmentSchema(BaseSchema):
        """Schéma ajustement inventaire"""
        product_id: int = Field(..., gt=0, alias="productId")
        warehouse_id: int = Field(..., gt=0, alias="warehouseId")
        quantity: int
        reason: str = Field(..., pattern=r'^(receipt|shipment|adjustment|return|damage|transfer)$')
        notes: Optional[str] = None
        reference: Optional[str] = None

    class StockTransferSchema(BaseSchema):
        """Schéma transfert de stock"""
        product_id: int = Field(..., gt=0, alias="productId")
        source_warehouse_id: int = Field(..., gt=0, alias="sourceWarehouseId")
        destination_warehouse_id: int = Field(..., gt=0, alias="destinationWarehouseId")
        quantity: int = Field(..., ge=1)
        notes: Optional[str] = None


    # =========================================================================
    # FINANCE SCHEMAS
    # =========================================================================

    class InvoiceLineSchema(BaseSchema):
        """Schéma ligne de facture"""
        description: str = Field(..., min_length=1)
        quantity: Decimal = Field(..., gt=0)
        unit_price: Decimal = Field(..., ge=0, alias="unitPrice")
        tax_rate: Decimal = Field(20, ge=0, le=100, alias="taxRate")
        discount: Decimal = Field(0, ge=0, le=100)

    class InvoiceSchema(BaseSchema):
        """Schéma facture"""
        customer_id: int = Field(..., gt=0, alias="customerId")
        order_id: Optional[int] = Field(None, gt=0, alias="orderId")
        lines: List[InvoiceLineSchema] = Field(..., min_length=1)
        due_date: Optional[datetime] = Field(None, alias="dueDate")
        notes: Optional[str] = None
        payment_terms: Optional[str] = Field(None, alias="paymentTerms")

    class PaymentSchema(BaseSchema):
        """Schéma paiement"""
        invoice_id: int = Field(..., gt=0, alias="invoiceId")
        amount: Decimal = Field(..., gt=0)
        method: str = Field(..., pattern=r'^(card|transfer|cash|check|other)$')
        reference: Optional[str] = None
        date: datetime
        notes: Optional[str] = None


# =============================================================================
# VALIDATION DECORATOR
# =============================================================================

def validate_input(schema_class):
    """
    Décorateur pour valider les données d'entrée d'un endpoint.

    Usage:
        @validate_input(ProductSchema)
        def create_product(self, **kwargs):
            validated_data = kwargs['validated_data']
            # ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            from odoo.http import request

            try:
                # Récupérer les données JSON
                data = request.get_json_data() if hasattr(request, 'get_json_data') else {}

                # Valider avec Pydantic
                if PYDANTIC_V2 is not None:
                    validated = schema_class(**data)
                    kwargs['validated_data'] = validated.model_dump() if PYDANTIC_V2 else validated.dict()
                else:
                    # Fallback sans Pydantic
                    kwargs['validated_data'] = data

                return func(self, *args, **kwargs)

            except Exception as e:
                _logger.error(f"Validation error: {e}")
                return {
                    'success': False,
                    'error': 'Validation error',
                    'error_code': 'VALIDATION_ERROR',
                    'details': str(e),
                }

        return wrapper
    return decorator


def validate_data(schema_class, data: dict) -> tuple:
    """
    Valide des données avec un schéma.

    Returns:
        (success, data_or_errors)
    """
    if PYDANTIC_V2 is None:
        return True, data

    try:
        validated = schema_class(**data)
        return True, validated.model_dump() if PYDANTIC_V2 else validated.dict()
    except Exception as e:
        return False, str(e)
