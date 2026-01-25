/**
 * @quelyos/odoo - Unified Odoo client for Quelyos Suite
 *
 * Features:
 * - Automatic environment detection (Next.js SSR, Client, Vite)
 * - 60+ business methods (Auth, Products, Cart, Checkout, Orders, etc.)
 * - Low-level ORM methods (search, read, create, write, unlink)
 * - TypeScript types for all Odoo models
 * - Session management
 * - Error handling
 *
 * Usage:
 * ```typescript
 * import { odooClient } from '@quelyos/odoo';
 *
 * // High-level API
 * const products = await odooClient.getProducts({ limit: 10 });
 *
 * // Low-level ORM
 * import { odooRpc } from '@quelyos/odoo';
 * const records = await odooRpc.search('product.product', [['sale_ok', '=', true]]);
 * ```
 */

// Export client instances
export { odooClient, OdooClient } from './client';
export { odooRpc, OdooRpcClient } from './rpc';

// Export configuration utilities
export {
  detectEnvironment,
  getOdooConfig,
  getSessionId,
  setSessionId,
  clearSession,
  type Environment,
  type OdooConfig,
} from './config';

// Export all types
export type {
  OdooRecord,
  OdooResponse,
  OdooPaginatedResponse,
  OdooProduct,
  OdooProductImage,
  OdooProductVariant,
  OdooCategory,
  OdooPartner,
  OdooAddress,
  OdooSaleOrder,
  OdooSaleOrderLine,
  OdooStockQuant,
  OdooWarehouse,
  OdooPricelist,
  OdooPricelistItem,
  OdooCurrency,
  OdooSubscription,
  OdooSubscriptionPlan,
  OdooAccount,
  OdooAccountMove,
  OdooAccountMoveLine,
} from './types';

// Export RPC options
export type { RpcOptions } from './rpc';
