/**
 * GuidedTours - Tours Guidés Interactifs
 *
 * Système de tours guidés pour onboarding nouveaux utilisateurs.
 * Utilise react-joyride pour créer des parcours pas-à-pas interactifs.
 *
 * Tours disponibles :
 * - flash-sale: Créer première vente flash (7 étapes)
 * - homepage: Optimiser homepage (12 étapes)
 * - product: Créer premier produit (5 étapes)
 *
 * @module components/common
 */

import { useState, useEffect } from 'react'
import Joyride, { CallBackProps, Step, STATUS, ACTIONS, EVENTS } from 'react-joyride'
import { STORAGE_KEYS } from '@quelyos/config'

export type TourId = 'flash-sale' | 'homepage' | 'product' | 'order-management'

interface TourConfig {
  id: TourId
  steps: Step[]
  storageKey: string
}

/**
 * Tour: Créer première vente flash
 */
const FLASH_SALE_TOUR: TourConfig = {
  id: 'flash-sale',
  storageKey: 'quelyos_tour_flash_sale_completed',
  steps: [
    {
      target: 'body',
      content:
        '🎯 Bienvenue ! Ce tour vous guide pour créer votre première vente flash et booster vos ventes.',
      placement: 'center',
    },
    {
      target: '[data-tour="flash-sale-create"]',
      content:
        'Cliquez sur "Nouvelle vente flash" pour commencer. Les ventes flash créent de l\'urgence et augmentent les conversions.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="flash-sale-name"]',
      content:
        'Donnez un nom accrocheur à votre vente flash. Exemple : "Soldes d\'hiver 2026", "Black Friday", etc.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="flash-sale-discount"]',
      content:
        'Définissez le pourcentage de réduction. Une réduction de 20-30% fonctionne bien pour débuter.',
      placement: 'top',
    },
    {
      target: '[data-tour="flash-sale-products"]',
      content:
        'Sélectionnez les produits à inclure dans la vente flash. Commencez avec vos produits les plus populaires.',
      placement: 'left',
    },
    {
      target: '[data-tour="flash-sale-dates"]',
      content:
        'Définissez les dates de début et fin. Une durée de 3-7 jours crée suffisamment d\'urgence.',
      placement: 'top',
    },
    {
      target: '[data-tour="flash-sale-preview"]',
      content:
        '✅ Prévisualisez votre vente flash avant de la publier. Vérifiez le countdown timer et les prix affichés.',
      placement: 'left',
    },
  ],
}

/**
 * Tour: Optimiser homepage
 */
const HOMEPAGE_TOUR: TourConfig = {
  id: 'homepage',
  storageKey: 'quelyos_tour_homepage_completed',
  steps: [
    {
      target: 'body',
      content:
        '🏠 Optimisons votre page d\'accueil pour maximiser les conversions et améliorer l\'expérience client.',
      placement: 'center',
    },
    {
      target: '[data-tour="homepage-hero"]',
      content:
        '1/12 - Hero Slider : Ajoutez 3-5 slides accrocheurs avec images haute qualité et CTA clairs.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="homepage-trust-badges"]',
      content:
        '2/12 - Trust Badges : Affichez vos garanties (paiement sécurisé, livraison gratuite, SAV) pour rassurer.',
      placement: 'top',
    },
    {
      target: '[data-tour="homepage-flash-sales"]',
      content:
        '3/12 - Ventes Flash : Section urgence avec countdown timer. Convertit 2x mieux qu\'un catalogue statique.',
      placement: 'left',
    },
    {
      target: '[data-tour="homepage-categories"]',
      content:
        '4/12 - Catégories : Grille visuelle pour navigation rapide. Maximum 8 catégories principales.',
      placement: 'right',
    },
    {
      target: '[data-tour="homepage-featured"]',
      content:
        '5/12 - Produits Vedette : Mettez en avant vos best-sellers ou nouveautés. 4-8 produits suffisent.',
      placement: 'top',
    },
    {
      target: '[data-tour="homepage-banners"]',
      content:
        '6/12 - Bannières Promo : Annoncez vos offres spéciales avec des visuels impactants.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="homepage-testimonials"]',
      content:
        '7/12 - Témoignages : Preuve sociale essentielle. Affichez 3-6 avis clients authentiques avec photos.',
      placement: 'left',
    },
    {
      target: '[data-tour="homepage-newsletter"]',
      content:
        '8/12 - Newsletter : Captez emails pour relances. Offrez -10% sur première commande pour inciter.',
      placement: 'top',
    },
    {
      target: '[data-tour="homepage-reorder"]',
      content:
        '9/12 - Réorganiser : Drag & drop pour tester différents ordres. Section flash sale en haut convertit mieux.',
      placement: 'right',
    },
    {
      target: '[data-tour="homepage-visibility"]',
      content:
        '10/12 - Visibilité : Toggle sections selon saison/événements. Masquez catégories saisonnières.',
      placement: 'left',
    },
    {
      target: '[data-tour="homepage-preview"]',
      content:
        '11/12 - Preview : Testez sur mobile/desktop AVANT de publier. 65% du trafic vient du mobile.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="homepage-publish"]',
      content:
        '12/12 - Publier : Sauvegardez et vérifiez le résultat sur votre site e-commerce. Bravo ! 🎉',
      placement: 'center',
    },
  ],
}

