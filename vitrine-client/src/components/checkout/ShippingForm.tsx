'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/common';
import { GovernorateSelect } from './GovernorateSelect';

import { backendClient } from '@/lib/backend/client';
import { useAuthStore } from '@/store/authStore';
import type { Address } from '@quelyos/types';
import {
  GOVERNORATES,
  SHIPPING_ZONES,
  getDefaultShippingPrice,
  type ShippingZone,
} from '@/data/tunisia-governorates';

interface ShippingFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  governorate: string;
  shippingMethod: 'standard' | 'express';
}

interface ShippingFormProps {
  initialData?: Partial<ShippingFormData>;
  onSubmit: (data: ShippingFormData, shippingCost: number) => Promise<void>;
  onBack: () => void;
  isLoading?: boolean;
  cartTotal?: number;
  freeThreshold?: number;
  zonePrices?: Record<ShippingZone, number>;
}

const ShippingForm: React.FC<ShippingFormProps> = ({
  initialData = {},
  onSubmit,
  onBack,
  isLoading = false,
  cartTotal = 0,
  freeThreshold = 150,
  zonePrices,
}) => {
  const { isAuthenticated } = useAuthStore();
  const [addressMode, setAddressMode] = useState<'saved' | 'new'>('new');
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedSavedAddress, setSelectedSavedAddress] = useState<Address | null>(null);

  const [data, setData] = useState<ShippingFormData>({
    firstName: initialData.firstName || '',
    lastName: initialData.lastName || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    address: initialData.address || '',
    city: initialData.city || '',
    postalCode: initialData.postalCode || '',
    country: initialData.country || 'TN',
    governorate: initialData.governorate || '',
    shippingMethod: initialData.shippingMethod || 'standard',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ShippingFormData, string>>>({});

  const handleSelectSavedAddress = React.useCallback((addr: Address) => {
    setSelectedSavedAddress(addr);
    // Remplir le formulaire avec l'adresse selectionnee
    const nameParts = (addr.name || '').split(' ');
    setData(prev => ({
      ...prev,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      address: addr.street || '',
      city: addr.city || '',
      postalCode: addr.zip || '',
      phone: addr.phone || prev.phone,
    }));
  }, []);

  // Charger les adresses sauvegardees
  useEffect(() => {
    if (isAuthenticated) {
      backendClient.getAddresses().then((response) => {
        if (response.success && response.addresses && response.addresses.length > 0) {
          setSavedAddresses(response.addresses);
          setAddressMode('saved');
          // Pre-selectionner l'adresse par defaut
          const defaultAddr = response.addresses.find((a) => a.is_default);
          if (defaultAddr) {
            handleSelectSavedAddress(defaultAddr);
          }
        }
      });
    }
  }, [isAuthenticated, handleSelectSavedAddress]);

  const selectedGovernorate = useMemo(
    () => GOVERNORATES.find((g) => g.code === data.governorate),
    [data.governorate]
  );

  const shippingCost = useMemo(() => {
    if (!selectedGovernorate) return 0;
    const basePrice = zonePrices?.[selectedGovernorate.zone] ?? getDefaultShippingPrice(selectedGovernorate.zone);
    if (freeThreshold > 0 && cartTotal >= freeThreshold) return 0;
    return basePrice;
  }, [selectedGovernorate, zonePrices, cartTotal, freeThreshold]);

  const handleChange = (field: keyof ShippingFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ShippingFormData, string>> = {};

    if (!data.firstName.trim()) newErrors.firstName = 'Prénom requis';
    if (!data.lastName.trim()) newErrors.lastName = 'Nom requis';
    if (!data.email.trim()) newErrors.email = 'Email requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = 'Email invalide';
    }
    if (!data.phone.trim()) newErrors.phone = 'Téléphone requis';
    if (!data.address.trim()) newErrors.address = 'Adresse requise';
    if (!data.city.trim()) newErrors.city = 'Ville/Delegation requise';
    if (!data.postalCode.trim()) newErrors.postalCode = 'Code postal requis';
    if (!data.governorate) newErrors.governorate = 'Gouvernorat requis';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onSubmit(data, shippingCost);
  };

  const handleGovernorateChange = (code: string) => {
    setData((prev) => ({ ...prev, governorate: code }));
    if (errors.governorate) {
      setErrors((prev) => ({ ...prev, governorate: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Address Mode Tabs - Si des adresses sauvegardees existent */}
      {isAuthenticated && savedAddresses.length > 0 && (
        <div className="mb-6">
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <button
              type="button"
              onClick={() => setAddressMode('saved')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                addressMode === 'saved'
                  ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              Mes adresses ({savedAddresses.length})
            </button>
            <button
              type="button"
              onClick={() => setAddressMode('new')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                addressMode === 'new'
                  ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              Nouvelle adresse
            </button>
          </div>

          {/* Liste des adresses sauvegardees */}
          {addressMode === 'saved' && (
            <div className="mt-4 space-y-3">
              {savedAddresses.map((addr) => (
                <div
                  key={addr.id}
                  onClick={() => handleSelectSavedAddress(addr)}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    selectedSavedAddress?.id === addr.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{addr.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{addr.street}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{addr.zip} {addr.city}</p>
                      {addr.phone && <p className="text-sm text-gray-500">{addr.phone}</p>}
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedSavedAddress?.id === addr.id
                        ? 'border-primary bg-primary'
                        : 'border-gray-300'
                    }`}>
                      {selectedSavedAddress?.id === addr.id && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  {addr.is_default && (
                    <span className="mt-2 inline-block text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      Adresse par defaut
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Personal Information - Cache si adresse sauvegardee selectionnee */}
      {(addressMode === 'new' || !selectedSavedAddress) && (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Informations personnelles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Prénom *"
            type="text"
            value={data.firstName}
            onChange={handleChange('firstName')}
            error={errors.firstName}
            placeholder="Votre prénom"
            required
          />
          <Input
            label="Nom *"
            type="text"
            value={data.lastName}
            onChange={handleChange('lastName')}
            error={errors.lastName}
            placeholder="Votre nom"
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Input
            label="Email *"
            type="email"
            value={data.email}
            onChange={handleChange('email')}
            error={errors.email}
            placeholder="votre@email.com"
            required
          />
          <Input
            label="Téléphone *"
            type="tel"
            value={data.phone}
            onChange={handleChange('phone')}
            error={errors.phone}
            placeholder="+216 XX XXX XXX"
            required
          />
        </div>
      </div>
      )}

      {/* Shipping Address - Toujours affiche pour permettre les modifications */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Adresse de livraison
        </h3>
        <div className="space-y-4">
          <GovernorateSelect
            value={data.governorate}
            onChange={handleGovernorateChange}
            zonePrices={zonePrices}
            freeThreshold={freeThreshold}
            cartTotal={cartTotal}
            error={errors.governorate}
            disabled={isLoading}
          />

          <Input
            label="Adresse complète *"
            type="text"
            value={data.address}
            onChange={handleChange('address')}
            error={errors.address}
            placeholder="Numéro, rue, appartement..."
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Ville / Délégation *"
              type="text"
              value={data.city}
              onChange={handleChange('city')}
              error={errors.city}
              placeholder="Ville ou délégation"
              required
            />
            <Input
              label="Code postal *"
              type="text"
              value={data.postalCode}
              onChange={handleChange('postalCode')}
              error={errors.postalCode}
              placeholder="XXXX"
              required
            />
          </div>
        </div>
      </div>

      {/* Shipping Summary */}
      {selectedGovernorate && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Récapitulatif livraison
          </h3>
          <div className="p-4 rounded-lg border-2 border-primary bg-primary/5 dark:bg-primary/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  Livraison vers {selectedGovernorate.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Zone: {SHIPPING_ZONES.find((z) => z.code === selectedGovernorate.zone)?.label || selectedGovernorate.zone}
                  {' - '}
                  Délai: {selectedGovernorate.zone === 'grand-tunis' ? '2-3' : '3-5'} jours ouvrés
                </p>
              </div>
              <div className="text-right">
                {shippingCost === 0 ? (
                  <span className="font-bold text-green-600 dark:text-green-400 text-lg">
                    Gratuit
                  </span>
                ) : (
                  <span className="font-bold text-gray-900 dark:text-white text-lg">
                    {shippingCost.toFixed(2)} TND
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Retour au panier
        </button>
        <button
          type="submit"
          disabled={isLoading || !data.governorate}
          className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Traitement...
            </>
          ) : (
            <>
              Continuer vers le paiement
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export { ShippingForm };
export type { ShippingFormData as ShippingAddress };
export default ShippingForm;
