/**
 * React Hooks pour WebSocket
 *
 * Hooks pour faciliter l'utilisation du WebSocket dans les composants React.
 */

import { useEffect, useCallback, useRef, useState } from 'react'
import { wsClient, useWebSocketStore, MessageHandler } from './WebSocketClient'

/**
 * Hook pour la connexion WebSocket
 *
 * @example
 * const { isConnected, connectionState, connect, disconnect } = useWebSocket()
 */
export function useWebSocket() {
  const connectionState = useWebSocketStore((state) => state.connectionState)

  useEffect(() => {
    // Connecter au montage si pas déjà connecté
    if (connectionState === 'disconnected') {
      wsClient.connect()
    }
  }, [connectionState])

  return {
    isConnected: connectionState === 'connected',
    connectionState,
    connect: () => wsClient.connect(),
    disconnect: () => wsClient.disconnect(),
  }
}

/**
 * Hook pour s'abonner à un channel
 *
 * @example
 * useChannel('orders', (message) => {
 *   console.log('Order update:', message)
 * })
 */
export function useChannel(channel: string, handler: MessageHandler) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    const unsubscribe = wsClient.subscribe(channel, (message) => {
      handlerRef.current(message)
    })

    return unsubscribe
  }, [channel])
}

/**
 * Hook pour publier sur un channel
 *
 * @example
 * const publish = usePublish('chat')
 * publish('message', { text: 'Hello!' })
 */
export function usePublish(channel: string) {
  return useCallback(
    (event: string, data: unknown) => {
      return wsClient.publish(channel, event, data)
    },
    [channel]
  )
}

/**
 * Hook pour recevoir tous les messages
 *
 * @example
 * const lastMessage = useWebSocketMessage()
 */
export function useWebSocketMessage() {
  return useWebSocketStore((state) => state.lastMessage)
}

/**
 * Hook pour les notifications temps réel
 *
 * @example
 * useNotifications((notification) => {
 *   toast.info(notification.data.message)
 * })
 */
export function useNotifications(handler: MessageHandler) {
  useChannel('notifications', handler)
}

/**
 * Hook pour les mises à jour de stock en temps réel
 *
 * @example
 * useStockUpdates((update) => {
 *   // Rafraîchir les données de stock
 *   refetchStock()
 * })
 */
export function useStockUpdates(handler: MessageHandler) {
  useChannel('stock', handler)
}

/**
 * Hook pour les mises à jour de commandes en temps réel
 *
 * @example
 * useOrderUpdates((update) => {
 *   if (update.event === 'new_order') {
 *     toast.success('Nouvelle commande!')
 *   }
 * })
 */
export function useOrderUpdates(handler: MessageHandler) {
  useChannel('orders', handler)
}

/**
 * Hook pour synchroniser un état avec un channel
 *
 * @example
 * const [data, setData] = useSyncedState('products', initialProducts)
 * // data sera mis à jour automatiquement quand le channel reçoit des updates
 */
export function useSyncedState<T>(channel: string, initialValue: T): [T, (value: T) => void] {
  const [value, setValue] = useLocalState(initialValue)

  useChannel(channel, (message) => {
    if (message.type === 'update' && message.data) {
      setValue(message.data as T)
    }
  })

  const publish = usePublish(channel)

  const setAndPublish = useCallback(
    (newValue: T) => {
      setValue(newValue)
      publish('update', newValue)
    },
    [publish]
  )

  return [value, setAndPublish]
}

// Helper pour état local (pour éviter dépendance circulaire)
function useLocalState<T>(initialValue: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(initialValue)
  return [value, setValue]
}

/**
 * Hook pour le statut de présence utilisateur
 *
 * @example
 * const { onlineUsers, isOnline } = usePresence('dashboard')
 */
export function usePresence(room: string) {
  const onlineUsersRef = useRef<Set<string>>(new Set())

  useChannel(`presence:${room}`, (message) => {
    if (message.event === 'join') {
      onlineUsersRef.current.add(message.data as string)
    } else if (message.event === 'leave') {
      onlineUsersRef.current.delete(message.data as string)
    } else if (message.event === 'list') {
      onlineUsersRef.current = new Set(message.data as string[])
    }
  })

  // Rejoindre la room au montage
  useEffect(() => {
    const publish = (event: string, data: unknown) => wsClient.publish(`presence:${room}`, event, data)

    // Annoncer la présence
    publish('join', localStorage.getItem('userId') || 'anonymous')

    return () => {
      publish('leave', localStorage.getItem('userId') || 'anonymous')
    }
  }, [room])

  return {
    onlineUsers: Array.from(onlineUsersRef.current),
    isOnline: (userId: string) => onlineUsersRef.current.has(userId),
  }
}
