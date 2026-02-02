# -*- coding: utf-8 -*-
"""
Configuration centrale du module quelyos_api
"""

import os
import logging

_logger = logging.getLogger(__name__)

# ==================== CONFIGURATION CORS ====================

# Mode développement : autoriser toutes les origines localhost
# ATTENTION : À désactiver en production via QUELYOS_DEV_MODE=false
DEV_MODE = os.environ.get('QUELYOS_DEV_MODE', 'True').lower() in ('true', '1', 'yes')

# Liste des origines autorisées pour les requêtes CORS
# En production, SEULES ces origines sont autorisées
ALLOWED_ORIGINS = [
    # ============ DÉVELOPPEMENT LOCAL ============
    # Vitrine Quelyos (site vitrine)
    'http://localhost:3000',
    'http://127.0.0.1:3000',

    # Vitrine Client (e-commerce)
    'http://localhost:3001',
    'http://127.0.0.1:3001',

    # Dashboard Client (backoffice)
    'http://localhost:5175',
    'http://127.0.0.1:5175',

    # Super Admin Client
    'http://localhost:9000',
    'http://127.0.0.1:9000',

    # Legacy ports (compatibilité)
    'http://localhost:5173',
    'http://127.0.0.1:5173',

    # ============ PRODUCTION ============
    'https://quelyos.com',
    'https://www.quelyos.com',
    'https://shop.quelyos.com',
    'https://backoffice.quelyos.com',
    'https://admin.quelyos.com',
    'https://api.quelyos.com',
    'https://app.quelyos.com',

    # Domaines tenants (pattern: https://*.quelyos.com)
    # Gérés dynamiquement via QUELYOS_ALLOWED_ORIGINS
]

# Variable d'environnement pour ajouter des origines dynamiquement
# Format: QUELYOS_ALLOWED_ORIGINS="https://tenant1.quelyos.com,https://tenant2.quelyos.com"
env_origins = os.environ.get('QUELYOS_ALLOWED_ORIGINS', '')
if env_origins:
    additional_origins = [origin.strip() for origin in env_origins.split(',') if origin.strip()]
    ALLOWED_ORIGINS.extend(additional_origins)
    _logger.info(f"CORS: {len(additional_origins)} origines ajoutées via env var")

# Logging des origines autorisées au démarrage
if DEV_MODE:
    _logger.warning("CORS: Mode développement activé - localhost autorisé")
else:
    _logger.info(f"CORS: Mode production - {len(ALLOWED_ORIGINS)} origines autorisées")

# Domaine wildcard pour tenants (*.quelyos.com)
# Format: QUELYOS_WILDCARD_DOMAIN="quelyos.com"
WILDCARD_DOMAIN = os.environ.get('QUELYOS_WILDCARD_DOMAIN', '')


def is_origin_allowed(origin):
    """
    Vérifie si l'origine de la requête est autorisée.

    Args:
        origin (str): Origine HTTP (ex: 'http://localhost:3000')

    Returns:
        bool: True si autorisée, False sinon
    """
    if not origin:
        # Pas d'en-tête Origin (requête non-CORS ou même domaine)
        return True

    # En mode développement, autoriser tous les localhost/127.0.0.1
    if DEV_MODE and ('localhost' in origin or '127.0.0.1' in origin):
        return True

    # Vérifier si l'origine est dans la liste blanche exacte
    if origin in ALLOWED_ORIGINS:
        return True

    # Support wildcard pour sous-domaines tenants (ex: *.quelyos.com)
    if WILDCARD_DOMAIN:
        # Extraire le domaine de l'origine (https://tenant.quelyos.com -> tenant.quelyos.com)
        try:
            from urllib.parse import urlparse
            parsed = urlparse(origin)
            host = parsed.netloc or parsed.path

            # Vérifier si c'est un sous-domaine du wildcard
            if host.endswith(f'.{WILDCARD_DOMAIN}') or host == WILDCARD_DOMAIN:
                # En production, exiger HTTPS
                if not DEV_MODE and parsed.scheme != 'https':
                    _logger.warning(f"CORS rejeté: {origin} (HTTPS requis en production)")
                    return False
                return True
        except Exception:
            pass

    # Origine non autorisée - logger pour audit
    _logger.warning(f"CORS rejeté: origine non autorisée '{origin}'")
    return False


