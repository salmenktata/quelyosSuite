#!/bin/bash
# Script de réinitialisation et installation complète de Quelyos sur base vierge

set -e

echo "=================================================="
echo "🔄 Réinitialisation complète Odoo + Installation Quelyos"
echo "=================================================="
echo ""

# Couleurs pour l'affichage
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="${DB_NAME:-quelyos_fresh}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "   - Base de données: $DB_NAME"
echo "   - Données démo: OUI"
echo "   - Modules: quelyos_core, quelyos_frontend, quelyos_branding, quelyos_ecommerce"
echo ""

# Étape 1: Arrêter les containers
echo -e "${YELLOW}1️⃣  Arrêt des containers...${NC}"
cd "$SCRIPT_DIR"
docker-compose down
echo -e "${GREEN}✓ Containers arrêtés${NC}"
echo ""

# Étape 2: Supprimer les volumes pour repartir de zéro
echo -e "${YELLOW}2️⃣  Suppression des volumes (base de données + données Odoo)...${NC}"
docker volume rm backend_postgres_data backend_odoo_data backend_odoo_config 2>/dev/null || true
echo -e "${GREEN}✓ Volumes supprimés${NC}"
echo ""

# Étape 3: Recréer les containers avec base vierge
echo -e "${YELLOW}3️⃣  Démarrage des containers (PostgreSQL + Odoo)...${NC}"
docker-compose up -d db
echo "   Attente du démarrage de PostgreSQL..."
sleep 10
echo -e "${GREEN}✓ PostgreSQL démarré${NC}"
echo ""

# Étape 4: Créer la base de données avec Odoo (sans demo data pour l'instant)
echo -e "${YELLOW}4️⃣  Création de la base de données Odoo...${NC}"
docker-compose run --rm odoo \
  odoo --addons-path=/mnt/extra-addons,/usr/lib/python3/dist-packages/odoo/addons \
  -d "$DB_NAME" \
  -i base \
  --load-language=fr_FR \
  --without-demo=False \
  --stop-after-init

echo -e "${GREEN}✓ Base de données créée avec module base + données démo${NC}"
echo ""

# Étape 5: Installer les modules Quelyos dans l'ordre
echo -e "${YELLOW}5️⃣  Installation des modules Quelyos...${NC}"

echo "   📦 Installation de quelyos_core..."
docker-compose run --rm odoo \
  odoo --addons-path=/mnt/extra-addons,/usr/lib/python3/dist-packages/odoo/addons \
  -d "$DB_NAME" \
  -i quelyos_core \
  --stop-after-init
echo -e "${GREEN}   ✓ quelyos_core installé${NC}"

echo "   📦 Installation de quelyos_frontend..."
docker-compose run --rm odoo \
  odoo --addons-path=/mnt/extra-addons,/usr/lib/python3/dist-packages/odoo/addons \
  -d "$DB_NAME" \
  -i quelyos_frontend \
  --stop-after-init
echo -e "${GREEN}   ✓ quelyos_frontend installé${NC}"

echo "   📦 Installation de quelyos_branding..."
docker-compose run --rm odoo \
  odoo --addons-path=/mnt/extra-addons,/usr/lib/python3/dist-packages/odoo/addons \
  -d "$DB_NAME" \
  -i quelyos_branding \
  --stop-after-init
echo -e "${GREEN}   ✓ quelyos_branding installé${NC}"

echo "   📦 Installation de quelyos_ecommerce..."
docker-compose run --rm odoo \
  odoo --addons-path=/mnt/extra-addons,/usr/lib/python3/dist-packages/odoo/addons \
  -d "$DB_NAME" \
  -i quelyos_ecommerce \
  --stop-after-init
echo -e "${GREEN}   ✓ quelyos_ecommerce installé${NC}"

echo ""
echo -e "${GREEN}✅ Tous les modules Quelyos sont installés !${NC}"
echo ""

# Étape 6: Démarrer Odoo en mode normal
echo -e "${YELLOW}6️⃣  Démarrage d'Odoo en mode normal...${NC}"
docker-compose up -d odoo
echo "   Attente du démarrage d'Odoo..."
sleep 5
echo -e "${GREEN}✓ Odoo démarré${NC}"
echo ""

# Étape 7: Vérification finale
echo -e "${YELLOW}7️⃣  Vérification de l'installation...${NC}"

echo "   Vérification des modules installés..."
MODULES_CHECK=$(docker-compose exec -T db psql -U odoo -d "$DB_NAME" -tAc \
  "SELECT name, state FROM ir_module_module WHERE name IN ('quelyos_core', 'quelyos_frontend', 'quelyos_branding', 'quelyos_ecommerce') ORDER BY name;")

echo "$MODULES_CHECK" | while IFS='|' read -r module state; do
  if [ "$state" = "installed" ]; then
    echo -e "   ${GREEN}✓${NC} $module: $state"
  else
    echo -e "   ${RED}✗${NC} $module: $state"
  fi
done

echo ""
echo "=================================================="
echo -e "${GREEN}✅ Installation terminée avec succès !${NC}"
echo "=================================================="
echo ""
echo "🌐 Accès:"
echo "   - Backend Odoo: http://localhost:8069"
echo "   - Base de données: $DB_NAME"
echo "   - Login: admin"
echo "   - Password: admin"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. Accéder à Odoo: http://localhost:8069"
echo "   2. Vérifier les modules dans Apps"
echo "   3. Configurer quelyos_frontend (Quelyos → Configuration → Frontend)"
echo "   4. Tester l'API: curl http://localhost:8069/api/ecommerce/products"
echo ""
echo "📊 Commandes utiles:"
echo "   - Voir les logs: docker-compose logs -f odoo"
echo "   - Arrêter: docker-compose down"
echo "   - Redémarrer: docker-compose restart odoo"
echo ""
