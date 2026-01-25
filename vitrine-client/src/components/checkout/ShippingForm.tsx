'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/common';

interface ShippingFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  shippingMethod: 'standard' | 'express';
}

interface ShippingFormProps {
  initialData?: Partial<ShippingFormData>;
  onSubmit: (data: ShippingFormData) => Promise<void>;
  onBack: () => void;
  isLoading?: boolean;
}

const ShippingForm: React.FC<ShippingFormProps> = ({
  initialData = {},
  onSubmit,
  onBack,
  isLoading = false
}) => {
  const [data, setData] = useState<ShippingFormData>({
    firstName: initialData.firstName || '',
    lastName: initialData.lastName || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    address: initialData.address || '',
    city: initialData.city || '',
    postalCode: initialData.postalCode || '',
    country: initialData.country || 'TN',
    shippingMethod: initialData.shippingMethod || 'standard',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ShippingFormData, string>>>({});

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
    if (!data.city.trim()) newErrors.city = 'Ville requise';
    if (!data.postalCode.trim()) newErrors.postalCode = 'Code postal requis';
    if (!data.country) newErrors.country = 'Pays requis';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
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

      {/* Shipping Address */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Adresse de livraison
        </h3>
        <div className="space-y-4">
          <Input
            label="Adresse complète *"
            type="text"
            value={data.address}
            onChange={handleChange('address')}
            error={errors.address}
            placeholder="Numéro, rue, appartement..."
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Ville *"
              type="text"
              value={data.city}
              onChange={handleChange('city')}
              error={errors.city}
              placeholder="Ville"
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pays *
              </label>
              <select
                value={data.country}
                onChange={handleChange('country')}
                className={`
                  w-full px-4 py-2 border rounded-lg text-gray-900
                  focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                  ${errors.country ? 'border-red-500' : 'border-gray-300'}
                `}
                required
              >
                <option value="">Sélectionner</option>
                <option value="TN">Tunisie</option>
                <option value="FR">France</option>
                <option value="DZ">Algérie</option>
                <option value="MA">Maroc</option>
              </select>
              {errors.country && (
                <p className="mt-1 text-sm text-red-600">{errors.country}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Method */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Mode de livraison
        </h3>
        <div className="space-y-3">
          <label
            className={`
              flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all
              ${
                data.shippingMethod === 'standard'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <input
              type="radio"
              name="shippingMethod"
              value="standard"
              checked={data.shippingMethod === 'standard'}
              onChange={handleChange('shippingMethod')}
              className="mt-1 text-primary focus:ring-ring"
            />
            <div className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Livraison Standard</span>
                <span className="font-bold text-green-600">Gratuite</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Délai: 2-3 jours ouvrés
              </p>
            </div>
          </label>

          <label
            className={`
              flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all
              ${
                data.shippingMethod === 'express'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <input
              type="radio"
              name="shippingMethod"
              value="express"
              checked={data.shippingMethod === 'express'}
              onChange={handleChange('shippingMethod')}
              className="mt-1 text-primary focus:ring-ring"
            />
            <div className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Livraison Express</span>
                <span className="font-bold text-gray-900">15 DT</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Délai: 24-48 heures
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Retour au panier
        </button>
        <button
          type="submit"
          disabled={isLoading}
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
