import { Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './contexts/ThemeContext'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Customers from './pages/Customers'
import CustomerDetail from './pages/CustomerDetail'
import Products from './pages/Products'
import ProductForm from './pages/ProductForm'
import Categories from './pages/Categories'
import Coupons from './pages/Coupons'
import CouponForm from './pages/CouponForm'
import Stock from './pages/Stock'
import DeliveryMethods from './pages/DeliveryMethods'
import Payments from './pages/Payments'
import Featured from './pages/Featured'
import Analytics from './pages/Analytics'
import Invoices from './pages/Invoices'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/create" element={<ProductForm />} />
            <Route path="/products/:id/edit" element={<ProductForm />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/coupons" element={<Coupons />} />
            <Route path="/coupons/create" element={<CouponForm />} />
            <Route path="/stock" element={<Stock />} />
            <Route path="/delivery" element={<DeliveryMethods />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/featured" element={<Featured />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/invoices" element={<Invoices />} />
          </Routes>
        </div>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
