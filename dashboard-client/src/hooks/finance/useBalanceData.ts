import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Account {
  id: number;
  name: string;
  balance: number;
  currency: string;
}

interface VariationData {
  variation24h: number;
  variationPercent: number;
}

/**
 * Hook to fetch company accounts with React Query
 * Deduplicated automatically - single request even if used in multiple components
 */
export function useAccounts() {
  return useQuery({
    queryKey: ["company", "accounts"],
    queryFn: () => api<Account[]>("/company/accounts"),
    staleTime: 2 * 60 * 1000, // 2 minutes - balance changes frequently
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Hook to fetch 24h balance variation with React Query
 * Deduplicated automatically
 */
export function useBalanceVariation() {
  return useQuery({
    queryKey: ["company", "balance-variation"],
    queryFn: () => api<VariationData>("/company/accounts/variation24h"),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Composite hook that combines accounts and variation data
 * Uses React Query's automatic deduplication
 */
export function useTotalBalanceOptimized() {
  const { data: accounts, isLoading: accountsLoading, error: accountsError } = useAccounts();
  const { data: variation, isLoading: variationLoading, error: variationError } = useBalanceVariation();

  // Calculate total balance from accounts
  const totalBalance = accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0;

  // Get currency (most common)
  const currencyCounts = accounts?.reduce((acc, account) => {
    acc[account.currency] = (acc[account.currency] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const currency = Object.entries(currencyCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || "EUR";

  return {
    totalBalance,
    variation24h: variation?.variation24h || 0,
    variationPercent: variation?.variationPercent || 0,
    currency,
    isLoading: accountsLoading || variationLoading,
    error: accountsError || variationError,
    accounts: accounts || [],
  };
}
