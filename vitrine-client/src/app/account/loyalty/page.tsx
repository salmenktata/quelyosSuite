'use client';

import React, { useEffect, useState } from 'react';
import { useLoyaltyStore } from '@/store/loyaltyStore';
import { Button } from '@/components/common';

/**
 * Loyalty Dashboard Page
 * Shows customer's loyalty points, tier, history, and redemption options
 */
export default function LoyaltyPage() {
  const { balance, tiers, loading, error, fetchBalance, fetchTiers, redeemPoints, clearError } = useLoyaltyStore();
  const [redeemAmount, setRedeemAmount] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchBalance();
    fetchTiers();
  }, [fetchBalance, fetchTiers]);

  const handleRedeemPoints = async () => {
    if (!redeemAmount || isNaN(Number(redeemAmount)) || Number(redeemAmount) <= 0) {
      setRedeemMessage({ type: 'error', text: 'Veuillez entrer un montant valide' });
      return;
    }

    const points = Number(redeemAmount);

    if (balance && points > balance.balance) {
      setRedeemMessage({ type: 'error', text: 'Solde de points insuffisant' });
      return;
    }

    setRedeemLoading(true);
    setRedeemMessage(null);

    const result = await redeemPoints(points);

    setRedeemLoading(false);

    if (result.success) {
      setRedeemMessage({
        type: 'success',
        text: result.message || `${points} points échangés avec succès!`,
      });
      setRedeemAmount('');
    } else {
      setRedeemMessage({
        type: 'error',
        text: result.error || 'Échec de l\'échange de points',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const getTierColor = (color?: string) => {
    const colorMap: Record<string, string> = {
      bronze: 'bg-orange-600 border-orange-700',
      silver: 'bg-gray-400 border-gray-500',
      gold: 'bg-yellow-500 border-yellow-600',
      platinum: 'bg-purple-600 border-purple-700',
    };

    return colorMap[color?.toLowerCase() || ''] || 'bg-gray-500 border-gray-600';
  };

  const getTierIcon = (tierName?: string) => {
    switch (tierName?.toLowerCase()) {
      case 'bronze':
        return '🥉';
      case 'silver':
        return '🥈';
      case 'gold':
        return '🥇';
      case 'platinum':
        return '💎';
      default:
        return '⭐';
    }
  };

  if (loading && !balance) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 rounded bg-gray-200"></div>
          <div className="h-48 w-full rounded-lg bg-gray-200"></div>
          <div className="h-96 w-full rounded-lg bg-gray-200"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">{error}</p>
          <Button onClick={() => { clearError(); fetchBalance(); }} className="mt-2">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  if (!balance) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-600">Aucune information de fidélité disponible</p>
      </div>
    );
  }

  const tier = balance.tier;
  const nextTier = balance.next_tier;
  const program = balance.program;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Programme de Fidélité</h1>
        <p className="mt-2 text-gray-600">
          Gagnez des points sur chaque achat et profitez d&apos;avantages exclusifs
        </p>
      </div>

      {/* Points Balance Card */}
      <div className="mb-6 rounded-lg bg-gradient-to-br from-primary to-purple-600 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* Points */}
          <div>
            <p className="text-sm opacity-90">Solde de points</p>
            <p className="text-5xl font-bold">{balance.balance}</p>
            <p className="mt-1 text-sm opacity-75">
              {balance.lifetime_points} points gagnés au total
            </p>
          </div>

          {/* Current Tier */}
          {tier && (
            <div className="flex items-center gap-4">
              <div
                className={`flex h-20 w-20 items-center justify-center rounded-full border-4 text-4xl ${getTierColor(tier.color)}`}
              >
                {getTierIcon(tier.name)}
              </div>
              <div>
                <p className="text-sm opacity-90">Niveau actuel</p>
                <p className="text-2xl font-bold">{tier.name}</p>
                <p className="text-sm opacity-75">
                  {tier.discount_percentage}% de réduction
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Progress to Next Tier */}
        {nextTier && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm">
              <span>Prochain niveau: {nextTier.name}</span>
              <span>{nextTier.points_needed} points restants</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full bg-white transition-all duration-500"
                style={{
                  width: `${Math.min(
                    ((balance.lifetime_points / nextTier.points_threshold) * 100),
                    100
                  )}%`,
                }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Redeem & Info */}
        <div className="space-y-6 lg:col-span-1">
          {/* Redeem Points Card */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-gray-900">
              Échanger des points
            </h2>

            {program && (
              <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                <p className="font-semibold">
                  {program.points_to_euro_rate} points = 1€ de réduction
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nombre de points
                </label>
                <input
                  type="number"
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(e.target.value)}
                  placeholder="Ex: 100"
                  min="1"
                  max={balance.balance}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {redeemAmount && program && (
                  <p className="mt-1 text-sm text-gray-600">
                    = {formatPrice(Number(redeemAmount) / program.points_to_euro_rate)} de réduction
                  </p>
                )}
              </div>

              {redeemMessage && (
                <div
                  className={`rounded-lg p-3 text-sm ${
                    redeemMessage.type === 'success'
                      ? 'bg-green-50 text-green-800'
                      : 'bg-red-50 text-red-800'
                  }`}
                >
                  {redeemMessage.text}
                </div>
              )}

              <Button
                onClick={handleRedeemPoints}
                disabled={redeemLoading || !redeemAmount || Number(redeemAmount) <= 0}
                className="w-full"
              >
                {redeemLoading ? 'Échange en cours...' : 'Échanger les points'}
              </Button>

              <p className="text-xs text-gray-500">
                Les points échangés seront crédités sur votre prochaine commande
              </p>
            </div>
          </div>

          {/* Tiers Card */}
          {tiers.length > 0 && (
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                Niveaux de fidélité
              </h2>

              <div className="space-y-3">
                {tiers.map((t) => (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between rounded-lg border-2 p-3 ${
                      tier?.id === t.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-xl ${getTierColor(t.color)}`}
                      >
                        {getTierIcon(t.name)}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-900">{t.name}</p>
                        <p className="text-xs text-gray-600">
                          {t.points_threshold} points
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        -{t.discount_percentage}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Program Info */}
          {program && (
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                Comment ça marche ?
              </h2>

              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💰</span>
                  <div>
                    <p className="font-semibold">Gagnez des points</p>
                    <p className="text-gray-600">
                      {program.points_per_euro} points par euro dépensé
                      {program.min_order_amount > 0 && (
                        <> (minimum {formatPrice(program.min_order_amount)})</>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-2xl">🎁</span>
                  <div>
                    <p className="font-semibold">Échangez vos points</p>
                    <p className="text-gray-600">
                      {program.points_to_euro_rate} points = 1€ de réduction
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-2xl">⬆️</span>
                  <div>
                    <p className="font-semibold">Montez de niveau</p>
                    <p className="text-gray-600">
                      Plus vous cumulez de points, plus vous débloquez d&apos;avantages
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Transaction History */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-gray-900">
              Historique des transactions
            </h2>

            {balance.transactions.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
                <svg
                  className="mx-auto mb-3 h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p className="text-gray-600">Aucune transaction pour le moment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {balance.transactions.map((txn) => (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xl ${
                            txn.type === 'earn' ? 'text-green-600' : 'text-orange-600'
                          }`}
                        >
                          {txn.type === 'earn' ? '📈' : '🎁'}
                        </span>
                        <p className="font-medium text-gray-900">
                          {txn.description}
                        </p>
                      </div>

                      <div className="mt-1 flex items-center gap-3 text-sm text-gray-600">
                        <span>{formatDate(txn.date)}</span>
                        {txn.order_name && (
                          <>
                            <span>•</span>
                            <span>Commande {txn.order_name}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${
                          txn.points > 0 ? 'text-green-600' : 'text-orange-600'
                        }`}
                      >
                        {txn.points > 0 ? '+' : ''}
                        {txn.points}
                      </p>
                      <p className="text-xs text-gray-500">points</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
