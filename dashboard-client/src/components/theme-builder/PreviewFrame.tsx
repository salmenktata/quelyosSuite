/**
 * PreviewFrame - Iframe pour preview temps réel du thème
 *
 * Affiche vitrine-client dans une iframe et communique via postMessage
 * pour mettre à jour le thème en temps réel
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { ThemeConfig } from '@/types/theme';
import { Eye, RefreshCw, Maximize2 } from 'lucide-react';

interface PreviewFrameProps {
  theme: ThemeConfig;
  className?: string;
}

export function PreviewFrame({ theme, className = '' }: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // URL de la page preview
  const previewUrl = import.meta.env.VITE_VITRINE_URL || 'http://localhost:3001';
  const previewPath = `${previewUrl}/theme-preview`;

  const sendThemeUpdate = useCallback((themeData: ThemeConfig) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'THEME_UPDATE',
          theme: themeData,
        },
        '*' // En production: spécifier l'origine exacte
      );
    }
  }, []);

  useEffect(() => {
    // Écouter les messages de l'iframe
    function handleMessage(event: MessageEvent) {
      if (event.data.type === 'PREVIEW_READY') {
        setIsReady(true);
        setIsLoading(false);
        // Envoyer le thème initial
        sendThemeUpdate(theme);
      }
    }

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [theme, previewUrl, sendThemeUpdate]);

  // Envoyer les updates du thème à l'iframe
  useEffect(() => {
    if (isReady) {
      sendThemeUpdate(theme);
    }
  }, [theme, isReady, sendThemeUpdate]);

  const handleReload = () => {
    setIsLoading(true);
    setIsReady(false);
    if (iframeRef.current) {
      iframeRef.current.src = previewPath;
    }
  };

  const handleOpenInNewTab = () => {
    window.open(previewPath, '_blank');
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Eye className="h-4 w-4" />
          <span>Preview Live</span>
          {isLoading && (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Chargement...</span>
            </div>
          )}
          {isReady && !isLoading && (
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-green-600 dark:text-green-400">En ligne</span>
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReload}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Recharger"
          >
            <RefreshCw className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={handleOpenInNewTab}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Ouvrir dans un nouvel onglet"
          >
            <Maximize2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Iframe */}
      <div className="flex-1 relative bg-white dark:bg-gray-900">
        <iframe
          ref={iframeRef}
          src={previewPath}
          className="w-full h-full border-0"
          title="Theme Preview"
          sandbox="allow-same-origin allow-scripts allow-forms"
        />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900 bg-opacity-90 dark:bg-opacity-90">
            <div className="text-center">
              <div className="inline-block h-12 w-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Chargement de la preview...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
