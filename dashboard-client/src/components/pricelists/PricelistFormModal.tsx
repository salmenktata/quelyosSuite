/**
 * Modal de création/édition de Pricelist
 *
 * Formulaire avec validation pour créer ou modifier une liste de prix.
 * Utilise react-hook-form + validation temps réel.
 */

import { Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { X, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { useCurrencies } from '../../hooks/useCurrencies';
import { useCreatePricelist, useUpdatePricelist, type Pricelist } from '../../hooks/usePricelists';
import { useToast } from '../../hooks/useToast';

interface PricelistFormData {
  name: string;
  currency_id: number;
  discount_policy: string;
  active: boolean;
}

interface PricelistFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  pricelist?: Pricelist; // Si fourni, mode édition
}

export function PricelistFormModal({ isOpen, onClose, pricelist }: PricelistFormModalProps) {
  const isEditing = !!pricelist;
  const { success, error: showError } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<PricelistFormData>({
    defaultValues: {
      name: '',
      currency_id: 0,
      discount_policy: 'with_discount',
      active: true,
    },
  });

  const { data: currencies, isLoading: currenciesLoading } = useCurrencies();
  const createMutation = useCreatePricelist();
  const updateMutation = useUpdatePricelist();

  // Pré-remplir le formulaire en mode édition
  useEffect(() => {
    if (pricelist) {
      setValue('name', pricelist.name);
      setValue('currency_id', pricelist.currency_id);
      setValue('discount_policy', pricelist.discount_policy);
      setValue('active', pricelist.active);
    }
  }, [pricelist, setValue]);

  // Reset formulaire à la fermeture
  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: PricelistFormData) => {
    try {
      if (isEditing && pricelist) {
        // Mode édition
        await updateMutation.mutateAsync({
          pricelistId: pricelist.id,
          params: {
            name: data.name,
            currency_id: data.currency_id,
            discount_policy: data.discount_policy,
            active: data.active,
          },
        });
        success(`Liste de prix "${data.name}" mise à jour avec succès`);
      } else {
        // Mode création
        await createMutation.mutateAsync({
          name: data.name,
          currency_id: data.currency_id,
          discount_policy: data.discount_policy,
          active: data.active,
        });
        success(`Liste de prix "${data.name}" créée avec succès`);
      }
      onClose();
    } catch (error) {
      showError(
        error instanceof Error ? error.message : 'Erreur lors de la sauvegarde'
      );
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <DollarSign className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                      {isEditing ? 'Modifier la liste de prix' : 'Nouvelle liste de prix'}
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
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Nom */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Nom de la liste <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('name', {
                        required: 'Le nom est requis',
                        minLength: { value: 3, message: 'Minimum 3 caractères' },
                      })}
                      type="text"
                      id="name"
                      placeholder="Ex: Liste VIP, Revendeurs..."
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Devise */}
                  <div>
                    <label
                      htmlFor="currency_id"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Devise <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('currency_id', {
                        required: 'La devise est requise',
                        validate: (value) => value > 0 || 'Sélectionnez une devise',
                      })}
                      id="currency_id"
                      disabled={currenciesLoading}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                    >
                      <option value={0}>Sélectionnez une devise</option>
                      {currencies?.map((currency) => (
                        <option key={currency.id} value={currency.id}>
                          {currency.symbol} - {currency.name}
                        </option>
                      ))}
                    </select>
                    {errors.currency_id && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.currency_id.message}
                      </p>
                    )}
                  </div>

                  {/* Politique de remise */}
                  <div>
                    <label
                      htmlFor="discount_policy"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Politique de remise
                    </label>
                    <select
                      {...register('discount_policy')}
                      id="discount_policy"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="with_discount">Avec remises affichées</option>
                      <option value="without_discount">Sans remises affichées</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Détermine si les remises sont affichées au client
                    </p>
                  </div>

                  {/* Actif */}
                  <div className="flex items-center gap-2">
                    <input
                      {...register('active')}
                      type="checkbox"
                      id="active"
                      className="w-4 h-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500"
                    />
                    <label
                      htmlFor="active"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      Liste de prix active
                    </label>
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
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          {isEditing ? 'Mettre à jour' : 'Créer'}
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
