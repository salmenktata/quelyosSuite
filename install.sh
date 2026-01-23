#!/bin/bash

# Script d'installation automatique Quelyos ERP
# Usage: ./install.sh

set -e  # Exit on error

echo "================================================"
echo "🚀 Installation Quelyos ERP"
echo "================================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les étapes
step() {
    echo -e "${BLUE}▶ $1${NC}"
}

success() {
    echo -e "${GREEN}✓ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Vérifier prérequis
step "Vérification des prérequis..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez installer Docker first."
    exit 1
fi
success "Docker trouvé"

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé."
    exit 1
fi
success "Docker Compose trouvé"

if ! command -v node &> /dev/null; then
    warning "Node.js n'est pas installé. Installation du frontend ignorée."
    INSTALL_FRONTEND=false
else
    success "Node.js trouvé ($(node -v))"
    INSTALL_FRONTEND=true
fi

echo ""

# Backend
step "Démarrage du backend Odoo..."
cd backend

if [ ! -f .env ]; then
    warning "Fichier .env manquant. Utilisation des valeurs par défaut."
fi

docker-compose up -d

echo "Attente du démarrage d'Odoo (30 secondes)..."
sleep 30

success "Backend Odoo démarré sur http://localhost:8069"
echo ""

# Frontend
if [ "$INSTALL_FRONTEND" = true ]; then
    step "Installation du frontend Next.js..."
    cd ../frontend

    if [ ! -f .env.local ]; then
        warning "Fichier .env.local manquant. Création avec valeurs par défaut..."
        cat > .env.local << 'ENVEOF'
NEXT_PUBLIC_ODOO_URL=http://localhost:8069
ODOO_DATABASE=quelyos
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_COMPANY_NAME=Quelyos
ENVEOF
        success "Fichier .env.local créé"
    fi

    if [ ! -d node_modules ]; then
        step "Installation des dépendances npm..."
        npm install
        success "Dépendances installées"
    else
        success "Dépendances déjà installées"
    fi

    step "Le frontend peut être démarré avec: npm run dev"
else
    warning "Installation du frontend ignorée (Node.js non disponible)"
fi

echo ""
echo "================================================"
echo "✅ Installation Terminée!"
echo "================================================"
echo ""
echo "📋 Prochaines étapes:"
echo ""
echo "1. Accéder à Odoo:"
echo "   URL: http://localhost:8069"
echo "   Login: admin"
echo "   Password: admin"
echo ""
echo "2. Installer les modules:"
echo "   - Aller dans Apps > Update Apps List"
echo "   - Rechercher 'Quelyos'"
echo "   - Installer: Quelyos Branding + Quelyos E-commerce API"
echo ""
if [ "$INSTALL_FRONTEND" = true ]; then
echo "3. Démarrer le frontend:"
echo "   cd frontend && npm run dev"
echo "   URL: http://localhost:3000"
echo ""
fi
echo "4. Consulter la documentation:"
echo "   - QUICKSTART.md (guide 5 minutes)"
echo "   - README.md (documentation complète)"
echo "   - SESSION_RECAP.md (récapitulatif)"
echo ""
echo "================================================"
echo "🎉 Bon développement!"
echo "================================================"
