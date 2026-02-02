/**
 * Hook pour la commande vocale POS
 * Utilise Web Speech API pour la reconnaissance vocale
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { logger } from '@/lib/logger'

// Types
export interface VoiceCommand {
  type: 'add_product' | 'remove_product' | 'set_quantity' | 'clear_cart' | 'pay' | 'unknown'
  product?: string
  quantity?: number
  rawText: string
  confidence: number
}

interface UseVoiceOrderingOptions {
  language?: string
  continuous?: boolean
  onCommand?: (command: VoiceCommand) => void
  onError?: (error: string) => void
  products?: { name: string; aliases?: string[] }[]
}

interface UseVoiceOrderingReturn {
  isListening: boolean
  isSupported: boolean
  transcript: string
  lastCommand: VoiceCommand | null
  startListening: () => void
  stopListening: () => void
  toggleListening: () => void
}

// Mots-clés pour parser les commandes
const ADD_KEYWORDS = ['ajoute', 'ajouter', 'met', 'mets', 'donne', 'je veux', 'je voudrais', 'un', 'une', 'des']
const REMOVE_KEYWORDS = ['enlève', 'enlever', 'retire', 'retirer', 'supprime', 'supprimer', 'annule']
const _QUANTITY_KEYWORDS = ['deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix']
const QUANTITY_MAP: Record<string, number> = {
  'un': 1, 'une': 1, 'deux': 2, 'trois': 3, 'quatre': 4, 'cinq': 5,
  'six': 6, 'sept': 7, 'huit': 8, 'neuf': 9, 'dix': 10,
  '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
}
const PAY_KEYWORDS = ['payer', 'paiement', 'encaisser', 'total', 'facture', 'addition']
const CLEAR_KEYWORDS = ['vider', 'annuler', 'recommencer', 'effacer tout', 'supprimer tout']

// Parser la commande vocale
function parseVoiceCommand(text: string, products: { name: string; aliases?: string[] }[]): VoiceCommand {
  const lowerText = text.toLowerCase().trim()

  // Détection paiement
  if (PAY_KEYWORDS.some(k => lowerText.includes(k))) {
    return { type: 'pay', rawText: text, confidence: 0.9 }
  }

  // Détection vider panier
  if (CLEAR_KEYWORDS.some(k => lowerText.includes(k))) {
    return { type: 'clear_cart', rawText: text, confidence: 0.9 }
  }

  // Détection suppression
  const isRemove = REMOVE_KEYWORDS.some(k => lowerText.includes(k))

  // Détection ajout
  const _isAdd = ADD_KEYWORDS.some(k => lowerText.includes(k)) || !isRemove

  // Extraire la quantité
  let quantity = 1
  for (const [word, num] of Object.entries(QUANTITY_MAP)) {
    if (lowerText.includes(word)) {
      quantity = num
      break
    }
  }

  // Rechercher le produit
  let matchedProduct: string | undefined
  let bestMatchScore = 0

  for (const product of products) {
    const names = [product.name.toLowerCase(), ...(product.aliases?.map(a => a.toLowerCase()) || [])]

    for (const name of names) {
      // Match exact
      if (lowerText.includes(name)) {
        const score = name.length / lowerText.length
        if (score > bestMatchScore) {
          bestMatchScore = score
          matchedProduct = product.name
        }
      }

      // Match partiel (mots)
      const words = name.split(' ')
      for (const word of words) {
        if (word.length > 3 && lowerText.includes(word)) {
          const score = (word.length / lowerText.length) * 0.8
          if (score > bestMatchScore) {
            bestMatchScore = score
            matchedProduct = product.name
          }
        }
      }
    }
  }

  if (matchedProduct) {
    return {
      type: isRemove ? 'remove_product' : 'add_product',
      product: matchedProduct,
      quantity,
      rawText: text,
      confidence: Math.min(0.95, bestMatchScore + 0.3),
    }
  }

  return { type: 'unknown', rawText: text, confidence: 0 }
}

export function useVoiceOrdering(options: UseVoiceOrderingOptions = {}): UseVoiceOrderingReturn {
  const {
    language = 'fr-FR',
    continuous = false,
    onCommand,
    onError,
    products = [],
  } = options

  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null)

  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Vérifier le support
  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  // Feedback vocal
  const speakFeedback = useCallback((command: VoiceCommand) => {
    if (!('speechSynthesis' in window)) return

    let message = ''

    switch (command.type) {
      case 'add_product':
        message = (command.quantity ?? 1) > 1
          ? `${command.quantity} ${command.product} ajoutés`
          : `${command.product} ajouté`
        break
      case 'remove_product':
        message = `${command.product} retiré`
        break
      case 'clear_cart':
        message = 'Panier vidé'
        break
      case 'pay':
        message = 'Ouverture du paiement'
        break
    }

    if (message) {
      const utterance = new SpeechSynthesisUtterance(message)
      utterance.lang = 'fr-FR'
      utterance.rate = 1.2
      utterance.volume = 0.8
      speechSynthesis.speak(utterance)
    }
  }, [])

  // Initialiser la reconnaissance
  useEffect(() => {
    if (!isSupported) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.lang = language
    recognition.continuous = continuous
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      setTranscript('')
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.onerror = (event) => {
      logger.error('[Voice] Error:', event.error)
      setIsListening(false)

      const errorMessages: Record<string, string> = {
        'not-allowed': 'Microphone non autorisé',
        'no-speech': 'Aucune parole détectée',
        'audio-capture': 'Microphone non disponible',
        'network': 'Erreur réseau',
      }

      onError?.(errorMessages[event.error] || `Erreur: ${event.error}`)
    }

    recognition.onresult = (event) => {
      const results = event.results
      const lastResult = results[results.length - 1]
      const transcript = lastResult[0].transcript

      setTranscript(transcript)

      // Si résultat final, parser la commande
      if (lastResult.isFinal) {
        const command = parseVoiceCommand(transcript, products)
        setLastCommand(command)
        onCommand?.(command)

        // Feedback audio
        if (command.type !== 'unknown') {
          speakFeedback(command)
        }
      }
    }

    recognitionRef.current = recognition

    return () => {
      recognition.abort()
    }
  }, [isSupported, language, continuous, products, onCommand, onError, speakFeedback])

  // Contrôles
  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start()
      } catch (_e) {
        logger.error('[Voice] Start error:', e)
      }
    }
  }, [isListening])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }, [isListening])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  return {
    isListening,
    isSupported,
    transcript,
    lastCommand,
    startListening,
    stopListening,
    toggleListening,
  }
}

// Déclarations TypeScript pour Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}
