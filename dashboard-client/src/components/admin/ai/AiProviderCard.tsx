/**
 * Carte d'affichage d'un provider IA.
 * Montre le statut, les métriques clés et les actions disponibles.
 */

import { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Settings,
  Trash2,
  TestTube,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/common';

interface AiProvider {
  id: number;
  name: string;
  provider: 'groq' | 'claude' | 'openai';
  is_enabled: boolean;
  priority: number;
  model: string;
  max_tokens: number;
  temperature: number;
  has_api_key: boolean;
  test_result: 'success' | 'failed' | null;
  test_message: string;
  last_tested_at: string | null;
  total_requests: number;
  success_rate: number;
  avg_latency_ms: number;
  total_cost: number;
}

interface AiProviderCardProps {
  provider: AiProvider;
  onEdit: (provider: AiProvider) => void;
  onDelete: (providerId: number) => void;
  onRefresh: () => void;
}

const PROVIDER_LABELS: Record<string, string> = {
  groq: 'Groq',
  claude: 'Anthropic Claude',
  openai: 'OpenAI GPT',
};

const PROVIDER_COLORS: Record<
  string,
  { bg: string; text: string; badge: string }
> = {
  groq: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-300',
    badge: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  },
  claude: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-700 dark:text-purple-300',
    badge:
      'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  },
  openai: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-300',
    badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  },
};

export function AiProviderCard({
  provider,
  onEdit,
  onDelete,
  onRefresh,
}: AiProviderCardProps) {
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);

    try {
      const response = await fetch(
        `/api/super-admin/ai/providers/${provider.id}/test`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (data.success) {
        alert(
          `✅ Test réussi !\n\nLatence: ${data.latency_ms.toFixed(0)}ms\n${data.message}`
        );
      } else {
        alert(`❌ Test échoué !\n\n${data.message || data.error}`);
      }

      onRefresh();
    } catch (error) {
      alert(
        `Erreur lors du test:\n${error instanceof Error ? error.message : 'Erreur inconnue'}`
      );
    } finally {
      setTesting(false);
    }
  };

  const colors = PROVIDER_COLORS[provider.provider] || PROVIDER_COLORS.groq;

  return (
    <div
      className={`p-6 rounded-lg border transition-all ${
        provider.is_enabled
          ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colors.bg}`}>
            <Sparkles className={`w-5 h-5 ${colors.text}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {provider.name}
            </h3>
            <span className={`text-xs px-2 py-1 rounded ${colors.badge}`}>
              {PROVIDER_LABELS[provider.provider]}
            </span>
          </div>
        </div>

        {provider.is_enabled && (
          <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
            Actif
          </span>
        )}
      </div>

      {/* Config */}
      <div className="mb-4 space-y-1 text-sm text-gray-600 dark:text-gray-400">
        <div>
          <span className="font-medium">Modèle :</span> {provider.model || 'N/A'}
        </div>
        <div>
          <span className="font-medium">Priorité :</span> {provider.priority}
        </div>
        <div>
          <span className="font-medium">Température :</span>{' '}
          {provider.temperature}
        </div>
      </div>

      {/* Test Result */}
      {provider.test_result && (
        <div
          className={`mb-4 p-3 rounded-lg flex items-start gap-2 ${
            provider.test_result === 'success'
              ? 'bg-green-50 dark:bg-green-900/20'
              : 'bg-red-50 dark:bg-red-900/20'
          }`}
        >
          {provider.test_result === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p
              className={`text-xs font-medium ${
                provider.test_result === 'success'
                  ? 'text-green-800 dark:text-green-200'
                  : 'text-red-800 dark:text-red-200'
              }`}
            >
              {provider.test_message}
            </p>
            {provider.last_tested_at && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {new Date(provider.last_tested_at).toLocaleString('fr-FR')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 dark:bg-gray-900/30 p-3 rounded">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Requêtes
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {provider.total_requests.toLocaleString()}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/30 p-3 rounded">
          <div className="text-xs text-gray-600 dark:text-gray-400">Succès</div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {provider.success_rate.toFixed(1)}%
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/30 p-3 rounded">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Latence
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {provider.avg_latency_ms.toFixed(0)}ms
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/30 p-3 rounded">
          <div className="text-xs text-gray-600 dark:text-gray-400">Coût</div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            ${provider.total_cost.toFixed(4)}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={handleTest}
          disabled={testing || !provider.has_api_key}
          variant="secondary"
          size="sm"
          className="flex-1"
        >
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Test...
            </>
          ) : (
            <>
              <TestTube className="w-4 h-4 mr-2" />
              Tester
            </>
          )}
        </Button>
        <Button
          onClick={() => onEdit(provider)}
          variant="secondary"
          size="sm"
          className="flex-1"
        >
          <Settings className="w-4 h-4 mr-2" />
          Config
        </Button>
        <Button
          onClick={() => onDelete(provider.id)}
          variant="secondary"
          size="sm"
          className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
