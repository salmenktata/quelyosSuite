/**
 * Hooks React pour Groupes d'Inventaire OCA (stock_inventory module).
 * 
 * Fonctionnalités:
 * - Liste groupes d'inventaire avec filtres
 * - Création groupe avec sélection produits
 * - Workflow complet: draft → in_progress → done
 * - Annulation et suppression
 * - Détail avec ajustements et mouvements
 */

import { useState, useEffect, useCallback } from 'react';
import { api as apiClient } from '@/lib/api';

// ============================================================================
// TYPES
// ============================================================================

export interface InventoryGroup {
  id: number;
  name: string;
  date: string | null;
  state: 'draft' | 'in_progress' | 'done' | 'cancel';
  product_selection: 'all' | 'manual' | 'category' | 'one' | 'lot';
  location_ids: number[];
  location_names: string[];
  product_ids: number[];
  product_count: number;
  quant_count: number;
  move_count: number;
  company_id: number;
  company_name: string;
}

export interface InventoryQuant {
  id: number;
  product_id: number;
  product_name: string;
  product_code: string | null;
  location_id: number;
  location_name: string;
  quantity: number;
  inventory_quantity: number;
  inventory_diff_quantity: number;
  lot_id: number | null;
  lot_name: string | null;
}

export interface InventoryGroupDetail extends InventoryGroup {
  quants: InventoryQuant[];
  moves: Array<{
    id: number;
    product_id: number;
    product_name: string;
    product_qty: number;
    location_id: number;
    location_dest_id: number;
    state: string;
  }>;
}

export interface CreateInventoryGroupParams {
  name: string;
  location_ids: number[];
  product_selection?: 'all' | 'manual' | 'category' | 'one' | 'lot';
  product_ids?: number[];
  category_id?: number;
  lot_ids?: number[];
  tenant_id?: number;
}

export interface InventoryGroupsParams {
  tenant_id?: number;
  state?: 'draft' | 'in_progress' | 'done' | 'cancel';
  location_ids?: number[];
  limit?: number;
  offset?: number;
}

// ============================================================================
// HOOK: useInventoryGroups - Liste avec filtres
// ============================================================================

export function useInventoryGroups(params: InventoryGroupsParams = {}) {
  const [inventoryGroups, setInventoryGroups] = useState<InventoryGroup[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventoryGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.post<{
        success: boolean;
        data: {
          inventory_groups: InventoryGroup[];
          total_count: number;
        };
        error?: string;
      }>('/api/ecommerce/stock/inventory-groups', {
        params: {
          tenant_id: params.tenant_id,
          state: params.state,
          location_ids: params.location_ids,
          limit: params.limit || 100,
          offset: params.offset || 0,
        },
      });

      if (result.data?.success && result.data.data) {
        setInventoryGroups(result.data.data.inventory_groups || []);
        setTotalCount(result.data.data.total_count || 0);
      } else {
        setError(result.data?.error || 'Erreur lors du chargement des groupes d\'inventaire');
      }
    } catch (_err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [params.tenant_id, params.state, params.location_ids, params.limit, params.offset]);

  useEffect(() => {
    fetchInventoryGroups();
  }, [fetchInventoryGroups]);

  return {
    inventoryGroups,
    totalCount,
    loading,
    error,
    refetch: fetchInventoryGroups,
  };
}

// ============================================================================
// HOOK: useInventoryGroupDetail - Détail avec ajustements
// ============================================================================

