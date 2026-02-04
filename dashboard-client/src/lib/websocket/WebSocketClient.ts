/**
 * WebSocket Client pour Quelyos Dashboard
 *
 * Gère la connexion WebSocket avec:
 * - Reconnexion automatique avec backoff exponentiel
 * - Heartbeat pour détecter les déconnexions
 * - Abonnement à des channels
 * - File d'attente pour messages en attente
 */

import { create } from 'zustand'
import { logger } from '@quelyos/logger'
import { LongPollingAdapter } from './LongPollingAdapter'

// Configuration
const USE_LONG_POLLING = true // Backend utilise long-polling HTTP, pas WebSocket natif
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8069/websocket'
const HEARTBEAT_INTERVAL = 30000 // 30 secondes
const RECONNECT_BASE_DELAY = 1000
const RECONNECT_MAX_DELAY = 30000
const MAX_QUEUE_SIZE = 100

// Types
export type WSMessageType =
  | 'subscribe'
  | 'unsubscribe'
  | 'publish'
  | 'notification'
  | 'update'
  | 'ping'
  | 'pong'

export interface WSMessage {
  type: WSMessageType
  channel?: string
  event?: string
  data?: unknown
  timestamp?: string
  id?: string
}

export type WSConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

export type MessageHandler = (message: WSMessage) => void

// Store Zustand pour l'état global
interface WSStore {
  connectionState: WSConnectionState
  lastMessage: WSMessage | null
  subscribedChannels: Set<string>
  setConnectionState: (state: WSConnectionState) => void
  setLastMessage: (message: WSMessage) => void
  addChannel: (channel: string) => void
  removeChannel: (channel: string) => void
}

export const useWebSocketStore = create<WSStore>((set) => ({
  connectionState: 'disconnected',
  lastMessage: null,
  subscribedChannels: new Set(),
  setConnectionState: (state) => set({ connectionState: state }),
  setLastMessage: (message) => set({ lastMessage: message }),
  addChannel: (channel) =>
    set((state) => ({
      subscribedChannels: new Set([...state.subscribedChannels, channel]),
    })),
  removeChannel: (channel) =>
    set((state) => {
      const channels = new Set(state.subscribedChannels)
      channels.delete(channel)
      return { subscribedChannels: channels }
    }),
}))

/**
 * Client WebSocket singleton
 */
class WebSocketClient {
  private socket: WebSocket | LongPollingAdapter | null = null
  private reconnectAttempts = 0
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private messageQueue: WSMessage[] = []
  private handlers: Map<string, Set<MessageHandler>> = new Map()
  private globalHandlers: Set<MessageHandler> = new Set()

