/**
 * Hook TanStack Query - Factures avec Cursor Pagination
 *
 * Pagination haute performance pour 100K+ factures :
 * - Performance constante O(1) (vs O(n) offset-based)
 * - Infinite scroll natif (useInfiniteQuery)
 * - Pas de duplicatas si nouvelles factures créées
 * - PostgreSQL optimisé (index sur ID)
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ============================================================================
// Types
// ============================================================================

export interface Invoice {
  id: number;
  name: string;
  partner_id: number;
  partner_name: string;
  invoice_date: string | null;
  invoice_date_due: string | null;
  amount_untaxed: number;
  amount_tax: number;
  amount_total: number;
  amount_residual: number;
  state: 'draft' | 'posted' | 'cancel';
  payment_state: 'not_paid' | 'in_payment' | 'paid' | 'partial';
  currency_symbol: string;
  payment_reference?: string;
}

export interface InvoicesCursorParams {
  status?: 'draft' | 'posted' | 'cancel' | 'all';
  payment_state?: 'not_paid' | 'in_payment' | 'paid' | 'partial' | 'all';
  customer_id?: number;
  date_from?: string;
  date_to?: string;
  limit?: number;
  sort_field?: 'id' | 'invoice_date' | 'amount_total' | 'create_date';
  sort_direction?: 'asc' | 'desc';
}

export interface InvoicesCursorResponse {
  invoices: Invoice[];
  has_more: boolean;
  next_cursor: number | string | null;
  count: number;
}

// ============================================================================
// Query
// ============================================================================

/**
 * Hook useInfiniteQuery pour pagination cursor-based
 *
 * Exemple utilisation :
 * ```tsx
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInvoicesCursor({
 *   status: 'posted',
 *   payment_state: 'not_paid',
 *   limit: 50
 * });
 *
 * // Infinite scroll
 * <div onScroll={(e) => {
 *   const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
 *   if (bottom && hasNextPage && !isFetchingNextPage) {
 *     fetchNextPage();
 *   }
 * }}>
 *   {data?.pages.map((page) =>
 *     page.invoices.map((invoice) => <InvoiceRow key={invoice.id} invoice={invoice} />)
 *   )}
 * </div>
 * ```
 */
