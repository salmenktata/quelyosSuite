/**
 * AIGeneratorModal - Modal de génération de thème par IA
 *
 * Permet de générer un thème complet via prompt utilisateur
 * Utilise Claude API pour génération intelligente
 */

import { useState } from 'react';
import { X, Sparkles, Wand2, Loader2 } from 'lucide-react';
import { Button } from '@/components/common';
import type { ThemeConfig } from '@/types/theme';

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (theme: ThemeConfig) => void;
}

const EXAMPLE_PROMPTS = [
  'Thème minimaliste pour boutique de vêtements de luxe, couleurs noir et or',
  'Thème coloré et fun pour boutique de jouets pour enfants',
  'Thème tech moderne pour magasin d\'électronique, style futuriste',
  'Thème naturel et bio pour boutique de cosmétiques éco-responsables',
  'Thème élégant pour bijouterie, couleurs pastel et rose gold',
];

export function AIGeneratorModal({ isOpen, onClose, onGenerate }: AIGeneratorModalProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Veuillez entrer une description du thème');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/themes/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: { prompt },
          id: 1,
        }),
      });

      const data = await response.json();

      if (data.result?.success && data.result.theme) {
        onGenerate(data.result.theme);
        onClose();
        setPrompt('');
      } else {
        setError(data.result?.error || 'Erreur lors de la génération');
      }
    } catch (err) {
      setError('Impossible de générer le thème. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Générateur de Thème IA
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Décrivez votre thème, l'IA le créera pour vous
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
              Décrivez votre thème idéal
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Thème élégant pour boutique de mode, couleurs pastels, style minimaliste..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Soyez précis : industrie, couleurs, style, ambiance...
            </p>
          </div>

          {/* Examples */}
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
              Exemples de prompts :
            </p>
            <div className="space-y-2">
              {EXAMPLE_PROMPTS.map((example, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(example)}
                  disabled={loading}
                  className="w-full text-left px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-900 dark:text-white dark:text-gray-300 disabled:opacity-50"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Info */}
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <div className="flex gap-3">
              <Wand2 className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-purple-700 dark:text-purple-300">
                <p className="font-semibold mb-1">Comment ça marche ?</p>
                <ul className="list-disc list-inside space-y-1 text-purple-600 dark:text-purple-400">
                  <li>L'IA analyse votre description</li>
                  <li>Génère une palette de couleurs adaptée</li>
                  <li>Sélectionne les polices appropriées</li>
                  <li>Compose les sections de la homepage</li>
                  <li>Vous pouvez ensuite personnaliser le résultat</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            icon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          >
            {loading ? 'Génération...' : 'Générer le thème'}
          </Button>
        </div>
      </div>
    </div>
  );
}
