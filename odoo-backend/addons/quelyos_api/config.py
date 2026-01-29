# -*- coding: utf-8 -*-
"""
Configuration centrale du module quelyos_api
"""

import os

# ==================== CONFIGURATION CORS ====================

# Liste des origines autorisées pour les requêtes CORS
# En production, restreindre strictement aux domaines légitimes
ALLOWED_ORIGINS = [
    # Environnement local développement
    'http://localhost:3000',      # Frontend Next.js dev
    'http://localhost:5173',      # Backoffice Vite dev (ancien port)
    'http://localhost:5175',      # Backoffice Vite dev (nouveau port)
    'http://localhost:5176',      # Super-admin-client Vite dev
    'http://127.0.0.1:3000',      # Frontend Next.js dev (127.0.0.1)
    'http://127.0.0.1:5173',      # Backoffice Vite dev (127.0.0.1)
    'http://127.0.0.1:5175',      # Backoffice Vite dev (127.0.0.1, nouveau port)
    'http://127.0.0.1:5176',      # Super-admin-client Vite dev (127.0.0.1)

    # Production (à configurer selon votre déploiement)
    # 'https://votre-domaine.com',
    # 'https://admin.votre-domaine.com',
]

# Variable d'environnement pour ajouter des origines dynamiquement
# Format: QUELYOS_ALLOWED_ORIGINS="https://exemple.com,https://autre.com"
env_origins = os.environ.get('QUELYOS_ALLOWED_ORIGINS', '')
if env_origins:
    additional_origins = [origin.strip() for origin in env_origins.split(',') if origin.strip()]
    ALLOWED_ORIGINS.extend(additional_origins)

# Mode développement : autoriser toutes les origines localhost
# ATTENTION : À désactiver en production !
DEV_MODE = os.environ.get('QUELYOS_DEV_MODE', 'True').lower() in ('true', '1', 'yes')

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

    # Vérifier si l'origine est dans la liste blanche
    return origin in ALLOWED_ORIGINS


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

    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Id, X-Request-Id',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '3600',  # Cache preflight pendant 1h
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
