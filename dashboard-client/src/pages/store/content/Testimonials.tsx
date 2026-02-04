/**
 * Page Témoignages - Gestion des avis clients mis en avant
 *
 * Fonctionnalités :
 * - Liste des témoignages avec statut
 * - Création et édition de témoignages
 * - Gestion de la note (étoiles)
 * - Options d'affichage (homepage, produit, checkout)
 * - Mise en avant de témoignages
 */
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Quote, Star, User, AlertCircle, RefreshCw } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, PageNotice, Button, SkeletonTable } from '@/components/common';
import { storeNotices } from '@/lib/notices';
import { apiFetchJson } from '@/lib/apiFetch';
import { logger } from '@quelyos/logger';

interface Testimonial {
  id: number;
  customerName: string;
  customerTitle: string;
  customerCompany: string;
  avatarUrl: string | null;
  content: string;
  rating: number;
  isPublished: boolean;
  isFeatured: boolean;
  displayOn: string;
}

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Testimonial | null>(null);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    setError(null);
    try {
      const data = await apiFetchJson<{ result?: { success: boolean; testimonials: Testimonial[] } }>(
        '/api/admin/testimonials',
        {
          method: 'POST',
          body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: {} }),
        }
      );
      if (data.result?.success) {
        setTestimonials(data.result.testimonials || []);
      } else {
        setError('Erreur lors du chargement des témoignages');
      }
    } catch {
      logger.error("Erreur attrapée");
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const saveTestimonial = async () => {
    if (!editing) return;
    try {
      const data = await apiFetchJson<{ result?: { success: boolean } }>(
        '/api/admin/testimonials/save',
        {
          method: 'POST',
          body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: editing }),
        }
      );
      if (data.result?.success) {
        setEditing(null);
        fetchTestimonials();
      }
    } catch {
      logger.error("Erreur attrapée");
      // Error handled silently
    }
  };

  const newTestimonial = () => {
    setEditing({
      id: 0,
      customerName: '',
      customerTitle: '',
      customerCompany: '',
      avatarUrl: null,
      content: '',
      rating: 5,
      isPublished: false,
      isFeatured: false,
      displayOn: 'homepage',
    });
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="p-4 md:p-8">
          <SkeletonTable rows={6} columns={4} />
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
            { label: 'Témoignages' },
          ]}
        />

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Témoignages</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Affichez les témoignages de vos clients satisfaits
            </p>
          </div>
          <Button onClick={newTestimonial} icon={<Plus className="w-4 h-4" />}>
            Nouveau témoignage
          </Button>
        </div>

        <PageNotice config={storeNotices.testimonials} className="mb-6" />

        {error && (
          <div role="alert" className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700 dark:text-red-300">{error}</p>
              <Button variant="ghost" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={fetchTestimonials} className="mt-2">
                Réessayer
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              <Quote className="w-8 h-8 text-blue-500/20 mb-4" />
              <p className="text-gray-600 dark:text-gray-300 mb-4 italic">
                "{testimonial.content}"
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    {testimonial.avatarUrl ? (
                      <img src={testimonial.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{testimonial.customerName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {testimonial.customerTitle}
                      {testimonial.customerCompany && ` - ${testimonial.customerCompany}`}
                    </p>
                  </div>
                </div>
                {renderStars(testimonial.rating)}
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex gap-2">
                  {testimonial.isPublished ? (
                    <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded">
                      Publié
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded">
                      Brouillon
                    </span>
                  )}
                  {testimonial.isFeatured && (
                    <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded">
                      Mis en avant
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Edit className="w-4 h-4" />}
                    onClick={() => setEditing(testimonial)}
                    className="p-1.5"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 className="w-4 h-4 text-red-500" />}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20"
                  />
                </div>
              </div>
            </div>
          ))}

          {testimonials.length === 0 && !error && (
            <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <Quote className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Aucun témoignage</p>
              <Button variant="ghost" onClick={newTestimonial} className="mt-4">
                Ajouter un témoignage
              </Button>
            </div>
          )}
        </div>

        {editing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {editing.id ? 'Modifier le témoignage' : 'Nouveau témoignage'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Nom du client
                  </label>
                  <input
                    type="text"
                    value={editing.customerName}
                    onChange={(e) => setEditing({ ...editing, customerName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                      Titre/Fonction
                    </label>
                    <input
                      type="text"
                      value={editing.customerTitle}
                      onChange={(e) => setEditing({ ...editing, customerTitle: e.target.value })}
                      placeholder="Ex: CEO"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                      Entreprise
                    </label>
                    <input
                      type="text"
                      value={editing.customerCompany}
                      onChange={(e) => setEditing({ ...editing, customerCompany: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Témoignage
                  </label>
                  <textarea
                    value={editing.content}
                    onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Note
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setEditing({ ...editing, rating: star })}
                      >
                        <Star
                          className={`w-6 h-6 ${star <= editing.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Afficher sur
                  </label>
                  <select
                    value={editing.displayOn}
                    onChange={(e) => setEditing({ ...editing, displayOn: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="homepage">Page d'accueil</option>
                    <option value="product">Pages produit</option>
                    <option value="checkout">Checkout</option>
                    <option value="all">Partout</option>
                  </select>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editing.isPublished}
                      onChange={(e) => setEditing({ ...editing, isPublished: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-900 dark:text-white dark:text-gray-300">Publié</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editing.isFeatured}
                      onChange={(e) => setEditing({ ...editing, isFeatured: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-900 dark:text-white dark:text-gray-300">Mise en avant</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="secondary" onClick={() => setEditing(null)}>
                  Annuler
                </Button>
                <Button onClick={saveTestimonial}>
                  Enregistrer
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
