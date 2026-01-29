import { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '../common';

type Device = 'desktop' | 'tablet' | 'mobile';

interface PreviewPaneProps {
  device: Device;
}

/**
 * Preview iframe isolé du thème en cours d'édition
 *
 * Features :
 * - Iframe isolé pour éviter conflits de styles
 * - Largeur responsive selon device (desktop 100%, tablet 768px, mobile 375px)
 * - Auto-refresh quand le thème change (via storage event)
 * - Bouton refresh manuel
 * - Loading state avec skeleton
 */
export function PreviewPane({ device }: PreviewPaneProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [key, setKey] = useState(0); // Force reload iframe

  // Dimensions selon device
  const deviceDimensions = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  };

  // Refresh manuel
  const handleRefresh = () => {
    setKey((prev) => prev + 1);
    setIsLoading(true);
  };

  // Auto-refresh quand le thème change dans localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme-builder-preview') {
        // Reload iframe pour appliquer les changements
        setKey((prev) => prev + 1);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Détecter fin de chargement iframe
  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Preview
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Aperçu temps réel de votre thème
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto p-4 flex items-start justify-center">
        <div
          className="relative transition-all duration-300 ease-in-out"
          style={{
            width: deviceDimensions[device],
            minHeight: '600px',
          }}
        >
          {/* Loading skeleton */}
          {isLoading && (
            <div className="absolute inset-0 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Chargement de la preview...
                </p>
              </div>
            </div>
          )}

          {/* Iframe */}
          <iframe
            key={key}
            ref={iframeRef}
            src="/store/themes/builder/preview"
            onLoad={handleIframeLoad}
            className="w-full h-full min-h-[600px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg"
            title="Theme Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}
