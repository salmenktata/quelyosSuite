import {
  Store,
  ShoppingCart,
  Package,
  Palette,
  Image,
  Settings,
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
    features: [
      { icon: Palette, text: 'Thèmes prédéfinis et personnalisables' },
      { icon: Image, text: 'Upload logo et favicon' },
      { icon: Settings, text: 'Configuration complète du site' },
    ],
    actions: [
      {
        label: 'Appliquer un thème',
        description: 'Choisissez un thème prédéfini pour un changement rapide',
      },
      {
        label: 'Personnaliser les couleurs',
        description: 'Ajustez chaque couleur individuellement',
      },
      {
        label: 'Configurer le SEO',
        description: 'Optimisez votre référencement naturel',
      },
    ],
    color: 'indigo',
  },
  products: {
    pageId: 'store-products',
    title: 'Produits',
    purpose: 'Gérez votre catalogue de produits : ajoutez, modifiez et organisez vos articles.',
    features: [
      { icon: Package, text: 'Gestion du catalogue produits' },
      { icon: Image, text: 'Images et galeries' },
      { icon: Settings, text: 'Variantes et options' },
    ],
    actions: [
      { label: 'Ajouter un produit', description: 'Créez une nouvelle fiche produit' },
      { label: 'Gérer les catégories', description: 'Organisez vos produits' },
    ],
    color: 'indigo',
  },
  orders: {
    pageId: 'store-orders',
    title: 'Commandes',
    purpose: 'Suivez et gérez toutes les commandes de votre boutique.',
    features: [
      { icon: ShoppingCart, text: 'Suivi des commandes' },
      { icon: Package, text: 'Gestion des livraisons' },
    ],
    actions: [
      { label: 'Traiter une commande', description: 'Passez à l\'étape suivante' },
    ],
    color: 'indigo',
  },
  productDetail: {
    pageId: 'store-product-detail',
    title: 'Détails Produit',
    purpose: 'Consultez toutes les informations détaillées d\'un produit : stock, prix, images, variantes.',
    features: [
      { icon: Package, text: 'Informations produit complètes' },
      { icon: Image, text: 'Galerie d\'images' },
      { icon: Settings, text: 'Variantes et options' },
    ],
    actions: [
      { label: 'Modifier', description: 'Éditez les informations du produit' },
      { label: 'Voir sur le site', description: 'Aperçu du rendu public' },
    ],
    color: 'indigo',
  },
  orderDetail: {
    pageId: 'store-order-detail',
    title: 'Détails Commande',
    purpose: 'Consultez et gérez une commande : articles, client, paiement, livraison.',
    features: [
      { icon: ShoppingCart, text: 'Détails de la commande' },
      { icon: Package, text: 'Articles commandés' },
      { icon: Settings, text: 'Statut et suivi' },
    ],
    actions: [
      { label: 'Traiter', description: 'Passez à l\'étape suivante' },
      { label: 'Imprimer', description: 'Imprimez la commande' },
    ],
    color: 'indigo',
  },
};
