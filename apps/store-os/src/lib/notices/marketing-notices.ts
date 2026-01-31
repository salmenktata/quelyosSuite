import { Megaphone, MessageSquare, Image as ImageIcon, Shield, Search, FileText, Menu, Lightbulb } from 'lucide-react';
import type { PageNoticeConfig } from './types';

export const marketingNotices: Record<string, PageNoticeConfig> = {
  popups: {
    pageId: 'marketing-popups',
    title: 'Popups Marketing',
    purpose: "Créez et gérez vos popups marketing intelligentes pour capter l'attention des visiteurs au bon moment : exit intent, scroll, délai temporisé. Maximisez conversions et inscriptions newsletter.",
    icon: Megaphone,
    moduleColor: 'pink',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        `Limitez à 1 popup par session pour éviter frustration utilisateur (taux rebond +40% si trop de popups)`,
        `Utilisez exit intent pour dernière chance conversion avant départ (timing optimal : souris vers barre navigation)`,
        `Proposez valeur claire immédiate : remise 10%, guide gratuit, livraison offerte (CTA spécifique > générique)`,
        `Testez délais : 15-30s pour articles blog, 5-10s pour pages produits, immédiat pour checkout`,
        `Mesurez taux conversion par popup : visuel A/B testing, optimisez message/design selon performance`,
      ]
    }]
  },

  promoMessages: {
    pageId: 'marketing-promo-messages',
    title: 'Messages Promotionnels',
    purpose: "Gérez les messages de promo bar affichés en haut du site (header) pour communiquer offres spéciales, livraison gratuite, nouveautés. Rotation automatique pour capter attention.",
    icon: MessageSquare,
    moduleColor: 'pink',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        `Limitez à 3-4 messages en rotation : trop de messages diminue impact et lisibilité`,
        `Priorisez urgence + bénéfice clair : "Livraison gratuite dès 50€ - Expire ce soir 23h59"`,
        `Utilisez couleurs contrastées selon importance : rouge (urgence flash), vert (livraison gratuite), bleu (info)`,
        `Alternez 5-8 secondes par message : assez long pour lire, assez rapide pour montrer variété`,
        `Trackez clics par message : identifiez les accroches performantes, supprimez messages ignorés`,
      ]
    }]
  },

  heroSlides: {
    pageId: 'marketing-hero-slides',
    title: 'Hero Slider Homepage',
    purpose: "Configurez le carrousel de slides héro en page d'accueil : visuels grand format, messages clés, CTA stratégiques. Première impression critique pour engagement visiteur.",
    icon: ImageIcon,
    moduleColor: 'pink',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        `Limitez à 3-5 slides max : au-delà, utilisateurs ignorent carrousel et scrollent directement`,
        `Images HD optimisées : 1920x800px desktop, <200Ko compression intelligente, format WebP préféré`,
        `Message clair en 5 mots max + CTA visible : bouton contrasté, verbe action ("Découvrir", "Profiter")`,
        `Rotation automatique 5-7 secondes : pause automatique au hover pour lire tranquillement`,
        `Slide 1 = offre principale : 70% visiteurs ne voient que le premier slide, placez meilleur argument`,
      ]
    }]
  },

  trustBadges: {
    pageId: 'marketing-trust-badges',
    title: 'Badges de Confiance',
    purpose: "Gérez les badges de réassurance affichés site (paiement sécurisé, garantie, livraison rapide, retour gratuit). Éléments cruciaux pour conversion et réduction abandon panier.",
    icon: Shield,
    moduleColor: 'pink',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        `Affichez 4-6 badges max : paiement sécurisé, livraison rapide, retour facile, garantie, SAV réactif`,
        `Positionnement stratégique : footer (réassurance globale), fiche produit (avant ajout panier), checkout (réduction friction)`,
        `Icônes reconnaissables instantanément : cadenas (sécurité), camion (livraison), boîte retour (retours)`,
        `Messages concrets chiffrés : "Livraison 48h" > "Livraison rapide", "Garantie 2 ans" > "Garanti"`,
        `Prouvez affirmations : logos transporteurs, certifications SSL/PCI DSS, nombre clients satisfaits`,
      ]
    }]
  },

  seoMetadata: {
    pageId: 'marketing-seo-metadata',
    title: 'Métadonnées SEO',
    purpose: "Optimisez les balises meta (title, description, keywords, Open Graph) pour chaque type de page. Améliore référencement naturel Google et partage réseaux sociaux.",
    icon: Search,
    moduleColor: 'pink',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        `Title 50-60 caractères : inclure mot-clé principal + marque, unique par page, éviter duplication`,
        `Description 150-160 caractères : résumé attractif avec CTA, mot-clé secondaire, incite au clic`,
        `Open Graph complet : og:title, og:description, og:image (1200x630px), og:url pour partage Facebook/LinkedIn/Twitter`,
        `Keywords 5-10 mots-clés : focus qualité sur pertinence, éviter keyword stuffing (Google ignore depuis 2009)`,
        `Structure hiérarchique : Homepage > Catégories > Produits avec breadcrumbs schema.org pour rich snippets`,
      ]
    }]
  },

  staticPages: {
    pageId: 'marketing-static-pages',
    title: 'Pages Statiques',
    purpose: "Gérez les pages de contenu éditorial (À propos, CGV, Mentions légales, Politique confidentialité, FAQ, Contact). Essentielles pour conformité légale et SEO.",
    icon: FileText,
    moduleColor: 'pink',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        `Pages obligatoires légales : Mentions légales, CGV, Politique confidentialité RGPD, Cookies (conformité e-commerce)`,
        `FAQ structurée avec schema markup : questions/réponses indexables Google, augmente trafic organique longue traîne`,
        `Page "À propos" storytelling : histoire marque, valeurs, équipe, raison d'être pour humaniser entreprise`,
        `Contact multi-canal : formulaire + email + téléphone + adresse + horaires, temps réponse < 24h`,
        `SEO pages statiques : optimisez title/description, maillage interne vers produits, call-to-action bottom page`,
      ]
    }]
  },

  menus: {
    pageId: 'marketing-menus',
    title: 'Menus de Navigation',
    purpose: "Configurez les menus de navigation site (header, footer, sidebar, méga-menu). Architecture navigation critique pour UX, SEO et conversions.",
    icon: Menu,
    moduleColor: 'pink',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        `Header menu 5-7 items max : au-delà, surcharge cognitive et abandon utilisateur (règle de Miller 7±2)`,
        `Hiérarchie claire : mega-menu pour catégories nombreuses, sous-menus pour 3-8 items, éviter >3 niveaux profondeur`,
        `Footer structuré en colonnes : Produits, Aide, Entreprise, Légal + réseaux sociaux + newsletter`,
        `Labels explicites actionnables : "Nos produits" > "Catalogue", "Aide & Contact" > "Support"`,
        `Mobile hamburger menu : icône reconnaissable, slide-in animé, fermeture facile (X visible), search accessible`,
      ]
    }]
  },
};
