/**
 * GraphQL Client pour Quelyos Dashboard
 *
 * Client GraphQL léger avec:
 * - Cache automatique
 * - Gestion des erreurs
 * - Requêtes typées
 * - Subscriptions WebSocket
 */

import { config } from '@/lib/config'

// Types
export interface GraphQLResponse<T = unknown> {
  data?: T
  errors?: GraphQLError[]
}

export interface GraphQLError {
  message: string
  locations?: { line: number; column: number }[]
  path?: (string | number)[]
  extensions?: Record<string, unknown>
}

export interface GraphQLRequestOptions {
  variables?: Record<string, unknown>
  operationName?: string
  headers?: Record<string, string>
  signal?: AbortSignal
}

// Cache simple en mémoire
const queryCache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 60000 // 1 minute

function getCacheKey(query: string, variables?: Record<string, unknown>): string {
  return `${query}:${JSON.stringify(variables || {})}`
}

/**
 * Exécute une requête GraphQL
 */
export async function graphqlRequest<T = unknown>(
  query: string,
  options: GraphQLRequestOptions = {}
): Promise<T> {
  const { variables, operationName, headers = {}, signal } = options

  // Vérifier le cache pour les queries (pas les mutations)
  const isQuery = query.trim().startsWith('query')
  const cacheKey = getCacheKey(query, variables)

  if (isQuery) {
    const cached = queryCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data as T
    }
  }

  const endpoint = `${config.apiUrl}/graphql`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem(config.authTokenKey)}`,
      ...headers,
    },
    body: JSON.stringify({
      query,
      variables,
      operationName,
    }),
    signal,
  })

  if (!response.ok) {
    throw new GraphQLNetworkError(`HTTP ${response.status}: ${response.statusText}`)
  }

  const result: GraphQLResponse<T> = await response.json()

  if (result.errors?.length) {
    throw new GraphQLQueryError(result.errors)
  }

  // Mettre en cache
  if (isQuery && result.data) {
    queryCache.set(cacheKey, { data: result.data, timestamp: Date.now() })
  }

  return result.data as T
}

/**
 * Invalide le cache pour une query
 */
export function invalidateQuery(query: string, variables?: Record<string, unknown>): void {
  const cacheKey = getCacheKey(query, variables)
  queryCache.delete(cacheKey)
}

/**
 * Invalide tout le cache
 */
export function invalidateAllQueries(): void {
  queryCache.clear()
}

// Erreurs personnalisées
export class GraphQLNetworkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GraphQLNetworkError'
  }
}

export class GraphQLQueryError extends Error {
  errors: GraphQLError[]

  constructor(errors: GraphQLError[]) {
    super(errors.map((e) => e.message).join(', '))
    this.name = 'GraphQLQueryError'
    this.errors = errors
  }
}

// =============================================================================
// QUERY BUILDER
// =============================================================================

/**
 * Helper pour construire des queries GraphQL
 */
export function gql(strings: TemplateStringsArray, ...values: unknown[]): string {
  return strings.reduce((result, str, i) => result + str + (values[i] ?? ''), '')
}

// =============================================================================
// FRAGMENTS RÉUTILISABLES
// =============================================================================

export const PRODUCT_FRAGMENT = gql`
  fragment ProductFields on Product {
    id
    name
    sku
    price
    compareAtPrice
    description
    images
    category {
      id
      name
    }
    stockQuantity
    isActive
    createdAt
    updatedAt
  }
`

export const ORDER_FRAGMENT = gql`
  fragment OrderFields on Order {
    id
    reference
    status
    customer {
      id
      name
      email
    }
    lines {
      id
      product {
        id
        name
        sku
      }
      quantity
      unitPrice
      total
    }
    subtotal
    tax
    total
    createdAt
  }
`

export const CUSTOMER_FRAGMENT = gql`
  fragment CustomerFields on Customer {
    id
    firstName
    lastName
    email
    phone
    company
    totalOrders
    totalSpent
    createdAt
  }
