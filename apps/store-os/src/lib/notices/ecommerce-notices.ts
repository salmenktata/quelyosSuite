import { Package, ShoppingCart, Users, FolderTree, Ticket, Star, Image as ImageIcon, ShoppingBag, TruckIcon, Lightbulb } from 'lucide-react';
import type { PageNoticeConfig } from './types';

export const ecommerceNotices: Record<string, PageNoticeConfig> = {
  products: {
    pageId: 'ecommerce-products',
    title: 'Catalogue Produits',
    purpose: "Gérez l'intégralité de votre catalogue e-commerce : création, modification, import/export massif, gestion des variantes, prix et disponibilité. Contrôlez ce qui est visible sur le site vitrine.",
    icon: Package,
    moduleColor: 'indigo',
    sections: [{
      title: 'Optimisation du catalogue',
      icon: Lightbulb,
      items: [
        "Complétez les fiches avec images HD (min 1200x1200px), descriptions SEO-friendly et attributs détaillés",
        "Utilisez les variantes pour produits déclinables (tailles, couleurs) : évite la multiplication de fiches",
        "Importez massivement via Excel/CSV : gain de temps majeur pour catalogues volumineux",
        "Gérez les prix par liste (particuliers, B2B, revendeurs) : tarification différenciée automatique",
        "Archivez plutôt que supprimer : préserve historique commandes et permet réactivation rapide",
      ]
    }]
  },

  orders: {
    pageId: 'ecommerce-orders',
    title: 'Commandes E-commerce',
    purpose: "Suivez et traitez toutes les commandes passées sur votre site e-commerce. Gérez les statuts (nouveau, en préparation, expédié, livré), les paiements et les litiges clients.",
    icon: ShoppingCart,
    moduleColor: 'indigo',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        "Traitez quotidiennement les nouvelles commandes : délai de traitement < 24h améliore satisfaction client",
        "Mettez à jour les statuts en temps réel : le client reçoit des notifications automatiques",
        "Exportez les commandes pour préparation entrepôt ou intégration transporteur",
        "Surveillez les commandes \"Paiement en attente\" : relancez ou annulez après 48-72h",
        "Analysez les taux d'abandon par étape du tunnel pour identifier les frictions",
      ]
    }]
  },

  customers: {
    pageId: 'ecommerce-customers',
    title: 'Base Clients E-commerce',
    purpose: "Consultez et gérez votre base clients e-commerce : historique d'achats, segments, coordonnées, préférences. Identifiez vos meilleurs clients et prospects à réactiver.",
    icon: Users,
    moduleColor: 'indigo',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        "Segmentez par valeur : VIP (>X€/an), Réguliers, Occasionnels, Inactifs (>6 mois)",
        "Analysez le LTV (Lifetime Value) et fréquence d'achat pour cibler les actions marketing",
        "Exportez les segments pour campagnes emailing/SMS ciblées",
        "Surveillez les clients à risque : inactifs depuis longtemps, première commande non répétée",
        "Enrichissez les profils avec tags comportementaux (panier moyen, catégories préférées)",
      ]
    }]
  },

  categories: {
    pageId: 'ecommerce-categories',
    title: 'Catégories Produits',
    purpose: "Organisez votre catalogue en catégories et sous-catégories pour faciliter la navigation client. Gérez l'arborescence, les visuels et le référencement des pages catégories.",
    icon: FolderTree,
    moduleColor: 'indigo',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        "Limitez la profondeur : 3 niveaux max (Homme > Vêtements > T-shirts) pour éviter de perdre le client",
        "Optimisez SEO : URL propres, méta-descriptions uniques, mots-clés stratégiques par catégorie",
        "Ajoutez des visuels attractifs : bannières catégories améliorent l'engagement de 30%+",
        "Équilibrez le nombre de produits : ni catégories surchargées (>100 produits), ni vides (<3 produits)",
        "Créez des catégories saisonnières temporaires (Soldes, Nouveautés, Best-sellers)",
      ]
    }]
  },

  coupons: {
    pageId: 'ecommerce-coupons',
    title: 'Codes Promo & Coupons',
    purpose: "Créez et gérez vos campagnes promotionnelles : codes promo, remises pourcentage ou montant fixe, conditions d'application. Suivez l'utilisation et le ROI de chaque campagne.",
    icon: Ticket,
    moduleColor: 'indigo',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        `Définissez des conditions claires : montant minimum, catégories/produits éligibles, limite d'utilisation`,
        `Utilisez des codes mémorables pour campagnes génériques (BIENVENUE10, SOLDES20)`,
        `Générez des codes uniques pour partenaires/influenceurs : trackez la performance par source`,
        `Limitez la durée : urgence booste conversions (ex: 72h pour Black Friday)`,
        `Analysez le ROI : coût remise vs CA additionnel généré, taux de conversion avec/sans promo`,
      ]
    }]
  },

  featured: {
    pageId: 'ecommerce-featured',
    title: 'Produits Vedette',
    purpose: "Mettez en avant vos produits stratégiques sur la page d'accueil et pages clés du site. Optimisez la visibilité de vos bestsellers, nouveautés ou produits à forte marge.",
    icon: Star,
    moduleColor: 'indigo',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        `Limitez à 6-12 produits vedette : trop de choix diminue le taux de conversion`,
        `Renouvelez régulièrement (hebdomadaire/mensuel) : évite la lassitude des visiteurs récurrents`,
        `Priorisez mix stratégique : 50% bestsellers (conversion facile) + 50% nouveautés/forte marge`,
        `Testez l'ordre d'affichage : les 3 premiers captent 70% de l'attention`,
        `Mesurez impact : trackez CTR, conversion et CA généré par produit vedette`,
      ]
    }]
  },

  promoBanners: {
    pageId: 'ecommerce-promo-banners',
    title: 'Bannières Promotionnelles',
    purpose: "Créez et planifiez les bannières promotionnelles affichées sur votre site e-commerce. Gérez les visuels, liens, positionnement et périodes d'activation pour maximiser l'impact commercial.",
    icon: ImageIcon,
    moduleColor: 'indigo',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        `Respectez les formats recommandés : desktop 1920x600px, mobile 768x600px pour éviter déformations`,
        `Utilisez des CTA clairs et visibles : boutons contrastés avec verbes d'action ("Découvrir", "Profiter")`,
        `Planifiez les campagnes à l'avance : changements automatiques selon calendrier commercial`,
        `Testez A/B : comparez performance de 2 visuels/messages sur même période`,
        `Optimisez poids images (<200Ko) : vitesse chargement critique pour conversion`,
      ]
    }]
  },

  abandonedCarts: {
    pageId: 'ecommerce-abandoned-carts',
    title: 'Paniers Abandonnés',
    purpose: "Identifiez et analysez les paniers abandonnés pour comprendre les frictions du tunnel de commande. Déclenchez des relances automatiques pour récupérer les ventes perdues.",
    icon: ShoppingBag,
    moduleColor: 'indigo',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        `Analysez les motifs d'abandon : prix total trop élevé, frais de port, processus trop long`,
        `Configurez relances email automatiques : 1h, 24h, 72h après abandon avec incentive croissant`,
        `Proposez réduction progressive : 5% après 24h, 10% après 72h pour débloquer l'achat`,
        `Simplifiez tunnel : checkout en 3 étapes max, paiement express (PayPal, Apple Pay)`,
        `Surveillez taux abandon global : cible <70%, alertez si dégradation soudaine`,
      ]
    }]
  },

  delivery: {
    pageId: 'ecommerce-delivery',
    title: 'Modes de Livraison',
    purpose: "Configurez les modes de livraison proposés à vos clients : tarifs, délais, zones géographiques, transporteurs. Optimisez l'équilibre entre choix client et rentabilité logistique.",
    icon: TruckIcon,
    moduleColor: 'indigo',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        `Proposez plusieurs options : standard économique + express premium pour couvrir tous besoins`,
        `Activez livraison gratuite conditionnelle : seuil = panier moyen +20% pour booster CA`,
        `Configurez zones géographiques : tarifs dégressifs local > national > international`,
        `Intégrez tracking transporteur : lien suivi automatique réduit charge SAV de 30%`,
        `Testez impact franco de port : souvent rentable malgré coût (conversion +15-25%)`,
      ]
    }]
  },
};
