import type { PageNoticeConfig } from './types'

/**
 * Notices pour le module GMAO (Maintenance)
 */

export const maintenanceNotices = {
  dashboard: {
    type: 'info',
    title: 'Tableau de bord GMAO',
    message: 'Suivez vos KPI de maintenance : MTBF, MTTR, taux uptime et coûts.',
    actions: [
      { label: 'Voir KPI', to: '/maintenance/reports' },
      { label: 'Équipements critiques', to: '/maintenance/equipment/critical' },
    ],
  },

  equipment: {
    type: 'info',
    title: 'Gestion Équipements',
    message: 'Gérez vos équipements, suivez leur état et planifiez la maintenance préventive.',
    actions: [
      { label: 'Équipements critiques', to: '/maintenance/equipment/critical' },
      { label: 'Historique pannes', to: '/maintenance/reports' },
    ],
  },

  equipmentDetail: {
    type: 'info',
    title: 'Détail Équipement',
    message: 'Consultez l\'historique des interventions et les KPI de cet équipement.',
    actions: [
      { label: 'Créer intervention', to: '/maintenance/requests/new' },
    ],
  },

  requests: {
    type: 'info',
    title: 'Demandes d\'Intervention',
    message: 'Gérez les demandes de maintenance corrective et préventive.',
    actions: [
      { label: 'Urgences', to: '/maintenance/requests/emergency' },
      { label: 'Planning', to: '/maintenance/calendar' },
    ],
  },

  requestsEmergency: {
    type: 'warning',
    title: 'Interventions Urgentes',
    message: 'Liste des demandes urgentes nécessitant une intervention immédiate.',
    actions: [
      { label: 'Toutes les demandes', to: '/maintenance/requests' },
    ],
  },

  calendar: {
    type: 'info',
    title: 'Planning Maintenance',
    message: 'Planifiez et suivez les interventions de maintenance.',
    actions: [
      { label: 'Créer intervention', to: '/maintenance/requests/new' },
    ],
  },

  reports: {
    type: 'info',
    title: 'KPI & Rapports GMAO',
    message: 'Analysez vos indicateurs de performance maintenance : MTBF, MTTR, uptime.',
    actions: [
      { label: 'Coûts maintenance', to: '/maintenance/costs' },
    ],
  },

  costs: {
    type: 'info',
    title: 'Coûts Maintenance',
    message: 'Suivez les coûts de maintenance par équipement et par type d\'intervention.',
    actions: [
      { label: 'KPI globaux', to: '/maintenance/reports' },
    ],
  },

  categories: {
    type: 'info',
    title: 'Catégories Équipements',
    message: 'Organisez vos équipements par catégories pour faciliter la gestion.',
  },

  settings: {
    type: 'info',
    title: 'Paramètres GMAO',
    message: 'Configurez les paramètres du module de gestion de maintenance.',
  },
}
