import { Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'
import { useSessionManager } from './hooks/useSessionManager'
import { ProtectedRoute } from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Customers from './pages/Customers'
import CustomerDetail from './pages/CustomerDetail'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import ProductForm from './pages/ProductForm'
import Categories from './pages/Categories'
import Coupons from './pages/Coupons'
import CouponForm from './pages/CouponForm'
import Stock from './pages/Stock'
import Inventory from './pages/Inventory'
import StockMoves from './pages/StockMoves'
import DeliveryMethods from './pages/DeliveryMethods'
import SiteConfig from './pages/SiteConfig'
import Payments from './pages/Payments'
import Featured from './pages/Featured'
import Analytics from './pages/Analytics'
import Invoices from './pages/Invoices'
import AbandonedCarts from './pages/AbandonedCarts'
import Pricelists from './pages/Pricelists'
import PricelistDetail from './pages/PricelistDetail'
import CustomerCategories from './pages/CustomerCategories'
import Warehouses from './pages/Warehouses'
import WarehouseDetail from './pages/WarehouseDetail'
import MyShop from './pages/MyShop'
import Tenants from './pages/Tenants'
import Menus from './pages/Menus'
import HeroSlides from './pages/HeroSlides'
import PromoBanners from './pages/PromoBanners'
import PromoMessages from './pages/PromoMessages'
import TrustBadges from './pages/TrustBadges'
import SeoMetadata from './pages/SeoMetadata'
import MarketingPopups from './pages/MarketingPopups'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

// TEMPORAIRE : SessionManager désactivé en DEV (voir TODO_AUTH.md)
function SessionManager() {
  // Ne rien faire en mode développement
  if (import.meta.env.DEV) {
    return null
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useSessionManager({
    enableAutoRefresh: true,
    enableWarning: true,
  })
  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <SessionManager />
          <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <Orders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders/:id"
                element={
                  <ProtectedRoute>
                    <OrderDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customers"
                element={
                  <ProtectedRoute>
                    <Customers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customers/:id"
                element={
                  <ProtectedRoute>
                    <CustomerDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products"
                element={
                  <ProtectedRoute>
                    <Products />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products/create"
                element={
                  <ProtectedRoute>
                    <ProductForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products/:id"
                element={
                  <ProtectedRoute>
                    <ProductDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products/:id/edit"
                element={
                  <ProtectedRoute>
                    <ProductForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/categories"
                element={
                  <ProtectedRoute>
                    <Categories />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coupons"
                element={
                  <ProtectedRoute>
                    <Coupons />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coupons/create"
                element={
                  <ProtectedRoute>
                    <CouponForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stock"
                element={
                  <ProtectedRoute>
                    <Stock />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inventory"
                element={
                  <ProtectedRoute>
                    <Inventory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stock/moves"
                element={
                  <ProtectedRoute>
                    <StockMoves />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/delivery"
                element={
                  <ProtectedRoute>
                    <DeliveryMethods />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/site-config"
                element={
                  <ProtectedRoute>
                    <SiteConfig />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payments"
                element={
                  <ProtectedRoute>
                    <Payments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/featured"
                element={
                  <ProtectedRoute>
                    <Featured />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invoices"
                element={
                  <ProtectedRoute>
                    <Invoices />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/abandoned-carts"
                element={
                  <ProtectedRoute>
                    <AbandonedCarts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pricelists"
                element={
                  <ProtectedRoute>
                    <Pricelists />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pricelists/:id"
                element={
                  <ProtectedRoute>
                    <PricelistDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer-categories"
                element={
                  <ProtectedRoute>
                    <CustomerCategories />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/warehouses"
                element={
                  <ProtectedRoute>
                    <Warehouses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/warehouses/:id"
                element={
                  <ProtectedRoute>
                    <WarehouseDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tenants"
                element={
                  <ProtectedRoute>
                    <Tenants />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/menus"
                element={
                  <ProtectedRoute>
                    <Menus />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hero-slides"
                element={
                  <ProtectedRoute>
                    <HeroSlides />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/promo-banners"
                element={
                  <ProtectedRoute>
                    <PromoBanners />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/promo-messages"
                element={
                  <ProtectedRoute>
                    <PromoMessages />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/trust-badges"
                element={
                  <ProtectedRoute>
                    <TrustBadges />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/seo-metadata"
                element={
                  <ProtectedRoute>
                    <SeoMetadata />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/marketing-popups"
                element={
                  <ProtectedRoute>
                    <MarketingPopups />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-shop"
                element={
                  <ProtectedRoute>
                    <MyShop />
                  </ProtectedRoute>
                }
              />
            </Routes>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
