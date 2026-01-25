#!/bin/bash
# Script pour upgrader le module quelyos_api et charger les tenants par défaut

echo "🔄 Upgrade du module quelyos_api..."
echo ""

# Vérifier si Odoo tourne
if ! lsof -i :8069 > /dev/null 2>&1; then
    echo "❌ Erreur: Odoo ne semble pas tourner sur le port 8069"
    echo "   Démarrez Odoo d'abord"
    exit 1
fi

echo "📦 Upgrade du module quelyos_api (version 19.0.1.0.30)..."
echo "   Cela va créer les 2 tenants par défaut:"
echo "   - Boutique Sport (code: sport, couleur: bleu)"
echo "   - Marque Mode (code: mode, couleur: rose)"
echo ""

# Méthode 1 : Via Docker (si disponible)
if command -v docker &> /dev/null && docker ps | grep -q odoo; then
    echo "🐳 Upgrade via Docker..."
    docker exec -it $(docker ps | grep odoo | awk '{print $1}') \
        odoo -d quelyos -u quelyos_api --stop-after-init

    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Module upgradé avec succès !"
        echo ""
        echo "🎉 Les 2 tenants ont été créés !"
        echo ""
        echo "🌐 Testez les frontends:"
        echo "   - Tenant Sport (Bleu):  http://localhost:3000?tenant=sport"
        echo "   - Tenant Mode (Rose):   http://localhost:3000?tenant=mode"
        echo ""
        echo "💡 Astuce: Faites Cmd+Shift+R pour vider le cache du navigateur"
        exit 0
    else
        echo "❌ Erreur lors de l'upgrade"
        exit 1
    fi
fi

# Méthode 2 : Via l'interface Odoo
echo "⚠️  Docker non disponible"
echo ""
echo "📋 Upgrade manuel via interface Odoo:"
echo ""
echo "1. Ouvrir http://localhost:8069"
echo "2. Menu → Apps"
echo "3. Rechercher 'Quelyos API'"
echo "4. Cliquer sur 'Upgrade'"
echo "5. Attendre la fin du processus"
echo ""
echo "Ou utiliser la commande Odoo directement :"
echo "  odoo -d quelyos -u quelyos_api --stop-after-init"
