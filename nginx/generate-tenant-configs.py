#!/usr/bin/env python3
"""
Script de génération automatique des configurations Nginx multi-tenant.

Récupère tous les tenants actifs depuis Odoo et génère un fichier de config
Nginx pour chaque tenant avec ses domaines (frontend + backoffice).

Usage:
    python nginx/generate-tenant-configs.py

Requirements:
    pip install requests
"""

import os
import sys
import requests
import json
from pathlib import Path

# Configuration
ODOO_URL = os.getenv('ODOO_URL', 'http://localhost:8069')
ODOO_DB = os.getenv('ODOO_DB', 'quelyos')
ODOO_USERNAME = os.getenv('ODOO_ADMIN_USER', 'admin')
ODOO_PASSWORD = os.getenv('ODOO_ADMIN_PASSWORD', 'admin')

# Chemins
SCRIPT_DIR = Path(__file__).parent
TEMPLATE_FILE = SCRIPT_DIR / 'conf.d' / 'tenant-routing.conf.template'
OUTPUT_DIR = SCRIPT_DIR / 'conf.d' / 'tenants'


def odoo_jsonrpc(url, method, params):
    """Appel JSON-RPC vers Odoo."""
    headers = {'Content-Type': 'application/json'}
    data = {
        'jsonrpc': '2.0',
        'method': 'call',
        'params': params,
        'id': 1
    }
    response = requests.post(f"{url}{method}", json=data, headers=headers)
    response.raise_for_status()
    result = response.json()

    if 'error' in result:
        raise Exception(f"Odoo error: {result['error']}")

    return result.get('result')


def authenticate():
    """Authentification Odoo et récupération du session_id."""
    result = odoo_jsonrpc(ODOO_URL, '/web/session/authenticate', {
        'db': ODOO_DB,
        'login': ODOO_USERNAME,
        'password': ODOO_PASSWORD
    })

    if not result or 'uid' not in result:
        raise Exception("Authentification échouée")

    return result


def get_active_tenants(session_id):
    """Récupère tous les tenants actifs depuis Odoo."""
    result = odoo_jsonrpc(ODOO_URL, '/web/dataset/call_kw', {
        'model': 'quelyos.tenant',
        'method': 'search_read',
        'args': [[['active', '=', True]]],
        'kwargs': {
            'fields': ['code', 'name', 'domain', 'backoffice_domain'],
            'context': {'session_id': session_id}
        }
    })

    return result


def generate_tenant_config(tenant, template_content):
    """Génère la config Nginx pour un tenant donné."""
    # Domaines par défaut si non configurés
    frontend_domain = tenant.get('domain') or f"{tenant['code']}.example.com"
    backoffice_domain = tenant.get('backoffice_domain') or f"admin.{frontend_domain}"

    # Remplacement des variables du template
    config = template_content.replace('${TENANT_CODE}', tenant['code'])
    config = config.replace('${FRONTEND_DOMAIN}', frontend_domain)
    config = config.replace('${BACKOFFICE_DOMAIN}', backoffice_domain)

    return config


def main():
    """Point d'entrée principal."""
    print("🔧 Génération des configurations Nginx multi-tenant...")

    # Vérifier le template
    if not TEMPLATE_FILE.exists():
        print(f"❌ Template introuvable: {TEMPLATE_FILE}")
        sys.exit(1)

    # Créer le dossier de sortie
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    try:
        # Authentification Odoo
        print(f"🔐 Authentification sur {ODOO_URL}...")
        session = authenticate()
        session_id = session.get('session_id')
        print(f"✅ Connecté en tant que {session['username']}")

        # Récupérer les tenants
        print("📦 Récupération des tenants actifs...")
        tenants = get_active_tenants(session_id)
        print(f"✅ {len(tenants)} tenant(s) trouvé(s)")

        # Lire le template
        template_content = TEMPLATE_FILE.read_text()

        # Générer les configs
        for tenant in tenants:
            print(f"\n🏪 Génération config pour: {tenant['name']} ({tenant['code']})")
            print(f"   Frontend: {tenant.get('domain', 'N/A')}")
            print(f"   Backoffice: {tenant.get('backoffice_domain', 'N/A')}")

            # Générer la config
            config_content = generate_tenant_config(tenant, template_content)

            # Sauvegarder
            output_file = OUTPUT_DIR / f"{tenant['code']}.conf"
            output_file.write_text(config_content)
            print(f"   ✅ Généré: {output_file}")

        print(f"\n✨ Terminé ! {len(tenants)} configuration(s) générée(s)")
        print(f"📁 Emplacement: {OUTPUT_DIR}")
        print("\n⚠️  N'oubliez pas de recharger Nginx:")
        print("   docker-compose exec nginx nginx -s reload")

    except Exception as e:
        print(f"\n❌ Erreur: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
