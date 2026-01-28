/**
 * Modal d'ajout/édition de règle de prix
 *
 * Formulaire complexe pour ajouter ou modifier une règle de prix à une pricelist.
 * Champs conditionnels selon le type d'application et de calcul.
 * Supporte le mode édition via la prop 'item'.
 */

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm, Controller } from 'react-hook-form';
import { X, Calculator, CheckCircle } from 'lucide-react';
import {
  useCreatePricelistItem,
  useUpdatePricelistItem,
  type CreatePricelistItemParams,
  type PricelistItem,
} from '../../hooks/usePricelists';
import { useCategories } from '../../hooks/useCategories';
import { SearchAutocomplete, type SearchSuggestion } from '../common/SearchAutocomplete';
import { useToast } from '../../hooks/useToast';
import { api } from '../../lib/api';
import { logger } from '@quelyos/logger';
import type { Product } from '@/types';

interface PricelistItemFormData {
  applied_on: '3_global' | '2_product_category' | '1_product' | '0_product_variant';
  compute_price: 'fixed' | 'percentage' | 'formula';
  fixed_price?: number;
  percent_price?: number;
  price_discount?: number;
  min_quantity: number;
  product_tmpl_id?: number;
  categ_id?: number;
  date_start?: string;
  date_end?: string;
}

interface PricelistItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  pricelistId: number;
  currencySymbol: string;
  item?: PricelistItem; // Si défini, mode édition
}

