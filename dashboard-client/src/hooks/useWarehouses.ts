import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { odooRpc } from '../lib/odoo-rpc';
import { logger } from '@quelyos/logger';

export interface Warehouse {
  id: number;
  name: string;
  code: string;
  company_id?: number;
  company_name?: string;
  active: boolean;
  partner_id?: number;
  lot_stock_id?: number;
  view_location_id?: number;
}

export interface WarehouseLocation {
  id: number;
  name: string;
  complete_name: string;
  usage: string;
  parent_id?: number;
}

export interface WarehouseDetail extends Warehouse {
  locations: WarehouseLocation[];
  location_count: number;
}

export interface StockByLocation {
  location_id: number;
  location_name: string;
  warehouse_id?: number;
  warehouse_name?: string;
  qty_available: number;
}

export interface ProductStockByLocation {
  product_id: number;
  product_name: string;
  stock_by_location: StockByLocation[];
  total_qty: number;
  location_count: number;
}

interface WarehousesParams {
  active_only?: boolean;
}

export function useWarehouses(params: WarehousesParams = {}) {
  return useQuery({
    queryKey: ['warehouses', params],
    queryFn: async () => {
      try {
        const response = await odooRpc('/api/ecommerce/warehouses', params);

        if (!response.success) {
          logger.error('[useWarehouses] API error:', response.error);
          throw new Error(response.error || 'Échec du chargement des entrepôts');
        }

        // Le backend retourne { success, data: [...], total }
        // On extrait juste le tableau data
        const result = response.data as { success: boolean; data: Warehouse[]; total: number };
        return result.data || [];
      } catch (error) {
        logger.error('[useWarehouses] Fetch error:', error);
        throw error;
      }
    },
  });
}

export function useWarehouseDetail(warehouseId: number) {
  return useQuery({
    queryKey: ['warehouse', warehouseId],
    queryFn: async () => {
      const response = await odooRpc(`/api/ecommerce/warehouses/${warehouseId}`, {});
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch warehouse detail');
      }
      return response.data as WarehouseDetail;
    },
    enabled: !!warehouseId,
  });
}

export function useProductStockByLocation(productId: number, warehouseId?: number) {
  return useQuery({
    queryKey: ['product-stock-by-location', productId, warehouseId],
    queryFn: async () => {
      const params = warehouseId ? { warehouse_id: warehouseId } : {};
      const response = await odooRpc(`/api/ecommerce/products/${productId}/stock-by-location`, params);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch product stock by location');
      }
      return response.data as ProductStockByLocation;
    },
    enabled: !!productId,
  });
}

export function useCreateStockTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      product_id: number;
      quantity: number;
      from_location_id: number;
      to_location_id: number;
      note?: string;
    }) => {
      const response = await odooRpc('/api/ecommerce/stock/transfer', data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create stock transfer');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-stock-by-location'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
