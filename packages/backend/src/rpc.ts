/**
 * Client JSON-RPC Backend bas niveau
 * Gère les appels JSON-RPC directs vers le backend
 *
 * ANONYMISATION : Utilise getBackendConfig au lieu de getOdooConfig
 */

import axios, { AxiosInstance } from 'axios';
import { getBackendConfig, getSessionId, detectEnvironment } from './config';
import type { OdooResponse } from './types';

/**
 * Options pour un appel JSON-RPC
 */
export interface RpcOptions {
  throwOn404?: boolean;
  timeout?: number;
  sessionId?: string | null;
}

/**
 * Client JSON-RPC Backend unifié
 * Supporte SSR Next.js, Client Next.js, et Vite
 */
export class OdooRpcClient {
  private api: AxiosInstance;
  private config = getBackendConfig();

  constructor() {
    this.api = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: false,
    });

    // Intercepteur pour ajouter session_id automatiquement
    this.api.interceptors.request.use((config) => {
      const sessionId = getSessionId();
      if (sessionId) {
        // Pour Vite, utiliser header X-Session-Id
        if (detectEnvironment() === 'vite') {
          config.headers['X-Session-Id'] = sessionId;
        }
        // Pour Next.js proxy, ajouter au body
        else if (config.data) {
          config.data.session_id = sessionId;
        }
      }
      return config;
    });
  }

  /**
   * Appel JSON-RPC générique
   * @param endpoint - Endpoint API (ex: '/api/ecommerce/products')
   * @param params - Paramètres de l'appel
   * @param options - Options supplémentaires
   */
  async call<T = any>(
    endpoint: string,
    params: Record<string, any> = {},
    options: RpcOptions = {}
  ): Promise<OdooResponse<T>> {
    const { throwOn404 = false, timeout, sessionId } = options;

    try {
      // Si proxy Next.js, envoyer juste les params (proxy wrappe en JSON-RPC)
      const payload = this.config.useProxy
        ? params
        : {
            jsonrpc: '2.0',
            method: 'call',
            params,
            id: Math.random(),
          };

      const response = await this.api.post(endpoint, payload, {
        timeout: timeout || this.config.timeout,
      });

      // Proxy Next.js retourne directement le result
      if (this.config.useProxy) {
        return {
          success: true,
          data: response.data,
        };
      }

      // JSON-RPC direct (Vite)
      const json = response.data;

      if (json.error) {
        const errorMessage =
          json.error.data?.message || json.error.message || 'API Error';

        // Redirection login si session expirée (Vite uniquement)
        if (
          detectEnvironment() === 'vite' &&
          !(import.meta as any).env?.DEV &&
          (errorMessage.toLowerCase().includes('session') ||
            errorMessage.toLowerCase().includes('authentication'))
        ) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('session_id');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
        }

        return {
          success: false,
          error: errorMessage,
        };
      }

      return {
        success: true,
        data: json.result,
      };
    } catch (error: any) {
      // Gestion 404 gracieuse pour endpoints non implémentés
      if (error.response?.status === 404 && !throwOn404) {
        return {
          success: false,
          error: 'Endpoint not implemented',
        };
      }

      // Gestion 401 session expirée
      if (error.response?.status === 401) {
        if (detectEnvironment() === 'vite' && typeof window !== 'undefined') {
          localStorage.removeItem('session_id');
          localStorage.removeItem('user');
          if (!(import.meta as any).env?.DEV) {
            window.location.href = '/login';
          }
        }

        return {
          success: false,
          error: 'Session expired',
        };
      }

      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Unknown error';

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Appel JSON-RPC ORM direct (pour appels ORM Odoo)
   * @param model - Nom du modèle Odoo (ex: 'product.product')
   * @param method - Méthode à appeler (ex: 'search_read')
   * @param args - Arguments de la méthode
   * @param kwargs - Keyword arguments
   */
  async callORM<T = any>(
    model: string,
    method: string,
    args: any[] = [],
    kwargs: Record<string, any> = {}
  ): Promise<T> {
    const response = await this.call<T>('/web/dataset/call_kw', {
      model,
      method,
      args,
      kwargs,
    });

    if (!response.success) {
      throw new Error(response.error || 'ORM call failed');
    }

    return response.data as T;
  }

  /**
   * Search records in Odoo model
   * @param model - Model name (ex: 'product.product')
   * @param domain - Search domain
   * @param options - Search options (fields, limit, offset, order)
   */
  async search<T = any>(
    model: string,
    domain: any[] = [],
    options: {
      fields?: string[];
      limit?: number;
      offset?: number;
      order?: string;
    } = {}
  ): Promise<T[]> {
    return this.callORM<T[]>(model, 'search_read', [domain], {
      fields: options.fields,
      limit: options.limit || 100,
      offset: options.offset || 0,
      order: options.order,
    });
  }

  /**
   * Read records from Odoo model
   * @param model - Model name
   * @param ids - Record IDs
   * @param fields - Fields to read
   */
  async read<T = any>(
    model: string,
    ids: number[],
    fields: string[] = []
  ): Promise<T[]> {
    return this.callORM<T[]>(model, 'read', [ids], { fields });
  }

  /**
   * Create record in Odoo model
   * @param model - Model name
   * @param values - Record values
   */
  async create<T = any>(
    model: string,
    values: Record<string, any>
  ): Promise<number> {
    return this.callORM<number>(model, 'create', [values]);
  }

  /**
   * Update records in Odoo model
   * @param model - Model name
   * @param ids - Record IDs
   * @param values - Values to update
   */
  async write(
    model: string,
    ids: number[],
    values: Record<string, any>
  ): Promise<boolean> {
    return this.callORM<boolean>(model, 'write', [ids, values]);
  }

  /**
   * Delete records from Odoo model
   * @param model - Model name
   * @param ids - Record IDs to delete
   */
  async unlink(model: string, ids: number[]): Promise<boolean> {
    return this.callORM<boolean>(model, 'unlink', [ids]);
  }
}

// Export singleton instance
export const odooRpc = new OdooRpcClient();
