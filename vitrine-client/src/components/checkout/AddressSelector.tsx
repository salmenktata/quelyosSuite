'use client';

import React, { useState, useEffect } from 'react';
import { backendClient } from '@/lib/backend/client';
import { logger } from '@/lib/logger';

interface Address {
  id: number;
  name: string;
  street: string;
  street2?: string;
  city: string;
  state_id?: number;
  state_name?: string;
  zip: string;
  country_id?: number;
  country_name?: string;
  phone?: string;
  is_default?: boolean;
}

interface AddressSelectorProps {
  type: 'shipping' | 'billing';
  selectedAddressId?: number;
  onAddressSelect: (address: Address) => void;
  onAddNew?: () => void;
}

export function AddressSelector({
  type,
  selectedAddressId,
  onAddressSelect,
  onAddNew,
}: AddressSelectorProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState<Partial<Address>>({});

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await backendClient.getAddresses();
      if (response.success && response.addresses) {
        const validAddresses = response.addresses.filter((a): a is Address => a.id !== undefined) as Address[];
        setAddresses(validAddresses);
        // Auto-selectionner l'adresse par defaut
        if (!selectedAddressId) {
          const defaultAddress = validAddresses.find(a => a.is_default);
          if (defaultAddress) {
            onAddressSelect(defaultAddress);
          }
        }
      }
    } catch (error) {
      logger.error('Error fetching addresses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.name || !newAddress.street || !newAddress.city || !newAddress.zip) {
      return;
    }

    try {
      const response = await backendClient.addAddress(newAddress as Address);
      if (response.success) {
        fetchAddresses();
        setShowAddForm(false);
        setNewAddress({});
      }
    } catch (error) {
      logger.error('Error adding address:', error);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm('Supprimer cette adresse ?')) return;

    try {
      await backendClient.deleteAddress(id);
      fetchAddresses();
    } catch (error) {
      logger.error('Error deleting address:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          {type === 'shipping' ? 'Adresse de livraison' : 'Adresse de facturation'}
        </h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="text-sm text-primary hover:text-primary-dark font-medium"
        >
          + Nouvelle adresse
        </button>
      </div>

      {/* Liste des adresses */}
      <div className="grid gap-3">
        {addresses.map((address) => (
          <div
            key={address.id}
            onClick={() => onAddressSelect(address)}
            className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all ${
              selectedAddressId === address.id
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Indicateur de selection */}
            <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              selectedAddressId === address.id
                ? 'border-primary bg-primary'
                : 'border-gray-300'
            }`}>
              {selectedAddressId === address.id && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>

            {/* Badge defaut */}
            {address.is_default && (
              <span className="absolute top-4 left-4 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                Par defaut
              </span>
            )}

            <div className={address.is_default ? 'mt-6' : ''}>
              <p className="font-semibold text-gray-900">{address.name}</p>
              <p className="text-sm text-gray-600">{address.street}</p>
              {address.street2 && (
                <p className="text-sm text-gray-600">{address.street2}</p>
              )}
              <p className="text-sm text-gray-600">
                {address.zip} {address.city}
                {address.country_name && `, ${address.country_name}`}
              </p>
              {address.phone && (
                <p className="text-sm text-gray-500 mt-1">{address.phone}</p>
              )}
            </div>

            {/* Actions */}
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteAddress(address.id);
                }}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                title="Supprimer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}

        {addresses.length === 0 && !showAddForm && (
          <div className="text-center py-8 text-gray-500">
            <p>Aucune adresse enregistree</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-2 text-primary hover:text-primary-dark font-medium"
            >
              Ajouter une adresse
            </button>
          </div>
        )}
      </div>

      {/* Formulaire nouvelle adresse */}
      {showAddForm && (
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 space-y-4">
          <h4 className="font-semibold">Nouvelle adresse</h4>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nom complet *"
              value={newAddress.name || ''}
              onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <input
              type="tel"
              placeholder="Telephone"
              value={newAddress.phone || ''}
              onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <input
            type="text"
            placeholder="Adresse *"
            value={newAddress.street || ''}
            onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />

          <input
            type="text"
            placeholder="Complement d&apos;adresse"
            value={newAddress.street2 || ''}
            onChange={(e) => setNewAddress({ ...newAddress, street2: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />

          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Code postal *"
              value={newAddress.zip || ''}
              onChange={(e) => setNewAddress({ ...newAddress, zip: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Ville *"
              value={newAddress.city || ''}
              onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewAddress({});
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Annuler
            </button>
            <button
              onClick={handleAddAddress}
              className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
            >
              Enregistrer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