export function useInvoicesCursor(params: InvoicesCursorParams = {}) {
  return useInfiniteQuery({
    queryKey: ['invoices-cursor', params],
    queryFn: async ({ pageParam }) => {
      const response = await apiClient.post('/finance/invoices/cursor', {
        ...params,
        cursor: pageParam, // undefined pour 1ère page, sinon next_cursor
      });

      return response.data as InvoicesCursorResponse;
    },
    initialPageParam: undefined as number | string | undefined,
    getNextPageParam: (lastPage) => {
      // Retourner next_cursor si has_more=true, sinon undefined (arrêt pagination)
      return lastPage.has_more ? lastPage.next_cursor : undefined;
    },
    staleTime: 2 * 60 * 1000, // Cache 2 min
  });
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Aplatit toutes les pages en une seule liste de factures
 */
export function flattenInvoices(
  data: { pages: InvoicesCursorResponse[] } | undefined
): Invoice[] {
  if (!data) return [];

  return data.pages.flatMap((page) => page.invoices);
}

/**
 * Calcule le nombre total de factures chargées
 */
export function getTotalLoadedCount(
  data: { pages: InvoicesCursorResponse[] } | undefined
): number {
  if (!data) return 0;

  return data.pages.reduce((sum, page) => sum + page.count, 0);
}

/**
 * Vérifie si toutes les factures sont chargées (pour afficher message fin liste)
 */
export function isAllLoaded(
  hasNextPage: boolean | undefined,
  isFetchingNextPage: boolean
): boolean {
  return !hasNextPage && !isFetchingNextPage;
}

/**
 * Hook personnalisé avec infinite scroll automatique
 *
 * Utilise IntersectionObserver pour charger automatiquement next page
 * quand sentinel element devient visible
 *
 * Exemple :
 * ```tsx
 * const { data, sentinelRef, isLoadingMore } = useInvoicesInfiniteScroll({ limit: 50 });
 *
 * return (
 *   <div>
 *     {flattenInvoices(data).map(inv => <InvoiceRow key={inv.id} invoice={inv} />)}
 *     <div ref={sentinelRef}>
 *       {isLoadingMore && <Spinner />}
 *     </div>
 *   </div>
 * );
 * ```
 */
export function useInvoicesInfiniteScroll(params: InvoicesCursorParams = {}) {
  const query = useInvoicesCursor(params);

  // Ref pour sentinel element (IntersectionObserver)
  const sentinelRef = (node: HTMLElement | null) => {
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (
          firstEntry.isIntersecting &&
          query.hasNextPage &&
          !query.isFetchingNextPage
        ) {
          query.fetchNextPage();
        }
      },
      {
        threshold: 0.1, // Trigger quand 10% visible
        rootMargin: '100px', // Charger 100px avant d'atteindre sentinel
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  };

  return {
    ...query,
    sentinelRef,
    isLoadingMore: query.isFetchingNextPage,
    allLoaded: isAllLoaded(query.hasNextPage, query.isFetchingNextPage),
  };
}

/**
 * Calcule statistiques agrégées sur factures chargées
 */
export function calculateInvoiceStats(invoices: Invoice[]) {
  const stats = {
    total_count: invoices.length,
    total_amount: 0,
    total_paid: 0,
    total_unpaid: 0,
    total_overdue: 0,
    count_draft: 0,
    count_posted: 0,
    count_paid: 0,
    count_unpaid: 0,
  };

  const today = new Date();

  for (const invoice of invoices) {
    stats.total_amount += invoice.amount_total;

    if (invoice.payment_state === 'paid') {
      stats.total_paid += invoice.amount_total;
      stats.count_paid++;
    } else {
      stats.total_unpaid += invoice.amount_residual;
      stats.count_unpaid++;

      // Vérifier si overdue
      if (invoice.invoice_date_due) {
        const dueDate = new Date(invoice.invoice_date_due);
        if (dueDate < today) {
          stats.total_overdue += invoice.amount_residual;
        }
      }
    }

    if (invoice.state === 'draft') {
      stats.count_draft++;
    } else if (invoice.state === 'posted') {
      stats.count_posted++;
    }
  }

  return stats;
}

/**
 * Filtre factures en client-side (utile pour recherche instantanée)
 */
export function filterInvoices(
  invoices: Invoice[],
  searchTerm: string
): Invoice[] {
  if (!searchTerm.trim()) return invoices;

  const lowerSearch = searchTerm.toLowerCase();

  return invoices.filter(
    (inv) =>
      inv.name.toLowerCase().includes(lowerSearch) ||
      inv.partner_name.toLowerCase().includes(lowerSearch) ||
      inv.payment_reference?.toLowerCase().includes(lowerSearch)
  );
}

/**
 * Trie factures en client-side (fallback si pas de sort backend)
 */
export function sortInvoices(
  invoices: Invoice[],
  sortField: 'invoice_date' | 'amount_total' | 'partner_name',
  sortDirection: 'asc' | 'desc'
): Invoice[] {
  const sorted = [...invoices].sort((a, b) => {
    let compareResult = 0;

    switch (sortField) {
      case 'invoice_date':
        compareResult =
          new Date(a.invoice_date || 0).getTime() -
          new Date(b.invoice_date || 0).getTime();
        break;
      case 'amount_total':
        compareResult = a.amount_total - b.amount_total;
        break;
      case 'partner_name':
        compareResult = a.partner_name.localeCompare(b.partner_name);
        break;
    }

    return sortDirection === 'asc' ? compareResult : -compareResult;
  });

  return sorted;
}
