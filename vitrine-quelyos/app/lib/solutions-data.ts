/**
 * Données des packages sectoriels Quelyos
 * 8 solutions métier complètes avec contenu illustratif
 */

export interface PainPoint {
  problem: string;
  solution: string;
}

export interface Feature {
  icon: string;
  title: string;
  description: string;
  benefit: string;
}

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  location: string;
  metric: string;
}

export interface SolutionData {
  id: string;
  name: string;
  sectorName: string;
  headline: string;
  subheadline: string;
  valueProp: string;
  verb: string; // Ex: "faire tourner votre restaurant"
  painPoints: PainPoint[];
  features: Feature[];
  testimonials: Testimonial[];
  pricing: {
    basePrice: number;
    features: string[];
  };
  stats: {
    clients: string;
    timeSaved: string;
    precision: string;
    mainMetric: string;
  };
  modulesIncluded: string[];
}

export const solutionsData: Record<string, SolutionData> = {
  restaurant: {
    id: 'restaurant',
    name: 'Quelyos Resto',
    sectorName: 'Restauration',
    headline: 'Pilotez votre restaurant avec sérénité',
    subheadline: 'Commandes, stock, trésorerie : tout sous contrôle',
    valueProp: 'De la prise de commande au pilotage financier. Une solution complète pensée pour les restaurateurs.',
    verb: 'faire tourner votre restaurant',

    modulesIncluded: ['POS', 'Stock', 'Finance', 'CRM', 'Marketing'],

    stats: {
      clients: '200+',
      timeSaved: '15h/semaine',
      precision: '95%',
      mainMetric: '+40% de réservations'
    },

    painPoints: [
      {
        problem: 'Temps passé sur la gestion au détriment du service',
        solution: 'Automatisation des tâches répétitives, gain de 15h/semaine en moyenne'
      },
      {
        problem: 'Ruptures de stock d\'ingrédients en plein service',
        solution: 'Alertes automatiques et suggestions de commandes intelligentes. Zéro rupture.'
      },
      {
        problem: 'Trésorerie imprévisible, stress sur les paiements fournisseurs',
        solution: 'Prévisions de trésorerie à 90 jours avec 95% de précision. Anticipez sereinement.'
      },
      {
        problem: 'Réservations par téléphone, messages perdus, tables vides',
        solution: 'Système de réservation en ligne 24/7 avec rappels automatiques. +40% de remplissage.'
      },
      {
        problem: 'Difficulté à fidéliser la clientèle locale',
        solution: 'Programme de fidélité intégré avec offres personnalisées. +30% de clients réguliers.'
      },
      {
        problem: 'Manque de visibilité sur la rentabilité par plat',
        solution: 'Analyse automatique des marges et suggestions d\'optimisation du menu.'
      }
    ],

    features: [
      {
        icon: '📱',
        title: 'Prise de commande intuitive',
        description: 'Interface tactile optimisée pour le service en salle. Mode rush pour les moments d\'affluence.',
        benefit: 'Service 2x plus rapide'
      },
      {
        icon: '📦',
        title: 'Gestion de stock intelligente',
        description: 'Suivi en temps réel des ingrédients avec alertes automatiques et suggestions de réapprovisionnement.',
        benefit: 'Zéro rupture de stock'
      },
      {
        icon: '📅',
        title: 'Réservations en ligne',
        description: 'Widget de réservation pour votre site web avec confirmations et rappels SMS automatiques.',
        benefit: '+40% de réservations'
      },
      {
        icon: '💰',
        title: 'Pilotage financier',
        description: 'Prévisions de trésorerie à 90 jours, analyse de rentabilité par plat, rapports comptables automatiques.',
        benefit: '95% de précision'
      },
      {
        icon: '🎁',
        title: 'Programme fidélité',
        description: 'Carte de fidélité digitale avec accumulation automatique de points et offres personnalisées.',
        benefit: '+30% de clients réguliers'
      },
      {
        icon: '📊',
        title: 'Analytics de performance',
        description: 'Tableaux de bord temps réel : plats les plus vendus, heures de pointe, tendances saisonnières.',
        benefit: 'Décisions data-driven'
      },
      {
        icon: '👨‍🍳',
        title: 'Écran cuisine intégré',
        description: 'Affichage des commandes en cuisine avec gestion des priorités et temps de préparation.',
        benefit: 'Coordination optimale'
      },
      {
        icon: '📲',
        title: 'Marketing automatisé',
        description: 'Envois SMS et emails ciblés pour les offres spéciales et événements. Génération automatique de contenu.',
        benefit: '+25% de fréquentation'
      }
    ],

    testimonials: [
      {
        quote: "L'outil s'est intégré naturellement dans notre quotidien. Les prévisions de trésorerie sont bluffantes, je dors mieux la nuit.",
        author: 'Marc Dubois',
        role: 'Gérant',
        company: 'Restaurant Le Bistrot',
        location: 'Ville',
        metric: '15h gagnées/semaine'
      },
      {
        quote: "Fini les ruptures d'ingrédients en plein service. Le système m'alerte automatiquement et suggère les quantités optimales.",
        author: 'Sophie Durand',
        role: 'Propriétaire',
        company: 'La Table du Marché',
        location: 'Ville',
        metric: 'Zéro rupture depuis 8 mois'
      },
      {
        quote: "Les réservations en ligne ont transformé notre activité. On remplit désormais 40% de tables en plus grâce aux rappels automatiques.",
        author: 'Thomas Martin',
        role: 'Chef & Gérant',
        company: 'Bistro Thomas',
        location: 'Bordeaux',
        metric: '+40% de réservations'
      }
    ],

    pricing: {
      basePrice: 99,
      features: [
        'Solutions POS, Stock, Finance, CRM, Marketing incluses',
        'Prise de commande tactile illimitée',
        'Réservations en ligne + rappels SMS',
        'Prévisions de trésorerie IA 90 jours',
        'Programme fidélité intégré',
        'Utilisateurs illimités',
        'Support prioritaire 24h',
        'Formations incluses'
      ]
    }
  },

  commerce: {
    id: 'commerce',
    name: 'Quelyos Boutique',
    sectorName: 'Commerce',
    headline: 'Développez votre commerce sans complexité technique',
    subheadline: 'Caisse, e-commerce, stock : une solution complète',
    valueProp: 'Gérez votre boutique physique et en ligne depuis une interface unique. Synchronisation automatique, zéro double saisie.',
    verb: 'faire grandir votre commerce',

    modulesIncluded: ['POS', 'Stock', 'Store', 'Finance', 'Marketing'],

    stats: {
      clients: '180+',
      timeSaved: '12h/semaine',
      precision: '95%',
      mainMetric: '+35% de CA en 12 mois'
    },

    painPoints: [
      {
        problem: 'Gestion séparée boutique physique et site e-commerce',
        solution: 'Synchronisation automatique du stock, des prix et des promotions entre tous vos canaux de vente.'
      },
      {
        problem: 'Inventaires fastidieux et source d\'erreurs',
        solution: 'Inventaire en temps réel avec scanner mobile. Alertes de réapprovisionnement intelligentes.'
      },
      {
        problem: 'Difficultés à fidéliser les clients',
        solution: 'Programme de fidélité omnicanal avec historique d\'achat unifié. +30% de clients réguliers.'
      },
      {
        problem: 'Pas de visibilité sur les tendances de vente',
        solution: 'Analytics avancés : produits stars, tendances saisonnières, prévisions de demande.'
      },
      {
        problem: 'Trésorerie imprévisible, surstocks coûteux',
        solution: 'Prévisions de trésorerie à 90 jours et optimisation automatique des stocks.'
      },
      {
        problem: 'Marketing inefficace, faible taux de retour',
        solution: 'Campagnes ciblées par segment client avec mesure ROI automatique.'
      }
    ],

    features: [
      {
        icon: '💳',
        title: 'Caisse omnicanal',
        description: 'Point de vente physique et en ligne synchronisés. Acceptez tous les moyens de paiement.',
        benefit: 'Expérience unifiée'
      },
      {
        icon: '🌐',
        title: 'Boutique en ligne intégrée',
        description: 'Site e-commerce responsive avec catalogue synchronisé automatiquement avec votre stock.',
        benefit: '+50% de canal de vente'
      },
      {
        icon: '📦',
        title: 'Gestion de stock unifiée',
        description: 'Vue consolidée du stock physique et web. Alertes de réapprovisionnement intelligentes.',
        benefit: 'Zéro surstock inutile'
      },
      {
        icon: '🎁',
        title: 'Fidélité omnicanal',
        description: 'Programme de fidélité valable en boutique et en ligne. Historique d\'achat unifié.',
        benefit: '+30% de clients fidèles'
      },
      {
        icon: '💰',
        title: 'Pilotage financier',
        description: 'Prévisions de trésorerie, analyse de marge par produit, optimisation du mix produits.',
        benefit: '95% de précision'
      },
      {
        icon: '📊',
        title: 'Analytics de vente',
        description: 'Tableaux de bord temps réel : best-sellers, taux de rotation, performance par canal.',
        benefit: 'Décisions éclairées'
      },
      {
        icon: '📲',
        title: 'Marketing automatisé',
        description: 'Campagnes email/SMS segmentées. Relances paniers abandonnés. Offres personnalisées.',
        benefit: '+25% de conversion'
      },
      {
        icon: '🔄',
        title: 'Promotions dynamiques',
        description: 'Création et gestion des promotions sur tous les canaux simultanément. Codes promo automatiques.',
        benefit: 'Cohérence garantie'
      }
    ],

    testimonials: [
      {
        quote: "Avant, je passais des heures à synchroniser stock et prix entre ma boutique et mon site. Maintenant c'est automatique. J'ai gagné 12h par semaine.",
        author: 'Sophie Martin',
        role: 'Propriétaire',
        company: 'ModaShop',
        location: 'Ville',
        metric: '12h gagnées/semaine'
      },
      {
        quote: "Mon CA a augmenté de 35% en un an grâce à la boutique en ligne intégrée. Mes clients achètent désormais partout, tout le temps.",
        author: 'Julie Renard',
        role: 'Gérante',
        company: 'Boutique Élégance',
        location: 'Marseille',
        metric: '+35% de CA en 12 mois'
      },
      {
        quote: "Le programme de fidélité a transformé mes clients occasionnels en habitués. +30% de clients réguliers en 6 mois.",
        author: 'Pierre Lefebvre',
        role: 'Commerçant',
        company: 'Maison Lefebvre',
        location: 'Toulouse',
        metric: '+30% de clients fidèles'
      }
    ],

    pricing: {
      basePrice: 99,
      features: [
        'Solutions POS, Stock, Store, Finance, Marketing incluses',
        'Caisse physique + boutique en ligne synchronisées',
        'Stock unifié temps réel',
        'Programme fidélité omnicanal',
        'Prévisions de trésorerie IA 90 jours',
        'Marketing automation',
        'Utilisateurs illimités',
        'Support prioritaire 24h'
      ]
    }
  },

  ecommerce: {
    id: 'ecommerce',
    name: 'Quelyos Store',
    sectorName: 'E-commerce',
    headline: 'Vendez en ligne professionnellement',
    subheadline: 'Boutique, stock, marketing : l\'écosystème complet',
    valueProp: 'Créez et gérez votre boutique en ligne avec tous les outils pour réussir. Du catalogue au marketing, tout est intégré.',
    verb: 'réussir votre e-commerce',

    modulesIncluded: ['Store', 'Stock', 'Finance', 'Marketing', 'CRM'],

    stats: {
      clients: '150+',
      timeSaved: '20h/semaine',
      precision: '92%',
      mainMetric: '+50% de ventes en ligne'
    },

    painPoints: [
      {
        problem: 'Complexité technique, besoin d\'un développeur',
        solution: 'Interface no-code intuitive. Créez et personnalisez votre boutique sans compétences techniques.'
      },
      {
        problem: 'Gestion manuelle du stock, erreurs fréquentes',
        solution: 'Synchronisation automatique du stock. Alertes de rupture. Intégration fournisseurs.'
      },
      {
        problem: 'Paniers abandonnés, taux de conversion faible',
        solution: 'Relances automatiques paniers abandonnés. Recommandations produits IA. +25% de conversion.'
      },
      {
        problem: 'Marketing chronophage, résultats médiocres',
        solution: 'Automation marketing complète : emails, SMS, retargeting. ROI mesuré automatiquement.'
      },
      {
        problem: 'Difficultés à prévoir les commandes fournisseurs',
        solution: 'Prévisions de demande IA. Suggestions d\'achat optimisées. Réduction de 40% du surstock.'
      },
      {
        problem: 'Aucune visibilité sur la rentabilité réelle',
        solution: 'Analyse de marge produit par produit incluant tous les coûts. Optimisation automatique.'
      }
    ],

    features: [
      {
        icon: '🛍️',
        title: 'Boutique en ligne complète',
        description: 'Site e-commerce responsive, rapide et optimisé SEO. Personnalisation no-code du design.',
        benefit: 'Professionnel en 1h'
      },
      {
        icon: '📦',
        title: 'Gestion de stock intelligente',
        description: 'Suivi temps réel avec alertes de rupture. Prévisions de demande IA. Intégration fournisseurs.',
        benefit: 'Zéro rupture'
      },
      {
        icon: '🎯',
        title: 'Marketing automation',
        description: 'Relances paniers abandonnés, emails de bienvenue, campagnes segmentées, retargeting automatique.',
        benefit: '+25% de conversion'
      },
      {
        icon: '🤖',
        title: 'Recommandations produits IA',
        description: 'Suggestions personnalisées basées sur l\'historique d\'achat et le comportement. Cross-sell optimisé.',
        benefit: '+30% de panier moyen'
      },
      {
        icon: '💰',
        title: 'Pilotage financier avancé',
        description: 'Prévisions de trésorerie, analyse de marge, coût d\'acquisition client, LTV automatiques.',
        benefit: '92% de précision'
      },
      {
        icon: '📊',
        title: 'Analytics e-commerce',
        description: 'Tunnel de conversion, sources de trafic, produits best-sellers, comportement utilisateur.',
        benefit: 'Décisions data-driven'
      },
      {
        icon: '📲',
        title: 'Multicanal intégré',
        description: 'Vendez sur votre site, marketplaces, réseaux sociaux. Centralisation des commandes et du stock.',
        benefit: '+40% de portée'
      },
      {
        icon: '🎁',
        title: 'Fidélisation clients',
        description: 'Programme de fidélité, codes promo automatiques, offres personnalisées selon l\'historique.',
        benefit: '+35% de clients réguliers'
      }
    ],

    testimonials: [
      {
        quote: "J'ai lancé ma boutique en ligne en moins de 2 heures. Les ventes ont dépassé mes espérances : +50% en 6 mois sans compétences techniques.",
        author: 'Julie Renard',
        role: 'Fondatrice',
        company: 'Cosmétiques BioNature',
        location: '100% en ligne',
        metric: '+50% de ventes'
      },
      {
        quote: "Les recommandations produits IA ont augmenté mon panier moyen de 30%. Les clients trouvent exactement ce qu'ils cherchent.",
        author: 'Alexandre Petit',
        role: 'CEO',
        company: 'TechGadgets',
        location: 'Ville',
        metric: '+30% de panier moyen'
      },
      {
        quote: "Le marketing automation a transformé ma boutique. Les relances paniers abandonnés récupèrent 25% de ventes perdues chaque mois.",
        author: 'Marie Dubois',
        role: 'E-commerçante',
        company: 'Mode & Style',
        location: 'Toulouse',
        metric: '+25% de conversion'
      }
    ],

    pricing: {
      basePrice: 99,
      features: [
        'Solutions Store, Stock, Finance, Marketing, CRM incluses',
        'Boutique en ligne responsive complète',
        'Marketing automation (emails, SMS, retargeting)',
        'Recommandations produits IA',
        'Gestion stock + prévisions demande',
        'Analytics e-commerce avancés',
        'Utilisateurs illimités',
        'Support prioritaire 24h'
      ]
    }
  },

  services: {
    id: 'services',
    name: 'Quelyos Pro',
    sectorName: 'Services B2B',
    headline: 'Concentrez-vous sur vos clients, pas sur l\'administratif',
    subheadline: 'CRM, facturation, trésorerie : pilotage métier simplifié',
    valueProp: 'Gérez votre agence ou activité de services avec des outils pensés pour votre métier. Automatisation maximale, croissance simplifiée.',
    verb: 'développer votre activité',

    modulesIncluded: ['CRM', 'Finance', 'HR', 'Marketing'],

    stats: {
      clients: '220+',
      timeSaved: '18h/semaine',
      precision: '93%',
      mainMetric: '70% de temps gagné sur admin'
    },

    painPoints: [
      {
        problem: 'Temps perdu sur facturation et relances',
        solution: 'Facturation automatique avec relances intelligentes. Clients paient 2x plus vite.'
      },
      {
        problem: 'Prospection désorganisée, opportunités perdues',
        solution: 'CRM complet avec pipeline visuel et automatisation des suivis. +40% de conversion.'
      },
      {
        problem: 'Aucune visibilité sur la trésorerie future',
        solution: 'Prévisions de trésorerie à 90 jours avec 93% de précision. Anticipez sereinement.'
      },
      {
        problem: 'Difficultés à suivre la rentabilité par client/projet',
        solution: 'Analyse automatique de la rentabilité avec suivi du temps intégré.'
      },
      {
        problem: 'Gestion d\'équipe chronophage',
        solution: 'Outils RH intégrés : planning, congés, notes de frais automatisées.'
      },
      {
        problem: 'Marketing inefficace, peu de leads qualifiés',
        solution: 'Automation marketing B2B : nurturing, scoring, qualification automatique.'
      }
    ],

    features: [
      {
        icon: '🎯',
        title: 'CRM complet',
        description: 'Pipeline de vente visuel, historique client unifié, automatisation des suivis et relances.',
        benefit: '+40% de conversion'
      },
      {
        icon: '💼',
        title: 'Facturation intelligente',
        description: 'Devis, factures, avoirs automatisés. Relances intelligentes. Intégration comptable.',
        benefit: 'Paiements 2x plus rapides'
      },
      {
        icon: '⏱️',
        title: 'Suivi du temps',
        description: 'Pointage intégré par projet/client. Facturation automatique du temps passé.',
        benefit: 'Zéro heure perdue'
      },
      {
        icon: '💰',
        title: 'Pilotage financier',
        description: 'Prévisions de trésorerie 90 jours, analyse de rentabilité par client, reporting automatique.',
        benefit: '93% de précision'
      },
      {
        icon: '👥',
        title: 'Gestion d\'équipe',
        description: 'Planning, congés, notes de frais, évaluations. Interface simple pour vos collaborateurs.',
        benefit: 'Équipe autonome'
      },
      {
        icon: '📊',
        title: 'Analytics business',
        description: 'Tableaux de bord temps réel : CA, marge, pipeline, productivité, KPIs métier.',
        benefit: 'Décisions éclairées'
      },
      {
        icon: '📧',
        title: 'Marketing automation B2B',
        description: 'Nurturing automatisé, lead scoring, qualification. Intégration LinkedIn.',
        benefit: '+50% de leads qualifiés'
      },
      {
        icon: '🔗',
        title: 'Intégrations métier',
        description: 'Connectez vos outils existants : comptabilité, emailing, calendriers, stockage cloud.',
        benefit: 'Écosystème unifié'
      }
    ],

    testimonials: [
      {
        quote: "Je ne passe plus que 30 minutes par semaine sur la facturation contre 10 heures avant. Les relances automatiques font payer mes clients en 15 jours au lieu de 45.",
        author: 'Thomas Laurent',
        role: 'Fondateur',
        company: 'Agence WebFlow',
        location: 'Ville',
        metric: '70% de temps gagné'
      },
      {
        quote: "Le CRM a structuré notre prospection. Taux de conversion de 25% à 40% en 6 mois grâce aux suivis automatiques.",
        author: 'Caroline Dupont',
        role: 'Directrice',
        company: 'Conseil & Stratégie',
        location: 'Ville',
        metric: '+40% de conversion'
      },
      {
        quote: "Les prévisions de trésorerie m'ont sauvé plusieurs fois. Je sais exactement combien j'aurai dans 90 jours avec 93% de précision.",
        author: 'Vincent Moreau',
        role: 'Gérant',
        company: 'Studio Créatif',
        location: 'Bordeaux',
        metric: '93% de précision tréso'
      }
    ],

    pricing: {
      basePrice: 99,
      features: [
        'Solutions CRM, Finance, HR, Marketing incluses',
        'CRM complet avec pipeline et automation',
        'Facturation + relances automatiques',
        'Suivi du temps intégré',
        'Prévisions de trésorerie IA 90 jours',
        'Gestion d\'équipe (planning, congés, frais)',
        'Utilisateurs illimités',
        'Support prioritaire 24h'
      ]
    }
  },

  sante: {
    id: 'sante',
    name: 'Quelyos Care',
    sectorName: 'Santé & Bien-être',
    headline: 'Soignez vos patients, on gère le reste',
    subheadline: 'Agenda, dossiers, facturation : solution santé complète',
    valueProp: 'Solution tout-en-un pour professionnels de santé et bien-être. Gestion de cabinet simplifiée, conformité garantie.',
    verb: 'gérer votre cabinet',

    modulesIncluded: ['CRM', 'Finance', 'Marketing'],

    stats: {
      clients: '120+',
      timeSaved: '10h/semaine',
      precision: '94%',
      mainMetric: '+35% de rendez-vous'
    },

    painPoints: [
      {
        problem: 'Gestion des rendez-vous chronophage',
        solution: 'Agenda en ligne avec réservation 24/7 et rappels SMS automatiques. -50% d\'absences.'
      },
      {
        problem: 'Dossiers patients dispersés, recherche difficile',
        solution: 'Dossier patient unifié et sécurisé. Accès instantané à tout l\'historique.'
      },
      {
        problem: 'Facturation et télétransmission complexes',
        solution: 'Facturation automatique avec télétransmission CPAM intégrée. Conformité garantie.'
      },
      {
        problem: 'Cabinet vide certains créneaux',
        solution: 'Optimisation automatique de l\'agenda et rappels patients. +35% de taux de remplissage.'
      },
      {
        problem: 'Difficultés à fidéliser les patients',
        solution: 'Rappels automatiques de rendez-vous préventifs. Suivi personnalisé.'
      },
      {
        problem: 'Manque de visibilité financière',
        solution: 'Prévisions de revenus, analyse de rentabilité par type de consultation.'
      }
    ],

    features: [
      {
        icon: '📅',
        title: 'Agenda intelligent',
        description: 'Réservation en ligne 24/7, rappels SMS/email automatiques, gestion des annulations.',
        benefit: '-50% d\'absences'
      },
      {
        icon: '📋',
        title: 'Dossier patient unifié',
        description: 'Historique complet sécurisé, notes de consultation, documents, prescriptions.',
        benefit: 'Conformité RGPD'
      },
      {
        icon: '💳',
        title: 'Facturation santé',
        description: 'Télétransmission CPAM automatique, tiers payant, feuilles de soins électroniques.',
        benefit: 'Conformité garantie'
      },
      {
        icon: '💰',
        title: 'Pilotage du cabinet',
        description: 'Prévisions de revenus, taux d\'occupation, analyse par type de consultation.',
        benefit: '94% de précision'
      },
      {
        icon: '📲',
        title: 'Communication patients',
        description: 'Rappels automatiques, newsletters santé, enquêtes de satisfaction.',
        benefit: '+35% de fidélisation'
      },
      {
        icon: '🔒',
        title: 'Sécurité & conformité',
        description: 'Hébergement HDS certifié, chiffrement bout-en-bout, traçabilité complète.',
        benefit: 'Certification HDS'
      },
      {
        icon: '📊',
        title: 'Statistiques cabinet',
        description: 'Tableaux de bord : consultations, revenus, motifs de visite, évolution patientèle.',
        benefit: 'Pilotage optimisé'
      },
      {
        icon: '🔗',
        title: 'Intégrations santé',
        description: 'Connecteurs systèmes médicaux, laboratoires, pharmacies, mutuelles.',
        benefit: 'Écosystème connecté'
      }
    ],

    testimonials: [
      {
        quote: "Les rendez-vous en ligne ont rempli mes créneaux creux. +35% de consultations en 6 mois, sans effort marketing.",
        author: 'Dr. Claire Bernard',
        role: 'Médecin généraliste',
        company: 'Cabinet médical',
        location: 'Nantes',
        metric: '+35% de consultations'
      },
      {
        quote: "Les rappels SMS ont divisé par deux les absences. Mon planning est désormais optimal, moins de stress financier.",
        author: 'Sylvie Moreau',
        role: 'Ostéopathe',
        company: 'Cabinet bien-être',
        location: 'Marseille',
        metric: '-50% d\'absences'
      },
      {
        quote: "La télétransmission CPAM automatique m'a fait gagner 8 heures par semaine. Je me concentre enfin sur mes patients.",
        author: 'Jean Dupuis',
        role: 'Kinésithérapeute',
        company: 'Cabinet kiné',
        location: 'Lille',
        metric: '8h gagnées/semaine'
      }
    ],

    pricing: {
      basePrice: 99,
      features: [
        'Solutions CRM, Finance, Marketing incluses',
        'Agenda en ligne + réservation 24/7',
        'Dossier patient sécurisé (conformité RGPD/HDS)',
        'Télétransmission CPAM intégrée',
        'Rappels SMS/email automatiques',
        'Prévisions de revenus',
        'Utilisateurs illimités',
        'Support prioritaire santé'
      ]
    }
  },

  btp: {
    id: 'btp',
    name: 'Quelyos Build',
    sectorName: 'BTP & Artisanat',
    headline: 'Du devis au chantier, tout sous contrôle',
    subheadline: 'Devis, interventions, matériaux : solution artisans',
    valueProp: 'Gérez votre activité d\'artisan ou PME du BTP de A à Z. Devis rapides, suivi de chantiers, facturation automatique.',
    verb: 'piloter vos chantiers',

    modulesIncluded: ['CRM', 'Stock', 'Finance', 'HR'],

    stats: {
      clients: '95+',
      timeSaved: '14h/semaine',
      precision: '91%',
      mainMetric: '+40% de devis transformés'
    },

    painPoints: [
      {
        problem: 'Devis lents à produire, clients impatients',
        solution: 'Devis automatisés avec bibliothèque de prestations. Création en 10 min au lieu de 2h.'
      },
      {
        problem: 'Difficultés à suivre les chantiers en cours',
        solution: 'Planning visuel des interventions avec suivi temps réel. Alertes de retard automatiques.'
      },
      {
        problem: 'Gestion des matériaux désorganisée',
        solution: 'Suivi du stock de matériaux avec alertes et commandes fournisseurs intégrées.'
      },
      {
        problem: 'Paiements clients en retard',
        solution: 'Facturation automatique avec relances intelligentes. Paiements 2x plus rapides.'
      },
      {
        problem: 'Difficultés à gérer l\'équipe et les plannings',
        solution: 'Planning équipe optimisé, affectation automatique, suivi des heures par chantier.'
      },
      {
        problem: 'Pas de visibilité sur la rentabilité par chantier',
        solution: 'Analyse automatique marge par chantier incluant main-d\'œuvre et matériaux.'
      }
    ],

    features: [
      {
        icon: '📝',
        title: 'Devis rapides',
        description: 'Bibliothèque de prestations, calcul automatique, génération PDF pro en quelques clics.',
        benefit: '10 min par devis'
      },
      {
        icon: '🏗️',
        title: 'Suivi de chantiers',
        description: 'Planning visuel, affectation d\'équipe, suivi d\'avancement, photos avant/après.',
        benefit: 'Zéro retard'
      },
      {
        icon: '📦',
        title: 'Gestion des matériaux',
        description: 'Stock en temps réel, alertes de réapprovisionnement, commandes fournisseurs intégrées.',
        benefit: 'Optimisation stocks'
      },
      {
        icon: '💰',
        title: 'Facturation BTP',
        description: 'Situations de travaux, retenue de garantie, facturation automatique, relances.',
        benefit: 'Paiements 2x plus vites'
      },
      {
        icon: '👷',
        title: 'Gestion d\'équipe',
        description: 'Planning équipe, affectation par compétences, suivi des heures, notes de frais.',
        benefit: 'Productivité optimale'
      },
      {
        icon: '📊',
        title: 'Rentabilité chantiers',
        description: 'Analyse marge par chantier avec coûts réels matériaux + main-d\'œuvre.',
        benefit: '+15% de marge'
      },
      {
        icon: '📸',
        title: 'Photos de chantiers',
        description: 'Capture photos avant/après, annotations, partage client automatique.',
        benefit: 'Satisfaction client'
      },
      {
        icon: '🔗',
        title: 'Intégrations BTP',
        description: 'Connexion logiciels métier, fournisseurs matériaux, comptabilité.',
        benefit: 'Écosystème unifié'
      }
    ],

    testimonials: [
      {
        quote: "Les devis automatisés ont transformé ma productivité. Je réponds désormais en 10 minutes, mes clients adorent. +40% de transformation.",
        author: 'Michel Durand',
        role: 'Artisan plombier',
        company: 'Plomberie Durand',
        location: 'Strasbourg',
        metric: '+40% de devis transformés'
      },
      {
        quote: "Le suivi de chantiers me permet de gérer 3 interventions simultanées sans stress. Mon équipe sait toujours où aller.",
        author: 'Patrick Rousseau',
        role: 'Gérant',
        company: 'Électricité Rousseau',
        location: 'Rennes',
        metric: '3x plus de chantiers gérés'
      },
      {
        quote: "L'analyse de rentabilité par chantier m'a fait réaliser que certains travaux me coûtaient de l'argent. J'ai optimisé mes prix et gagné 15% de marge.",
        author: 'Julien Lambert',
        role: 'Artisan menuisier',
        company: 'Menuiserie Lambert',
        location: 'Nice',
        metric: '+15% de marge'
      }
    ],

    pricing: {
      basePrice: 99,
      features: [
        'Solutions CRM, Stock, Finance, HR incluses',
        'Devis automatisés avec bibliothèque prestations',
        'Suivi de chantiers et planning équipe',
        'Gestion stock matériaux + commandes',
        'Facturation BTP (situations, retenue)',
        'Analyse rentabilité par chantier',
        'Utilisateurs illimités',
        'Support prioritaire BTP'
      ]
    }
  },

  hotellerie: {
    id: 'hotellerie',
    name: 'Quelyos Hotel',
    sectorName: 'Hôtellerie',
    headline: 'Remplissez vos chambres, simplifiez votre gestion',
    subheadline: 'Réservations, planning, check-in : solution hôtelière',
    valueProp: 'Solution complète pour hôtels, chambres d\'hôtes et hébergements touristiques. Optimisez votre taux d\'occupation.',
    verb: 'gérer votre établissement',

    modulesIncluded: ['CRM', 'POS', 'Finance', 'Marketing'],

    stats: {
      clients: '85+',
      timeSaved: '16h/semaine',
      precision: '92%',
      mainMetric: '+45% de réservations directes'
    },

    painPoints: [
      {
        problem: 'Dépendance aux OTA (Booking, Airbnb) et commissions élevées',
        solution: 'Moteur de réservation direct avec 0% de commission. +45% de réservations directes.'
      },
      {
        problem: 'Gestion manuelle du planning des chambres',
        solution: 'Channel manager intégré synchronisant tous les canaux de distribution en temps réel.'
      },
      {
        problem: 'Check-in/check-out chronophages',
        solution: 'Check-in en ligne automatisé. Les clients reçoivent leur code d\'accès par SMS.'
      },
      {
        problem: 'Pas de visibilité sur le taux d\'occupation futur',
        solution: 'Prévisions d\'occupation par saison. Yield management automatique pour optimiser les tarifs.'
      },
      {
        problem: 'Difficultés à fidéliser les clients',
        solution: 'Programme de fidélité avec offres personnalisées. +30% de clients réguliers.'
      },
      {
        problem: 'Gestion de la facturation complexe',
        solution: 'Facturation automatique avec paiement en ligne. Intégration comptable.'
      }
    ],

    features: [
      {
        icon: '🏨',
        title: 'Moteur de réservation',
        description: 'Système de réservation en ligne sans commission. Intégration site web et réseaux sociaux.',
        benefit: '0% de commission'
      },
      {
        icon: '📅',
        title: 'Channel manager',
        description: 'Synchronisation temps réel avec Booking, Airbnb, Expedia. Planning unifié.',
        benefit: 'Zéro double résa'
      },
      {
        icon: '🔑',
        title: 'Check-in digital',
        description: 'Check-in en ligne automatisé. Codes d\'accès envoyés par SMS. Checkout express.',
        benefit: '-80% de temps accueil'
      },
      {
        icon: '💰',
        title: 'Yield management',
        description: 'Optimisation automatique des tarifs selon la demande. Maximisation du revenu par chambre.',
        benefit: '+20% de RevPAR'
      },
      {
        icon: '📊',
        title: 'Analytics hôtelier',
        description: 'Taux d\'occupation, RevPAR, ADR, évolution par saison, prévisions occupation.',
        benefit: 'Pilotage optimisé'
      },
      {
        icon: '🎁',
        title: 'Fidélisation clients',
        description: 'Programme de fidélité, offres personnalisées, codes promo automatiques.',
        benefit: '+30% de clients fidèles'
      },
      {
        icon: '💳',
        title: 'Encaissement intégré',
        description: 'Paiement en ligne sécurisé, terminaux de paiement, facturation automatique.',
        benefit: 'Paiements instantanés'
      },
      {
        icon: '📲',
        title: 'Communication voyageurs',
        description: 'Emails de confirmation, rappels avant arrivée, demandes d\'avis post-séjour.',
        benefit: '+40% d\'avis positifs'
      }
    ],

    testimonials: [
      {
        quote: "Les réservations directes ont explosé : +45% en un an. Je ne dépends plus de Booking et j'ai récupéré mes marges.",
        author: 'Hélène Dubois',
        role: 'Propriétaire',
        company: 'Hôtel Le Provençal',
        location: 'Aix-en-Provence',
        metric: '+45% de réservations directes'
      },
      {
        quote: "Le check-in digital m'a libéré 16h par semaine. Mes clients reçoivent leur code par SMS et s'installent directement.",
        author: 'François Martin',
        role: 'Gérant',
        company: 'Chambres d\'hôtes',
        location: 'Annecy',
        metric: '16h gagnées/semaine'
      },
      {
        quote: "Le yield management a augmenté mon RevPAR de 20%. Les tarifs s'ajustent automatiquement selon la demande.",
        author: 'Sophie Renard',
        role: 'Directrice',
        company: 'Boutique Hotel',
        location: 'Bordeaux',
        metric: '+20% de RevPAR'
      }
    ],

    pricing: {
      basePrice: 129,
      features: [
        'Solutions CRM, POS, Finance, Marketing incluses',
        'Moteur de réservation sans commission',
        'Channel manager (Booking, Airbnb, etc.)',
        'Check-in digital automatisé',
        'Yield management IA',
        'Analytics hôtelier complet',
        'Programme fidélité',
        'Support prioritaire 24h'
      ]
    }
  },

  associations: {
    id: 'associations',
    name: 'Quelyos Club',
    sectorName: 'Associations',
    headline: 'Animez votre communauté sans vous noyer dans l\'admin',
    subheadline: 'Adhérents, cotisations, événements : solution associative',
    valueProp: 'Solution complète pour associations, clubs et organisations. Gestion simplifiée, engagement maximisé.',
    verb: 'développer votre association',

    modulesIncluded: ['CRM', 'Finance', 'Marketing'],

    stats: {
      clients: '110+',
      timeSaved: '12h/semaine',
      precision: '90%',
      mainMetric: '+50% d\'adhérents actifs'
    },

    painPoints: [
      {
        problem: 'Gestion manuelle des adhérents chronophage',
        solution: 'Base adhérents centralisée avec renouvellement automatique. Gain de 12h/semaine.'
      },
      {
        problem: 'Relances cotisations inefficaces',
        solution: 'Relances automatiques par email/SMS. Taux de recouvrement +35%.'
      },
      {
        problem: 'Organisation d\'événements complexe',
        solution: 'Système d\'inscription en ligne avec paiement intégré. Gestion simplifiée.'
      },
      {
        problem: 'Communication dispersée, membres peu engagés',
        solution: 'Newsletters automatiques, notifications ciblées. +50% d\'adhérents actifs.'
      },
      {
        problem: 'Comptabilité associative complexe',
        solution: 'Comptabilité simplifiée conforme aux associations. Rapports automatiques.'
      },
      {
        problem: 'Difficultés à recruter de nouveaux membres',
        solution: 'Formulaires d\'inscription en ligne, campagnes d\'adhésion automatisées.'
      }
    ],

    features: [
      {
        icon: '👥',
        title: 'Gestion des adhérents',
        description: 'Base centralisée, historique complet, renouvellement automatique, cartes de membre digitales.',
        benefit: '12h gagnées/semaine'
      },
      {
        icon: '💳',
        title: 'Cotisations automatisées',
        description: 'Paiement en ligne, prélèvement automatique, relances intelligentes, reçus fiscaux.',
        benefit: '+35% de recouvrement'
      },
      {
        icon: '🎉',
        title: 'Gestion d\'événements',
        description: 'Inscriptions en ligne, paiements, badges, listes participants, enquêtes post-événement.',
        benefit: 'Organisation simplifiée'
      },
      {
        icon: '📧',
        title: 'Communication membres',
        description: 'Newsletters segmentées, notifications push, SMS groupés, historique communications.',
        benefit: '+50% d\'engagement'
      },
      {
        icon: '💰',
        title: 'Comptabilité associative',
        description: 'Suivi budgets, dépenses, recettes, rapports financiers, conformité légale assoc.',
        benefit: 'Conformité garantie'
      },
      {
        icon: '📊',
        title: 'Statistiques association',
        description: 'Tableaux de bord : évolution adhérents, taux de renouvellement, participation événements.',
        benefit: 'Pilotage efficace'
      },
      {
        icon: '🎁',
        title: 'Programme avantages',
        description: 'Offres partenaires, réductions membres, système de points, avantages exclusifs.',
        benefit: 'Fidélisation renforcée'
      },
      {
        icon: '🔗',
        title: 'Site web intégré',
        description: 'Page web de l\'association avec formulaires d\'adhésion et présentation activités.',
        benefit: 'Visibilité en ligne'
      }
    ],

    testimonials: [
      {
        quote: "La gestion des adhérents est devenue un jeu d'enfant. Les relances automatiques ont augmenté notre taux de renouvellement de 35%.",
        author: 'Pierre Lefebvre',
        role: 'Président',
        company: 'Association sportive',
        location: 'Toulouse',
        metric: '+35% de renouvellements'
      },
      {
        quote: "L'organisation de nos événements mensuels prend désormais 30 minutes au lieu de 3 heures. Les inscriptions se font en ligne, c'est magique.",
        author: 'Marie Durand',
        role: 'Secrétaire',
        company: 'Club culturel',
        location: 'Nantes',
        metric: '90% de temps gagné'
      },
      {
        quote: "Nos newsletters ciblées ont réactivé nos membres dormants. +50% de participation aux activités en 6 mois.",
        author: 'Jean Moreau',
        role: 'Trésorier',
        company: 'Association caritative',
        location: 'Ville',
        metric: '+50% d\'adhérents actifs'
      }
    ],

    pricing: {
      basePrice: 49,
      features: [
        'Solutions CRM, Finance, Marketing incluses',
        'Gestion adhérents complète',
        'Cotisations + renouvellements automatiques',
        'Organisation d\'événements',
        'Communication membres (email, SMS)',
        'Comptabilité associative conforme',
        'Site web association',
        'Support prioritaire'
      ]
    }
  }
};

export const getSolutionData = (sectorId: string): SolutionData | undefined => {
  return solutionsData[sectorId];
};

export const getAllSolutions = (): SolutionData[] => {
  return Object.values(solutionsData);
};
