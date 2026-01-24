'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { odooClient } from '@/lib/odoo/client';
import { LoadingPage } from '@/components/common/Loading';

interface DashboardData {
  period: string;
  date_from: string | null;
  date_to: string;
  revenue: {
    total: number;
    growth_percentage: number | null;
    currency: string;
  };
  orders: {
    total_count: number;
    average_value: number;
    states: Record<string, number>;
  };
  top_products: Array<{
    id: number;
    name: string;
    slug: string;
    quantity_sold: number;
    revenue: number;
    image: string;
  }>;
  top_categories: Array<{
    id: number;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  conversion: {
    total_carts: number;
    total_orders: number;
    abandoned_carts: number;
    conversion_rate: number;
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [period, setPeriod] = useState<string>('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, [period]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await odooClient.getAnalyticsDashboard(period);

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Failed to load analytics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return <LoadingPage />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <h2 className="text-lg font-semibold text-red-800">Error</h2>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="mb-4 text-sm">
            <Link href="/" className="text-gray-600 hover:text-primary">
              Accueil
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <Link href="/account" className="text-gray-600 hover:text-primary">
              Mon Compte
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-900">Analytics</span>
          </nav>

          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard Analytics
            </h1>

            {/* Period Selector */}
            <div className="flex gap-2 rounded-lg bg-white p-1 shadow-sm">
              {['today', 'week', 'month', 'year'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    period === p
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {p === 'today' ? "Aujourd'hui" : ''}
                  {p === 'week' ? '7 jours' : ''}
                  {p === 'month' ? '30 jours' : ''}
                  {p === 'year' ? 'Année' : ''}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Revenue Card */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Chiffre d'Affaires
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {formatCurrency(data.revenue.total)}
                </p>
                {data.revenue.growth_percentage !== null && (
                  <p
                    className={`mt-2 text-sm ${
                      data.revenue.growth_percentage >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {data.revenue.growth_percentage >= 0 ? '+' : ''}
                    {data.revenue.growth_percentage.toFixed(1)}% vs période
                    précédente
                  </p>
                )}
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Orders Card */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Commandes</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {data.orders.total_count}
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Total des commandes
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Average Order Value Card */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Panier Moyen
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {formatCurrency(data.orders.average_value)}
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Valeur moyenne commande
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <svg
                  className="h-6 w-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Conversion Rate Card */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Taux de Conversion
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {data.conversion.conversion_rate}%
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  {data.conversion.abandoned_carts} paniers abandonnés
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <svg
                  className="h-6 w-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Tables Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Products */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Top 10 Produits
            </h2>
            <div className="space-y-3">
              {data.top_products.slice(0, 10).map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {index + 1}
                  </div>
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-12 w-12 flex-shrink-0 rounded object-cover"
                  />
                  <div className="flex-1 overflow-hidden">
                    <Link
                      href={`/products/${product.slug}`}
                      className="block truncate font-medium text-gray-900 hover:text-primary"
                    >
                      {product.name}
                    </Link>
                    <p className="text-sm text-gray-500">
                      {product.quantity_sold} vendus
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(product.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Categories */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Top Catégories
            </h2>
            <div className="space-y-3">
              {data.top_categories.map((category, index) => (
                <div
                  key={category.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-100 p-3"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{category.name}</p>
                    <p className="text-sm text-gray-500">
                      {Math.round(category.quantity)} unités vendues
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(category.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
