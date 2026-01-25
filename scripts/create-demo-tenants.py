#!/usr/bin/env python3
"""
Script pour créer 2 tenants de démonstration dans Odoo
Usage: python3 scripts/create-demo-tenants.py
"""

import json
import requests

ODOO_URL = "http://localhost:8069"
# Remplacez par votre session_id admin (récupéré depuis les cookies du navigateur)
SESSION_ID = "YOUR_ADMIN_SESSION_ID"

def create_tenant(data):
    """Crée un tenant via l'API"""
    url = f"{ODOO_URL}/api/ecommerce/tenant/create"
    headers = {
        "Content-Type": "application/json",
        "X-Session-Id": SESSION_ID
    }

    response = requests.post(url, json=data, headers=headers)
    return response.json()

# Tenant 1 - Boutique Sport
tenant1 = {
    "name": "Boutique Sport",
    "code": "boutiquesport",
    "domain": "tenant1.local",
    "backoffice_domain": "localhost:5175",
    "slogan": "Votre équipement sportif de qualité",
    "plan_code": "starter",
    "admin_email": "admin@tenant1.local",
    "primary_color": "#3b82f6",  # Bleu
    "secondary_color": "#10b981",  # Vert
    "accent_color": "#f59e0b",  # Orange
    "email": "contact@tenant1.local",
    "phone": "+33 1 23 45 67 89",
    "meta_title": "Boutique Sport - Équipement sportif",
    "meta_description": "Découvrez notre sélection d'équipements sportifs de qualité",
    "feature_wishlist": True,
    "feature_comparison": True,
    "feature_reviews": True,
    "feature_newsletter": True,
    "enable_dark_mode": True
}

# Tenant 2 - Marque Mode
tenant2 = {
    "name": "Marque Mode",
    "code": "marquemode",
    "domain": "tenant2.local",
    "backoffice_domain": "localhost:5175",
    "slogan": "L'élégance à la française",
    "plan_code": "pro",
    "admin_email": "admin@tenant2.local",
    "primary_color": "#ec4899",  # Rose
    "secondary_color": "#8b5cf6",  # Violet
    "accent_color": "#f59e0b",  # Orange
    "email": "contact@tenant2.local",
    "phone": "+33 1 98 76 54 32",
    "meta_title": "Marque Mode - Vêtements tendance",
    "meta_description": "Mode française haut de gamme pour femmes et hommes",
    "feature_wishlist": True,
    "feature_comparison": False,
    "feature_reviews": True,
    "feature_newsletter": True,
    "enable_dark_mode": True
}

if __name__ == "__main__":
    if SESSION_ID == "YOUR_ADMIN_SESSION_ID":
        print("❌ Erreur: Vous devez remplacer SESSION_ID dans le script")
        print("")
        print("Pour récupérer votre session_id:")
        print("1. Ouvrez http://localhost:5175 dans votre navigateur")
        print("2. Ouvrez la console développeur (F12)")
        print("3. Allez dans Application → Cookies → http://localhost:5175")
        print("4. Copiez la valeur de 'session_id'")
        print("5. Remplacez SESSION_ID = 'YOUR_ADMIN_SESSION_ID' dans ce fichier")
        exit(1)

    print("🚀 Création des tenants de démonstration...")
    print("")

    # Créer Tenant 1
    print("📦 Création Tenant 1: Boutique Sport...")
    result1 = create_tenant(tenant1)
    if result1.get("success"):
        print(f"✅ Tenant 1 créé avec succès (ID: {result1.get('id')})")
    else:
        print(f"❌ Erreur Tenant 1: {result1.get('error')}")
    print("")

    # Créer Tenant 2
    print("📦 Création Tenant 2: Marque Mode...")
    result2 = create_tenant(tenant2)
    if result2.get("success"):
        print(f"✅ Tenant 2 créé avec succès (ID: {result2.get('id')})")
    else:
        print(f"❌ Erreur Tenant 2: {result2.get('error')}")
    print("")

    print("🎉 Configuration terminée !")
    print("")
    print("🌐 Accédez aux frontends:")
    print("   - Tenant 1: http://tenant1.local:3000")
    print("   - Tenant 2: http://tenant2.local:3000")
    print("")
    print("🔐 Accédez au backoffice pour chaque tenant:")
    print("   - Login: admin@tenant1.local ou admin@tenant2.local")
    print("   - Password: (voir email ou demander à l'admin)")
