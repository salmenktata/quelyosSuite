/**
 * Hook i18n léger pour les traductions frontend
 * Utilise le locale du navigateur ou localStorage
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  t,
  getTranslations,
  isLocaleSupported,
  DEFAULT_LOCALE,
  type Locale,
  type TranslationKeys,
} from '@/lib/i18n/translations';

const LOCALE_STORAGE_KEY = 'quelyos_locale';

/**
 * Detect browser locale
 */
function detectBrowserLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  // Check localStorage first
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored && isLocaleSupported(stored)) {
    return stored as Locale;
  }

  // Check browser language
  const browserLang = navigator.language.split('-')[0];
  if (isLocaleSupported(browserLang)) {
    return browserLang as Locale;
  }

  return DEFAULT_LOCALE;
}

interface UseTranslationsReturn {
  /** Current locale */
  locale: Locale;
  /** Get translation for key */
  t: (key: keyof TranslationKeys) => string;
  /** All translations for current locale */
  translations: TranslationKeys;
  /** Change locale */
  setLocale: (locale: Locale) => void;
  /** Available locales */
  availableLocales: Locale[];
}

/**
 * Hook for translations
 *
 * @example
 * ```tsx
 * const { t, locale, setLocale } = useTranslations();
 * return <h1>{t('products.filter.title')}</h1>;
 * ```
 */
export function useTranslations(): UseTranslationsReturn {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Detect locale on mount (client-side only)
  useEffect(() => {
    setLocaleState(detectBrowserLocale());
  }, []);

  // Memoized translate function
  const translate = useCallback(
    (key: keyof TranslationKeys): string => t(key, locale),
    [locale]
  );

  // Get all translations for current locale
  const translations = useMemo(() => getTranslations(locale), [locale]);

  // Change locale and persist
  const setLocale = useCallback((newLocale: Locale) => {
    if (isLocaleSupported(newLocale)) {
      setLocaleState(newLocale);
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
      // Update HTML lang attribute
      document.documentElement.lang = newLocale;
      // Update dir attribute for RTL languages
      document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
    }
  }, []);

  const availableLocales: Locale[] = ['fr', 'en', 'ar'];

  return {
    locale,
    t: translate,
    translations,
    setLocale,
    availableLocales,
  };
}

export type { Locale, TranslationKeys };
