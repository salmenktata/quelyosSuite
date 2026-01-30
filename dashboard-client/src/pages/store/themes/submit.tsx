/**
 * Page Soumission Thème - Upload thème pour marketplace
 *
 * Fonctionnalités :
 * - Formulaire soumission thème
 * - Upload JSON configuration
 * - Upload miniature et screenshots
 * - Définir prix (gratuit/premium)
 * - Prévisualiser avant soumission
 */

import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, Button, PageNotice } from '@/components/common';
import { Upload, Image, DollarSign, CheckCircle, AlertCircle, FileUp } from 'lucide-react';
import type { ThemeCategory } from '@/types/theme';

const CATEGORIES: { value: ThemeCategory; label: string }[] = [
  { value: 'fashion', label: 'Mode' },
  { value: 'tech', label: 'High-Tech' },
  { value: 'food', label: 'Alimentaire' },
  { value: 'beauty', label: 'Beauté' },
  { value: 'sports', label: 'Sports' },
  { value: 'home', label: 'Maison' },
  { value: 'general', label: 'Général' },
];

export default function SubmitThemePage() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'general' as ThemeCategory,
    is_premium: false,
    price: 0,
    config_json: '',
  });

  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'json' | 'thumbnail') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'json') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const config = JSON.parse(event.target?.result as string);
          setFormData({ ...formData, config_json: JSON.stringify(config, null, 2) });
          setError(null);
        } catch {
          setError('Fichier JSON invalide');
        }
      };
      reader.readAsText(file);
    } else {
      setThumbnail(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Validation
      if (!formData.name || !formData.description || !formData.config_json) {
        setError('Veuillez remplir tous les champs requis');
        setSubmitting(false);
        return;
      }

      // Vérifier JSON valide
      try {
        JSON.parse(formData.config_json);
      } catch {
        setError('Configuration JSON invalide');
        setSubmitting(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/themes/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: {
            name: formData.name,
            description: formData.description,
            category: formData.category,
            config_json: formData.config_json,
            is_premium: formData.is_premium,
            price: formData.is_premium ? formData.price : 0,
          },
          id: 1,
        }),
      });

      const data = await response.json();

      if (data.result?.success) {
        setSuccess(true);
        setFormData({
          name: '',
          description: '',
          category: 'general',
          is_premium: false,
          price: 0,
          config_json: '',
        });
        setThumbnail(null);
      } else {
        setError(data.result?.error || 'Erreur lors de la soumission');
      }
    } catch (err) {
      setError('Erreur lors de la soumission. Réessayez.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <Breadcrumbs
            items={[
              { label: 'Boutique', href: '/store' },
              { label: 'Thèmes', href: '/store/themes' },
              { label: 'Soumettre', href: '/store/themes/submit' },
            ]}
          />

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Soumission Réussie</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Votre thème est en cours de review
              </p>
            </div>
          </div>

          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-6">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Thème Soumis avec Succès !
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Votre thème est en cours de review par notre équipe. Vous recevrez une notification une fois validé.
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => setSuccess(false)}>
                Soumettre un Autre Thème
              </Button>
              <Button variant="primary" onClick={() => (window.location.href = '/store/themes/my-submissions')}>
                Voir Mes Soumissions
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Boutique', href: '/store' },
            { label: 'Thèmes', href: '/store/themes' },
            { label: 'Soumettre', href: '/store/themes/submit' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Soumettre un Thème</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Partagez votre thème avec la communauté et générez des revenus
            </p>
          </div>
        </div>

        <PageNotice
          config={{
            pageId: 'themes-submit',
            title: 'Soumission de Thème',
            purpose:
              'Soumettez votre thème personnalisé au marketplace pour le partager avec la communauté',
            icon: FileUp,
            moduleColor: 'indigo',
            sections: [
              {
                title: 'Informations',
                items: [
                  'Configuration JSON requise (format validé)',
                  'Miniature recommandée pour attirer les utilisateurs',
                  'Thèmes gratuits ou premium (revenue share 70/30)',
                  'Review par l\'équipe avant publication',
                  'Suivi des soumissions dans "Mes Soumissions"',
                ],
              },
            ],
          }}
        />

        <div className="max-w-3xl mx-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3" role="alert">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Informations de Base
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                  Nom du Thème *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Ex: Fashion Luxury"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                  placeholder="Décrivez votre thème, son style, ses fonctionnalités..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                  Catégorie *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ThemeCategory })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Configuration JSON */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Configuration Thème
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                  Fichier JSON *
                </label>
                <label className="cursor-pointer flex items-center justify-center gap-2 w-full px-4 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors">
                  <Upload className="h-6 w-6 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Cliquer pour uploader la configuration JSON
                  </span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => handleFileUpload(e, 'json')}
                    className="hidden"
                  />
                </label>
              </div>

              {formData.config_json && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                    Aperçu JSON
                  </label>
                  <textarea
                    value={formData.config_json}
                    onChange={(e) => setFormData({ ...formData, config_json: e.target.value })}
                    rows={10}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Miniature */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Miniature
            </h2>

            <label className="cursor-pointer flex items-center justify-center gap-2 w-full px-4 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors">
              <Image className="h-6 w-6 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {thumbnail ? thumbnail.name : 'Cliquer pour uploader une miniature (recommandé)'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'thumbnail')}
                className="hidden"
              />
            </label>
          </div>

          {/* Prix */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Monétisation
            </h2>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_premium"
                  checked={formData.is_premium}
                  onChange={(e) => setFormData({ ...formData, is_premium: e.target.checked })}
                  className="h-4 w-4 text-primary-600 rounded"
                />
                <label htmlFor="is_premium" className="text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300">
                  Thème Premium (payant)
                </label>
              </div>

              {formData.is_premium && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                    Prix (TND)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      min="0"
                      step="0.01"
                      placeholder="29.99"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Vous recevrez 70% du prix de vente (revenue share)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => (window.location.href = '/store/themes/marketplace')}>
              Annuler
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Soumission...' : 'Soumettre le Thème'}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </Layout>
  );
}
