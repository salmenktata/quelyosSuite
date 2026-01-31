/**
 * Page Attributs Produits - Gestion des attributs pour variantes
 *
 * Fonctionnalités :
 * - Liste des attributs avec leurs valeurs
 * - Création et modification d'attributs
 * - Types d'affichage (radio, select, nuancier couleurs)
 * - Gestion dynamique des valeurs d'attribut
 * - Configuration des modes de création de variantes
 */
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Palette, Tag } from 'lucide-react';
import { Breadcrumbs, Button, SkeletonTable, PageNotice } from '@/components/common';
import { storeNotices } from '@/lib/notices';
import { apiFetchJson } from '@quelyos/api-client';
import { useRequireAuth } from '@/lib/retail/compat/auth';
import { useRequireAuth } from '@/lib/retail/compat/auth';

interface AttributeValue {
  id: number;
  name: string;
}

interface Attribute {
  id: number;
  name: string;
  displayType: string;
  createVariant: string;
  values: AttributeValue[];
}

export default function Attributes() {
  useRequireAuth(); // Protection auth avec redirection auto
  useRequireAuth();

  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Attribute | null>(null);
  const [newValue, setNewValue] = useState('');

  useEffect(() => {
    fetchAttributes();
  }, []);

  const fetchAttributes = async () => {
    setError(null);
    try {
      const data = await apiFetchJson<{ result?: { success: boolean; attributes: Attribute[] } }>(
        '/api/admin/attributes',
        {
          method: 'POST',
          body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: {} }),
        }
      );
      if (data.result?.success) {
        setAttributes(data.result.attributes);
      } else {
        setError('Erreur lors du chargement des attributs');
      }
    } catch {
      setError('Impossible de charger les attributs');
    } finally {
      setLoading(false);
    }
  };

  const saveAttribute = async () => {
    if (!editing) return;
    try {
      const data = await apiFetchJson<{ result?: { success: boolean } }>(
        '/api/admin/attributes/save',
        {
          method: 'POST',
          body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: editing }),
        }
      );
      if (data.result?.success) {
        setEditing(null);
        fetchAttributes();
      } else {
        setError('Erreur lors de la sauvegarde');
      }
    } catch {
      setError('Impossible de sauvegarder l\'attribut');
    }
  };

  const addValue = () => {
    if (!editing || !newValue.trim()) return;
    setEditing({
      ...editing,
      values: [...editing.values, { id: 0, name: newValue.trim() }],
    });
    setNewValue('');
  };

  const removeValue = (index: number) => {
    if (!editing) return;
    const newValues = [...editing.values];
    newValues.splice(index, 1);
    setEditing({ ...editing, values: newValues });
  };

  const newAttribute = () => {
    setEditing({
      id: 0,
      name: '',
      displayType: 'radio',
      createVariant: 'always',
      values: [],
    });
  };

  const getDisplayTypeLabel = (type: string) => {
    switch (type) {
      case 'radio': return 'Boutons radio';
      case 'select': return 'Liste déroulante';
      case 'color': return 'Nuancier couleurs';
      default: return type;
    }
  };

  const breadcrumbItems = [
    { label: 'Boutique', href: '/store' },
    { label: 'Attributs Produits' }
  ];

  if (loading) {
    return (
      <>
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex items-center justify-center h-64">
          <SkeletonTable rows={3} columns={3} />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Breadcrumbs items={breadcrumbItems} />
        <div role="alert" className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
          <p className="text-red-800 dark:text-red-200">{error}</p>
          <Button variant="secondary" onClick={fetchAttributes} className="mt-3">
            Réessayer
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Breadcrumbs items={breadcrumbItems} />

      <div className="space-y-6 mt-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attributs Produits</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Gérez les attributs pour créer des variantes produits
            </p>
          </div>
          <Button onClick={newAttribute}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvel attribut
          </Button>
        </div>

        {storeNotices.attributes && (
          <PageNotice config={storeNotices.attributes} className="mb-6" />
        )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {attributes.map((attr) => (
          <div
            key={attr.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                {attr.displayType === 'color' ? (
                  <Palette className="w-5 h-5 text-purple-500" />
                ) : (
                  <Tag className="w-5 h-5 text-blue-500" />
                )}
                <h3 className="font-semibold text-gray-900 dark:text-white">{attr.name}</h3>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(attr)}
                  className="p-1.5"
                >
                  <Edit className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
                </Button>
              </div>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              {getDisplayTypeLabel(attr.displayType)}
            </p>

            <div className="flex flex-wrap gap-2">
              {attr.values.slice(0, 8).map((value) => (
                <span
                  key={value.id}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white dark:text-gray-300 rounded"
                >
                  {value.name}
                </span>
              ))}
              {attr.values.length > 8 && (
                <span className="px-2 py-1 text-xs text-gray-500">
                  +{attr.values.length - 8} autres
                </span>
              )}
            </div>
          </div>
        ))}

        {attributes.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Tag className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Aucun attribut défini</p>
            <Button
              variant="ghost"
              onClick={newAttribute}
              className="mt-4 text-blue-600 dark:text-blue-400"
            >
              Créer un attribut
            </Button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editing.id ? 'Modifier l\'attribut' : 'Nouvel attribut'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="Ex: Taille, Couleur, Matière..."
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Type d'affichage
                </label>
                <select
                  value={editing.displayType}
                  onChange={(e) => setEditing({ ...editing, displayType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="radio">Boutons radio</option>
                  <option value="select">Liste déroulante</option>
                  <option value="color">Nuancier couleurs</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Création de variantes
                </label>
                <select
                  value={editing.createVariant}
                  onChange={(e) => setEditing({ ...editing, createVariant: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="always">Toujours créer des variantes</option>
                  <option value="dynamic">Variantes dynamiques</option>
                  <option value="no_variant">Jamais (attribut informatif)</option>
                </select>
              </div>

              {/* Values */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Valeurs
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editing.values.map((value, index) => (
                    <span
                      key={index}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white dark:text-gray-300 rounded"
                    >
                      {value.name}
                      <button
                        onClick={() => removeValue(index)}
                        className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addValue()}
                    placeholder="Ajouter une valeur..."
                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                  <Button variant="subtle" onClick={addValue}>
                    Ajouter
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="secondary" onClick={() => setEditing(null)}>
                Annuler
              </Button>
              <Button onClick={saveAttribute}>
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