/**
 * Tour: Créer premier produit
 */
const PRODUCT_TOUR: TourConfig = {
  id: 'product',
  storageKey: 'quelyos_tour_product_completed',
  steps: [
    {
      target: 'body',
      content:
        '📦 Créons votre premier produit ensemble. Suivez ces étapes pour un référencement optimal.',
      placement: 'center',
    },
    {
      target: '[data-tour="product-name"]',
      content:
        'Nom descriptif : Incluez marque, modèle, caractéristiques. Exemple : "iPhone 15 Pro 256Go Noir".',
      placement: 'bottom',
    },
    {
      target: '[data-tour="product-price"]',
      content:
        'Prix : Définissez prix de vente et prix barré (compare_at_price) pour afficher réduction.',
      placement: 'top',
    },
    {
      target: '[data-tour="product-images"]',
      content:
        'Images : Ajoutez 4-8 photos haute qualité (différents angles + détails). Format carré recommandé.',
      placement: 'left',
    },
    {
      target: '[data-tour="product-description"]',
      content:
        'Description : Décrivez bénéfices (pas que features). Utilisez bullet points pour lisibilité.',
      placement: 'right',
    },
    {
      target: '[data-tour="product-preview"]',
      content:
        '✅ Preview : Vérifiez rendu final côté client avant publication. Testez sur mobile !',
      placement: 'center',
    },
  ],
}

/**
 * Tour: Gestion commandes
 */
const ORDER_MANAGEMENT_TOUR: TourConfig = {
  id: 'order-management',
  storageKey: 'quelyos_tour_order_management_completed',
  steps: [
    {
      target: 'body',
      content:
        '📋 Découvrez comment gérer efficacement vos commandes et satisfaire vos clients.',
      placement: 'center',
    },
    {
      target: '[data-tour="order-filters"]',
      content:
        'Filtres : Trouvez rapidement les commandes par statut, date, montant ou client.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="order-status"]',
      content:
        'Statuts : Brouillon → Confirmée → En préparation → Expédiée → Livrée. Mettez à jour pour informer client.',
      placement: 'top',
    },
    {
      target: '[data-tour="order-tracking"]',
      content:
        'Suivi : Ajoutez numéro de tracking pour que client suive son colis en temps réel.',
      placement: 'left',
    },
    {
      target: '[data-tour="order-timeline"]',
      content:
        'Timeline : Visualisez ce que le client voit (emails automatiques, étapes, tracking).',
      placement: 'right',
    },
  ],
}