export function useInventoryGroupDetail(groupId: number | null) {
  const [inventoryGroup, setInventoryGroup] = useState<InventoryGroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroupDetail = useCallback(async () => {
    if (!groupId) {
      setInventoryGroup(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.post<{
        success: boolean;
        data: {
          inventory_group: InventoryGroupDetail;
        };
        error?: string;
      }>(`/api/ecommerce/stock/inventory-groups/${groupId}`, {
        params: {},
      });

      if (result.data?.success && result.data.data) {
        setInventoryGroup(result.data.data.inventory_group);
      } else {
        setError(result.data?.error || 'Erreur lors du chargement du groupe');
      }
    } catch (_err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroupDetail();
  }, [fetchGroupDetail]);

  return {
    inventoryGroup,
    loading,
    error,
    refetch: fetchGroupDetail,
  };
}

// ============================================================================
// HOOK: useCreateInventoryGroup - Création
// ============================================================================

export function useCreateInventoryGroup() {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGroup = async (data: CreateInventoryGroupParams) => {
    try {
      setCreating(true);
      setError(null);

      const result = await apiClient.post<{
        success: boolean;
        data: {
          inventory_group: InventoryGroup;
        };
        error?: string;
      }>('/api/ecommerce/stock/inventory-groups/create', {
        params: data,
      });

      if (result.data?.success && result.data.data) {
        return result.data.data.inventory_group;
      } else {
        setError(result.data?.error || 'Erreur lors de la création');
        return null;
      }
    } catch (_err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau');
      return null;
    } finally {
      setCreating(false);
    }
  };

  return {
    createGroup,
    creating,
    error,
  };
}

// ============================================================================
// HOOK: useStartInventoryGroup - Démarrer (draft → in_progress)
// ============================================================================

export function useStartInventoryGroup() {
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startGroup = async (groupId: number) => {
    try {
      setStarting(true);
      setError(null);

      const result = await apiClient.post(`/api/ecommerce/stock/inventory-groups/${groupId}/start`, {
        params: {},
      });

      if (result.data?.success && result.data.data) {
        return true;
      } else {
        setError(result.data?.error || 'Erreur lors du démarrage');
        return false;
      }
    } catch (_err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau');
      return false;
    } finally {
      setStarting(false);
    }
  };

  return {
    startGroup,
    starting,
    error,
  };
}

// ============================================================================
// HOOK: useValidateInventoryGroup - Valider (in_progress → done)
// ============================================================================

export function useValidateInventoryGroup() {
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateGroup = async (groupId: number) => {
    try {
      setValidating(true);
      setError(null);

      const result = await apiClient.post(`/api/ecommerce/stock/inventory-groups/${groupId}/validate`, {
        params: {},
      });

      if (result.data?.success && result.data.data) {
        return true;
      } else {
        setError(result.data?.error || 'Erreur lors de la validation');
        return false;
      }
    } catch (_err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau');
      return false;
    } finally {
      setValidating(false);
    }
  };

  return {
    validateGroup,
    validating,
    error,
  };
}

// ============================================================================
// HOOK: useCancelInventoryGroup - Annuler
// ============================================================================

export function useCancelInventoryGroup() {
  const [canceling, setCanceling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelGroup = async (groupId: number) => {
    try {
      setCanceling(true);
      setError(null);

      const result = await apiClient.post(`/api/ecommerce/stock/inventory-groups/${groupId}/cancel`, {
        params: {},
      });

      if (result.data?.success && result.data.data) {
        return true;
      } else {
        setError(result.data?.error || 'Erreur lors de l\'annulation');
        return false;
      }
    } catch (_err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau');
      return false;
    } finally {
      setCanceling(false);
    }
  };

  return {
    cancelGroup,
    canceling,
    error,
  };
}

// ============================================================================
// HOOK: useDeleteInventoryGroup - Supprimer (draft/cancel uniquement)
// ============================================================================

export function useDeleteInventoryGroup() {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteGroup = async (groupId: number) => {
    try {
      setDeleting(true);
      setError(null);

      const result = await apiClient.post(`/api/ecommerce/stock/inventory-groups/${groupId}/delete`, {
        params: {},
      });

      if (result.data?.success && result.data.data) {
        return true;
      } else {
        setError(result.data?.error || 'Erreur lors de la suppression');
        return false;
      }
    } catch (_err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau');
      return false;
    } finally {
      setDeleting(false);
    }
  };

  return {
    deleteGroup,
    deleting,
    error,
  };
}
