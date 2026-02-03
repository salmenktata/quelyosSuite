#!/bin/bash
# Script principal de standardisation des variables .env

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                           ║"
echo "║         🔄 STANDARDISATION VARIABLES ENVIRONNEMENT                        ║"
echo "║                                                                           ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

# Rendre les scripts exécutables
chmod +x scripts/migrate-env-dashboard.sh
chmod +x scripts/migrate-env-superadmin.sh
chmod +x scripts/migrate-env-vitrine-quelyos.sh

# Exécuter les migrations
./scripts/migrate-env-dashboard.sh
echo ""
./scripts/migrate-env-superadmin.sh
echo ""
./scripts/migrate-env-vitrine-quelyos.sh

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Migration des fichiers .env complète!"
echo ""
echo "⚠️  ACTIONS MANUELLES REQUISES:"
echo ""
echo "1. Mettre à jour le code utilisant les anciennes variables:"
echo "   • Dashboard: VITE_API_URL, VITE_SHOP_URL, VITE_SITE_URL, VITE_API_TIMEOUT"
echo "   • Super-Admin: VITE_API_TIMEOUT"
echo "   • Vitrine-Quelyos: BACKEND_DB, NEXT_PUBLIC_WEBSITE_URL"
echo ""
echo "2. Tester tous les frontends:"
echo "   $ pnpm dev --filter \"./dashboard-client\""
echo "   $ pnpm dev --filter \"./super-admin-client\""
echo "   $ pnpm dev --filter \"./vitrine-quelyos\""
echo ""
echo "3. Valider les builds:"
echo "   $ pnpm build --filter \"./dashboard-client\""
echo "   $ pnpm build --filter \"./super-admin-client\""
echo "   $ pnpm build --filter \"./vitrine-quelyos\""
echo ""
echo "4. Supprimer les fichiers .bak si tout fonctionne:"
echo "   $ find . -name \".env*.bak\" -delete"
echo ""
echo "📖 Documentation: .claude/STANDARDISATION_ENV_VARS.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
