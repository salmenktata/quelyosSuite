/**
 * MSW Handlers - Mock API pour les tests
 */
import { http, HttpResponse } from 'msw'

const API_URL = 'http://localhost:8069/api'

// Données de test
export const mockContactLists = [
  { id: 1, name: 'VIP Clients', contact_count: 150, list_type: 'static', created_at: '2024-01-15' },
  { id: 2, name: 'Newsletter', contact_count: 1200, list_type: 'dynamic', created_at: '2024-01-10' },
  { id: 3, name: 'Inactifs', contact_count: 89, list_type: 'static', created_at: '2024-01-05' },
]

export const mockProducts = [
  { id: 1, name: 'Product A', sku: 'SKU-001', price: 29.99, stock_quantity: 100 },
  { id: 2, name: 'Product B', sku: 'SKU-002', price: 49.99, stock_quantity: 50 },
]

export const mockCustomers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', phone: '+33612345678' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '+33698765432' },
]

// Handlers
export const handlers = [
  // Marketing - Contact Lists
  http.get(`${API_URL}/marketing/contact-lists`, () => {
    return HttpResponse.json({ success: true, data: { lists: mockContactLists } })
  }),

  http.post(`${API_URL}/marketing/contact-lists`, async ({ request }) => {
    const body = await request.json() as { name: string; list_type: string }
    const newList = { id: Date.now(), ...body, contact_count: 0, created_at: new Date().toISOString() }
    return HttpResponse.json({ success: true, data: newList })
  }),

  http.delete(`${API_URL}/marketing/contact-lists/:id`, ({ params }) => {
    return HttpResponse.json({ success: true, message: `List ${params.id} deleted` })
  }),

  // Products
  http.get(`${API_URL}/ecommerce/products`, () => {
    return HttpResponse.json({ success: true, data: { products: mockProducts } })
  }),

  // Customers
  http.get(`${API_URL}/ecommerce/customers`, () => {
    return HttpResponse.json({ success: true, data: { customers: mockCustomers } })
  }),

  // Auth
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string }
    if (body.email === 'admin' && body.password === 'admin') {
      return HttpResponse.json({
        success: true,
        data: { user: { id: 1, email: 'admin', name: 'Admin' }, token: 'mock-token' },
      })
    }
    return HttpResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
  }),
]
