import {
  Wrench,
  ClipboardList,
  Calendar,
  BarChart3,
  Settings,
  AlertTriangle,
  Lightbulb,
  type LucideIcon,
} from 'lucide-react'
import type { PageNoticeConfig } from './types'

/**
 * Configurations des notices pour le module GMAO (Maintenance)
 * Couleur: orange (amber)
 */
export const maintenanceNotices: Record<string, PageNoticeConfig> = {
  dashboard: {
    pageId: 'maintenance-dashboard',
    title: 'Tableau de bord GMAO',
    purpose:
      'Vue d\'ensemble simplifiée de vos KPIs de maintenance : MTBF, MTTR, taux uptime et coûts. Suivez l\'état de vos équipements et interventions.',
    icon: BarChart3 as LucideIcon,
    moduleColor: 'orange',
    sections: [
      {
        title: 'KPIs Essentiels',
        icon: Lightbulb,
        items: [
          'Total équipements : nombre total d\'équipements suivis dans la GMAO',
          'Équipements critiques : nombre d\'équipements nécessitant une attention prioritaire',
          'Demandes en attente : interventions non encore traitées',
          'Interventions urgentes : demandes nécessitant une intervention immédiate',
          'MTBF moyen : temps moyen entre pannes (Mean Time Between Failures)',
          'MTTR moyen : temps moyen de réparation (Mean Time To Repair)',
          'Taux uptime moyen : pourcentage de disponibilité des équipements',
        ],
      },
    ],
  },

  equipment: {
    pageId: 'maintenance-equipment',
    title: 'Gestion Équipements',
    purpose:
      'Gérez vos équipements, suivez leur état et planifiez la maintenance préventive. Consultez les KPI par équipement et l\'historique des pannes.',
    icon: Wrench as LucideIcon,
    moduleColor: 'orange',
    sections: [
      {
        title: 'Fonctionnalités principales',
        icon: Lightbulb,
        items: [
          'Liste complète avec filtres par catégorie et équipements critiques uniquement',
          'KPI par équipement : MTBF, MTTR, taux uptime, nombre de pannes',
          'Statut temps réel : opérationnel, en panne, en maintenance',
          'Création rapide de nouvelle demande d\'intervention depuis la liste',
          'Indicateur visuel pour équipements critiques nécessitant attention prioritaire',
        ],
      },
    ],
  },

  equipmentDetail: {
    pageId: 'maintenance-equipment-detail',
    title: 'Détail Équipement',
    purpose:
      'Consultez l\'historique complet des interventions, les KPI détaillés et les informations techniques de l\'équipement (garantie, date d\'achat, etc.).',
    icon: Wrench as LucideIcon,
    moduleColor: 'orange',
    sections: [
      {
        title: 'Informations disponibles',
        icon: Lightbulb,
        items: [
          'Fiche technique : nom, catégorie, numéro de série, statut critique',
          'Informations contractuelles : date d\'achat, fin de garantie',
          'KPI détaillés : MTBF, MTTR, uptime, nombre de pannes, dernière panne',
          'Historique des interventions : liste des demandes passées avec type et priorité',
          'Bouton création rapide d\'intervention pré-remplie pour cet équipement',
        ],
      },
    ],
  },

  requests: {
    pageId: 'maintenance-requests',
    title: 'Demandes d\'Intervention',
    purpose:
      'Gérez les demandes de maintenance corrective (pannes) et préventive (planifiée). Suivez le statut, la priorité et les coûts des interventions.',
    icon: ClipboardList as LucideIcon,
    moduleColor: 'orange',
    sections: [
      {
        title: 'Fonctionnalités principales',
        icon: Lightbulb,
        items: [
          'Filtres par type : toutes, corrective (pannes), préventive (planifiée)',
          'Indicateurs : nombre de demandes, coût total, durée totale',
          'Statut en temps réel : nouvelle, en cours, terminée, annulée',
          'Priorité visuelle : très faible, faible, normale, haute',
          'Création rapide avec formulaire complet et validation',
        ],
      },
    ],
  },

  requestsEmergency: {
    pageId: 'maintenance-requests-emergency',
    title: 'Interventions Urgentes',
    purpose:
      'Liste filtrée des demandes urgentes nécessitant une intervention immédiate. Suivez les urgences avec indicateur d\'impact sur les temps d\'arrêt.',
    icon: AlertTriangle as LucideIcon,
    moduleColor: 'orange',
    sections: [
      {
        title: 'Gestion des urgences',
        icon: Lightbulb,
        items: [
          'Toutes les demandes marquées comme urgence (is_emergency=true)',
          'Impact temps d\'arrêt : aucun, faible, moyen, élevé, critique',
          'Bordure rouge pour identification visuelle immédiate',
          'Priorité élevée par défaut pour traitement rapide',
          'Lien direct vers toutes les demandes pour vue d\'ensemble',
        ],
      },
    ],
  },

  calendar: {
    pageId: 'maintenance-calendar',
    title: 'Planning Maintenance',
    purpose:
      'Planifiez et suivez les interventions de maintenance sur un calendrier visuel. Organisez les interventions par date et assurez le suivi chronologique.',
    icon: Calendar as LucideIcon,
    moduleColor: 'orange',
    sections: [
      {
        title: 'Organisation du planning',
        icon: Lightbulb,
        items: [
          'Vue chronologique des interventions planifiées',
          'Groupement par date pour visibilité claire',
          'Création rapide d\'intervention depuis le calendrier',
          'Identification visuelle : type, priorité, équipement concerné',
          'Suivi des interventions passées et à venir',
        ],
      },
    ],
  },

  reports: {
    pageId: 'maintenance-reports',
    title: 'KPI & Rapports GMAO',
    purpose:
      'Analysez vos indicateurs de performance maintenance : MTBF, MTTR, uptime. Suivez les coûts de maintenance par équipement et type d\'intervention.',
    icon: BarChart3 as LucideIcon,
    moduleColor: 'orange',
    sections: [
      {
        title: 'Indicateurs disponibles',
        icon: Lightbulb,
        items: [
          'Statistiques équipements : total, critiques, taux critique',
          'Statistiques demandes : total, en attente, urgentes, taux urgence',
          'Performance : MTBF moyen, MTTR moyen, taux uptime moyen',
          'Interprétation guidée : seuils d\'alerte et bonnes pratiques',
          'Code couleur : vert (bon), orange (attention), rouge (critique)',
        ],
      },
    ],
  },

  costs: {
    pageId: 'maintenance-costs',
    title: 'Coûts Maintenance',
    purpose:
      'Suivez les coûts de maintenance par équipement et par type d\'intervention. Analysez la répartition des dépenses et optimisez votre budget maintenance.',
    icon: BarChart3 as LucideIcon,
    moduleColor: 'orange',
    sections: [
      {
        title: 'Analyse des coûts',
        icon: Lightbulb,
        items: [
          'Coût total de maintenance sur la période',
          'Répartition par type : corrective vs préventive',
          'Coût moyen par intervention et par équipement',
          'Top équipements les plus coûteux à maintenir',
          'Tendances mensuelles pour anticiper les budgets',
        ],
      },
    ],
  },

  categories: {
    pageId: 'maintenance-categories',
    title: 'Catégories Équipements',
    purpose:
      'Organisez vos équipements par catégories pour faciliter la gestion, les filtres et le reporting. Créez des catégories personnalisées selon votre organisation.',
    icon: Wrench as LucideIcon,
    moduleColor: 'orange',
    sections: [
      {
        title: 'Organisation par catégories',
        icon: Lightbulb,
        items: [
          'Création et gestion de catégories personnalisées',
          'Nombre d\'équipements par catégorie',
          'Filtrage rapide dans la liste des équipements',
          'Reporting par catégorie pour analyse comparative',
          'Suppression sécurisée avec vérification des dépendances',
        ],
      },
    ],
  },

  settings: {
    pageId: 'maintenance-settings',
    title: 'Paramètres GMAO',
    purpose:
      'Configurez les paramètres du module de gestion de maintenance : catégories, types d\'intervention, niveaux de priorité, seuils d\'alerte KPI.',
    icon: Settings as LucideIcon,
    moduleColor: 'orange',
    sections: [
      {
        title: 'Paramètres configurables',
        icon: Lightbulb,
        items: [
          'Types de maintenance : corrective, préventive, prédictive',
          'Niveaux de priorité : très faible, faible, normale, haute',
          'Seuils d\'alerte : MTBF minimum, MTTR maximum, uptime minimum',
          'Notifications : alertes pour équipements critiques et urgences',
          'Intégrations : connexion avec systèmes de monitoring externes',
        ],
      },
    ],
  },
}