`

// =============================================================================
// QUERIES PRÉDÉFINIES
// =============================================================================

export const QUERIES = {
  // Products
  getProducts: gql`
    ${PRODUCT_FRAGMENT}
    query GetProducts($page: Int, $limit: Int, $search: String, $categoryId: ID) {
      products(page: $page, limit: $limit, search: $search, categoryId: $categoryId) {
        items {
          ...ProductFields
        }
        total
        page
        pages
      }
    }
  `,

  getProduct: gql`
    ${PRODUCT_FRAGMENT}
    query GetProduct($id: ID!) {
      product(id: $id) {
        ...ProductFields
        variants {
          id
          sku
          price
          attributes
          stockQuantity
        }
      }
    }
  `,

  // Orders
  getOrders: gql`
    ${ORDER_FRAGMENT}
    query GetOrders($page: Int, $limit: Int, $status: String, $customerId: ID) {
      orders(page: $page, limit: $limit, status: $status, customerId: $customerId) {
        items {
          ...OrderFields
        }
        total
        page
        pages
      }
    }
  `,

  getOrder: gql`
    ${ORDER_FRAGMENT}
    query GetOrder($id: ID!) {
      order(id: $id) {
        ...OrderFields
        shippingAddress {
          street
          city
          zip
          country
        }
        payments {
          id
          amount
          method
          status
          date
        }
      }
    }
  `,

  // Customers
  getCustomers: gql`
    ${CUSTOMER_FRAGMENT}
    query GetCustomers($page: Int, $limit: Int, $search: String) {
      customers(page: $page, limit: $limit, search: $search) {
        items {
          ...CustomerFields
        }
        total
        page
        pages
      }
    }
  `,

  // Dashboard
  getDashboardStats: gql`
    query GetDashboardStats($dateFrom: String, $dateTo: String) {
      dashboardStats(dateFrom: $dateFrom, dateTo: $dateTo) {
        totalRevenue
        ordersCount
        customersCount
        productsCount
        revenueByDay {
          date
          amount
        }
        topProducts {
          id
          name
          quantity
          revenue
        }
        ordersByStatus {
          status
          count
        }
      }
    }
  `,
}

// =============================================================================
// MUTATIONS PRÉDÉFINIES
// =============================================================================

export const MUTATIONS = {
  // Products
  createProduct: gql`
    mutation CreateProduct($input: ProductInput!) {
      createProduct(input: $input) {
        id
        name
        sku
      }
    }
  `,

  updateProduct: gql`
    mutation UpdateProduct($id: ID!, $input: ProductInput!) {
      updateProduct(id: $id, input: $input) {
        id
        name
      }
    }
  `,

  deleteProduct: gql`
    mutation DeleteProduct($id: ID!) {
      deleteProduct(id: $id)
    }
  `,

  // Orders
  createOrder: gql`
    mutation CreateOrder($input: OrderInput!) {
      createOrder(input: $input) {
        id
        reference
        status
      }
    }
  `,

  updateOrderStatus: gql`
    mutation UpdateOrderStatus($id: ID!, $status: String!) {
      updateOrderStatus(id: $id, status: $status) {
        id
        status
      }
    }
  `,

  // Stock
  adjustStock: gql`
    mutation AdjustStock($productId: ID!, $quantity: Int!, $reason: String!) {
      adjustStock(productId: $productId, quantity: $quantity, reason: $reason) {
        productId
        newQuantity
      }
    }
  `,
}

// =============================================================================
// TYPED HOOKS (pour React Query)
// =============================================================================

export type ProductsQueryResult = {
  products: {
    items: Product[]
    total: number
    page: number
    pages: number
  }
}

export type OrdersQueryResult = {
  orders: {
    items: Order[]
    total: number
    page: number
    pages: number
  }
}

export type DashboardStatsResult = {
  dashboardStats: {
    totalRevenue: number
    ordersCount: number
    customersCount: number
    productsCount: number
    revenueByDay: { date: string; amount: number }[]
    topProducts: { id: number; name: string; quantity: number; revenue: number }[]
    ordersByStatus: { status: string; count: number }[]
  }
}

// Types simplifiés pour éviter les imports circulaires
interface Product {
  id: number
  name: string
  sku?: string
  price: number
  stockQuantity: number
  isActive: boolean
}

interface Order {
  id: number
  reference: string
  status: string
  total: number
  createdAt: string
}
