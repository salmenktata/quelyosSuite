import {
  Store,
  ShoppingCart,
  Package,
  Palette,
  Image,
  Settings,
  Tag,
  Truck,
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
};
