/**
 * Adaptateur Long-Polling simulant WebSocket
 *
 * Utilise les endpoints HTTP backend :
 * - POST /websocket/connect
 * - POST /websocket/poll
 * - POST /websocket/disconnect
 */

import { logger } from '@quelyos/logger'
import { getBackendUrl, STORAGE_KEYS } from '@quelyos/config'

const BACKEND_URL = getBackendUrl(import.meta.env.MODE as 'development' | 'production')
const POLL_INTERVAL = 5000 // 5 secondes

interface LongPollingMessage {
  id?: number
  channel: string
  event: string
  data: unknown
  timestamp?: string
}

/**
 * Adaptateur qui simule WebSocket via long-polling HTTP
 */
export class LongPollingAdapter {
  private connectionId: string | null = null
  private pollInterval: ReturnType<typeof setInterval> | null = null
  private lastMessageId = 0
  private _readyState: number = WebSocket.CLOSED

  public onopen: ((event: Event) => void) | null = null
  public onclose: ((event: CloseEvent) => void) | null = null
  public onerror: ((event: Event) => void) | null = null
  public onmessage: ((event: MessageEvent) => void) | null = null

  get readyState(): number {
    return this._readyState
  }

  /**
   * Connexion au backend
   */
  async connect(): Promise<void> {
    this._readyState = WebSocket.CONNECTING

    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN as string)
      if (!token) {
        throw new Error('No auth token')
      }

      const sessionId = this.generateSessionId()

      const response = await fetch(`${BACKEND_URL}/websocket/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token!}`,
        },
        body: JSON.stringify({ session_id: sessionId }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Connection failed')
      }

      this.connectionId = data.connection_id
      this._readyState = WebSocket.OPEN

      logger.info('[LongPolling] Connected:', this.connectionId)

      // Déclencher onopen
      if (this.onopen) {
        this.onopen(new Event('open'))
      }

      // Démarrer polling
      this.startPolling()
    } catch (error) {
      logger.error('[LongPolling] Connect error:', error)
      this._readyState = WebSocket.CLOSED

      if (this.onerror) {
        this.onerror(new Event('error'))
      }

      throw error
    }
  }

  /**
   * Démarrer le polling
   */
  private startPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
    }

    this.pollInterval = setInterval(() => {
      this.poll()
    }, POLL_INTERVAL)
  }

  /**
   * Polling pour recevoir messages
   */
  private async poll(): Promise<void> {
    if (!this.connectionId || this._readyState !== WebSocket.OPEN) {
      return
    }

    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN as string)
      if (!token) {
        return
      }

      const response = await fetch(`${BACKEND_URL}/websocket/poll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token!}`,
        },
        body: JSON.stringify({
          connection_id: this.connectionId,
          last_message_id: this.lastMessageId,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        logger.warn('[LongPolling] Poll error:', data.error)
        return
      }

      // Traiter les messages reçus
      if (data.messages && data.messages.length > 0) {
        for (const message of data.messages) {
          this.handleMessage(message)
          if (message.id && message.id > this.lastMessageId) {
            this.lastMessageId = message.id
          }
        }
      }
    } catch (error) {
      logger.error('[LongPolling] Poll error:', error)
    }
  }

  /**
   * Traiter un message reçu
   */
  private handleMessage(message: LongPollingMessage): void {
    if (this.onmessage) {
      const event = new MessageEvent('message', {
        data: JSON.stringify(message),
      })
      this.onmessage(event)
    }
  }

  /**
   * Envoyer un message (subscribe/unsubscribe/publish)
   */
  send(data: string): void {
    if (this._readyState !== WebSocket.OPEN) {
      logger.warn('[LongPolling] Cannot send, not connected')
      return
    }

    try {
      const message = JSON.parse(data)
      logger.debug('[LongPolling] Send:', message)

      // Pour long-polling, on ne peut pas envoyer de messages arbitraires
      // Les subscriptions sont gérées côté serveur automatiquement
      // On log juste pour debug
    } catch (error) {
      logger.error('[LongPolling] Send error:', error)
    }
  }

  /**
   * Fermer la connexion
   */
  async close(code?: number, reason?: string): Promise<void> {
    this._readyState = WebSocket.CLOSING

    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }

    if (this.connectionId) {
      try {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN as string)
        if (token) {
          await fetch(`${BACKEND_URL}/websocket/disconnect`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token!}`,
            },
            body: JSON.stringify({ connection_id: this.connectionId }),
          })
        }
      } catch (error) {
        logger.error('[LongPolling] Disconnect error:', error)
      }

      this.connectionId = null
    }

    this._readyState = WebSocket.CLOSED

    if (this.onclose) {
      const event = new CloseEvent('close', {
        code: code || 1000,
        reason: reason || 'Normal closure',
      })
      this.onclose(event)
    }

    logger.info('[LongPolling] Disconnected')
  }

  /**
   * Générer un ID de session unique
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
  }
}

// Constantes compatibles WebSocket
export const CONNECTING = WebSocket.CONNECTING
export const OPEN = WebSocket.OPEN
export const CLOSING = WebSocket.CLOSING
export const CLOSED = WebSocket.CLOSED
