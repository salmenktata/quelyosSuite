import { Receipt, BarChart3, Lightbulb, UserCircle, Tag, DollarSign, ClipboardList, Target, Kanban } from 'lucide-react';
import type { PageNoticeConfig } from './types';

/**
 * Module CRM - Notices pour gestion relation client
 * Note: Module en construction, configurations minimales pour pages existantes
 * Extension future: Leads, Opportunités, Pipeline, Activités, Campagnes
 */
export const crmNotices: Record<string, PageNoticeConfig> = {
  customers: {
    pageId: 'crm-customers',
    title: 'Base Clients',
    purpose: "Centralisez toutes les informations clients : coordonnées, historique d'achats, préférences et segmentation. Base de données enrichie pour personnaliser votre relation client et piloter vos actions marketing.",
    icon: UserCircle,
    moduleColor: 'violet',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        `Enrichissez fiches clients : notes, tags, historique interactions pour personnaliser expérience et anticiper besoins`,
        `Segmentez intelligemment : VIP (CA>5K€), Fidèles (>3 commandes), Inactifs (>6 mois), Nouveaux pour actions ciblées`,
        `RGPD obligatoire : consentement explicite, droit accès/rectification/suppression, conservation limitée (3 ans inactif)`,
        `Dédoublonnez régulièrement : fusionnez doublons pour données propres et éviter communications multiples agaçantes`,
        `Exportez pour campagnes : listes segmentées CSV compatibles outils emailing (Mailchimp, Sendinblue, Brevo)`,
      ]
    }]
  },

  customerCategories: {
    pageId: 'crm-customer-categories',
    title: 'Catégories Clients',
    purpose: "Organisez vos clients en segments personnalisés (VIP, Professionnels, Particuliers, etc.) pour adapter tarifs, communications et services selon profils et valeur client.",
    icon: Tag,
    moduleColor: 'violet',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        `Créez 4-6 catégories max : VIP, Pro, Particulier, Revendeur - trop de segments dilue la personnalisation`,
        `Critères objectifs automatiques : CA annuel, nombre commandes, ancienneté pour classification fiable et évolutive`,
        `Tarifs dégressifs par catégorie : VIP -10%, Pro -5%, Revendeur -15% pour fidéliser et augmenter panier moyen`,
        `Communications adaptées : ton, fréquence, contenu différenciés selon valeur et attentes de chaque segment`,
        `Révisez trimestriellement : reclassez clients selon évolution comportement (upgrade VIP, downgrade inactif)`,
      ]
    }]
  },

  payments: {
    pageId: 'crm-payments',
    title: 'Suivi des Paiements',
    purpose: "Suivez tous les encaissements clients en temps réel : rapprochement bancaire, retards, litiges et relances automatisées pour optimiser votre trésorerie et réduire impayés.",
    icon: DollarSign,
    moduleColor: 'violet',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        `Rapprochement bancaire quotidien : associez paiements reçus aux factures pour suivi trésorerie fiable temps réel`,
        `Alertes retards automatiques : notification J+1 échéance pour relance proactive avant que dette ne s'aggrave`,
        `Multipliez moyens paiement : CB, virement, prélèvement, PayPal - facilite règlement = réduit impayés de 30%`,
        `Fractionnez si nécessaire : 3x 4x sans frais pour gros montants - augmente taux conversion et réduit abandon`,
        `Tableaux de bord DSO : Days Sales Outstanding (délai moyen paiement) pour identifier clients problématiques`,
      ]
    }]
  },

  pricelists: {
    pageId: 'crm-pricelists',
    title: 'Listes de Prix',
    purpose: "Gérez vos grilles tarifaires personnalisées par segment client, zone géographique ou canal de vente. Automatisez la politique de prix pour maximiser marge et compétitivité.",
    icon: ClipboardList,
    moduleColor: 'violet',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        `Prix par segment client : tarifs standard, pro -5%, VIP -10%, revendeur -15% pour fidélisation et volume`,
        `Zones géographiques : ajustez selon marché local, coûts logistique, concurrence et pouvoir achat régional`,
        `Période validité : dates début/fin pour promotions saisonnières contrôlées sans risque oubli désactivation`,
        `Priorité intelligente : catégorie client > zone géo > standard pour application automatique prix le plus avantageux`,
        `Testez élasticité prix : A/B testing -10% vs prix standard pour trouver optimum volume x marge par produit`,
      ]
    }]
  },

  invoices: {
    pageId: 'crm-invoices',
    title: 'Gestion des Factures',
    purpose: "Consultez, générez et suivez toutes les factures clients. Gérez les statuts de paiement, relances automatiques et exports comptables pour pilotage financier optimisé.",
    icon: Receipt,
    moduleColor: 'violet',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        `Générez factures sous 24h après expédition : obligation légale + améliore trésorerie (paiement plus rapide)`,
        `Automatisez relances : J+7 (rappel amical), J+15 (relance ferme), J+30 (mise en demeure formelle)`,
        `Numérotation séquentielle obligatoire : pas de trou, chronologique, format FACT-2024-00001 conforme`,
        `Mentions légales complètes : SIRET, TVA, RIB, conditions paiement, pénalités retard (conformité fiscale)`,
        `Exportez mensuellement pour comptable : format CSV/Excel avec colonnes client, montant HT/TTC, date, statut`,
      ]
    }]
  },

  analytics: {
    pageId: 'crm-analytics',
    title: 'Analytics & Statistiques',
    purpose: "Visualisez les KPIs clés de votre activité : CA, nombre commandes, taux conversion, panier moyen, clients actifs. Tableaux de bord temps réel pour pilotage data-driven.",
    icon: BarChart3,
    moduleColor: 'violet',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        `Consultez dashboard quotidiennement : identifiez tendances tôt, réagissez rapidement aux anomalies`,
        `Définissez 5-7 KPIs critiques : CA, nombre commandes, panier moyen, taux conversion, taux abandon panier`,
        `Comparez périodes : Jour vs hier, Semaine vs semaine N-1, Mois vs année précédente pour détecter variations`,
        `Segmentez analyses : par source trafic (SEO, paid, direct), canal vente (web, mobile), catégorie produit`,
        `Automatisez rapports hebdomadaires : export CSV + email récapitulatif pour suivi équipe et direction`,
      ]
    }]
  },

  pipeline: {
    pageId: 'crm-pipeline',
    title: 'Pipeline CRM',
    purpose: "Visualisez et gérez vos opportunités commerciales en vue Kanban. Glissez-déposez les leads entre les étapes pour suivre leur progression vers la conversion.",
    icon: BarChart3,
    moduleColor: 'violet',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        `Mettez à jour quotidiennement : déplacez leads entre étapes dès changement statut pour pipeline temps réel fiable`,
        `Qualifiez rapidement : distinguez prospects froids des opportunités chaudes pour concentrer énergie sur conversions probables`,
        `Suivez temps par étape : si lead bloqué >7j même étape, identifiez blocage et relancez prospect activement`,
        `Priorisez par revenu attendu : focalisez d'abord sur opportunités à fort montant pour maximiser ROI commercial`,
        `Nettoyez mensuellement : archivez leads perdus/abandonnés pour garder pipeline clair et éviter pollution données`,
      ]
    }]
  },

  leads: {
    pageId: 'crm-leads',
    title: 'Opportunités',
    purpose: "Gérez toutes vos opportunités commerciales en cours : qualification, suivi, relances et conversion en clients. Vue liste complète avec filtres et recherche.",
    icon: Target,
    moduleColor: 'violet',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        `Créez lead immédiatement : dès contact prospect (appel, email, salon) pour ne perdre aucune opportunité commerciale`,
        `Renseignez montant attendu + probabilité : permet calcul revenu prévisionnel et priorisation intelligente du pipeline`,
        `Assignez responsable : chaque lead doit avoir un commercial référent pour suivi personnalisé et accountability`,
        `Planifiez échéances : date limite rappel automatique pour relancer au bon moment sans oublier opportunités`,
        `Documentez interactions : notes sur chaque appel/email pour historique complet et passation si changement commercial`,
      ]
    }]
  },

  pipelineStages: {
    pageId: 'crm-pipeline-stages',
    title: 'Étapes Pipeline',
    purpose: "Configurez les étapes de votre funnel de vente CRM : nom, ordre, probabilités de conversion et couleurs. Structure le parcours commercial de la prospection à la signature.",
    icon: Kanban,
    moduleColor: 'violet',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        `Limitez à 4-6 étapes : pipeline trop complexe ralentit vente, trop simple perd visibilité. Idéal : Nouveau → Qualifié → Proposition → Négociation → Gagné/Perdu`,
        `Définissez probabilités réalistes : basées sur historique conversion (ex: Qualifié 25%, Proposition 50%, Négociation 75%) pour prévisions précises`,
        `Assignez couleurs distinctes : facilite lecture visuelle rapide du pipeline et identification immédiate de l'étape en cours`,
        `Marquez étapes terminales : "Gagné" (100%) et "Perdu" (0%) pour clôturer automatiquement les opportunités et calculer taux de conversion`,
        `Réorganisez par drag & drop : ordre des colonnes reflète le parcours chronologique de votre cycle de vente`,
        `Protégez étapes critiques : empêchez suppression accidentelle des étapes Gagné/Perdu qui contiennent des données historiques importantes`,
      ]
    }]
  },

  // Configurations futures (à activer quand pages créées)
  // activities: { ... },
  // campaigns: { ... },
};