  constructor() {
    // Reconnexion sur focus de la fenêtre
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        if (useWebSocketStore.getState().connectionState === 'disconnected') {
          this.connect()
        }
      })

      window.addEventListener('online', () => {
        this.connect()
      })

      window.addEventListener('offline', () => {
        this.disconnect()
      })
    }
  }

  /**
   * Connecte au serveur WebSocket (ou long-polling)
   */
  connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return
    }

    useWebSocketStore.getState().setConnectionState('connecting')

    try {
      if (USE_LONG_POLLING) {
        // Utiliser adaptateur long-polling
        const adapter = new LongPollingAdapter()
        adapter.onopen = this.handleOpen.bind(this)
        adapter.onmessage = this.handleMessage.bind(this)
        adapter.onclose = this.handleClose.bind(this)
        adapter.onerror = this.handleError.bind(this)

        this.socket = adapter
        adapter.connect().catch((error) => {
          logger.error('[WS] Connection error:', error)
          this.scheduleReconnect()
        })
      } else {
        // WebSocket natif (désactivé car backend ne le supporte pas)
        this.socket = new WebSocket(WS_URL)
        this.socket.onopen = this.handleOpen.bind(this)
        this.socket.onmessage = this.handleMessage.bind(this)
        this.socket.onclose = this.handleClose.bind(this)
        this.socket.onerror = this.handleError.bind(this)
      }
    } catch (error) {
      logger.error('[WS] Connection error:', error)
      this.scheduleReconnect()
    }
  }

  /**
   * Déconnecte proprement
   */
  disconnect(): void {
    this.stopHeartbeat()

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.socket) {
      this.socket.close(1000, 'Client disconnect')
      this.socket = null
    }

    useWebSocketStore.getState().setConnectionState('disconnected')
  }

  /**
   * Envoie un message
   */
  send(message: WSMessage): boolean {
    const msg = {
      ...message,
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID(),
    }

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(msg))
      return true
    }

    // Mettre en file d'attente
    if (this.messageQueue.length < MAX_QUEUE_SIZE) {
      this.messageQueue.push(msg)
    }

    return false
  }

  /**
   * S'abonne à un channel
   */
  subscribe(channel: string, handler?: MessageHandler): () => void {
    // Envoyer la demande d'abonnement
    this.send({
      type: 'subscribe',
      channel,
    })

    useWebSocketStore.getState().addChannel(channel)

    // Enregistrer le handler si fourni
    if (handler) {
      if (!this.handlers.has(channel)) {
        this.handlers.set(channel, new Set())
      }
      this.handlers.get(channel)!.add(handler)
    }

    // Retourner fonction de désabonnement
    return () => {
      this.unsubscribe(channel, handler)
    }
  }

  /**
   * Se désabonne d'un channel
   */
  unsubscribe(channel: string, handler?: MessageHandler): void {
    if (handler && this.handlers.has(channel)) {
      this.handlers.get(channel)!.delete(handler)

      if (this.handlers.get(channel)!.size === 0) {
        this.handlers.delete(channel)
      }
    }

    // Si plus de handlers, se désabonner du serveur
    if (!this.handlers.has(channel)) {
      this.send({
        type: 'unsubscribe',
        channel,
      })
      useWebSocketStore.getState().removeChannel(channel)
    }
  }

  /**
   * Publie un message sur un channel
   */
  publish(channel: string, event: string, data: unknown): boolean {
    return this.send({
      type: 'publish',
      channel,
      event,
      data,
    })
  }

  /**
   * Ajoute un handler global (reçoit tous les messages)
   */
  onMessage(handler: MessageHandler): () => void {
    this.globalHandlers.add(handler)
    return () => {
      this.globalHandlers.delete(handler)
    }
  }

  /**
   * Vérifie si connecté
   */
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN
  }

  // Handlers privés

  private handleOpen(): void {
    logger.info('[WS] Connected')
    this.reconnectAttempts = 0
    useWebSocketStore.getState().setConnectionState('connected')

    // Démarrer le heartbeat
    this.startHeartbeat()

    // Envoyer les messages en attente
    this.flushQueue()

    // Ré-abonner aux channels
    useWebSocketStore.getState().subscribedChannels.forEach((channel) => {
      this.send({ type: 'subscribe', channel })
    })
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WSMessage = JSON.parse(event.data)

      // Gérer le pong
      if (message.type === 'pong') {
        return
      }

      // Stocker le dernier message
      useWebSocketStore.getState().setLastMessage(message)

      // Appeler les handlers globaux
      this.globalHandlers.forEach((handler) => handler(message))

      // Appeler les handlers du channel
      if (message.channel && this.handlers.has(message.channel)) {
        this.handlers.get(message.channel)!.forEach((handler) => handler(message))
      }
    } catch (error) {
      logger.error('[WS] Message parse error:', error)
    }
  }

  private handleClose(event: CloseEvent): void {
    logger.info('[WS] Disconnected:', event.code, event.reason)
    this.stopHeartbeat()

    if (event.code !== 1000) {
      // Reconnexion si pas fermeture normale
      this.scheduleReconnect()
    } else {
      useWebSocketStore.getState().setConnectionState('disconnected')
    }
  }

  private handleError(event: Event): void {
    logger.error('[WS] Error:', event)
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: 'ping' })
    }, HEARTBEAT_INTERVAL)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private scheduleReconnect(): void {
    useWebSocketStore.getState().setConnectionState('reconnecting')

    const delay = Math.min(
      RECONNECT_BASE_DELAY * Math.pow(2, this.reconnectAttempts),
      RECONNECT_MAX_DELAY
    )

    logger.info(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`)

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++
      this.connect()
    }, delay)
  }

  private flushQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!
      this.send(message)
    }
  }
}

// Instance singleton
export const wsClient = new WebSocketClient()

// Export par défaut
export default wsClient
