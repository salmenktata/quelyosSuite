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
  type LucideIcon,
} from 'lucide-react';
import type { PageNoticeConfig } from './types';

/**
 * Configurations des notices pour le module Boutique
 * Couleur: indigo (violet)
 */
export const storeNotices: Record<string, PageNoticeConfig> = {
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
};