def get_cors_headers(origin):
    """
    Génère les en-têtes CORS appropriés pour une requête.

    Args:
        origin (str): Origine HTTP de la requête

    Returns:
        dict: En-têtes CORS à ajouter à la réponse
    """
    if not is_origin_allowed(origin):
        # Origine non autorisée : ne pas renvoyer d'en-têtes CORS
        return {}

    headers = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Id, X-Request-Id, X-Tenant-Id',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '3600',  # Cache preflight pendant 1h
        'Access-Control-Expose-Headers': 'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Window',
    }

    return headers


def get_security_headers():
    """
    Retourne les en-têtes de sécurité HTTP recommandés.

    À ajouter à toutes les réponses API pour renforcer la sécurité.
    """
    return {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
    }


# ==================== CONFIGURATION SÉCURITÉ ====================

# Endpoints admin nécessitant vérification groupe 'base.group_system'
# Ces endpoints DOIVENT appeler _require_admin() avant toute opération
ADMIN_ENDPOINTS = [
    # Gestion produits
    '/api/ecommerce/products/create',
    '/api/ecommerce/products/<int:product_id>/update',
    '/api/ecommerce/products/<int:product_id>/delete',
    '/api/ecommerce/products/<int:product_id>/images',
    '/api/ecommerce/products/<int:product_id>/variants',
    '/api/ecommerce/products/import',
    '/api/ecommerce/products/export',

    # Gestion catégories
    '/api/ecommerce/categories/create',
    '/api/ecommerce/categories/<int:category_id>/update',
    '/api/ecommerce/categories/<int:category_id>/delete',

    # Gestion configuration site
    '/api/ecommerce/site-config/update',

    # Gestion coupons/promotions
    '/api/ecommerce/coupons/create',
    '/api/ecommerce/coupons/<int:coupon_id>/update',
    '/api/ecommerce/coupons/<int:coupon_id>/delete',

    # Gestion entrepôts
    '/api/ecommerce/warehouses/create',
    '/api/ecommerce/warehouses/<int:warehouse_id>/update',
    '/api/ecommerce/warehouses/<int:warehouse_id>/delete',

    # Gestion stock
    '/api/ecommerce/stock/inventory',
    '/api/ecommerce/stock/adjust',

    # Gestion pricelists
    '/api/ecommerce/pricelists/create',
    '/api/ecommerce/pricelists/<int:pricelist_id>/update',
    '/api/ecommerce/pricelists/<int:pricelist_id>/delete',

    # Gestion catégories clients
    '/api/ecommerce/customer-categories/create',
    '/api/ecommerce/customer-categories/<int:category_id>/update',
    '/api/ecommerce/customer-categories/<int:category_id>/delete',

    # Gestion ribbons
    '/api/ecommerce/ribbons/create',
    '/api/ecommerce/ribbons/<int:ribbon_id>/update',
    '/api/ecommerce/ribbons/<int:ribbon_id>/delete',

    # Statistiques admin
    '/api/ecommerce/analytics',
    '/api/ecommerce/admin/stats',

    # Gestion abonnements admin
    '/api/ecommerce/subscription/admin',
]


# ==================== GESTION ERREURS SÉCURISÉE ====================

# Messages d'erreur génériques (ne pas exposer détails techniques)
ERROR_MESSAGES = {
    'generic': 'Une erreur est survenue. Veuillez réessayer.',
    'not_found': 'Ressource non trouvée.',
    'invalid_data': 'Données invalides.',
    'unauthorized': 'Accès non autorisé.',
    'validation': 'Erreur de validation des données.',
    'server': 'Erreur serveur. Veuillez réessayer plus tard.',
}


def safe_error_response(error_key='generic', success=False):
    """
    Retourne une réponse d'erreur sécurisée sans exposer de détails techniques.

    Args:
        error_key: Clé du message dans ERROR_MESSAGES
        success: Valeur du champ success

    Returns:
        dict: Réponse JSON sécurisée
    """
    return {
        'success': success,
        'error': ERROR_MESSAGES.get(error_key, ERROR_MESSAGES['generic'])
    }


# ==================== LIMITES TAUX (Rate Limiting) ====================

# Configuration pour implémenter rate limiting (à faire)
RATE_LIMIT_ENABLED = False
RATE_LIMIT_PER_MINUTE = 60  # Max requêtes/minute par IP
RATE_LIMIT_BURST = 10       # Burst autorisé
