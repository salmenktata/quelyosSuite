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
  ArrowDownCircle,
  ArrowUpCircle,
  Users,
  Lightbulb,
  Bell,
  Tag,
  Archive,
  FolderOpen,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import type { PageNoticeConfig } from './types';

/**
 * Configurations des notices pour le module Finance
 * Couleur: emerald (vert)
 */
export const financeNotices: Record<string, PageNoticeConfig> = {
  // Dashboard
  dashboard: {
    pageId: 'finance-dashboard',
    title: 'Tableau de bord Finance',
    purpose:
      "Pilotez votre trésorerie en temps réel avec KPIs, alertes, prévisions et insights personnalisés pour optimiser vos décisions financières.",
    icon: BarChart3 as LucideIcon,
    moduleColor: 'emerald',
    sections: [
      {
        title: 'Navigation rapide',
        icon: Lightbulb,
        items: [
          'KPIs Hero : solde actuel, évolution et tendances instantanées',
          'Alertes prioritaires : actions urgentes et notifications importantes',
          'KPIs critiques : métriques clés pour piloter votre activité (DSO, BFR, cash burn)',
          'Timeline 90 jours : projection trésorerie avec zones de risque identifiées',
          'Insights AI : analyses automatiques et recommandations contextuelles',
          'Activité récente : dernières transactions et mouvements bancaires',
          'Mode comparaison : comparez avec périodes antérieures pour identifier les écarts',
        ],
      },
    ],
  },

  // Paramètres
  settings: {
    pageId: 'finance-settings',
    title: 'Paramètres Finance',
    purpose: "Centralisez tous vos réglages pour personnaliser votre expérience Finance selon vos besoins métier et vos préférences.",
    icon: Settings as LucideIcon,
    moduleColor: 'emerald',
    sections: [
      {
        title: 'Organisation par groupes',
        icon: Lightbulb,
        items: [
          'Configuration de base : devise, formats, TVA et fiscalité pour démarrer rapidement',
          'Données métier : catégories de transactions et types de flux de paiement personnalisables',
          'Abonnement & Facturation : gestion de votre plan et paiements récurrents',
          'Préférences & connexions : sécurité, notifications, exports et intégrations externes',
          'Mode Démo : testez avec 110 transactions, 5 comptes et 15 catégories fictives sans risque',
        ],
      },
    ],
  },

  categories: {
    pageId: 'finance-categories',
    title: 'Catégories de transactions',
    purpose: "Organisez vos flux financiers avec des catégories personnalisées pour un suivi clair des revenus et dépenses.",
    icon: Tag as LucideIcon,
    moduleColor: 'emerald',
    sections: [
      {
        title: 'Fonctionnalités principales',
        icon: Lightbulb,
        items: [
          'Séparation revenus et dépenses : visualisez distinctement vos catégories de flux entrants et sortants',
          'Création rapide : ajoutez une nouvelle catégorie en un clic avec formulaire inline',
          'Compteurs en temps réel : suivez le nombre de catégories par type',
          'États empty clairs : messages informatifs quand aucune catégorie existe',
          'Full dark mode : interface adaptative pour confort visuel',
        ],
      },
    ],
  },

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

  expenses: {
    pageId: 'finance-expenses',
    title: 'Gestion des Dépenses',
    purpose:
      "Suivez et contrôlez toutes vos dépenses d'entreprise. Catégorisez, analysez et optimisez vos sorties d'argent pour maintenir une santé financière saine.",
    icon: ArrowDownCircle as LucideIcon,
    moduleColor: 'emerald',
    sections: [
      {
        title: 'Bonnes pratiques',
        icon: Lightbulb,
        items: [
          `Catégorisez systématiquement chaque dépense dès sa saisie pour faciliter l'analyse`,
          `Numérisez et attachez les justificatifs (factures, reçus) pour la traçabilité comptable`,
          `Définissez des budgets par catégorie et surveillez les dépassements mensuellement`,
          `Analysez les dépenses récurrentes pour identifier les opportunités de renégociation`,
          `Exportez régulièrement pour votre comptable ou expert-comptable`,
        ],
      },
    ],
  },

  incomes: {
    pageId: 'finance-incomes',
    title: 'Gestion des Revenus',
    purpose:
      "Suivez toutes vos sources de revenus (ventes, prestations, autres). Analysez la répartition et anticipez vos entrées d'argent pour optimiser votre trésorerie.",
    icon: ArrowUpCircle as LucideIcon,
    moduleColor: 'emerald',
    sections: [
      {
        title: 'Bonnes pratiques',
        icon: Lightbulb,
        items: [
          `Enregistrez les revenus dès leur confirmation pour avoir une vision temps réel`,
          `Catégorisez par source (ventes, prestations, subventions) pour identifier les activités rentables`,
          `Suivez les délais de paiement client pour anticiper les encaissements`,
          `Comparez revenus réels vs prévisionnels pour ajuster votre stratégie commerciale`,
          `Analysez la saisonnalité de vos revenus pour planifier les périodes creuses`,
        ],
      },
    ],
  },

  suppliers: {
    pageId: 'finance-suppliers',
    title: 'Gestion des Fournisseurs',
    purpose:
      "Gérez votre base fournisseurs, suivez les délais de paiement et pilotez vos relations commerciales. Optimisez vos conditions de paiement et réduisez les risques de rupture.",
    icon: Users as LucideIcon,
    moduleColor: 'emerald',
    sections: [
      {
        title: 'Bonnes pratiques',
        icon: Lightbulb,
        items: [
          `Classez vos fournisseurs par importance (stratégique, régulier, occasionnel) pour prioriser`,
          `Négociez des délais de paiement adaptés à votre trésorerie (45-60 jours)`,
          `Surveillez les factures impayées et alertez avant échéance pour maintenir la relation`,
          `Diversifiez vos fournisseurs critiques pour réduire les risques de rupture`,
          `Analysez les volumes d'achats pour négocier des remises sur quantités`,
        ],
      },
    ],
  },

  accounts: {
    pageId: 'finance-accounts',
    title: 'Comptes Bancaires',
    purpose:
      "Centralisez tous vos comptes bancaires (banque, cash, épargne, investissements). Suivez les soldes en temps réel et pilotez votre trésorerie multi-comptes.",
    icon: CreditCard as LucideIcon,
    moduleColor: 'emerald',
    sections: [
      {
        title: 'Bonnes pratiques',
        icon: Lightbulb,
        items: [
          `Créez un compte par type (banque principale, cash, épargne) pour clarifier la répartition`,
          `Réconciliez mensuellement les soldes système vs relevés bancaires réels`,
          `Définissez un seuil de trésorerie mini par compte et configurez des alertes`,
          `Centralisez la trésorerie excédentaire sur un compte rémunéré`,
          `Attribuez des comptes à des portefeuilles (opérationnel, investissement) pour segmenter`,
        ],
      },
    ],
  },

  budgets: {
    pageId: 'finance-budgets',
    title: 'Gestion des Budgets',
    purpose:
      "Définissez des budgets prévisionnels par catégorie et période. Suivez en temps réel les écarts entre prévu et réalisé pour ajuster votre pilotage financier.",
    icon: Target as LucideIcon,
    moduleColor: 'emerald',
    sections: [
      {
        title: 'Bonnes pratiques',
        icon: Lightbulb,
        items: [
          `Définissez des budgets réalistes basés sur l'historique + croissance prévisionnelle`,
          `Révisez trimestriellement les budgets pour ajuster selon l'activité réelle`,
          `Configurez des alertes à 80% et 100% de consommation pour anticiper les dépassements`,
          `Analysez les écarts significatifs (>20%) pour identifier les dérives ou opportunités`,
          `Impliquez les responsables de chaque poste budgétaire dans le suivi`,
        ],
      },
    ],
  },

  settingsDevise: {
    pageId: 'finance-settings-devise',
    title: 'Devise & Formats',
    purpose:
      "Configurez votre devise d'affichage préférée, votre thème (clair/sombre) et votre langue interface. Les montants seront automatiquement convertis dans votre devise pour une lecture facilitée.",
    icon: DollarSign as LucideIcon,
    moduleColor: 'emerald',
    sections: [
      {
        title: 'Bonnes pratiques',
        icon: Lightbulb,
        items: [
          `Choisissez la devise dans laquelle vous pilotez votre activité (souvent votre devise locale)`,
          `Si votre entreprise opère en multi-devises, consultez aussi les montants en devise entreprise`,
          `Activez le mode sombre pour réduire la fatigue oculaire lors de sessions prolongées`,
          `Configurez la langue de l'interface selon votre équipe (support multilingue)`,
          `Les paramètres sont sauvegardés automatiquement et synchronisés sur tous vos appareils`,
        ],
      },
    ],
  },

  settingsTva: {
    pageId: 'finance-settings-tva',
    title: 'TVA & Fiscalité',
    purpose:
      "Configurez votre stratégie de TVA (activée/désactivée, taux, mode HT/TTC). Ces paramètres s'appliquent automatiquement aux devis, factures, prévisions et rapports financiers.",
    icon: FileText as LucideIcon,
    moduleColor: 'emerald',
    sections: [
      {
        title: 'Bonnes pratiques',
        icon: Lightbulb,
        items: [
          `Activez la TVA uniquement si votre entreprise est assujettie (vérifiez avec votre comptable)`,
          `Choisissez "Prix HT" si vous saisissez vos montants hors taxes (B2B)`,
          `Choisissez "Prix TTC" si vous saisissez vos montants toutes taxes comprises (B2C)`,
          `Le taux standard en France est 20%, mais vérifiez les taux réduits selon votre activité`,
          `Activez la synchronisation Stripe si vous utilisez des plans tarifaires en ligne`,
        ],
      },
    ],
  },

  settingsCategories: {
    pageId: 'finance-settings-categories',
    title: 'Catégories',
    purpose:
      "Gérez vos catégories de revenus et dépenses pour classifier vos transactions. Une bonne catégorisation facilite l'analyse, les budgets et la compréhension de votre structure de coûts.",
    icon: PieChart as LucideIcon,
    moduleColor: 'emerald',
    sections: [
      {
        title: 'Bonnes pratiques',
        icon: Lightbulb,
        items: [
          `Créez des catégories claires et mutuellement exclusives (éviter chevauchements)`,
          `Limitez-vous à 10-15 catégories principales pour garder une vue lisible`,
          `Utilisez les catégories par défaut comme point de départ et ajustez selon votre activité`,
          `Attribuez une couleur distinctive à chaque catégorie pour faciliter la lecture des graphiques`,
          `Évitez de supprimer une catégorie utilisée dans l'historique (préférez la désactivation)`,
        ],
      },
    ],
  },

  'payment-planning': {
    pageId: 'finance-payment-planning',
    title: 'Planification des paiements fournisseurs',
    purpose:
      "Outil avancé pour optimiser vos paiements fournisseurs selon vos contraintes de trésorerie. Visualisez les échéances, créez des scénarios de paiement et comparez différentes stratégies pour maintenir l'équilibre entre relations fournisseurs et cash-flow.",
    icon: Calendar as LucideIcon,
    moduleColor: 'emerald',
    sections: [
      {
        title: 'Fonctionnalités principales',
        icon: Lightbulb,
        items: [
          'Calendrier visuel des échéances : visualisez tous vos paiements à venir sur 60 jours avec code couleur par montant',
          'Optimisation automatique : 5 stratégies (date échéance, importance fournisseur, pénalités, remises, trésorerie)',
          'Création de scénarios : sauvegardez différentes hypothèses de paiement pour simulation',
          'Comparaison de scénarios : analysez côte-à-côte les métriques (économies, taux paiement à temps, pénalités)',
          'Export Excel : téléchargez vos plans de paiement optimisés pour communication interne',
          'Exécution directe : validez et envoyez les paiements depuis l\'interface une fois le plan approuvé',
        ],
      },
    ],
  },

  alerts: {
    pageId: 'finance-alerts',
    title: 'Alertes Financières',
    purpose:
      "Configurez et gérez vos alertes financières pour être notifié en temps réel des événements critiques : seuils de trésorerie, dépassements budgétaires, paiements en retard, et variations anormales. Les alertes vous permettent de réagir rapidement et d'éviter les problèmes de trésorerie.",
    icon: Bell as LucideIcon,
    moduleColor: 'emerald',
    sections: [
      {
        title: 'Types d\'alertes disponibles',
        icon: Bell,
        items: [
          'Seuil de trésorerie : notification quand un compte bancaire passe sous un montant critique',
          'Dépassement budgétaire : alerte quand une catégorie dépasse son budget mensuel',
          'Paiements en retard : notification pour les factures clients impayées après X jours',
          'Variation anormale : détection des écarts importants vs tendance (CA, dépenses)',
          'Échéances à venir : rappel des paiements fournisseurs et prélèvements importants',
        ],
      },
      {
        title: 'Configuration recommandée',
        icon: Target,
        items: [
          'Définissez des seuils conservateurs : trésorerie minimum = 2 mois de charges fixes',
          'Activez les notifications multi-canal (email, SMS, notifications in-app)',
          'Configurez des destinataires par type d\'alerte (DAF, CEO, comptable)',
          'Testez vos alertes pour vérifier la bonne réception des notifications',
          'Consultez l\'historique pour analyser les récurrences et ajuster les seuils',
        ],
      },
    ],
  },

  archives: {
    pageId: 'finance-archives',
    title: 'Archives Transactions',
    purpose:
      "Les transactions archivées sont exclues de tous les calculs (trésorerie, budgets, rapports). Utilisez les archives pour masquer temporairement des opérations sans les supprimer définitivement. Vous pouvez restaurer une transaction archivée à tout moment.",
    icon: Archive as LucideIcon,
    moduleColor: 'emerald',
    sections: [
      {
        title: 'Gestion des archives',
        icon: FolderOpen,
        items: [
          'Filtrez par type (dépense/revenu) et statut pour trouver rapidement une transaction',
          'Utilisez la recherche par description, tag ou nom de compte',
          'Sélectionnez plusieurs lignes pour restauration ou suppression groupée',
          'Restaurer : réintègre la transaction dans les calculs actifs',
          'Supprimer : suppression définitive (irréversible, attention)',
        ],
      },
    ],
  },

  scenarios: {
    pageId: 'finance-scenarios',
    title: 'Scénarios Financiers',
    purpose:
      "Simulez différentes hypothèses financières (croissance, baisse d'activité, investissements) pour anticiper l'impact sur votre trésorerie et votre rentabilité. Comparez vos scénarios pour prendre des décisions éclairées.",
    icon: TrendingUp as LucideIcon,
    moduleColor: 'emerald',
    sections: [
      {
        title: 'Fonctionnalités principales',
        icon: Lightbulb,
        items: [
          'Création de scénarios : définissez des hypothèses de croissance, réduction de coûts, ou investissements',
          'Simulation multi-horizon : visualisez l\'impact à 3, 6 et 12 mois',
          'Comparaison visuelle : graphiques côte-à-côte pour analyser les différentes trajectoires',
          'Sauvegarde des scénarios : conservez vos hypothèses pour les réutiliser ou les partager',
          'Export et partage : générez des rapports PDF pour vos présentations ou votre board',
        ],
      },
    ],
  },
};
