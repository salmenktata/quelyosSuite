'use client';

import React from 'react';
import { usePromoMessages } from '@/hooks/usePromoMessages';

interface PromoMessage {
  text: string;
  link?: string;
  icon?: 'truck' | 'percent' | 'gift' | 'star' | 'clock';
}

interface PromoBarProps {
  messages?: PromoMessage[];
  backgroundColor?: string;
  textColor?: string;
  dismissible?: boolean;
}

// Fallback messages
const fallbackMessages: PromoMessage[] = [
  { text: 'Livraison gratuite dès 100 DT', icon: 'truck' },
  { text: 'Retours gratuits sous 30 jours', icon: 'gift' },
  { text: 'Support client 7j/7', icon: 'star' },
  { text: 'Paiement sécurisé', icon: 'clock' },
];

const PromoBar: React.FC<PromoBarProps> = ({
  messages: propMessages,
  backgroundColor = 'bg-primary-dark',
  textColor = 'text-white',
  dismissible = true,
}) => {
  const { messages: apiMessages, loading } = usePromoMessages();

  // Priorité : props > API > fallback
  const messages = propMessages || (apiMessages.length > 0 ? apiMessages : fallbackMessages);
  const [isVisible, setIsVisible] = React.useState(true);
  const [isPaused, setIsPaused] = React.useState(false);

  // Check localStorage on mount
  React.useEffect(() => {
    const dismissed = localStorage.getItem('promo-bar-dismissed');
    if (dismissed === 'true') {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('promo-bar-dismissed', 'true');
  };

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'truck':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
          </svg>
        );
      case 'percent':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M17 17h.01M7 17L17 7M7 7a2 2 0 100-4 2 2 0 000 4zm10 10a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
        );
      case 'gift':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
        );
      case 'star':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        );
      case 'clock':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (!isVisible || messages.length === 0) return null;

  // Duplicate messages for seamless loop
  const duplicatedMessages = [...messages, ...messages];

  return (
    <div
      className={`${backgroundColor} ${textColor} py-2 text-sm relative overflow-hidden`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="container mx-auto px-4 flex items-center justify-center">
        {/* Marquee Container */}
        <div className="flex-1 overflow-hidden relative">
          <div
            className={`flex whitespace-nowrap ${isPaused ? '' : 'animate-marquee'}`}
            style={{
              animationPlayState: isPaused ? 'paused' : 'running',
            }}
          >
            {duplicatedMessages.map((message, index) => (
              <React.Fragment key={index}>
                {message.link ? (
                  <a
                    href={message.link}
                    className="inline-flex items-center gap-2 mx-8 hover:underline"
                  >
                    {message.icon && getIcon(message.icon)}
                    <span>{message.text}</span>
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-2 mx-8">
                    {message.icon && getIcon(message.icon)}
                    <span>{message.text}</span>
                  </span>
                )}
                {/* Separator */}
                <span className="mx-4 text-white/50">|</span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Dismiss Button */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="ml-4 p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
            aria-label="Fermer la barre promotionnelle"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default PromoBar;
export { PromoBar };
