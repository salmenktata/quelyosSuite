"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/finance/compat/auth";
import { api } from "@/lib/api";

interface Account {
  id: number;
  name: string;
  balance: number;
  currency: string;
}

interface BalanceData {
  totalBalance: number;
  variation24h: number;
  variationPercent: number;
  currency: string;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// Cache pour éviter les appels répétitifs
let balanceCache: { data: Omit<BalanceData, 'isLoading' | 'error' | 'refetch'> | null; timestamp: number } = {
  data: null,
  timestamp: 0,
};
const CACHE_DURATION = 30000; // 30 secondes

/**
 * Hook pour récupérer le solde total et la variation 24h
 * Utilisé par le BalanceBadge dans le header
 */
export function useTotalBalance(): BalanceData {
  const { user } = useAuth();
  const [data, setData] = useState<Omit<BalanceData, 'isLoading' | 'error' | 'refetch'>>({
    totalBalance: 0,
    variation24h: 0,
    variationPercent: 0,
    currency: "EUR",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async (force = false) => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    // Vérifier le cache
    const now = Date.now();
    if (!force && balanceCache.data && now - balanceCache.timestamp < CACHE_DURATION) {
      setData(balanceCache.data);
      setIsLoading(false);
      return;
    }

    try {
      // Ne pas montrer le loading si on a des données en cache (évite le flash)
      if (!balanceCache.data) {
        setIsLoading(true);
      }
      setError(null);

      // Récupérer les comptes
      const accounts = await api<Account[]>("/company/accounts");
      
      // Calculer le solde total
      const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
      
      // Récupérer la variation 24h (endpoint dédié)
      let variation24h = 0;
      let variationPercent = 0;
      
      try {
        const variationData = await api<{ variation24h: number; variationPercent: number }>(
          "/company/accounts/variation24h"
        );
        variation24h = variationData.variation24h || 0;
        variationPercent = variationData.variationPercent || 0;
      } catch {
        // Si l'endpoint n'existe pas encore, calculer approximativement
        // depuis les transactions des dernières 24h
        try {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const transactions = await api<Array<{ type: string; amount: number; date: string }>>(
            `/company/transactions?from=${yesterday.toISOString().split('T')[0]}`
          );
          
          variation24h = transactions.reduce((sum, tx) => {
            const amount = tx.amount || 0;
            return sum + (tx.type === "CREDIT" ? amount : -amount);
          }, 0);
          
          if (totalBalance !== 0) {
            const previousBalance = totalBalance - variation24h;
            variationPercent = previousBalance !== 0 
              ? (variation24h / previousBalance) * 100 
              : 0;
          }
        } catch {
          // Ignorer si impossible de calculer
        }
      }

      // Devise principale (EUR par défaut ou la plus fréquente)
      const currencyCounts = accounts.reduce((acc, account) => {
        acc[account.currency] = (acc[account.currency] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const currency = Object.entries(currencyCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "EUR";

      const newData = {
        totalBalance,
        variation24h,
        variationPercent,
        currency,
      };

      // Mettre en cache
      balanceCache = { data: newData, timestamp: now };
      
      setData(newData);
    } catch (err) {
      console.error("[useTotalBalance] Error:", err);
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Vérifier le cache avant de fetch
    const now = Date.now();
    if (balanceCache.data && now - balanceCache.timestamp < CACHE_DURATION) {
      setData(balanceCache.data);
      setIsLoading(false);
    } else {
      fetchBalance();
    }

    // Rafraîchir automatiquement toutes les 5 minutes (réduit de 60s pour améliorer les performances)
    const interval = setInterval(() => fetchBalance(true), 300000);

    return () => clearInterval(interval);
  }, [fetchBalance]);

  return {
    ...data,
    isLoading,
    error,
    refetch: () => fetchBalance(true),
  };
}

/**
 * Invalider le cache (à appeler après une transaction)
 */
export function invalidateBalanceCache() {
  balanceCache = { data: null, timestamp: 0 };
}
