'use client';

import dynamic from 'next/dynamic';

// Lazy load ChatBot (non-critique, below-the-fold)
const ConditionalChatBot = dynamic(() => import('./ConditionalChatBot'), {
  ssr: false,
  loading: () => null,
});

export default function ChatBotWrapper() {
  return <ConditionalChatBot />;
}
