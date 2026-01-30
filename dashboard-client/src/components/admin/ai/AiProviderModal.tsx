/**
 * Modal de création/édition d'un provider IA.
 * Formulaire avec validation Zod et test connexion.
 */

import { useState, useEffect } from 'react';
import { X, Loader2, TestTube, Save } from 'lucide-react';
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

interface AiProviderModalProps {
  provider: AiProvider | null;
  onClose: (success: boolean) => void;
}

interface FormData {
  name: string;
  provider: 'groq' | 'claude' | 'openai';
  api_key: string;
  model: string;
  max_tokens: number;
  temperature: number;
  is_enabled: boolean;
  priority: number;
}

const DEFAULT_MODELS: Record<string, string[]> = {
  groq: [
    'llama-3.1-70b-versatile',
    'llama-3.1-8b-instant',
    'mixtral-8x7b-32768',
  ],
  claude: [
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022',
    'claude-3-opus-20240229',
  ],
  openai: ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo'],
};

export function AiProviderModal({ provider, onClose }: AiProviderModalProps) {
  const isEdit = !!provider;

  const [formData, setFormData] = useState<FormData>({
    name: provider?.name || '',
    provider: provider?.provider || 'groq',
    api_key: '',
    model: provider?.model || 'llama-3.1-70b-versatile',
    max_tokens: provider?.max_tokens || 800,
    temperature: provider?.temperature || 0.7,
    is_enabled: provider?.is_enabled || false,
    priority: provider?.priority || 1,
  });

  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Mettre à jour le modèle par défaut quand le provider change
    if (!isEdit && formData.provider) {
      const defaultModel = DEFAULT_MODELS[formData.provider][0];
      setFormData(prev => ({ ...prev, model: defaultModel }));
    }
  }, [formData.provider, isEdit]);

  const handleInputChange = (
    field: keyof FormData,
    value: string | number | boolean
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return 'Le nom est requis';
    }
    if (!formData.api_key && !isEdit) {
      return 'L\'API key est requise';
    }
    if (!formData.model.trim()) {
      return 'Le modèle est requis';
    }
    if (formData.max_tokens < 1) {
      return 'Max tokens doit être >= 1';
    }
    if (formData.temperature < 0 || formData.temperature > 2) {
      return 'La température doit être entre 0 et 2';
    }
    if (formData.priority < 1) {
      return 'La priorité doit être >= 1';
    }
    return null;
  };

  const handleTest = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setTesting(true);
    setError(null);

    try {
      // Si mode édition, tester le provider existant
      if (isEdit && provider) {
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
          setError(data.message || data.error || 'Test échoué');
        }
      } else {
        // Mode création : il faudrait créer temporairement puis tester
        // Pour l'instant, on informe l'utilisateur
        alert(
          'Veuillez d\'abord sauvegarder le provider, puis utiliser le bouton "Tester" depuis la liste.'
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur lors du test'
      );
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const url = isEdit
        ? `/api/super-admin/ai/providers/${provider!.id}`
        : '/api/super-admin/ai/providers';

      const method = isEdit ? 'PUT' : 'POST';

      const payload: Record<string, string | number | boolean> = {
        name: formData.name,
        provider: formData.provider,
        model: formData.model,
        max_tokens: formData.max_tokens,
        temperature: formData.temperature,
        is_enabled: formData.is_enabled,
        priority: formData.priority,
      };

      // N'envoyer l'API key que si elle a été modifiée
      if (formData.api_key) {
        payload.api_key = formData.api_key;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }

      onClose(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur lors de la sauvegarde'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Modifier' : 'Ajouter'} un Provider IA
          </h2>
          <button
            onClick={() => onClose(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {error && (
            <div
              role="alert"
              className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-800 dark:text-red-200"
            >
              {error}
            </div>
          )}

          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
              Nom du Provider *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => handleInputChange('name', e.target.value)}
              placeholder="Ex: Groq Production"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Type Provider */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
              Type de Provider *
            </label>
            <select
              value={formData.provider}
              onChange={e =>
                handleInputChange(
                  'provider',
                  e.target.value as 'groq' | 'claude' | 'openai'
                )
              }
              disabled={isEdit}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="groq">Groq (Gratuit)</option>
              <option value="claude">Anthropic Claude</option>
              <option value="openai">OpenAI GPT</option>
            </select>
            {formData.provider === 'groq' && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                14400 requêtes/jour gratuites, ~300 tokens/s
              </p>
            )}
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
              API Key {!isEdit && '*'}
            </label>
            <input
              type="password"
              value={formData.api_key}
              onChange={e => handleInputChange('api_key', e.target.value)}
              placeholder={
                isEdit
                  ? 'Laisser vide pour ne pas modifier'
                  : 'Votre API key...'
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Chiffrée avec Fernet (AES-128-CBC + HMAC-SHA256)
            </p>
          </div>

          {/* Modèle */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
              Modèle *
            </label>
            <select
              value={formData.model}
              onChange={e => handleInputChange('model', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {DEFAULT_MODELS[formData.provider].map(model => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Max Tokens */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                Max Tokens
              </label>
              <input
                type="number"
                value={formData.max_tokens}
                onChange={e =>
                  handleInputChange('max_tokens', parseInt(e.target.value))
                }
                min="1"
                max="4096"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Température */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                Température
              </label>
              <input
                type="number"
                value={formData.temperature}
                onChange={e =>
                  handleInputChange('temperature', parseFloat(e.target.value))
                }
                min="0"
                max="2"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Priorité */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                Priorité (1=highest)
              </label>
              <input
                type="number"
                value={formData.priority}
                onChange={e =>
                  handleInputChange('priority', parseInt(e.target.value))
                }
                min="1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Activer */}
            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_enabled}
                  onChange={e =>
                    handleInputChange('is_enabled', e.target.checked)
                  }
                  className="w-4 h-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-900 dark:text-white dark:text-gray-300">
                  Activer ce provider
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={() => onClose(false)} variant="secondary">
            Annuler
          </Button>
          <Button
            onClick={handleTest}
            disabled={testing || saving}
            variant="secondary"
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
          <Button onClick={handleSave} disabled={saving || testing}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
