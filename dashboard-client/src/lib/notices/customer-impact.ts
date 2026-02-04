/**
 * Customer Impact Helpers - Sections "Impact Client" pour PageNotice
 *
 * Helpers pour générer rapidement des sections "💡 Impact Client"
 * dans les PageNotice, expliquant comment les actions admin
 * affectent l'expérience client.
 *
 * @module lib/notices
 */

import { Eye } from 'lucide-react'
import type { NoticeSection } from './types'

/**
 * Génère une section "Impact Client" pour PageNotice
 */
export function createCustomerImpactSection(impacts: string[]): NoticeSection {
  return {
    title: '💡 Impact Client',
    icon: Eye,
    items: impacts,
  }
}

/**
 * Impacts prédéfinis pour features e-commerce courantes
 */
export const CUSTOMER_IMPACTS = {
  // Products
  productImages: [
    'Photos haute qualité = +40% conversions (vs images floues)',
    'Minimum 4 angles différents pour réduire retours',
    'Format carré recommandé (affichage optimal mobile)',
  ],

  productPrice: [
    'Prix barré (compare_at_price) affiche badge réduction',
    'Réduction visible incite achat impulsif (+25% conversion)',
    'Pricing psychologique : 19,99€ > 20€ (perception valeur)',
  ],

  productStock: [
    'Stock <5 = badge "Plus que X en stock" (urgence)',
    'Stock 0 = overlay "Rupture de stock" + wishlist',
    'Affichage stock renforce confiance et transparence',
  ],

  productDescription: [
    'Bullet points scannés 3x plus que texte dense',
    'Bénéfices avant features (client cherche solution)',
    'Mots-clés améliorent SEO et découvrabilité',
  ],

  // Flash Sales
  flashSaleCountdown: [
    'Countdown timer visible = +60% urgence d\'achat',
    'Affichage temps restant sur page produit',
    'Email 24h avant fin pour rappel urgence',
  ],

  flashSaleDiscount: [
    'Badge réduction rouge attire regard immédiatement',
    'Prix barré + nouveau prix côte à côte (comparaison)',
    'Réduction 20-30% optimal (balance marge/conversion)',
  ],

  // Homepage
  heroSlider: [
    'Première impression décisive (3 secondes attention)',
    'CTA clair augmente clics de 40%',
    'Animation auto-play maintient dynamisme visuel',
  ],

  trustBadges: [
    'Rassure sur sécurité paiement et livraison',
    'Réduit anxiété achat en ligne (-30% abandons)',
    'Badges authentiques (pas inventés) pour crédibilité',
  ],

  testimonials: [
    'Preuve sociale = +15% conversions moyennes',
    'Photos clients authentiques boostent confiance',
    '3-6 témoignages suffisent (trop = suspicion)',
  ],

  newsletter: [
    'Popup sortie capte 3-5% visiteurs (email précieux)',
    'Incentive -10% première commande multiplie inscriptions',
    'Base emails permet relances (ROI 40:1)',
  ],

  // Orders
  orderConfirmation: [
    'Email immédiat = client rassuré (commande validée)',
    'Résumé détaillé réduit appels SAV de 50%',
    'CTA tracking actif dès expédition',
  ],

  orderTracking: [
    'Numéro suivi affiché automatiquement',
    'Client suit colis sans contacter SAV',
    'Notifications auto réduisent inquiétudes livraison',
  ],

  // Checkout
  checkoutSteps: [
    'Checkout 3 étapes optimal (ni trop long ni trop court)',
    'Progress bar visible rassure sur durée processus',
    'Champs pré-remplis réduisent friction de 30%',
  ],

  checkoutPayment: [
    'Multiple moyens paiement = +20% conversions',
    'Badges sécurité SSL rassurent données bancaires',
    'Paiement 1-clic favorise achats impulsifs',
  ],

  // Shipping
  shippingFree: [
    'Livraison gratuite #1 facteur décision achat',
    'Seuil livraison gratuite augmente panier moyen',
    'Affichage "Plus que 15€ pour livraison gratuite"',
  ],

  shippingSpeed: [
    'Délai livraison affiché = transparence client',
    'Option express disponible pour urgents',
    'Estimation réaliste évite déceptions',
  ],

  // Promotions
  promoBanner: [
    'Bannière top page = 100% visibilité',
    'Message court percutant (max 10 mots)',
    'Couleur contrastée attire attention',
  ],

  couponCode: [
    'Code promo visible avant paiement',
    'Auto-apply si URL partagée (conversions +)',
    'Message "Code appliqué" rassure client',
  ],

  // Customer Experience
  reviews: [
    'Système avis vérifié augmente confiance',
    'Photos clients dans avis = +15% conversions',
    'Réponses SAV aux avis négatifs montrent engagement',
  ],

  wishlist: [
    'Sauvegarde produits pour retour ultérieur',
    'Email rappel si prix baisse (relance)',
    'Partage wishlist facilite cadeaux',
  ],

  loyalty: [
    'Points fidélité incitent achats répétés',
    'Gamification (niveaux) engage émotionnellement',
    'Programme visible = différenciation concurrents',
  ],

  // SEO & Performance
  seo: [
    'Méta-descriptions optimisées = +30% clics Google',
    'URLs propres (/produit/nom-produit) indexées mieux',
    'Images alt text améliore accessibilité + SEO',
  ],

  performance: [
    'Temps chargement <3s = meilleur référencement',
    'Images optimisées réduisent abandon mobile',
    'Cache activé améliore expérience retour client',
  ],
}

/**
 * Exemples d'utilisation dans PageNotice configs
 *
 * @example
 * import { createCustomerImpactSection, CUSTOMER_IMPACTS } from '@/lib/notices/customer-impact'
 *
 * export const productNotices: PageNoticeConfig = {
 *   pageId: 'product-form',
 *   title: 'Gestion Produits',
 *   purpose: 'Créer et gérer votre catalogue produits',
 *   sections: [
 *     // Section normale
 *     {
 *       title: 'Fonctionnalités',
 *       items: ['Ajout rapide', 'Import CSV', 'Variantes'],
 *     },
 *     // Section Impact Client
 *     createCustomerImpactSection(CUSTOMER_IMPACTS.productImages),
 *   ],
 *   moduleColor: 'indigo',
 * }
 */
