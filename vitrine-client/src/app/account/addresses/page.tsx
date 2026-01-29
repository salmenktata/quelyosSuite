/**
 * Page gestion des adresses
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { LoadingPage } from '@/components/common/Loading';
import { Button } from '@/components/common/Button';
import { backendClient } from '@/lib/backend/client';
import type { Address } from '@quelyos/types';
import { logger } from '@/lib/logger';

export default function AccountAddressesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/account/addresses');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const result = await backendClient.getAddresses();
        if (result.success && result.addresses) {
          setAddresses(result.addresses);
        }
      } catch (error) {
        logger.error('Erreur chargement adresses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchAddresses();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <LoadingPage />;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm mb-6">
          <Link href="/" className="text-gray-600 hover:text-primary">
            Accueil
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link href="/account" className="text-gray-600 hover:text-primary">
            Mon compte
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-900">Mes adresses</span>
        </nav>

        {/* Titre */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Mes adresses</h1>
          <div className="flex gap-3">
            <Button variant="primary" className="rounded-full">
              + Ajouter une adresse
            </Button>
            <Link href="/account">
              <Button variant="outline" className="rounded-full">
                ← Retour
              </Button>
            </Link>
          </div>
        </div>

        {/* Contenu */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        ) : addresses.length === 0 ? (
          /* Aucune adresse */
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg
              className="w-24 h-24 mx-auto text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              Aucune adresse enregistrée
            </h2>
            <p className="text-gray-500 mb-6">
              Ajoutez une adresse pour faciliter vos prochaines commandes
            </p>
            <Button variant="primary" size="lg" className="rounded-full">
              + Ajouter une adresse
            </Button>
          </div>
        ) : (
          /* Liste des adresses */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {addresses.map((address) => (
              <div key={address.id} className="bg-white rounded-lg shadow-sm p-6">
                {/* Badge par défaut */}
                {address.is_default && (
                  <div className="inline-block bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
                    Adresse par défaut
                  </div>
                )}

                {/* Adresse */}
                <div className="text-gray-700 mb-4">
                  <p className="font-semibold text-gray-900">{address.name}</p>
                  <p>{address.street}</p>
                  {address.street2 && <p>{address.street2}</p>}
                  <p>
                    {address.zip} {address.city}
                  </p>
                  <p>{address.country_name || address.country_id}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 rounded-full">
                    Modifier
                  </Button>
                  <button className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-full text-sm font-medium transition-colors">
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
