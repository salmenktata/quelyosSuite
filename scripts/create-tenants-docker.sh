#!/bin/bash
# Script pour créer les tenants via docker exec dans le conteneur Odoo

echo "🚀 Création des tenants de démonstration via Docker..."
echo ""

# Script Python à exécuter dans le conteneur
PYTHON_SCRIPT='
import odoo
from odoo import api, SUPERUSER_ID

# Connexion à la base de données
db_name = "quelyos"
registry = odoo.registry(db_name)

with registry.cursor() as cr:
    env = api.Environment(cr, SUPERUSER_ID, {})

    # Données Tenant Sport
    tenant_sport = {
        "name": "Boutique Sport",
        "code": "sport",
        "domain": "localhost",
        "backoffice_domain": "localhost:5175",
        "slogan": "Équipement sportif de qualité",
        "description": "Découvrez notre sélection d'\''équipements sportifs de qualité professionnelle",
        "font_family": "inter",
        "primary_color": "#3b82f6",
        "primary_dark": "#2563eb",
        "primary_light": "#60a5fa",
        "secondary_color": "#10b981",
        "secondary_dark": "#059669",
        "secondary_light": "#34d399",
        "accent_color": "#f59e0b",
        "background_color": "#ffffff",
        "foreground_color": "#0f172a",
        "muted_color": "#f1f5f9",
        "muted_foreground": "#64748b",
        "border_color": "#e2e8f0",
        "ring_color": "#3b82f6",
        "email": "contact@sport.local",
        "phone": "+33 1 23 45 67 89",
        "meta_title": "Boutique Sport - Équipement sportif professionnel",
        "meta_description": "Découvrez notre gamme complète d'\''équipements sportifs de qualité à prix compétitifs",
        "enable_dark_mode": True,
        "default_dark": False,
        "feature_wishlist": True,
        "feature_comparison": True,
        "feature_reviews": True,
        "feature_newsletter": True,
        "feature_guest_checkout": True,
        "active": True,
    }

    # Données Tenant Mode
    tenant_mode = {
        "name": "Marque Mode",
        "code": "mode",
        "domain": "localhost",
        "backoffice_domain": "localhost:5175",
        "slogan": "L'\''élégance à la française",
        "description": "Mode française haut de gamme pour femmes et hommes",
        "font_family": "poppins",
        "primary_color": "#ec4899",
        "primary_dark": "#db2777",
        "primary_light": "#f9a8d4",
        "secondary_color": "#8b5cf6",
        "secondary_dark": "#7c3aed",
        "secondary_light": "#a78bfa",
        "accent_color": "#f59e0b",
        "background_color": "#ffffff",
        "foreground_color": "#0f172a",
        "muted_color": "#f1f5f9",
        "muted_foreground": "#64748b",
        "border_color": "#e2e8f0",
        "ring_color": "#ec4899",
        "email": "contact@mode.local",
        "phone": "+33 1 98 76 54 32",
        "meta_title": "Marque Mode - Vêtements tendance et élégants",
        "meta_description": "Collection exclusive de vêtements français pour un style unique et raffiné",
        "enable_dark_mode": True,
        "default_dark": False,
        "feature_wishlist": True,
        "feature_comparison": False,
        "feature_reviews": True,
        "feature_newsletter": True,
        "feature_guest_checkout": True,
        "active": True,
    }

    # Créer les tenants
    Tenant = env["quelyos.tenant"]

    # Tenant Sport
    existing_sport = Tenant.search([("code", "=", "sport")], limit=1)
    if existing_sport:
        print(f"⚠️  Tenant sport existe déjà (ID: {existing_sport.id})")
    else:
        tenant_sport_obj = Tenant.create(tenant_sport)
        print(f"✅ Tenant sport créé (ID: {tenant_sport_obj.id})")

    # Tenant Mode
    existing_mode = Tenant.search([("code", "=", "mode")], limit=1)
    if existing_mode:
        print(f"⚠️  Tenant mode existe déjà (ID: {existing_mode.id})")
    else:
        tenant_mode_obj = Tenant.create(tenant_mode)
        print(f"✅ Tenant mode créé (ID: {tenant_mode_obj.id})")

    cr.commit()
    print("")
    print("🎉 Configuration terminée !")
'

# Exécuter dans le conteneur Odoo
docker-compose exec -T odoo python3 -c "$PYTHON_SCRIPT"

echo ""
echo "🌐 Testez les frontends:"
echo "   - Tenant Sport (Bleu):  http://localhost:3000?tenant=sport"
echo "   - Tenant Mode (Rose):   http://localhost:3000?tenant=mode"
echo ""
echo "💡 Astuce: Faites Cmd+Shift+R pour vider le cache du navigateur"
