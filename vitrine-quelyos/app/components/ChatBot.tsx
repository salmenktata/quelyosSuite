'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Sparkles } from 'lucide-react'
import { createComponentLogger } from '@/lib/logger'

const log = createComponentLogger('ChatBot')

type ChatMessage = {
  type: 'bot' | 'user'
  text: string
  suggestions?: string[]
  timestamp?: Date
}

// Message de bienvenue initial
const welcomeMessage: ChatMessage = {
  type: 'bot',
  text: 'Bonjour ! 👋 Je suis l\'assistant Quelyos IA. Je peux répondre à vos questions sur les tarifs, les fonctionnalités, l\'inscription ou le support. Comment puis-je vous aider aujourd\'hui ?',
  suggestions: ['Voir les tarifs', 'Découvrir nos solutions', 'Essai gratuit', 'Aide technique'],
  timestamp: new Date()
}

export default function ChatBot() {
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([welcomeMessage])
  const [chatInput, setChatInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Message de bienvenue automatique après 3 secondes si pas ouvert
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!chatOpen) {
        setHasNewMessage(true)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [chatOpen])

  const handleChatSend = async (suggestionText?: string) => {
    const messageText = suggestionText || chatInput.trim()
    if (!messageText) return

    // Ajouter le message utilisateur
    const userMessage: ChatMessage = {
      type: 'user',
      text: messageText,
      timestamp: new Date()
    }
    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setIsTyping(true)
    setHasNewMessage(false)

    try {
      // Appel à la route API Next.js (avec fallback keywords intégré)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText
        })
      })

      if (!response.ok) {
        throw new Error('Erreur API')
      }

      const data = await response.json()

      const botMessage: ChatMessage = {
        type: 'bot',
        text: data.response,
        suggestions: data.suggestions,
        timestamp: new Date()
      }

      setIsTyping(false)
      setChatMessages(prev => [...prev, botMessage])

      if (!chatOpen) {
        setHasNewMessage(true)
      }
    } catch (error) {
      log.error('Erreur chat:', error)

      const errorMessage: ChatMessage = {
        type: 'bot',
        text: 'Désolé, je rencontre un problème technique. Notre équipe est disponible par email à support@quelyos.com pour toute question urgente.',
        timestamp: new Date()
      }

      setIsTyping(false)
      setChatMessages(prev => [...prev, errorMessage])
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    // Actions spéciales
    const actions: Record<string, () => void> = {
      'Créer mon compte': () => window.location.href = '/register',
      'Essai gratuit': () => window.location.href = '/register',
      'Voir les tarifs': () => window.location.href = '/tarifs',
      'Comparer les plans': () => window.location.href = '/tarifs',
      'Voir les solutions': () => window.location.href = '/solutions',
      'Découvrir nos solutions': () => window.location.href = '/solutions',
      'Contacter le support': () => window.location.href = 'mailto:support@quelyos.com',
      'Aide technique': () => window.location.href = '/support',
      'Rejoindre Discord': () => window.open('https://discord.gg/quelyos', '_blank'),
      'Documentation': () => window.location.href = '/docs',
      'Demander une démo': () => window.location.href = '/contact',
      'Fermer': () => setChatOpen(false)
    }

    // Si c'est une action spéciale, l'exécuter
    if (actions[suggestion]) {
      actions[suggestion]()
    } else {
      // Sinon, envoyer comme message
      handleChatSend(suggestion)
    }
  }

  return (
    <>
      {/* Chatbot Window */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-50 w-80 overflow-hidden rounded-2xl border border-indigo-500/30 bg-slate-900 shadow-2xl shadow-indigo-500/10 sm:w-96"
          >
            {/* Header avec gradient */}
            <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3">
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                      <Sparkles size={18} className="text-white" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 animate-pulse rounded-full border-2 border-indigo-600 bg-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      Assistant Quelyos IA
                    </p>
                    <p className="flex items-center gap-1 text-xs text-indigo-100">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      En ligne • Réponse instantanée
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setChatOpen(false)}
                  className="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Fermer le chat"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages avec scroll auto */}
            <div className="h-80 space-y-3 overflow-y-auto bg-gradient-to-b from-slate-900 to-slate-950 p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700">
              {chatMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="max-w-[85%] space-y-2">
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm shadow-lg ${
                        msg.type === 'user'
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                          : 'border border-white/10 bg-slate-800/80 text-slate-200 backdrop-blur-sm'
                      }`}
                    >
                      {msg.text}
                    </div>

                    {/* Suggestions */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {msg.suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300 transition-all hover:border-indigo-500/50 hover:bg-indigo-500/20"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-800/80 px-4 py-2.5">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: '0ms' }} />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: '150ms' }} />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>

            {/* Input amélioré */}
            <div className="border-t border-white/10 bg-slate-900/95 p-3 backdrop-blur-sm">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isTyping && handleChatSend()}
                  placeholder="Posez votre question..."
                  disabled={isTyping}
                  className="flex-1 rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder-slate-500 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
                />
                <button
                  onClick={() => handleChatSend()}
                  disabled={isTyping || !chatInput.trim()}
                  className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-2 text-white transition-all hover:from-indigo-600 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Envoyer"
                >
                  <Send size={16} />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-500">
                <Sparkles size={12} className="text-indigo-400" />
                <span>Propulsé par l&apos;IA Quelyos</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chatbot Toggle Button avec badge */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.5 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <button
          onClick={() => {
            setChatOpen(!chatOpen)
            setHasNewMessage(false)
          }}
          className={`group relative flex h-16 w-16 items-center justify-center rounded-full shadow-2xl transition-all duration-300 ${
            chatOpen
              ? 'bg-slate-700 text-white hover:bg-slate-600'
              : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:scale-110 hover:shadow-indigo-500/50'
          }`}
          aria-label={chatOpen ? 'Fermer le chat' : 'Ouvrir le chat'}
        >
          {/* Badge de notification */}
          {hasNewMessage && !chatOpen && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white shadow-lg"
            >
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                1
              </motion.span>
            </motion.div>
          )}

          {/* Pulse ring */}
          {!chatOpen && (
            <motion.div
              className="absolute inset-0 rounded-full bg-indigo-500"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          )}

          <AnimatePresence mode="wait">
            {chatOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X size={26} />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageCircle size={26} className="transition-transform group-hover:scale-110" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Tooltip */}
        {!chatOpen && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 }}
            className="absolute bottom-4 right-20 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-sm text-white shadow-xl"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-indigo-400" />
              <span>Besoin d&apos;aide ? Je suis là !</span>
            </div>
            <div className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 translate-x-1/2 rotate-45 bg-slate-900" />
          </motion.div>
        )}
      </motion.div>
    </>
  )
}
