import { useState, useEffect } from 'react'

export interface PromoMessage {
  id: number
  text: string
  icon: 'truck' | 'gift' | 'star' | 'clock'
}

export function usePromoMessages() {
  const [messages, setMessages] = useState<PromoMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/promo-messages')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setMessages(data.messages)
      })
      .catch((err) => console.error('Failed to load promo messages:', err))
      .finally(() => setLoading(false))
  }, [])

  return { messages, loading }
}
