import {
  Store,
  ShoppingCart,
  Package,
  Palette,
  Image,
  Settings,
  Tag,
  Truck,
  FileText,
  Megaphone,
  Navigation,
  Shield,
  Search,
  Quote,
  Award,
  HelpCircle,
  Video,
  TrendingUp,
} from 'lucide-react';
import type { PageNoticeConfig } from './types';

/**
 * Configurations des notices pour le module Boutique
 * Couleur: indigo (violet)
 */
export const storeNotices: Record<string, PageNoticeConfig> = {
  dashboard: {
    pageId: 'store-dashboard',
    title: 'Dashboard Boutique',
    purpose:
      'Suivez vos ventes, commandes et alertes stock en temps réel. Consultez les KPIs, les dernières commandes et les produits populaires.',
    icon: Store,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Fonctionnalités',
        icon: TrendingUp,
        items: [
          'KPIs ventes (revenu, commandes, panier moyen, clients)',
          'Variations mensuelles avec tendances',
          '5 dernières commandes avec statuts temps réel',
          'Système alertes intelligent (rupture stock, stock faible)',
          'Top 5 produits populaires',
          'Actions rapides (produits, commandes, catégories)',
        ],
      },
      {
        title: 'Actions recommandées',
        items: [
          'Surveiller alertes stock : Réapprovisionner produits en rupture',
          'Analyser KPIs : Comparer évolution mensuelle',
          'Traiter commandes : Gérer commandes en attente',
          'Optimiser catalogue : Mettre en avant produits populaires',
        ],
      },
    ],
  },
  homepageBuilder: {
    pageId: 'store-homepage-builder',
    title: 'Homepage Builder',
    purpose:
      'Organisez l\'ordre et la visibilité des sections de votre homepage e-commerce avec drag & drop.',
    icon: Navigation,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Fonctionnalités',
        icon: Settings,
        items: [
          'Drag & drop sections homepage',
          'Toggle visibilité sections',
          'Preview ordre temps réel',
          'Sauvegarde configuration tenant',
          'Liens directs vers édition sections',
        ],
      },
      {
        title: 'Actions recommandées',
        items: [
          'Réorganiser sections : Glisser-déposer pour changer ordre',
          'Masquer sections : Désactiver sections non utilisées',
          'Sauvegarder : Enregistrer configuration personnalisée',
          'Réinitialiser : Revenir à l\'ordre par défaut si besoin',
        ],
      },
    ],
  },
  myShop: {
    pageId: 'store-my-shop',
    title: 'Ma Boutique - Personnalisation',
    purpose:
      'Personnalisez l\'apparence de votre boutique en ligne : couleurs, logo, typographie, SEO et fonctionnalités.',
    icon: Palette,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Fonctionnalités',
        icon: Settings,
        items: [
          'Thèmes prédéfinis et personnalisables',
          'Upload logo et favicon',
          'Configuration complète du site',
        ]
      },
      {
        title: 'Actions recommandées',
        items: [
          'Appliquer un thème : Choisissez un thème prédéfini pour un changement rapide',
          'Personnaliser les couleurs : Ajustez chaque couleur individuellement',
          'Configurer le SEO : Optimisez votre référencement naturel',
        ]
      }
    ]
  },
  products: {
    pageId: 'store-products',
    title: 'Produits',
    purpose: 'Gérez votre catalogue de produits : ajoutez, modifiez et organisez vos articles.',
    icon: Package,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Fonctionnalités',
        icon: Settings,
        items: [
          'Gestion du catalogue produits',
          'Images et galeries',
          'Variantes et options',
        ]
      },
      {
        title: 'Actions recommandées',
        items: [
          'Ajouter un produit : Créez une nouvelle fiche produit',
          'Gérer les catégories : Organisez vos produits',
        ]
      }
    ]
  },
  orders: {
    pageId: 'store-orders',
    title: 'Commandes',
    purpose: 'Suivez et gérez toutes les commandes de votre boutique.',
    icon: ShoppingCart,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Fonctionnalités',
        icon: Package,
        items: [
          'Suivi des commandes',
          'Gestion des livraisons',
        ]
      },
      {
        title: 'Actions recommandées',
        items: [
          'Traiter une commande : Passez à l\'étape suivante',
        ]
      }
    ]
  },
  productDetail: {
    pageId: 'store-product-detail',
    title: 'Détails Produit',
    purpose: 'Consultez toutes les informations détaillées d\'un produit : stock, prix, images, variantes.',
    icon: Package,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Fonctionnalités',
        icon: Settings,
        items: [
          'Informations produit complètes',
          'Galerie d\'images',
          'Variantes et options',
        ]
      },
      {
        title: 'Actions disponibles',
        items: [
          'Modifier : Éditez les informations du produit',
          'Voir sur le site : Aperçu du rendu public',
        ]
      }
    ]
  },
  orderDetail: {
    pageId: 'store-order-detail',
    title: 'Détails Commande',
    purpose: 'Consultez et gérez une commande : articles, client, paiement, livraison.',
    icon: ShoppingCart,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Fonctionnalités',
        icon: Package,
        items: [
          'Détails de la commande',
          'Articles commandés',
          'Statut et suivi',
        ]
      },
      {
        title: 'Actions disponibles',
        items: [
          'Traiter : Passez à l\'étape suivante',
          'Imprimer : Imprimez la commande',
        ]
      }
    ]
  },
  productForm: {
    pageId: 'store-product-form',
    title: 'Formulaire Produit',
    purpose: 'Créez ou modifiez un produit : informations, prix, images, variantes et stock.',
    icon: Package,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Fonctionnalités',
        icon: Settings,
        items: [
          'Informations produit complètes',
          'Galerie d\'images multi-upload',
          'Variantes et gestion du stock',
        ]
      },
      {
        title: 'Actions recommandées',
        items: [
          'Remplir les informations : Nom, prix, description, catégorie',
          'Ajouter des images : Upload et réorganisation des photos',
          'Gérer les variantes : Tailles, couleurs, options',
        ]
      }
    ]
  },
  settings: {
    pageId: 'store-settings',
    title: 'Paramètres Boutique',
    purpose: 'Configurez votre boutique en ligne : identité, contact, livraison, fonctionnalités et SEO.',
    icon: Settings,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Configuration disponible',
        icon: Store,
        items: [
          'Identité : Nom, logo et couleurs de marque',
          'Contact : Email, téléphone et WhatsApp',
          'Livraison : Délais et seuil de gratuité',
          'Fonctionnalités : Wishlist, avis, comparateur',
        ]
      },
      {
        title: 'Actions recommandées',
        items: [
          'Personnaliser l\'identité : Configurez le branding de votre boutique',
          'Configurer le contact : Renseignez vos coordonnées client',
          'Optimiser le SEO : Améliorez votre référencement',
        ]
      }
    ]
  },
  siteConfig: {
    pageId: 'store-site-config',
    title: 'Configuration Site',
    purpose: 'Configurez votre boutique en ligne : fonctionnalités, contact, livraison, paiement.',
    icon: Settings,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Fonctionnalités',
        icon: Store,
        items: [
          'Fonctionnalités activables/désactivables',
          'Informations de contact et livraison',
          'Modes de paiement et garantie',
        ]
      },
      {
        title: 'Actions recommandées',
        items: [
          'Activer des fonctionnalités : Comparateur, wishlist, avis, newsletter',
          'Configurer la livraison : Délais et seuil livraison gratuite',
          'Modes de paiement : Carte, espèces, virement, mobile money',
        ]
      }
    ]
  },
  couponForm: {
    pageId: 'store-coupon-form',
    title: 'Formulaire Coupon',
    purpose: 'Créez ou modifiez un code promo : réduction, conditions d\'utilisation et période de validité.',
    icon: Tag,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Fonctionnalités',
        icon: Settings,
        items: [
          'Code promo personnalisable',
          'Conditions et restrictions',
          'Applicabilité par produit/catégorie',
        ]
      },
      {
        title: 'Actions recommandées',
        items: [
          'Définir le code : Nom unique et mémorable',
          'Configurer la réduction : Pourcentage ou montant fixe',
          'Définir la période : Dates de début et fin',
        ]
      }
    ]
  },
  delivery: {
    pageId: 'store-delivery-methods',
    title: 'Méthodes de Livraison',
    purpose: 'Configurez les options de livraison : prix, délais et seuils de gratuité.',
    icon: Truck,
    moduleColor: 'indigo',
    sections: [{
      title: 'Configuration recommandée',
      icon: Settings,
      items: [
        'Proposez plusieurs options : standard économique + express premium pour couvrir tous besoins',
        'Activez livraison gratuite conditionnelle : seuil = panier moyen +20% pour booster CA',
        'Configurez zones géographiques : tarifs dégressifs local > national > international',
        'Testez impact franco de port : souvent rentable malgré coût (conversion +15-25%)',
      ]
    }]
  },
  staticPages: {
    pageId: 'store-static-pages',
    title: 'Pages Statiques',
    purpose: 'Gérez les pages institutionnelles de votre site : À propos, CGV, Mentions légales, etc.',
    icon: FileText,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Fonctionnalités',
        icon: Settings,
        items: [
          'Création et édition de pages statiques',
          'Configuration de la navigation (menu, footer)',
          'Gestion du contenu et de la mise en page',
        ]
      },
      {
        title: 'Actions recommandées',
        items: [
          'Créer pages essentielles : À propos, CGV, Mentions légales',
          'Configurer footer : Organisez vos pages en colonnes',
          'Définir slugs clairs : URLs SEO-friendly',
        ]
      }
    ]
  },
  heroSlides: {
    pageId: 'store-hero-slides',
    title: 'Hero Slides',
    purpose: 'Gérez le carrousel principal de votre page d\'accueil : images, textes et appels à l\'action.',
    icon: Image,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Fonctionnalités',
        icon: Settings,
        items: [
          'Carrousel d\'images avec transitions automatiques',
          'Textes personnalisables (titre, sous-titre, description)',
          'Boutons d\'action primaires et secondaires',
        ]
      },
      {
        title: 'Actions recommandées',
        items: [
          'Créer 3-5 slides : Équilibre entre contenu et temps de chargement',
          'Images haute qualité : Format 16:9, minimum 1920x1080px',
          'CTA clairs : Boutons avec actions précises',
        ]
      }
    ]
  },
  promoMessages: {
    pageId: 'store-promo-messages',
    title: 'Messages Promotionnels',
    purpose: 'Affichez des messages de promotion dans la barre supérieure de votre site.',
    icon: Megaphone,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Fonctionnalités',
        icon: Settings,
        items: [
          'Messages rotatifs automatiques',
          'Personnalisation des couleurs et icônes',
          'Liens cliquables vers promotions',
        ]
      },
      {
        title: 'Actions recommandées',
        items: [
          'Messages courts : Maximum 80 caractères pour lisibilité',
          'Rotation équilibrée : 3-4 messages maximum',
          'Urgence créée : "Livraison gratuite aujourd\'hui seulement"',
        ]
      }
    ]
  },
  promoBanners: {
    pageId: 'store-promo-banners',
    title: 'Bannières Promotionnelles',
    purpose: 'Créez des bannières visuelles pour mettre en avant vos offres et collections.',
    icon: Image,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Fonctionnalités',
        icon: Settings,
        items: [
          'Bannières pleine largeur ou colonnes',
          'Images personnalisables avec overlays',
          'Appels à l\'action intégrés',
        ]
      },
      {
        title: 'Actions recommandées',
        items: [
          'Bannières stratégiques : Entre sections de produits',
          'Design cohérent : Respectez votre charte graphique',
          'Tests A/B : Mesurez l\'impact sur conversions',
        ]
      }
    ]
  },
  menus: {
    pageId: 'store-menus',
    title: 'Menus de Navigation',
    purpose: 'Configurez la navigation principale et les menus de votre site e-commerce.',
    icon: Navigation,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Fonctionnalités',
        icon: Settings,
        items: [
          'Menu principal avec sous-menus',
          'Menu mobile adaptatif',
          'Liens vers catégories et pages',
        ]
      },
      {
        title: 'Actions recommandées',
        items: [
          'Structure claire : Maximum 7 items principaux',
          'Catégories visibles : Produits phares en accès direct',
          'Hiérarchie logique : Sous-menus organisés par thème',
        ]
      }
    ]
  },
  trustBadges: {
    pageId: 'store-trust-badges',
    title: 'Badges de Confiance',
    purpose: 'Affichez des badges de réassurance pour renforcer la confiance des visiteurs.',
    icon: Shield,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Fonctionnalités',
        icon: Settings,
        items: [
          'Badges personnalisables avec icônes',
          'Affichage sur pages stratégiques',
          'Messages de réassurance',
        ]
      },
      {
        title: 'Actions recommandées',
        items: [
          'Badges essentiels : Paiement sécurisé, livraison, retours',
          'Emplacement visible : Footer ou près du panier',
          'Preuves sociales : Avis clients, garanties',
        ]
      }
    ]
  },
  seoMetadata: {
    pageId: 'store-seo-metadata',
    title: 'Métadonnées SEO',
    purpose: 'Optimisez le référencement de votre site avec des métadonnées personnalisées.',
    icon: Search,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Fonctionnalités',
        icon: Settings,
        items: [
          'Meta title et description par page',
          'Open Graph pour réseaux sociaux',
          'Mots-clés et balises structurées',
        ]
      },
      {
        title: 'Actions recommandées',
        items: [
          'Titres optimisés : 50-60 caractères avec mots-clés',
          'Descriptions uniques : 150-160 caractères par page',
          'Images OG : Format 1200x630px pour partages sociaux',
        ]
      }
    ]
  },
  attributes: {
    pageId: 'store-attributes',
    title: 'Attributs Produits',
    purpose: 'Définissez les attributs (Taille, Couleur, Matière...) pour créer des variantes de vos produits.',
    icon: Tag,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Fonctionnalités',
        icon: Settings,
        items: [
          'Attributs personnalisés (Taille, Couleur, Matière...)',
          'Valeurs multiples par attribut',
          'Types d\'affichage (radio, liste, nuancier)',
        ]
      },
      {
        title: 'Actions recommandées',
        items: [
          'Créer un attribut : Définissez Taille, Couleur ou autre',
          'Ajouter des valeurs : S, M, L ou Rouge, Bleu, Vert...',
          'Configurer l\'affichage : Choisissez le mode d\'affichage sur la boutique',
        ]
      }
    ]
  },
  collections: {
    pageId: 'store-collections',
    title: 'Collections',
    purpose: 'Organisez vos produits en collections thématiques ou saisonnières pour faciliter la navigation.',
    icon: Package,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Fonctionnalités',
        icon: Settings,
        items: [
          'Collections thématiques et saisonnières',
          'Images et descriptions personnalisées',
          'Dates de validité programmables',
        ]
      },
      {
        title: 'Actions recommandées',
        items: [
          'Créer une collection : Regroupez des produits par thème',
          'Définir la période : Configurez les dates de début et fin',
          'Mettre en avant : Activez la mise en avant sur la page d\'accueil',
        ]
      }
    ]
  },
  bundles: {
    pageId: 'store-bundles',
    title: 'Packs & Bundles',
    purpose: 'Créez des packs de produits à prix réduit pour augmenter le panier moyen.',
    icon: Package,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Fonctionnalités',
        icon: Settings,
        items: [
          'Packs multi-produits avec réduction',
          'Calcul automatique des économies',
          'Gestion du stock par pack',
        ]
      },
      {
        title: 'Actions recommandées',
        items: [
          'Créer un pack : Combinez plusieurs produits',
          'Définir le prix : Appliquez une réduction',
          'Publier : Rendez le pack visible',
        ]
      }
    ]
  },
  productImport: {
    pageId: 'store-product-import',
    title: 'Import/Export Produits',
    purpose: 'Gérez vos produits en masse via des fichiers CSV.',
    icon: FileText,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Fonctionnalités',
        icon: Settings,
        items: [
          'Export CSV de tous les produits',
          'Import avec prévisualisation',
          'Création et mise à jour en masse',
        ]
      },
      {
        title: 'Actions recommandées',
        items: [
          'Exporter : Téléchargez votre catalogue',
          'Préparer le CSV : Suivez le format indiqué',
          'Importer : Vérifiez l\'aperçu avant validation',
        ]
      }
    ]
  },
  flashSales: {
    pageId: 'store-flash-sales',
    title: 'Ventes Flash',
    purpose: 'Créez des promotions limitées dans le temps.',
    icon: Megaphone,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Fonctionnalités',
        icon: Settings,
        items: [
          'Ventes à durée limitée',
          'Réductions personnalisées par produit',
          'Suivi des performances',
        ]
      },
      {
        title: 'Actions recommandées',
        items: [
          'Créer une vente : Définissez dates et produits',
          'Programmer : Planifiez à l\'avance',
          'Analyser : Suivez le CA',
        ]
      }
    ]
  },
  reviews: {
    pageId: 'store-reviews',
    title: 'Avis Clients',
    purpose: 'Modérez et répondez aux avis de vos clients.',
    icon: Megaphone,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Fonctionnalités',
        icon: Settings,
        items: [
          'Modération des avis',
          'Réponse aux clients',
          'Statistiques et note moyenne',
        ]
      },
      {
        title: 'Actions recommandées',
        items: [
          'Modérer : Approuvez les avis conformes',
          'Répondre : Engagez avec vos clients',
          'Analyser : Suivez la satisfaction',
        ]
      }
    ]
  },
  testimonials: {
    pageId: 'store-testimonials',
    title: 'Témoignages Clients',
    purpose: 'Mettez en avant les témoignages de vos clients satisfaits sur votre site.',
    icon: Quote,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Fonctionnalités',
        icon: Settings,
        items: [
          'Gestion des témoignages clients',
          'Notation par étoiles',
          'Mise en avant sélective',
          'Affichage configurable (homepage, produit, checkout)',
        ]
      },
      {
        title: 'Actions recommandées',
        items: [
          'Ajouter : Créez des témoignages clients',
          'Publier : Activez les meilleurs témoignages',
          'Mettre en avant : Sélectionnez les plus impactants',
        ]
      }
    ]
  },
  loyalty: {
    pageId: 'store-loyalty',
    title: 'Programme Fidélité',
    purpose: 'Récompensez vos clients fidèles avec un système de points et niveaux.',
    icon: Award,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Fonctionnalités',
        icon: Settings,
        items: [
          'Système de points configurable',
          'Niveaux de fidélité avec avantages',
          'Suivi des membres et statistiques',
          'Rédemption de points en réductions',
        ]
      },
      {
        title: 'Actions recommandées',
        items: [
          'Configurer : Définir les règles de points',
          'Créer niveaux : Bronze, Argent, Or, Platine',
          'Analyser : Suivre l\'engagement des membres',
        ]
      }
    ]
  },
  faq: {
    pageId: 'store-faq',
    title: 'FAQ',
    purpose: 'Gérez les questions fréquemment posées pour aider vos clients.',
    icon: HelpCircle,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Fonctionnalités',
        icon: Settings,
        items: [
          'Organisation par catégories',
          'Accordéon pour les réponses',
          'Mise en avant de FAQ importantes',
          'Publication/brouillon',
        ]
      },
      {
        title: 'Actions recommandées',
        items: [
          'Organiser : Créer des catégories thématiques',
          'Rédiger : Ajouter les questions fréquentes',
          'Mettre en avant : Sélectionner les plus utiles',
        ]
      }
    ]
  },
  blog: {
    pageId: 'store-blog',
    title: 'Blog',
    purpose: 'Gérez vos articles et contenus pour améliorer le SEO et engager vos clients.',
    icon: FileText,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Fonctionnalités',
        icon: Settings,
        items: [
          'Gestion des articles par catégorie',
          'États (brouillon, publié, archivé)',
          'Statistiques de lecture',
          'Mise en avant d\'articles',
        ]
      },
      {
        title: 'Actions recommandées',
        items: [
          'Créer des catégories : Organisez vos contenus',
          'Rédiger des articles : Ajoutez du contenu régulièrement',
          'Optimiser le SEO : Utilisez des mots-clés pertinents',
        ]
      }
    ]
  },
  tickets: {
    pageId: 'store-tickets',
    title: 'Support / SAV',
    purpose: 'Gérez les demandes et réclamations de vos clients efficacement.',
    icon: Shield,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Fonctionnalités',
        icon: Settings,
        items: [
          'Gestion des tickets par statut et priorité',
          'Conversation en temps réel',
          'Statistiques de temps de réponse',
          'Attribution et suivi',
        ]
      },
      {
        title: 'Actions recommandées',
        items: [
          'Répondre rapidement : Maintenir un bon temps de réponse',
          'Catégoriser : Organiser les tickets par type',
          'Résoudre : Clôturer les tickets traités',
        ]
      }
    ]
  },
  salesReports: {
    pageId: 'store-sales-reports',
    title: 'Rapports de Ventes',
    purpose: 'Analysez vos performances commerciales et identifiez vos meilleurs produits.',
    icon: ShoppingCart,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Fonctionnalités',
        icon: Settings,
        items: [
          'KPIs clés (CA, commandes, panier moyen)',
          'Top 10 produits par chiffre d\'affaires',
          'Filtrage par période personnalisable',
          'Visualisation des parts de marché',
        ]
      },
      {
        title: 'Actions recommandées',
        items: [
          'Analyser régulièrement : Suivez vos KPIs chaque semaine',
          'Identifier les tendances : Comparez les périodes',
          'Optimiser : Mettez en avant vos meilleurs produits',
        ]
      }
    ]
  },
  stockAlerts: {
    pageId: 'store-stock-alerts',
    title: 'Alertes Stock',
    purpose: 'Surveillez les ruptures et stocks faibles pour éviter les pertes de ventes.',
    icon: Package,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Fonctionnalités',
        icon: Settings,
        items: [
          'Détection des ruptures de stock',
          'Alertes de stock faible',
          'Seuil d\'alerte configurable',
          'Indicateurs visuels de niveau',
        ]
      },
      {
        title: 'Actions recommandées',
        items: [
          'Surveiller quotidiennement : Vérifiez les alertes régulièrement',
          'Réapprovisionner : Commandez avant rupture',
          'Ajuster les seuils : Adaptez selon vos produits',
        ]
      }
    ]
  },
  liveEvents: {
    pageId: 'store-live-events',
    title: 'Live Shopping',
    purpose: 'Organisez des sessions de vente en direct pour engager vos clients et booster vos ventes.',
    icon: Video,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Fonctionnalités',
        icon: Settings,
        items: [
          'Programmation des événements live',
          'Association de produits au live',
          'Gestion des états (brouillon, programmé, en direct, terminé)',
          'Miniature et description personnalisables',
        ]
      },
      {
        title: 'Actions recommandées',
        items: [
          'Planifier : Créez vos événements à l\'avance',
          'Associer produits : Sélectionnez les produits à présenter',
          'Promouvoir : Annoncez le live à vos clients',
        ]
      }
    ]
  },
  trendingProducts: {
    pageId: 'store-trending-products',
    title: 'Produits Tendance',
    purpose: 'Gérez les produits affichés dans la section "Tendances sur les réseaux" de votre page d\'accueil.',
    icon: TrendingUp,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Fonctionnalités',
        icon: Settings,
        items: [
          'Activation/désactivation du statut tendance',
          'Score de tendance pour l\'ordre d\'affichage',
          'Mentions sociales affichées sur les cartes produits',
          'Affichage automatique des 6 premiers sur la homepage',
        ]
      },
      {
        title: 'Actions recommandées',
        items: [
          'Activer les tendances : Sélectionnez 6-10 produits populaires',
          'Ajuster les scores : Plus élevé = plus visible',
          'Mettre à jour les mentions : Refléter l\'engagement réel',
        ]
      }
    ]
  },
  themes: {
    pageId: 'store-themes',
    title: 'Thèmes',
    purpose: 'Choisissez et activez un thème pour personnaliser l\'apparence de votre boutique en ligne.',
    icon: Palette,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Fonctionnalités',
        icon: Settings,
        items: [
          'Galerie de thèmes prédéfinis',
          'Filtres par catégorie (mode, tech, food...)',
          'Activation en un clic',
          'Preview du thème avant activation',
          'Thèmes gratuits et premium',
        ]
      },
      {
        title: 'Actions recommandées',
        items: [
          'Activer un thème : Cliquez sur "Activer" pour appliquer un thème',
          'Explorer les catégories : Trouvez un thème adapté à votre secteur',
          'Preview : Prévisualisez le rendu avant d\'activer',
        ]
      }
    ]
  },
  themeBuilder: {
    pageId: 'theme-builder',
    title: 'Theme Builder',
    purpose: 'Créez et personnalisez vos propres thèmes visuellement sans coder.',
    icon: Palette,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Fonctionnalités',
        icon: Settings,
        items: [
          'Éditeur visuel de couleurs (palette complète)',
          'Configuration typographie (polices Google Fonts)',
          'Gestion des sections homepage (drag & drop)',
          'Espacement et layout personnalisables',
          'Preview en temps réel',
          'Export/Import JSON',
          'Sauvegarde vers le système',
        ]
      },
      {
        title: 'Actions recommandées',
        items: [
          'Commencer par les couleurs : Définissez votre palette de marque',
          'Choisir les polices : 2 polices max pour cohérence visuelle',
          'Ajouter sections : Construisez la homepage idéale',
          'Preview : Vérifiez le rendu avant de sauvegarder',
          'Export : Sauvegardez une copie JSON en local',
        ]
      }
    ]
  },
  'themes.payouts': {
    pageId: 'store-themes-payouts',
    title: 'Payouts Designer',
    purpose: 'Consultez vos revenus de ventes de thèmes et gérez vos paiements Stripe Connect.',
    icon: Palette,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Fonctionnalités',
        icon: Settings,
        items: [
          'Suivi du solde en attente de paiement',
          'Historique complet des revenus (pending/paid/failed)',
          'Onboarding Stripe Connect pour recevoir les paiements',
          'Dashboard Stripe Express intégré',
          'Payouts automatiques mensuels (minimum 50 EUR)',
        ]
      },
      {
        title: 'Comment ça marche',
        items: [
          'Onboarding Stripe : Configurez votre compte Stripe Connect pour recevoir les paiements',
          'Vente de thème : Vous recevez 70% du prix, la plateforme conserve 30%',
          'Payout automatique : Chaque 1er du mois si votre solde ≥ 50 EUR',
          'Délai de traitement : 2-5 jours ouvrés après déclenchement du payout',
        ]
      }
    ]
  },
  'themes.analytics': {
    pageId: 'store-themes-analytics',
    title: 'Analytics Marketplace',
    purpose: 'Consultez les statistiques et performances complètes de votre marketplace de thèmes.',
    icon: Palette,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Métriques disponibles',
        icon: Settings,
        items: [
          'Revenus totaux marketplace (split 70/30 designer/platform)',
          'Nombre de ventes et taux de conversion',
          'Top 5 thèmes les plus vendus avec statistiques détaillées',
          'Top 5 designers par revenus avec statut onboarding',
          'Statistiques par catégorie (mode, tech, food, beauty...)',
          'Évolution temporelle ventes et revenus (6 derniers mois)',
        ]
      },
      {
        title: 'Insights clés',
        items: [
          'Prix moyen thèmes : Identifier la fourchette de prix optimale',
          'Taux conversion : Mesurer l\'efficacité de la marketplace',
          'Payouts en attente : Suivre les paiements designers à déclencher',
          'Soumissions en attente : Gérer la file de validation thèmes',
          'Performance catégories : Identifier les niches les plus rentables',
          'Tendances temporelles : Anticiper les variations saisonnières',
        ]
      }
    ]
  },
  'themes.builder': {
    pageId: 'store-themes-builder',
    title: 'Theme Builder Visuel',
    purpose: 'Créez des thèmes visuellement sans coder avec interface drag & drop, export JSON et sauvegarde backend.',
    icon: Palette,
    moduleColor: 'indigo',
    sections: [
      {
        title: 'Fonctionnalités Phase 1 (actuelle)',
        icon: Settings,
        items: [
          'Palette de 10 sections réutilisables (Hero, Products, Newsletter, etc.)',
          'Canvas pour organiser sections homepage',
          'Configuration de variants pour chaque section',
          'Export/Import JSON pour partage ou backup local',
          'Sauvegarde vers le système comme soumission draft',
        ]
      },
      {
        title: 'Prochaines phases',
        items: [
          'Phase 2 : Éditeur couleurs avec color picker et presets',
          'Phase 2 : Sélecteur Google Fonts avec preview',
          'Phase 3 : Drag & drop fonctionnel avec @dnd-kit',
          'Phase 5 : Preview temps réel dans iframe isolé',
        ]
      }
    ]
  },
};
