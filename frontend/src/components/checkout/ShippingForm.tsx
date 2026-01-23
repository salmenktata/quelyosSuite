/**
 * Formulaire d'adresse de livraison
 */

'use client';

import React, { useState } from 'react';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';

export interface ShippingAddress {
  name: string;
  email: string;
  phone: string;
  street: string;
  street2?: string;
  city: string;
  zip: string;
  state?: string;
  country: string;
}

interface ShippingFormProps {
  initialData?: Partial<ShippingAddress>;
  onSubmit: (data: ShippingAddress) => void;
  onBack?: () => void;
  isLoading?: boolean;
}

export function ShippingForm({ initialData, onSubmit, onBack, isLoading }: ShippingFormProps) {
  const [formData, setFormData] = useState<ShippingAddress>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    street: initialData?.street || '',
    street2: initialData?.street2 || '',
    city: initialData?.city || '',
    zip: initialData?.zip || '',
    state: initialData?.state || '',
    country: initialData?.country || 'Tunisie',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Le téléphone est requis';
    if (!formData.street.trim()) newErrors.street = 'L\'adresse est requise';
    if (!formData.city.trim()) newErrors.city = 'La ville est requise';
    if (!formData.zip.trim()) newErrors.zip = 'Le code postal est requis';
    if (!formData.country.trim()) newErrors.country = 'Le pays est requis';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informations de contact */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Informations de contact</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nom complet *
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Prénom Nom"
              required
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="exemple@email.com"
              required
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Téléphone *
          </label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+216 XX XXX XXX"
            required
          />
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
        </div>
      </div>

      {/* Adresse de livraison */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Adresse de livraison</h3>

        <div className="space-y-4">
          <div>
            <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-2">
              Adresse *
            </label>
            <Input
              id="street"
              name="street"
              type="text"
              value={formData.street}
              onChange={handleChange}
              placeholder="Numéro et nom de rue"
              required
            />
            {errors.street && <p className="mt-1 text-sm text-red-600">{errors.street}</p>}
          </div>

          <div>
            <label htmlFor="street2" className="block text-sm font-medium text-gray-700 mb-2">
              Complément d'adresse
            </label>
            <Input
              id="street2"
              name="street2"
              type="text"
              value={formData.street2}
              onChange={handleChange}
              placeholder="Appartement, étage, bâtiment, etc."
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                Ville *
              </label>
              <Input
                id="city"
                name="city"
                type="text"
                value={formData.city}
                onChange={handleChange}
                placeholder="Tunis"
                required
              />
              {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
            </div>

            <div>
              <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-2">
                Code postal *
              </label>
              <Input
                id="zip"
                name="zip"
                type="text"
                value={formData.zip}
                onChange={handleChange}
                placeholder="1000"
                required
              />
              {errors.zip && <p className="mt-1 text-sm text-red-600">{errors.zip}</p>}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                Gouvernorat
              </label>
              <Input
                id="state"
                name="state"
                type="text"
                value={formData.state}
                onChange={handleChange}
                placeholder="Tunis"
              />
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                Pays *
              </label>
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="Tunisie">Tunisie</option>
                <option value="Algérie">Algérie</option>
                <option value="Maroc">Maroc</option>
                <option value="France">France</option>
              </select>
              {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Boutons */}
      <div className="flex gap-4 pt-4">
        {onBack && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onBack}
            className="flex-1 rounded-full"
          >
            ← Retour
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="flex-1 rounded-full"
        >
          Continuer vers le paiement →
        </Button>
      </div>
    </form>
  );
}
