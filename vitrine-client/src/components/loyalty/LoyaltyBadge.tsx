'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useLoyaltyStore } from '@/store/loyaltyStore';

/**
 * Loyalty Badge Component
 * Displays user's loyalty tier and points balance in the header
 */
export function LoyaltyBadge() {
  const { balance, fetchBalance } = useLoyaltyStore();

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  if (!balance) {
    return null;
  }

  const tier = balance.tier;
  const points = balance.balance;

  // Tier color mapping
  const getTierColor = (color?: string) => {
    const colorMap: Record<string, string> = {
      bronze: 'bg-orange-600 text-white',
      silver: 'bg-gray-400 text-white',
      gold: 'bg-yellow-500 text-white',
      platinum: 'bg-purple-600 text-white',
    };

    return colorMap[color?.toLowerCase() || ''] || 'bg-gray-500 text-white';
  };

  // Tier icon
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

  return (
    <Link
      href="/account/loyalty"
      className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm transition-all hover:border-primary hover:shadow-md"
      title={`${points} points - ${tier?.name || 'Membre'}`}
    >
      {/* Tier Badge */}
      {tier && (
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${getTierColor(tier.color)}`}
        >
          {getTierIcon(tier.name)}
        </span>
      )}

      {/* Points */}
      <div className="flex flex-col">
        <span className="font-semibold text-gray-900">{points} pts</span>
        {tier && (
          <span className="text-xs text-gray-500">{tier.name}</span>
        )}
      </div>

      {/* Progress to next tier (optional) */}
      {balance.next_tier && (
        <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
          <span>→</span>
          <span>{balance.next_tier.points_needed} pts</span>
        </div>
      )}
    </Link>
  );
}
