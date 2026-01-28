import {
  Users,
  Building2,
  FileText,
  CalendarOff,
  Clock,
  UserCheck,
  Briefcase,
  Calendar,
  PieChart,
  Tag,
  Settings,
  UserPlus,
  ClipboardCheck,
  Layers,
  type LucideIcon,
} from 'lucide-react';
import type { PageNoticeConfig } from './types';

/**
 * Configurations des notices pour le module HR
 * Couleur: violet
 */
export const hrNotices: Record<string, PageNoticeConfig> = {
  dashboard: {
    pageId: 'hr-dashboard',
    title: 'Tableau de bord RH',
    purpose: "Vue d'ensemble de votre équipe : effectifs, présences, congés et contrats en un coup d'oeil.",
    icon: Users as LucideIcon,
    moduleColor: 'violet',
    sections: [
      {
        title: 'Indicateurs clés',
        icon: UserCheck,
        items: [
          'Effectif total et répartition par département',
          'Suivi des présences en temps réel',
          'Alertes pour congés en attente de validation',
          'Contrats arrivant à échéance sous 30 jours',
        ],
      },
    ],
  },

  employees: {
    pageId: 'hr-employees',
    title: 'Gestion des employés',
    purpose: "Centralisez les informations de vos collaborateurs : profils, contrats, présences et historique.",
    icon: Users as LucideIcon,
    moduleColor: 'violet',
    sections: [
      {
        title: 'Fonctionnalités',
        icon: Briefcase,
        items: [
          'Fiches employés complètes avec informations personnelles et professionnelles',
          'Historique des contrats et avenants',
          'Suivi des présences et absences',
          'Documents RH associés (CV, diplômes, etc.)',
        ],
      },
    ],
  },

  departments: {
    pageId: 'hr-departments',
    title: 'Départements',
    purpose: "Organisez votre structure avec des départements et une hiérarchie claire.",
    icon: Building2 as LucideIcon,
    moduleColor: 'violet',
    sections: [
      {
        title: 'Organisation',
        icon: Building2,
        items: [
          'Création et gestion des départements',
          'Affectation des responsables',
          'Visualisation de la répartition des effectifs',
        ],
      },
    ],
  },

  contracts: {
    pageId: 'hr-contracts',
    title: 'Contrats',
    purpose: "Gérez les contrats de travail : types, durées, renouvellements et échéances.",
    icon: FileText as LucideIcon,
    moduleColor: 'violet',
    sections: [
      {
        title: 'Suivi des contrats',
        icon: FileText,
        items: [
          'Création de contrats CDI, CDD, stage, etc.',
          'Alertes automatiques avant échéance',
          'Historique des avenants et modifications',
        ],
      },
    ],
  },

  leaves: {
    pageId: 'hr-leaves',
    title: 'Congés',
    purpose: "Gérez les demandes de congés, les validations et le suivi des soldes.",
    icon: CalendarOff as LucideIcon,
    moduleColor: 'violet',
    sections: [
      {
        title: 'Gestion des congés',
        icon: CalendarOff,
        items: [
          'Demandes de congés avec workflow de validation',
          'Différents types de congés paramétrables',
          'Suivi des soldes et allocations',
          'Calendrier des absences de l\'équipe',
        ],
      },
    ],
  },

  attendance: {
    pageId: 'hr-attendance',
    title: 'Présences',
    purpose: "Suivez les entrées/sorties et le temps de travail de vos collaborateurs.",
    icon: Clock as LucideIcon,
    moduleColor: 'violet',
    sections: [
      {
        title: 'Pointage',
        icon: Clock,
        items: [
          'Enregistrement des heures d\'entrée et sortie',
          'Calcul automatique des heures travaillées',
          'Suivi des retards et absences',
          'Rapports de présence par période',
        ],
      },
    ],
  },

  jobs: {
    pageId: 'hr-jobs',
    title: 'Postes',
    purpose: "Définissez les postes de votre organisation avec leurs descriptions et exigences.",
    icon: Briefcase as LucideIcon,
    moduleColor: 'violet',
    sections: [
      {
        title: 'Gestion des postes',
        icon: Briefcase,
        items: [
          'Création et description des postes',
          'Rattachement aux départements',
          'Nombre d\'employés par poste',
          'Compétences et exigences requises',
        ],
      },
    ],
  },

  settings: {
    pageId: 'hr-settings',
    title: 'Paramètres RH',
    purpose: "Configurez le module RH selon les besoins de votre organisation.",
    icon: Settings as LucideIcon,
    moduleColor: 'violet',
    sections: [
      {
        title: 'Configuration',
        icon: Settings,
        items: [
          'Format des matricules employés',
          'Règles de pointage et présences',
          'Types de congés et allocations',
          'Notifications et alertes RH',
        ],
      },
    ],
  },

  leavesCalendar: {
    pageId: 'hr-leaves-calendar',
    title: 'Calendrier des congés',
    purpose: "Visualisez les absences de l'équipe sur un calendrier partagé.",
    icon: Calendar as LucideIcon,
    moduleColor: 'violet',
    sections: [
      {
        title: 'Planification',
        icon: Calendar,
        items: [
          'Vue mensuelle des absences',
          'Filtrage par département ou employé',
          'Détection des chevauchements',
        ],
      },
    ],
  },

  leavesAllocations: {
    pageId: 'hr-leaves-allocations',
    title: 'Allocations de congés',
    purpose: "Gérez les droits à congés de vos employés par type et période.",
    icon: PieChart as LucideIcon,
    moduleColor: 'violet',
    sections: [
      {
        title: 'Droits à congés',
        icon: PieChart,
        items: [
          'Attribution des jours par type de congé',
          'Suivi des soldes restants',
          'Report des jours non pris',
        ],
      },
    ],
  },

  leavesTypes: {
    pageId: 'hr-leaves-types',
    title: 'Types de congés',
    purpose: "Configurez les différents types de congés disponibles dans votre organisation.",
    icon: Tag as LucideIcon,
    moduleColor: 'violet',
    sections: [
      {
        title: 'Paramétrage',
        icon: Tag,
        items: [
          'Création de types personnalisés',
          'Règles de validation par type',
          'Couleurs pour le calendrier',
        ],
      },
    ],
  },

  employeeNew: {
    pageId: 'hr-employee-new',
    title: 'Nouvel employé',
    purpose: "Créez une fiche employé complète avec toutes les informations nécessaires.",
    icon: UserPlus as LucideIcon,
    moduleColor: 'violet',
    sections: [
      {
        title: 'Informations requises',
        icon: UserPlus,
        items: [
          'Informations personnelles (nom, contact, adresse)',
          'Informations professionnelles (département, poste, manager)',
          'Documents d\'identité et administratifs',
        ],
      },
    ],
  },

  employeeDetail: {
    pageId: 'hr-employee-detail',
    title: 'Fiche employé',
    purpose: "Consultez et modifiez les informations complètes d'un collaborateur.",
    icon: Users as LucideIcon,
    moduleColor: 'violet',
    sections: [
      {
        title: 'Informations disponibles',
        icon: Users,
        items: [
          'Profil complet et coordonnées',
          'Historique des contrats',
          'Soldes de congés et absences',
          'Documents RH associés',
        ],
      },
    ],
  },

  contractNew: {
    pageId: 'hr-contract-new',
    title: 'Nouveau contrat',
    purpose: "Créez un nouveau contrat de travail pour un employé.",
    icon: FileText as LucideIcon,
    moduleColor: 'violet',
    sections: [
      {
        title: 'Informations du contrat',
        icon: FileText,
        items: [
          'Type de contrat (CDI, CDD, stage...)',
          'Dates de début et fin',
          'Poste et département',
          'Conditions salariales',
        ],
      },
    ],
  },

  appraisals: {
    pageId: 'hr-appraisals',
    title: 'Évaluations',
    purpose: "Gérez les entretiens annuels et bilans de performance de vos collaborateurs.",
    icon: ClipboardCheck as LucideIcon,
    moduleColor: 'violet',
    sections: [
      {
        title: 'Suivi des évaluations',
        icon: ClipboardCheck,
        items: [
          'Planification des entretiens annuels',
          'Suivi des objectifs et performances',
          'Notes et recommandations',
          'Historique des évaluations',
        ],
      },
    ],
  },

  appraisalDetail: {
    pageId: 'hr-appraisal-detail',
    title: 'Détail évaluation',
    purpose: "Consultez et complétez l'évaluation d'un collaborateur.",
    icon: ClipboardCheck as LucideIcon,
    moduleColor: 'violet',
    sections: [
      {
        title: 'Contenu',
        icon: ClipboardCheck,
        items: [
          'Auto-évaluation et évaluation manager',
          'Objectifs et progression',
          'Points forts et axes d\'amélioration',
          'Plan de développement',
        ],
      },
    ],
  },

  skills: {
    pageId: 'hr-skills',
    title: 'Compétences',
    purpose: "Gérez le référentiel de compétences de l'entreprise.",
    icon: Layers as LucideIcon,
    moduleColor: 'violet',
    sections: [
      {
        title: 'Référentiel',
        icon: Layers,
        items: [
          'Types de compétences (techniques, soft skills...)',
          'Catalogue de compétences',
          'Association aux postes et employés',
        ],
      },
    ],
  },
};
