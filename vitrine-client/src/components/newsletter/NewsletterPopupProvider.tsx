'use client';

import { NewsletterPopup } from './NewsletterPopup';
import { useNewsletterPopup } from '@/hooks/useNewsletterPopup';
import { useSiteConfig } from '@/lib/config/SiteConfigProvider';

/**
 * Provider for Newsletter Popup
 * Manages popup display with configured settings from backoffice
 */
export function NewsletterPopupProvider() {
  // Configuration depuis les variables d'environnement (avec valeurs par défaut)
  const newsletterConfig = {
    enabled: true,
    delaySeconds: 30,
    exitIntentEnabled: true,
  };

  const { isOpen, onClose } = useNewsletterPopup({
    enabled: newsletterConfig.enabled,
    delaySeconds: newsletterConfig.delaySeconds,
    exitIntentEnabled: newsletterConfig.exitIntentEnabled,
  });

  return <NewsletterPopup isOpen={isOpen} onClose={onClose} />;
}
