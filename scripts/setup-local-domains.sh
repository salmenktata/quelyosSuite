#!/bin/bash
# Script pour configurer des domaines locaux pour tester le multi-tenant

echo "🔧 Configuration des domaines locaux pour multi-tenant"
echo ""

# Vérifier si les entrées existent déjà
if grep -q "tenant1.local" /etc/hosts && grep -q "tenant2.local" /etc/hosts; then
    echo "✅ Les domaines sont déjà configurés dans /etc/hosts"
    echo ""
    grep "tenant[12].local" /etc/hosts
    exit 0
fi

echo "📝 Ajout des domaines locaux à /etc/hosts..."
echo "   (nécessite mot de passe sudo)"
echo ""

# Backup du fichier hosts
sudo cp /etc/hosts /etc/hosts.backup.$(date +%Y%m%d_%H%M%S)

# Ajouter les entrées
echo "# Quelyos ERP - Multi-tenant local development" | sudo tee -a /etc/hosts > /dev/null
echo "127.0.0.1  tenant1.local" | sudo tee -a /etc/hosts > /dev/null
echo "127.0.0.1  tenant2.local" | sudo tee -a /etc/hosts > /dev/null

echo "✅ Domaines ajoutés avec succès !"
echo ""
echo "📋 Entrées ajoutées :"
grep "tenant[12].local" /etc/hosts

echo ""
echo "🎯 Prochaines étapes :"
echo "   1. Créer les 2 tenants dans Odoo (http://localhost:8069)"
echo "   2. Tenant 1 → Domaine: tenant1.local"
echo "   3. Tenant 2 → Domaine: tenant2.local"
echo "   4. Accéder aux frontends :"
echo "      - http://tenant1.local:3000"
echo "      - http://tenant2.local:3000"
