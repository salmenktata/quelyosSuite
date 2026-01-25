#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script pour créer automatiquement 2 tenants de démonstration dans Odoo.
Utilise l'API XML-RPC d'Odoo.
"""

import xmlrpc.client
import sys

# Configuration Odoo
ODOO_URL = "http://localhost:8069"
ODOO_DB = "quelyos"
ODOO_USERNAME = "admin"  # À modifier si différent
ODOO_PASSWORD = "admin"  # À modifier si différent

def create_tenant_via_xmlrpc(tenant_data):
    """Crée un tenant via XML-RPC Odoo"""

    # Connexion
    common = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/common')

    try:
        uid = common.authenticate(ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD, {})
        if not uid:
            print("❌ Erreur: Authentification échouée")
            print("   Vérifiez ODOO_USERNAME et ODOO_PASSWORD dans le script")
            return False
    except Exception as e:
        print(f"❌ Erreur de connexion: {e}")
        return False

    # API Models
    models = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/object')

    try:
        # Vérifier si le tenant existe déjà
        existing = models.execute_kw(
            ODOO_DB, uid, ODOO_PASSWORD,
            'quelyos.tenant', 'search',
            [[('code', '=', tenant_data['code'])]]
        )

        if existing:
            print(f"⚠️  Tenant '{tenant_data['code']}' existe déjà (ID: {existing[0]})")
            return existing[0]

        # Créer le tenant
        tenant_id = models.execute_kw(
            ODOO_DB, uid, ODOO_PASSWORD,
            'quelyos.tenant', 'create',
            [tenant_data]
        )

        print(f"✅ Tenant '{tenant_data['code']}' créé (ID: {tenant_id})")
        return tenant_id

    except Exception as e:
        print(f"❌ Erreur lors de la création: {e}")
        return False

# ═══════════════════════════════════════════════════════════════════════════
# DONNÉES TENANTS
# ═══════════════════════════════════════════════════════════════════════════

# Tenant 1 - Boutique Sport (Bleu)
tenant_sport = {
    'name': 'Boutique Sport',
    'code': 'sport',
    'domain': 'localhost',
    'backoffice_domain': 'localhost:5175',
    'slogan': 'Équipement sportif de qualité',
    'description': 'Découvrez notre sélection d\'équipements sportifs de qualité professionnelle',

    # Branding
    'font_family': 'inter',

    # Couleurs (Thème Bleu Sport)
    'primary_color': '#3b82f6',
    'primary_dark': '#2563eb',
    'primary_light': '#60a5fa',
    'secondary_color': '#10b981',
    'secondary_dark': '#059669',
    'secondary_light': '#34d399',
    'accent_color': '#f59e0b',
    'background_color': '#ffffff',
    'foreground_color': '#0f172a',
    'muted_color': '#f1f5f9',
    'muted_foreground': '#64748b',
    'border_color': '#e2e8f0',
    'ring_color': '#3b82f6',

    # Contact
    'email': 'contact@sport.local',
    'phone': '+33 1 23 45 67 89',

    # SEO
    'meta_title': 'Boutique Sport - Équipement sportif professionnel',
    'meta_description': 'Découvrez notre gamme complète d\'équipements sportifs de qualité à prix compétitifs',

    # Options
    'enable_dark_mode': True,
    'default_dark': False,
    'feature_wishlist': True,
    'feature_comparison': True,
    'feature_reviews': True,
    'feature_newsletter': True,
    'feature_guest_checkout': True,

    'active': True,
}

# Tenant 2 - Marque Mode (Rose)
tenant_mode = {
    'name': 'Marque Mode',
    'code': 'mode',
    'domain': 'localhost',
    'backoffice_domain': 'localhost:5175',
    'slogan': 'L\'élégance à la française',
    'description': 'Mode française haut de gamme pour femmes et hommes',

    # Branding
    'font_family': 'poppins',

    # Couleurs (Thème Rose Mode)
    'primary_color': '#ec4899',
    'primary_dark': '#db2777',
    'primary_light': '#f9a8d4',
    'secondary_color': '#8b5cf6',
    'secondary_dark': '#7c3aed',
    'secondary_light': '#a78bfa',
    'accent_color': '#f59e0b',
    'background_color': '#ffffff',
    'foreground_color': '#0f172a',
    'muted_color': '#f1f5f9',
    'muted_foreground': '#64748b',
    'border_color': '#e2e8f0',
    'ring_color': '#ec4899',

    # Contact
    'email': 'contact@mode.local',
    'phone': '+33 1 98 76 54 32',

    # SEO
    'meta_title': 'Marque Mode - Vêtements tendance et élégants',
    'meta_description': 'Collection exclusive de vêtements français pour un style unique et raffiné',

    # Options
    'enable_dark_mode': True,
    'default_dark': False,
    'feature_wishlist': True,
    'feature_comparison': False,
    'feature_reviews': True,
    'feature_newsletter': True,
    'feature_guest_checkout': True,

    'active': True,
}

# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == '__main__':
    print("🚀 Création des tenants de démonstration\n")
    print(f"📡 Connexion à Odoo: {ODOO_URL}")
    print(f"🗄️  Base de données: {ODOO_DB}")
    print(f"👤 Utilisateur: {ODOO_USERNAME}\n")

    # Créer Tenant Sport
    print("📦 Création Tenant 1: Boutique Sport (Bleu)...")
    result1 = create_tenant_via_xmlrpc(tenant_sport)
    print()

    # Créer Tenant Mode
    print("📦 Création Tenant 2: Marque Mode (Rose)...")
    result2 = create_tenant_via_xmlrpc(tenant_mode)
    print()

    if result1 and result2:
        print("🎉 Configuration terminée avec succès !\n")
        print("🌐 Testez les frontends:")
        print("   - Tenant Sport (Bleu):  http://localhost:3000?tenant=sport")
        print("   - Tenant Mode (Rose):   http://localhost:3000?tenant=mode\n")
        print("💡 Astuce: Faites Cmd+Shift+R pour vider le cache du navigateur")
    else:
        print("⚠️  Certains tenants n'ont pas pu être créés")
        print("\n💡 Si l'authentification a échoué, modifiez ODOO_USERNAME et ODOO_PASSWORD dans le script")
        sys.exit(1)