const TOURS: Record<TourId, TourConfig> = {
  'flash-sale': FLASH_SALE_TOUR,
  homepage: HOMEPAGE_TOUR,
  product: PRODUCT_TOUR,
  'order-management': ORDER_MANAGEMENT_TOUR,
}

export interface GuidedToursProps {
  /** ID du tour à lancer */
  tourId: TourId
  /** Callback appelé quand tour complété */
  onComplete?: (tourId: TourId) => void
  /** Callback appelé quand tour ignoré */
  onSkip?: (tourId: TourId) => void
  /** Lancer automatiquement */
  autoStart?: boolean
  /** Forcer l'affichage même si déjà complété */
  forceShow?: boolean
}

export function GuidedTours({
  tourId,
  onComplete,
  onSkip,
  autoStart = false,
  forceShow = false,
}: GuidedToursProps) {
  const tour = TOURS[tourId]

  // Initialiser run basé sur autoStart et completion status
  const [run, setRun] = useState(() => {
    if (!tour) return false
    const completed = localStorage.getItem(tour.storageKey)
    return autoStart && (!completed || forceShow)
  })

  useEffect(() => {
    if (!tour) return

    // Vérifier si tour déjà complété (sync si état change après mount)
    const completed = localStorage.getItem(tour.storageKey)
    if (completed && !forceShow) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRun(false)
    }
  }, [tour, forceShow])

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, type } = data

    // Tour terminé avec succès
    if (status === STATUS.FINISHED) {
      localStorage.setItem(tour.storageKey, 'true')
      onComplete?.(tourId)
      setRun(false)
    }

    // Tour ignoré (skip/close)
    if (status === STATUS.SKIPPED || action === ACTIONS.CLOSE) {
      onSkip?.(tourId)
      setRun(false)
    }

    // Tour arrêté (ESC)
    if (type === EVENTS.TOUR_END && status !== STATUS.FINISHED) {
      onSkip?.(tourId)
      setRun(false)
    }
  }

  if (!tour) {
    return null
  }

  return (
    <Joyride
      steps={tour.steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      disableScrolling={false}
      locale={{
        back: 'Retour',
        close: 'Fermer',
        last: 'Terminer',
        next: 'Suivant',
        skip: 'Ignorer',
      }}
      styles={{
        options: {
          primaryColor: '#4f46e5', // indigo-600
          textColor: '#1f2937', // gray-800
          backgroundColor: '#ffffff',
          arrowColor: '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 8,
          fontSize: 14,
        },
        buttonNext: {
          backgroundColor: '#4f46e5',
          borderRadius: 6,
          padding: '8px 16px',
        },
        buttonBack: {
          color: '#6b7280',
        },
        buttonSkip: {
          color: '#9ca3af',
        },
      }}
      callback={handleJoyrideCallback}
    />
  )
}

/**
 * Hook pour démarrer un tour guidé
 */
export function useGuidedTour(tourId: TourId) {
  const [isActive, setIsActive] = useState(false)

  const startTour = () => {
    setIsActive(true)
  }

  const stopTour = () => {
    setIsActive(false)
  }

  const resetTour = () => {
    const tour = TOURS[tourId]
    if (tour) {
      localStorage.removeItem(tour.storageKey)
    }
  }

  const isTourCompleted = () => {
    const tour = TOURS[tourId]
    if (!tour) return false
    return localStorage.getItem(tour.storageKey) === 'true'
  }

  return {
    isActive,
    startTour,
    stopTour,
    resetTour,
    isTourCompleted: isTourCompleted(),
  }
}

/**
 * Helper: Vérifier si l'utilisateur devrait voir un tour
 */
export function shouldShowTour(tourId: TourId): boolean {
  const tour = TOURS[tourId]
  if (!tour) return false

  // Tour déjà complété
  const completed = localStorage.getItem(tour.storageKey)
  if (completed) return false

  // Onboarding pas terminé
  const onboarding = localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED)
  if (!onboarding) return false

  return true
}
