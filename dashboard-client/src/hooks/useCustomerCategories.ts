import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { odooRpc } from '../lib/odoo-rpc';
import { logger } from '@quelyos/logger';

export interface CustomerCategory {
  id: number;
  name: string;
  parent_id?: number;
  parent_name?: string;
  color: number;
  partner_count: number;
}

export function useCustomerCategories() {
  return useQuery({
    queryKey: ['customer-categories'],
    queryFn: async () => {
      try {
        const response = await odooRpc('/api/ecommerce/customer-categories', {});

        if (!response.success) {
          logger.error('[useCustomerCategories] API error:', response.error);
          throw new Error(response.error || 'Échec du chargement des catégories');
        }

        const result = response.data as { success: boolean; data: CustomerCategory[]; total: number };
        return result.data || [];
      } catch (error) {
        logger.error('[useCustomerCategories] Fetch error:', error);
        throw error;
      }
    },
  });
}

export function useCreateCustomerCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; parent_id?: number; color?: number }) => {
      const response = await odooRpc('/api/ecommerce/customer-categories/create', data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create category');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-categories'] });
    },
  });
}

export function useUpdateCustomerCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name?: string; color?: number } }) => {
      const response = await odooRpc(`/api/ecommerce/customer-categories/${id}/update`, data);
      if (!response.success) {
        logger.error('[useUpdateCustomerCategory] Update error:', response.error);
        throw new Error(response.error || 'Échec de la modification');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-categories'] });
    },
  });
}

export function useDeleteCustomerCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await odooRpc(`/api/ecommerce/customer-categories/${id}/delete`, {});
      if (!response.success) {
        logger.error('[useDeleteCustomerCategory] Delete error:', response.error);
        throw new Error(response.error || 'Échec de la suppression');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-categories'] });
    },
  });
}

export function useAssignCategoriesToCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, categoryIds }: { customerId: number; categoryIds: number[] }) => {
      const response = await odooRpc(`/api/ecommerce/customers/${customerId}/assign-categories`, {
        category_ids: categoryIds,
      });
      if (!response.success) {
        logger.error('[useAssignCategoriesToCustomer] Assign error:', response.error);
        throw new Error(response.error || 'Échec de l\'attribution');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}
