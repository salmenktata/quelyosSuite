#!/bin/bash

# Script de conversion ModularLayout → Layout pour pages reporting
# Usage: ./convert-reporting-pages.sh

set -e

PAGES=(
  "breakeven"
  "forecast"
  "by-category"
  "by-flow"
  "by-account"
  "by-portfolio"
  "profitability"
  "data-quality"
)

JSDOCS=(
  "/**\n * Point Mort (Break-even) - Seuil de Rentabilité\n *\n * Fonctionnalités :\n * - Calcul du point mort (CA minimum pour couvrir charges fixes + variables)\n * - Classification des dépenses en coûts fixes vs variables\n * - Marge de sécurité et taux de couverture\n * - Simulation de scénarios pour optimiser la rentabilité\n * - Recommandations pour réduire le seuil de rentabilité\n */"
  "/**\n * Prévisions Financières - Projection Trésorerie et Résultats\n *\n * Fonctionnalités :\n * - Projection trésorerie future basée sur tendances historiques\n * - Scénarios multiples (optimiste, pessimiste, réaliste)\n * - Anticipation besoins de financement sur 3-6-12 mois\n * - Comparaison prévisions vs réalisé pour affiner modèles\n * - Alertes écarts significatifs entre prévisions et réalisé\n */"
  "/**\n * Analyse par Catégorie - Breakdown Revenus et Dépenses\n *\n * Fonctionnalités :\n * - Détail revenus et dépenses par catégorie (salaires, marketing, etc.)\n * - Drill-down dans les transactions par catégorie\n * - Identification postes en hausse anormale ou non budgétés\n * - Comparaison dépenses réelles vs budgets prévisionnels\n * - Établissement benchmarks internes (% CA) par catégorie clé\n */"
  "/**\n * Analyse par Flux - Récurrent vs One-shot, Fixes vs Variables\n *\n *Fonctionnalités :\n * - Segmentation flux : récurrent vs one-shot, fixes vs variables\n * - Analyse prévisibilité de l'activité (poids des revenus récurrents)\n * - Suivi ratio charges fixes/variables pour maintenir flexibilité\n * - Identification opportunités transformation one-shot en récurrent\n * - Recommandations d'optimisation structure de coûts\n */"
  "/**\n * Analyse par Compte Bancaire - Performance Multi-Comptes\n *\n * Fonctionnalités :\n * - Suivi performance de chaque compte : soldes, mouvements, évolution\n * - Analyse mouvements pour détecter anomalies ou fraudes\n * - Comparaison frais bancaires entre comptes pour négociation\n * - Optimisation répartition trésorerie (courant vs épargne rémunérée)\n * - Surveillance comptes devises pour anticiper impacts de change\n */"
  "/**\n * Analyse par Portefeuille - Vue Consolidée par Groupes\n *\n * Fonctionnalités :\n * - Consolidation comptes en portefeuilles (entité, projet, filiale)\n * - Comparaison performance relative de chaque portefeuille\n * - Identification portefeuilles rentables vs déficitaires\n * - Suivi flux inter-portefeuilles (prêts, transferts, refacturations)\n * - Vue consolidée groupe avec détail par entité\n */"
  "/**\n * Rentabilité - Marges, Ratios et Coûts par Catégorie\n *\n * Fonctionnalités :\n * - Calcul et suivi marges brutes, opérationnelles et nettes\n * - Identification catégories revenus avec meilleures marges\n * - Analyse coûts par catégorie pour repérer dérapages\n * - Comparaison ratios de rentabilité aux benchmarks sectoriels\n * - Priorisation actions sur leviers à fort impact (prix, mix, productivité)\n */"
  "/**\n * Qualité des Données KPIs - Fiabilité et Recommandations\n *\n * Fonctionnalités :\n * - Vérification intégrité et qualité données financières\n * - Détection anomalies, doublons et incohérences\n * - Transactions non catégorisées et comptes orphelins\n * - Rapprochement bancaire : écarts soldes système vs relevés\n * - Recommandations d'amélioration qualité données pour KPIs fiables\n */"
)

BREADCRUMB_LABELS=(
  "Point Mort"
  "Prévisions"
  "Par Catégorie"
  "Par Flux"
  "Par Compte"
  "Par Portefeuille"
  "Rentabilité"
  "Qualité Données"
)

for i in "${!PAGES[@]}"; do
  PAGE="${PAGES[$i]}"
  JSDOC="${JSDOCS[$i]}"
  LABEL="${BREADCRUMB_LABELS[$i]}"

  FILE="src/pages/finance/reporting/${PAGE}/page.tsx"

  echo "Processing $FILE..."

  # Backup
  cp "$FILE" "$FILE.bak"

  # 1. Ajouter JSDoc au début (après les imports existants, avant export default)
  # 2. Remplacer imports ModularLayout → Layout
  # 3. Supprimer import ReportingNav
  # 4. Supprimer imports ChevronLeft, Link, ROUTES
  # 5. Ajouter import Breadcrumbs si manquant

  sed -i '' \
    -e 's/import { ModularLayout } from "@\/components\/ModularLayout";/import { Layout } from '\''@\/components\/Layout'\'';/' \
    -e 's/import { ReportingNav } from "@\/components\/finance\/reporting\/ReportingNav";//' \
    -e 's/import { PageNotice } from "@\/components\/common";/import { Breadcrumbs, PageNotice } from '\''@\/components\/common'\'';/' \
    -e '/ChevronLeft,/d' \
    -e '/import { Link } from "react-router-dom";/d' \
    -e '/import { ROUTES } from "@\/lib\/finance\/compat\/routes";/d' \
    -e 's/<ModularLayout>/<Layout>/' \
    -e 's/<\/ModularLayout>/<\/Layout>/' \
    -e 's/className="mb-8"/className="space-y-6"/' \
    "$FILE"

  echo "✓ $FILE converted"
done

echo "✅ All files converted successfully!"
echo "Run: git diff src/pages/finance/reporting/ to review changes"
