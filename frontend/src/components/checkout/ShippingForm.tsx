'use client';

import React from 'react';
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
  data: ShippingFormData;
  onChange: (data: Partial<ShippingFormData>) => void;
  errors?: Partial<Record<keyof ShippingFormData, string>>;
}

const ShippingForm: React.FC<ShippingFormProps> = ({ data, onChange, errors = {} }) => {
  const handleChange = (field: keyof ShippingFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    onChange({ [field]: e.target.value });
  };

  return (
    <div className="space-y-6">
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
                  w-full px-4 py-2 border rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-[#01613a] focus:border-transparent
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
                  ? 'border-[#01613a] bg-[#01613a]/5'
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
              className="mt-1 text-[#01613a] focus:ring-[#01613a]"
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
                  ? 'border-[#01613a] bg-[#01613a]/5'
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
              className="mt-1 text-[#01613a] focus:ring-[#01613a]"
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
    </div>
  );
};

export default ShippingForm;
