'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { backendClient } from '@/lib/backend/client';
import { useExitIntent } from '@/hooks/useExitIntent';
import { logger } from '@/lib/logger';
import { sanitizeHtml } from '@/lib/utils/sanitize';

interface PopupCampaign {
  id: number;
  title: string;
  content: string;
  image_url?: string;
  cta_text: string;
  cta_url?: string;
  secondary_cta_text?: string;
  has_coupon: boolean;
  coupon_code?: string;
  discount_percentage?: number;
  trigger_type: 'exit_intent' | 'time_based' | 'scroll_based' | 'immediate';
  trigger_delay?: number;
  trigger_scroll_percentage?: number;
  display_frequency: 'once' | 'daily' | 'session' | 'always';
  variant_name?: string;
}

/**
 * Marketing Popup Component
 * Displays popup campaigns based on various trigger conditions
 *
 * Triggers:
 * - Exit Intent: When user moves mouse to leave page
 * - Time Based: After X seconds on page
 * - Scroll Based: After scrolling X% of page
 * - Immediate: Show immediately
 *
 * Display Frequency:
 * - Once: Show only once per visitor (localStorage)
 * - Daily: Show once per day
 * - Session: Show once per browser session
 * - Always: Show every time trigger conditions are met
 */
export function MarketingPopup() {
  const pathname = usePathname();

  const [popup, setPopup] = useState<PopupCampaign | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  // Exit intent detection
  const { exitIntentDetected } = useExitIntent({
    threshold: 20,
    delay: 2000,
    enabled: popup?.trigger_type === 'exit_intent',
  });

  // Load active popup on mount and path change
  useEffect(() => {
    loadActivePopup();
  }, [pathname]);

  // Handle different trigger types
  useEffect(() => {
    if (!popup || isVisible) return;

    // Check if popup should be shown based on display frequency
    if (!shouldShowPopup(popup)) {
      return;
    }

    switch (popup.trigger_type) {
      case 'immediate':
        showPopup();
        break;

      case 'time_based':
        if (popup.trigger_delay) {
          const timer = setTimeout(() => {
            showPopup();
          }, popup.trigger_delay * 1000);

          return () => clearTimeout(timer);
        }
        break;

      case 'scroll_based':
        const handleScroll = () => {
          const scrollPercentage = getScrollPercentage();
          if (popup.trigger_scroll_percentage && scrollPercentage >= popup.trigger_scroll_percentage) {
            showPopup();
            window.removeEventListener('scroll', handleScroll);
          }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);

      case 'exit_intent':
        // Handled by useExitIntent hook
        break;
    }
  }, [popup]);

  // Handle exit intent trigger
  useEffect(() => {
    if (exitIntentDetected && popup && !isVisible && shouldShowPopup(popup)) {
      showPopup();
    }
  }, [exitIntentDetected]);

  const loadActivePopup = async () => {
    try {
      setLoading(true);

      const response = await backendClient.getActivePopups(pathname);

      if (response.success && response.data?.popup) {
        setPopup(response.data.popup as unknown as PopupCampaign);
      }
    } catch (error) {
      logger.error('Error loading popup:', error);
    } finally {
      setLoading(false);
    }
  };

  const shouldShowPopup = (campaign: PopupCampaign): boolean => {
    const storageKey = `popup_shown_${campaign.id}`;

    switch (campaign.display_frequency) {
      case 'once':
        // Check localStorage for permanent record
        if (localStorage.getItem(storageKey)) {
          return false;
        }
        break;

      case 'daily':
        // Check if shown today
        const lastShown = localStorage.getItem(storageKey);
        if (lastShown) {
          const lastShownDate = new Date(lastShown);
          const today = new Date();
          if (
            lastShownDate.getFullYear() === today.getFullYear() &&
            lastShownDate.getMonth() === today.getMonth() &&
            lastShownDate.getDate() === today.getDate()
          ) {
            return false;
          }
        }
        break;

      case 'session':
        // Check sessionStorage
        if (sessionStorage.getItem(storageKey)) {
          return false;
        }
        break;

      case 'always':
        // Always show (no storage check)
        break;
    }

    return true;
  };

  const showPopup = () => {
    if (!popup) return;

    setIsVisible(true);

    // Record that popup was shown
    const storageKey = `popup_shown_${popup.id}`;

    switch (popup.display_frequency) {
      case 'once':
        localStorage.setItem(storageKey, 'true');
        break;

      case 'daily':
        localStorage.setItem(storageKey, new Date().toISOString());
        break;

      case 'session':
        sessionStorage.setItem(storageKey, 'true');
        break;
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleCTAClick = async () => {
    if (popup) {
      // Track click
      try {
        await backendClient.trackPopupClick(popup.id);
      } catch (error) {
        logger.error('Error tracking popup click:', error);
      }
    }

    handleClose();
  };

  const getScrollPercentage = (): number => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    return (scrollTop / scrollHeight) * 100;
  };

  // Don't render anything if loading or no popup
  if (loading || !popup || !isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fadeIn">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-2xl animate-slideUp">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900"
          aria-label="Fermer"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Image (if available) */}
        {popup.image_url && (
          <div className="relative h-48 overflow-hidden rounded-t-lg">
            <Image
              src={popup.image_url}
              alt={popup.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 500px"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-8">
          {/* Title */}
          <h2 className="mb-4 text-2xl font-bold text-gray-900">{popup.title}</h2>

          {/* HTML Content */}
          <div
            className="mb-6 text-gray-700"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(popup.content) }}
          />

          {/* Coupon Code (if available) */}
          {popup.has_coupon && popup.coupon_code && (
            <div className="mb-6 rounded-lg bg-gradient-to-r from-primary to-purple-600 p-6 text-center text-white">
              <p className="mb-2 text-lg font-semibold">
                {popup.discount_percentage
                  ? `${popup.discount_percentage}% de réduction`
                  : 'Offre Spéciale'}
              </p>
              <div className="rounded-lg border-2 border-dashed border-white bg-white/20 p-4">
                <p className="mb-1 text-xs uppercase tracking-wider opacity-90">
                  Code Promo
                </p>
                <p className="text-2xl font-bold tracking-widest">{popup.coupon_code}</p>
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="space-y-3">
            {popup.cta_url ? (
              <Link href={popup.cta_url} onClick={handleCTAClick}>
                <button className="w-full rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90">
                  {popup.cta_text}
                </button>
              </Link>
            ) : (
              <button
                onClick={handleCTAClick}
                className="w-full rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
              >
                {popup.cta_text}
              </button>
            )}

            {popup.secondary_cta_text && (
              <button
                onClick={handleClose}
                className="w-full text-sm text-gray-600 transition-colors hover:text-gray-900"
              >
                {popup.secondary_cta_text}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
