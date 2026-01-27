import {
  TrendingUp,
  DollarSign,
  PieChart,
  Calendar,
  BarChart3,
  CreditCard,
  Wallet,
  Building2,
  Target,
  TrendingDown,
  FileText,
  type LucideIcon,
} from 'lucide-react';
import type { PageNoticeConfig } from './types';

/**
 * Configurations des notices pour le module Finance
 * Couleur: emerald (vert)
 */
export const financeNotices: Record<string, PageNoticeConfig> = {
  // Reporting
  dso: {
    pageId: 'finance-dso',
    title: "DSO - Délai d'Encaissement Client",
    purpose:
      "Le DSO (Days Sales Outstanding) mesure le nombre moyen de jours nécessaires pour encaisser vos créances clients. C'est un indicateur clé de la santé de votre trésorerie et de l'efficacité de votre recouvrement.",
    icon: Calendar as LucideIcon,
    moduleColor: 'emerald',
    sections: [
      {
        title: 'Pour un suivi fiable',
        items: [
          "Suivez l'évolution du DSO mensuellement pour détecter les dégradations",
          "Identifiez les clients avec des retards récurrents et mettez en place des relances systématiques",
          `Comparez votre DSO aux conditions de paiement négociées (ex: Net 30, Net 45)`,
          `Visez un DSO < 45 jours pour maintenir une trésorerie saine`,
          `Analysez les factures en retard et intensifiez les actions de recouvrement`,
        ],
      },
    ],
  },

  ebitda: {
    pageId: 'finance-ebitda',
    title: 'EBITDA - Rentabilité Opérationnelle',
    purpose:
      "L'EBITDA (Earnings Before Interest, Taxes, Depreciation & Amortization) mesure la rentabilité de votre activité opérationnelle avant les éléments financiers et comptables. C'est l'indicateur de référence pour évaluer la performance économique pure de votre entreprise.",
    icon: TrendingUp as LucideIcon,
    moduleColor: 'emerald',
    sections: [
      {
        title: 'Pour un suivi fiable',
        items: [
          "Suivez l'évolution mensuelle de la marge EBITDA (EBITDA / CA)",
          "Comparez votre marge EBITDA au benchmark sectoriel TPE/PME (cible > 15%)",
          "Analysez les variations pour identifier les leviers d'amélioration (prix, coûts)",
          "Utilisez l'EBITDA pour anticiper votre capacité d'investissement et de remboursement",
          "Surveillez la cohérence entre croissance du CA et amélioration de l'EBITDA",
        ],
      },
    ],
  },

  bfr: {
    pageId: 'finance-bfr',
    title: 'BFR - Besoin en Fonds de Roulement',
    purpose:
      "Le BFR mesure l'argent immobilisé dans votre cycle d'exploitation (créances clients + stock - dettes fournisseurs). Un BFR élevé signifie que vous devez financer votre activité avec votre trésorerie ou des crédits.",
    icon: Wallet as LucideIcon,
    moduleColor: 'emerald',
    sections: [
      {
        title: 'Pour un suivi fiable',
        items: [
          "Suivez l'évolution du BFR en jours de CA (cible < 30 jours)",
          "Surveillez les trois composantes: DSO (créances), rotation stock, DPO (dettes)",
          `Analysez les tendances: un BFR croissant dégrade la trésorerie`,
          `Identifiez les actions prioritaires: réduire DSO, négocier DPO, optimiser stock`,
          `Anticipez les pics de BFR (saisonnalité, forte croissance) pour sécuriser le financement`,
        ],
      },
    ],
  },

  breakeven: {
    pageId: 'finance-breakeven',
    title: 'Point Mort - Seuil de Rentabilité',
    purpose:
      "Le point mort indique le chiffre d'affaires minimum à réaliser pour couvrir l'ensemble de vos charges (fixes et variables). Au-delà, chaque euro de CA génère du profit. C'est un outil essentiel pour piloter votre rentabilité.",
    icon: Target as LucideIcon,
    moduleColor: 'emerald',
    sections: [
      {
        title: 'Pour un suivi fiable',
        items: [
          `Classifiez correctement vos catégories de dépenses en FIXED (loyer, salaires) ou VARIABLE (achats, commissions)`,
          "Suivez mensuellement l'écart entre votre CA réel et votre seuil de rentabilité",
          "Calculez votre marge de sécurité (cible > 20%) pour absorber les variations",
          "Simulez l'impact des décisions: embauche, nouveau local, baisse de prix",
          `Identifiez les leviers pour réduire le point mort: baisser coûts fixes, améliorer marge variable`,
        ],
      },
    ],
  },

  cashflow: {
    pageId: 'finance-cashflow',
    title: 'Trésorerie',
    purpose:
      "L'analyse de trésorerie suit vos encaissements et décaissements réels pour anticiper votre solde bancaire. C'est le nerf de la guerre: une entreprise peut être rentable sur le papier mais en difficulté si elle manque de cash.",
    icon: DollarSign as LucideIcon,
    moduleColor: 'emerald',
    sections: [
      {
        title: 'Pour un suivi fiable',
        items: [
          `Consultez votre solde et prévisions de trésorerie quotidiennement ou hebdomadairement`,
          `Identifiez les entrées et sorties à venir sur 30, 60, 90 jours`,
          `Anticipez les tensions (gros paiements, période creuse) et sécurisez des lignes de crédit`,
          `Analysez le waterfall pour comprendre les flux entre début et fin de période`,
          `Comparez systématiquement prévisions vs réalisé pour affiner vos estimations`,
        ],
      },
    ],
  },

  byCategory: {
    pageId: 'finance-by-category',
    title: 'Analyse par Catégorie',
    purpose:
      "Ce rapport détaille vos revenus et dépenses par catégorie (salaires, marketing, fournitures, etc.). Il vous permet de comprendre où va votre argent et d'identifier les postes à optimiser.",
    icon: PieChart as LucideIcon,
    moduleColor: 'emerald',
    sections: [
      {
        title: 'Pour un suivi fiable',
        items: [
          `Revoyez mensuellement les principales catégories de dépenses`,
          `Identifiez les catégories en hausse anormale ou non budgétées`,
          `Comparez les dépenses réelles aux budgets prévisionnels par catégorie`,
          `Utilisez le drill-down pour auditer les transactions suspectes ou inhabituelles`,
          `Établissez des benchmarks internes (% CA) pour chaque catégorie clé`,
        ],
      },
    ],
  },

  byFlow: {
    pageId: 'finance-by-flow',
    title: 'Analyse par Flux',
    purpose:
      "Ce rapport segmente vos flux en récurrent vs one-shot et fixes vs variables. Il vous aide à comprendre la prévisibilité de votre activité et la structure de vos coûts pour mieux piloter votre rentabilité.",
    icon: TrendingDown as LucideIcon,
    moduleColor: 'emerald',
    sections: [
      {
        title: 'Pour un suivi fiable',
        items: [
          `Suivez le poids des revenus récurrents (abonnements, contrats) vs one-shot (projets)`,
          `Analysez la part de charges fixes (incompressibles) vs variables (liées au CA)`,
          `Visez à augmenter les revenus récurrents pour plus de stabilité`,
          "Surveillez l'évolution du ratio charges fixes/variables pour maintenir la flexibilité",
          "Identifiez les opportunités de transformer du one-shot en récurrent",
        ],
      },
    ],
  },

  byAccount: {
    pageId: 'finance-by-account',
    title: 'Analyse par Compte Bancaire',
    purpose:
      "Ce rapport vous permet de suivre la performance de chaque compte bancaire: soldes, mouvements, évolution. Utile pour piloter plusieurs comptes (courant, épargne, devises) ou comparer plusieurs entités.",
    icon: CreditCard as LucideIcon,
    moduleColor: 'emerald',
    sections: [
      {
        title: 'Pour un suivi fiable',
        items: [
          `Consultez régulièrement le solde de chaque compte pour éviter les découverts`,
          `Analysez les mouvements pour identifier les anomalies ou fraudes`,
          `Comparez les frais bancaires entre comptes et négociez avec votre banque`,
          `Optimisez la répartition de trésorerie entre comptes (courant vs épargne rémunérée)`,
          `Surveillez les comptes de devises pour anticiper les impacts de change`,
        ],
      },
    ],
  },

  byPortfolio: {
    pageId: 'finance-by-portfolio',
    title: 'Analyse par Portefeuille',
    purpose:
      "Ce rapport consolide vos comptes en portefeuilles (par entité, projet, filiale, etc.). Il offre une vue d'ensemble pour piloter plusieurs activités ou entités de manière consolidée.",
    icon: Building2 as LucideIcon,
    moduleColor: 'emerald',
    sections: [
      {
        title: 'Pour un suivi fiable',
        items: [
          `Définissez vos portefeuilles selon votre organisation (filiales, projets, BU)`,
          `Comparez la performance relative de chaque portefeuille`,
          `Identifiez les portefeuilles rentables vs déficitaires`,
          `Suivez les flux inter-portefeuilles (prêts, transferts, refacturations)`,
          `Consolidez pour obtenir une vision groupe tout en conservant le détail par entité`,
        ],
      },
    ],
  },

  profitability: {
    pageId: 'finance-profitability',
    title: 'Rentabilité',
    purpose:
      "Ce rapport analyse vos marges, ratios et rentabilité par catégorie. Il vous permet d'identifier les activités, produits ou clients les plus rentables et ceux qui détruisent de la valeur.",
    icon: BarChart3 as LucideIcon,
    moduleColor: 'emerald',
    sections: [
      {
        title: 'Pour un suivi fiable',
        items: [
          `Calculez et suivez vos marges brutes, opérationnelles et nettes mensuellement`,
          `Identifiez les catégories de revenus avec les meilleures marges`,
          `Analysez les coûts par catégorie pour repérer les dérapages`,
          `Comparez vos ratios de rentabilité aux benchmarks sectoriels`,
          `Priorisez les actions sur les leviers à fort impact: prix, mix produit, productivité`,
        ],
      },
    ],
  },

  overview: {
    pageId: 'finance-overview',
    title: 'Vue d ensemble',
    purpose:
      "Ce rapport offre une synthèse de vos principaux KPIs financiers: trésorerie, revenus, dépenses, tendances. C'est votre tableau de bord pour piloter l'essentiel en un coup d'œil.",
    icon: BarChart3 as LucideIcon,
    moduleColor: 'emerald',
    sections: [
      {
        title: 'Pour un suivi fiable',
        items: [
          `Consultez cette vue d ensemble quotidiennement ou hebdomadairement`,
          `Surveillez les KPIs clés: solde de trésorerie, CA du mois, burn rate`,
          `Identifiez rapidement les tendances (amélioration, dégradation)`,
          `Utilisez cette vue pour préparer vos comités de direction ou boards`,
          `Complétez avec les rapports détaillés quand un KPI nécessite une investigation`,
        ],
      },
    ],
  },

  forecast: {
    pageId: 'finance-forecast',
    title: 'Prévisions',
    purpose:
      "Ce rapport projette votre trésorerie et résultats futurs sur la base des tendances et récurrence. Il vous aide à anticiper les besoins de financement et piloter proactivement votre activité.",
    icon: FileText as LucideIcon,
    moduleColor: 'emerald',
    sections: [
      {
        title: 'Pour un suivi fiable',
        items: [
          `Actualisez vos prévisions mensuellement en intégrant les dernières données`,
          `Comparez systématiquement prévisions vs réalisé pour affiner les modèles`,
          `Simulez différents scénarios (optimiste, pessimiste, réaliste)`,
          `Identifiez les périodes critiques nécessitant des actions correctives`,
          `Utilisez les prévisions pour négocier des financements en anticipation`,
        ],
      },
    ],
  },

  charts: {
    pageId: 'finance-charts',
    title: 'Graphiques Financiers',
    purpose:
      "Visualisez vos données financières sous forme de graphiques interactifs pour identifier rapidement les tendances, anomalies et opportunités d'optimisation.",
    icon: BarChart3 as LucideIcon,
    moduleColor: 'emerald',
    sections: [
      {
        title: 'Bonnes pratiques',
        items: [
          `Consultez l'évolution mensuelle pour détecter les variations saisonnières`,
          `Analysez la répartition par catégories pour identifier les postes prioritaires`,
          `Utilisez le cash-flow projeté pour anticiper les besoins de trésorerie à 90 jours`,
          `Exportez les graphiques pour vos présentations et rapports de gestion`,
          `Comparez les périodes pour mesurer la croissance et l'impact des actions correctives`,
        ],
      },
    ],
  },
};
