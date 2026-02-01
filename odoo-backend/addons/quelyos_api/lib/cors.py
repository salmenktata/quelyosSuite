"""
Configuration CORS sécurisée pour Quelyos Suite

Ce module centralise la liste des origines autorisées pour tous les endpoints API.
Remplace le pattern dangereux cors='*' par une whitelist stricte.
"""

# Liste blanche des origines autorisées (production + dev)
ALLOWED_ORIGINS = [
    # Production - Site Vitrine
    'https://quelyos.com',
    'https://www.quelyos.com',

    # Production - E-commerce
    'https://shop.quelyos.com',

    # Production - 7 SaaS
    'https://finance.quelyos.com',
    'https://store.quelyos.com',
    'https://copilote.quelyos.com',
    'https://sales.quelyos.com',
    'https://retail.quelyos.com',
    'https://team.quelyos.com',
    'https://support.quelyos.com',

    # Production - ERP Complet + Super Admin
    'https://app.quelyos.com',
    'https://admin.quelyos.com',

    # Développement local
    'http://localhost:3000',  # vitrine-quelyos
    'http://localhost:3001',  # vitrine-client (e-commerce)
    'http://localhost:5175',  # dashboard-client (ERP)
    'http://localhost:9000',  # super-admin-client
    'http://localhost:3010',  # SaaS Finance
    'http://localhost:3011',  # SaaS Store
    'http://localhost:3012',  # SaaS Copilote
    'http://localhost:3013',  # SaaS Sales
    'http://localhost:3014',  # SaaS Retail
    'http://localhost:3015',  # SaaS Team
    'http://localhost:3016',  # SaaS Support

    # Développement avec IP locale (mobile testing)
    'http://192.168.1.1:3000',
    'http://192.168.1.1:3001',
]


def check_cors_origin(request):
    """
    Vérifie si l'origine de la requête est autorisée.

    Args:
        request: Objet request Odoo

    Returns:
        dict: {'error': ...} si origine non autorisée, None sinon
    """
    origin = request.httprequest.headers.get('Origin')

    # Si pas d'origine (requête directe curl, Postman), autoriser
    if not origin:
        return None

    # Vérifier si origine dans la whitelist
    if origin not in ALLOWED_ORIGINS:
        return {
            'error': 'CORS policy violation',
            'message': f'Origin {origin} not allowed',
            'allowed_origins': ALLOWED_ORIGINS[:10]  # Montrer 10 premières pour debug
        }

    return None


def set_cors_headers(response, origin=None):
    """
    Ajoute les headers CORS sécurisés à la réponse.

    Args:
        response: Objet response Odoo
        origin: Origine de la requête (optionnel)

    Returns:
        response: Response avec headers CORS ajoutés
    """
    if origin and origin in ALLOWED_ORIGINS:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Max-Age'] = '3600'

    return response