export function PricelistItemFormModal({
  isOpen,
  onClose,
  pricelistId,
  currencySymbol,
  item,
}: PricelistItemFormModalProps) {
  const { success, error: showError } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const isEditing = !!item;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    control,
  } = useForm<PricelistItemFormData>({
    defaultValues: {
      applied_on: (item?.applied_on as PricelistItemFormData['applied_on']) || '3_global',
      compute_price: (item?.compute_price as PricelistItemFormData['compute_price']) || 'percentage',
      min_quantity: item?.min_quantity || 1,
      fixed_price: item?.fixed_price,
      percent_price: item?.percent_price,
      price_discount: item?.price_discount,
      product_tmpl_id: item?.product_id,
      categ_id: item?.category_id,
      date_start: '',
      date_end: '',
    },
  });

  const { data: categoriesData } = useCategories();
  const categories = (categoriesData?.data?.categories || []) as Array<{
    id: number;
    name: string;
  }>;

  const createMutation = useCreatePricelistItem();
  const updateMutation = useUpdatePricelistItem();

  const appliedOn = watch('applied_on');
  const computePrice = watch('compute_price');

  // Reset formulaire à la fermeture
  useEffect(() => {
    if (!isOpen) {
      reset();
      setSelectedProduct(null);
    }
  }, [isOpen, reset]);

  // Initialiser le produit sélectionné en mode édition
  useEffect(() => {
    if (item?.product_id && item?.product_name) {
      setSelectedProduct({
        id: item.product_id,
        name: item.product_name,
      } as Product);
    }
  }, [item]);

  // Fetch suggestions produits
  const fetchProductSuggestions = async (query: string): Promise<SearchSuggestion<Product>[]> => {
    try {
      const response = (await api.getProducts({ search: query, limit: 10 })) as unknown as {
        success: boolean;
        data?: { products?: Product[] };
        products?: Product[];
      };
      const productsList = response.data?.products || response.products;
      if (response.success && productsList && Array.isArray(productsList)) {
        return productsList.map((product) => ({
          id: product.id,
          label: product.name,
          data: product,
        }));
      }
      return [];
    } catch (error) {
      logger.error('Error fetching product suggestions:', error);
      return [];
    }
  };

  const handleSelectProduct = (item: SearchSuggestion<Product>) => {
    setSelectedProduct(item.data);
    setValue('product_tmpl_id', item.data.id);
  };

  const onSubmit = async (data: PricelistItemFormData) => {
    try {
      // Validation conditionnelle
      if (data.applied_on === '1_product' && !data.product_tmpl_id) {
        showError('Veuillez sélectionner un produit');
        return;
      }

      if (data.applied_on === '2_product_category' && !data.categ_id) {
        showError('Veuillez sélectionner une catégorie');
        return;
      }

      if (data.compute_price === 'fixed' && !data.fixed_price) {
        showError('Veuillez saisir un prix fixe');
        return;
      }

      if (data.compute_price === 'percentage' && !data.percent_price && !data.price_discount) {
        showError('Veuillez saisir un pourcentage ou une remise');
        return;
      }

      // Préparer les paramètres
      const params: any = {
        applied_on: data.applied_on,
        compute_price: data.compute_price,
        min_quantity: data.min_quantity,
      };

      // Ajouter les champs conditionnels
      if (data.applied_on === '1_product') {
        params.product_tmpl_id = data.product_tmpl_id;
      } else if (data.applied_on === '2_product_category') {
        params.categ_id = data.categ_id;
      }

      if (data.compute_price === 'fixed') {
        params.fixed_price = data.fixed_price;
      } else if (data.compute_price === 'percentage') {
        if (data.percent_price) {
          params.percent_price = data.percent_price;
        } else if (data.price_discount) {
          params.price_discount = data.price_discount;
        }
      }

      if (data.date_start) {
        params.date_start = data.date_start;
      }
      if (data.date_end) {
        params.date_end = data.date_end;
      }

      if (isEditing && item) {
        // Mode édition
        await updateMutation.mutateAsync({ pricelistId, itemId: item.id, params });
        success('Règle de prix mise à jour avec succès');
      } else {
        // Mode création
        await createMutation.mutateAsync({ pricelistId, params });
        success('Règle de prix ajoutée avec succès');
      }
      onClose();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Erreur lors de la création');
    }
  };

  // Labels pour affichage
  const getAppliedOnLabel = (value: string) => {
    switch (value) {
      case '3_global':
        return 'Tous les produits';
      case '2_product_category':
        return 'Catégorie de produits';
      case '1_product':
        return 'Produit spécifique';
      case '0_product_variant':
        return 'Variante de produit';
      default:
        return value;
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 dark:bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <Calculator className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                      {isEditing ? 'Modifier la règle de prix' : 'Ajouter une règle de prix'}
                    </Dialog.Title>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    aria-label="Fermer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* Type d'application */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Appliquer sur <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['3_global', '2_product_category', '1_product'] as const).map((value) => (
                        <label
                          key={value}
                          className={`relative flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                            appliedOn === value
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-700'
                          }`}
                        >
                          <input
                            {...register('applied_on')}
                            type="radio"
                            value={value}
                            className="sr-only"
                          />
                          <span
                            className={`text-sm font-medium ${
                              appliedOn === value
                                ? 'text-indigo-700 dark:text-indigo-300'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {getAppliedOnLabel(value)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Champ conditionnel : Produit */}
                  {appliedOn === '1_product' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Sélectionner un produit <span className="text-red-500">*</span>
                      </label>
                      <Controller
                        name="product_tmpl_id"
                        control={control}
                        rules={{ required: appliedOn === '1_product' }}
                        render={() => (
                          <SearchAutocomplete
                            fetchSuggestions={fetchProductSuggestions}
                            onSelect={handleSelectProduct}
                            placeholder="Rechercher un produit..."
                          />
                        )}
                      />
                      {selectedProduct && (
                        <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                          ✓ {selectedProduct.name}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Champ conditionnel : Catégorie */}
                  {appliedOn === '2_product_category' && (
                    <div>
                      <label
                        htmlFor="categ_id"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Sélectionner une catégorie <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register('categ_id', {
                          required: appliedOn === '2_product_category',
                        })}
                        id="categ_id"
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="">Sélectionnez une catégorie</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Type de calcul */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Type de calcul <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['percentage', 'fixed'] as const).map((value) => (
                        <label
                          key={value}
                          className={`relative flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                            computePrice === value
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-700'
                          }`}
                        >
                          <input
                            {...register('compute_price')}
                            type="radio"
                            value={value}
                            className="sr-only"
                          />
                          <span
                            className={`text-sm font-medium ${
                              computePrice === value
                                ? 'text-indigo-700 dark:text-indigo-300'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {value === 'percentage' ? 'Pourcentage' : 'Prix fixe'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Champs valeur selon type de calcul */}
                  <div className="grid grid-cols-2 gap-4">
                    {computePrice === 'fixed' ? (
                      <div className="col-span-2">
                        <label
                          htmlFor="fixed_price"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                          Prix fixe ({currencySymbol}) <span className="text-red-500">*</span>
                        </label>
                        <input
                          {...register('fixed_price', {
                            required: computePrice === 'fixed',
                            min: { value: 0, message: 'Le prix doit être positif' },
                          })}
                          type="number"
                          step="0.01"
                          id="fixed_price"
                          placeholder="Ex: 99.99"
                          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        {errors.fixed_price && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            {errors.fixed_price.message}
                          </p>
                        )}
                      </div>
                    ) : (
                      <>
                        <div>
                          <label
                            htmlFor="percent_price"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          >
                            % du prix de base
                          </label>
                          <input
                            {...register('percent_price', {
                              min: { value: 0, message: 'Doit être positif' },
                              max: { value: 100, message: 'Maximum 100%' },
                            })}
                            type="number"
                            step="0.1"
                            id="percent_price"
                            placeholder="Ex: 80 (pour -20%)"
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Prix = Prix base × %
                          </p>
                        </div>
                        <div>
                          <label
                            htmlFor="price_discount"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          >
                            % de remise
                          </label>
                          <input
                            {...register('price_discount', {
                              min: { value: 0, message: 'Doit être positif' },
                              max: { value: 100, message: 'Maximum 100%' },
                            })}
                            type="number"
                            step="0.1"
                            id="price_discount"
                            placeholder="Ex: 20 (pour -20%)"
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Prix = Prix base - %
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Quantité minimale */}
                  <div>
                    <label
                      htmlFor="min_quantity"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Quantité minimale
                    </label>
                    <input
                      {...register('min_quantity', {
                        required: 'La quantité minimale est requise',
                        min: { value: 1, message: 'Minimum 1' },
                      })}
                      type="number"
                      id="min_quantity"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Quantité minimale pour appliquer cette règle
                    </p>
                  </div>

                  {/* Dates optionnelles */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="date_start"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Date début (optionnel)
                      </label>
                      <input
                        {...register('date_start')}
                        type="date"
                        id="date_start"
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="date_end"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Date fin (optionnel)
                      </label>
                      <input
                        {...register('date_end')}
                        type="date"
                        id="date_end"
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          {isEditing ? 'Mise à jour...' : 'Création...'}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          {isEditing ? 'Mettre à jour' : 'Ajouter la règle'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
