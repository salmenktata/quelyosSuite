import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { SaasLayout } from './layouts/SaasLayout'
import { useAuth } from './lib/store/compat/auth'

// Lazy-loaded pages
const Login = lazy(() => import('./pages/Login'))

// Store
const StoreDashboard = lazy(() => import('./pages/store/StoreDashboard'))
const Orders = lazy(() => import('./pages/store/Orders'))
const OrderDetail = lazy(() => import('./pages/store/OrderDetail'))
const AbandonedCarts = lazy(() => import('./pages/store/AbandonedCarts'))
const Products = lazy(() => import('./pages/store/Products'))
const ProductDetail = lazy(() => import('./pages/store/ProductDetail'))
const ProductForm = lazy(() => import('./pages/store/ProductForm'))
const ProductImport = lazy(() => import('./pages/store/ProductImport'))
const Categories = lazy(() => import('./pages/store/Categories'))
const Attributes = lazy(() => import('./pages/store/Attributes'))
const Collections = lazy(() => import('./pages/store/Collections'))
const Bundles = lazy(() => import('./pages/store/Bundles'))
const Coupons = lazy(() => import('./pages/store/Coupons'))
const CouponForm = lazy(() => import('./pages/store/CouponForm'))
const FlashSales = lazy(() => import('./pages/store/FlashSales'))
const Featured = lazy(() => import('./pages/store/Featured'))
const PromoBanners = lazy(() => import('./pages/store/PromoBanners'))
const HeroSlides = lazy(() => import('./pages/store/HeroSlides'))
const MarketingPopups = lazy(() => import('./pages/store/MarketingPopups'))
const LiveEvents = lazy(() => import('./pages/store/LiveEvents'))
const TrendingProducts = lazy(() => import('./pages/store/TrendingProducts'))
const Reviews = lazy(() => import('./pages/store/Reviews'))
const Testimonials = lazy(() => import('./pages/store/Testimonials'))
const Loyalty = lazy(() => import('./pages/store/Loyalty'))
const FAQ = lazy(() => import('./pages/store/FAQ'))
const StaticPages = lazy(() => import('./pages/store/StaticPages'))
const Blog = lazy(() => import('./pages/store/Blog'))
const Menus = lazy(() => import('./pages/store/Menus'))
const PromoMessages = lazy(() => import('./pages/store/PromoMessages'))
const TrustBadges = lazy(() => import('./pages/store/TrustBadges'))
const Tickets = lazy(() => import('./pages/store/Tickets'))
const SalesReports = lazy(() => import('./pages/store/SalesReports'))
const StockAlerts = lazy(() => import('./pages/store/StockAlerts'))
const Themes = lazy(() => import('./pages/store/themes'))
const ThemeBuilder = lazy(() => import('./pages/store/themes/builder'))
const ThemeImport = lazy(() => import('./pages/store/themes/import'))
const ThemeMarketplace = lazy(() => import('./pages/store/themes/marketplace'))
const ThemeSubmit = lazy(() => import('./pages/store/themes/submit'))
const ThemeMySubmissions = lazy(() => import('./pages/store/themes/my-submissions'))

// Store settings
const StoreSettingsLayout = lazy(() => import('./pages/store/settings/layout'))
const StoreSettingsPage = lazy(() => import('./pages/store/settings/page'))
const StoreSettingsBrand = lazy(() => import('./pages/store/settings/brand/page'))
const StoreSettingsContact = lazy(() => import('./pages/store/settings/contact/page'))
const StoreSettingsFeatures = lazy(() => import('./pages/store/settings/features/page'))
const StoreSettingsNotifications = lazy(() => import('./pages/store/settings/notifications/page'))
const StoreSettingsPayment = lazy(() => import('./pages/store/settings/payment-methods/page'))
const StoreSettingsReturns = lazy(() => import('./pages/store/settings/returns/page'))
const StoreSettingsSeo = lazy(() => import('./pages/store/settings/seo/page'))
const StoreSettingsShipping = lazy(() => import('./pages/store/settings/shipping/page'))
const StoreSettingsShippingZones = lazy(() => import('./pages/store/settings/shipping-zones/page'))
const StoreSettingsSocial = lazy(() => import('./pages/store/settings/social/page'))

// Marketing
const MarketingDashboard = lazy(() => import('./pages/marketing/MarketingDashboard'))
const Campaigns = lazy(() => import('./pages/marketing/campaigns/page'))
const CampaignNew = lazy(() => import('./pages/marketing/campaigns/new/page'))
const CampaignDetail = lazy(() => import('./pages/marketing/campaigns/[id]/page'))
const EmailPage = lazy(() => import('./pages/marketing/email/page'))
const EmailTemplates = lazy(() => import('./pages/marketing/email/templates/page'))
const SmsPage = lazy(() => import('./pages/marketing/sms/page'))
const Contacts = lazy(() => import('./pages/marketing/contacts/page'))
const ContactDetail = lazy(() => import('./pages/marketing/contacts/[id]/page'))
const MarketingSettingsLayout = lazy(() => import('./pages/marketing/settings/layout'))
const MarketingSettingsPage = lazy(() => import('./pages/marketing/settings/page'))
const MarketingSettingsEmail = lazy(() => import('./pages/marketing/settings/email/page'))
const MarketingSettingsSms = lazy(() => import('./pages/marketing/settings/sms/page'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <SaasLayout />
            </ProtectedRoute>
          }
        >
          {/* Store */}
          <Route index element={<Navigate to="/store" replace />} />
          <Route path="store" element={<StoreDashboard />} />
          <Route path="store/orders" element={<Orders />} />
          <Route path="store/orders/:id" element={<OrderDetail />} />
          <Route path="store/abandoned-carts" element={<AbandonedCarts />} />
          <Route path="store/products" element={<Products />} />
          <Route path="store/products/new" element={<ProductForm />} />
          <Route path="store/products/:id" element={<ProductDetail />} />
          <Route path="store/products/:id/edit" element={<ProductForm />} />
          <Route path="store/import-export" element={<ProductImport />} />
          <Route path="store/categories" element={<Categories />} />
          <Route path="store/attributes" element={<Attributes />} />
          <Route path="store/collections" element={<Collections />} />
          <Route path="store/bundles" element={<Bundles />} />
          <Route path="store/coupons" element={<Coupons />} />
          <Route path="store/coupons/new" element={<CouponForm />} />
          <Route path="store/coupons/:id/edit" element={<CouponForm />} />
          <Route path="store/flash-sales" element={<FlashSales />} />
          <Route path="store/featured" element={<Featured />} />
          <Route path="store/promo-banners" element={<PromoBanners />} />
          <Route path="store/hero-slides" element={<HeroSlides />} />
          <Route path="store/marketing-popups" element={<MarketingPopups />} />
          <Route path="store/live-events" element={<LiveEvents />} />
          <Route path="store/trending-products" element={<TrendingProducts />} />
          <Route path="store/reviews" element={<Reviews />} />
          <Route path="store/testimonials" element={<Testimonials />} />
          <Route path="store/loyalty" element={<Loyalty />} />
          <Route path="store/faq" element={<FAQ />} />
          <Route path="store/static-pages" element={<StaticPages />} />
          <Route path="store/blog" element={<Blog />} />
          <Route path="store/menus" element={<Menus />} />
          <Route path="store/promo-messages" element={<PromoMessages />} />
          <Route path="store/trust-badges" element={<TrustBadges />} />
          <Route path="store/tickets" element={<Tickets />} />
          <Route path="store/sales-reports" element={<SalesReports />} />
          <Route path="store/stock-alerts" element={<StockAlerts />} />
          <Route path="store/themes" element={<Themes />} />
          <Route path="store/themes/builder" element={<ThemeBuilder />} />
          <Route path="store/themes/import" element={<ThemeImport />} />
          <Route path="store/themes/marketplace" element={<ThemeMarketplace />} />
          <Route path="store/themes/submit" element={<ThemeSubmit />} />
          <Route path="store/themes/my-submissions" element={<ThemeMySubmissions />} />

          {/* Store Settings */}
          <Route path="store/settings" element={<StoreSettingsLayout />}>
            <Route index element={<StoreSettingsPage />} />
            <Route path="brand" element={<StoreSettingsBrand />} />
            <Route path="contact" element={<StoreSettingsContact />} />
            <Route path="features" element={<StoreSettingsFeatures />} />
            <Route path="notifications" element={<StoreSettingsNotifications />} />
            <Route path="payment-methods" element={<StoreSettingsPayment />} />
            <Route path="returns" element={<StoreSettingsReturns />} />
            <Route path="seo" element={<StoreSettingsSeo />} />
            <Route path="shipping" element={<StoreSettingsShipping />} />
            <Route path="shipping-zones" element={<StoreSettingsShippingZones />} />
            <Route path="social" element={<StoreSettingsSocial />} />
          </Route>

          {/* Marketing */}
          <Route path="marketing" element={<MarketingDashboard />} />
          <Route path="marketing/campaigns" element={<Campaigns />} />
          <Route path="marketing/campaigns/new" element={<CampaignNew />} />
          <Route path="marketing/campaigns/:id" element={<CampaignDetail />} />
          <Route path="marketing/email" element={<EmailPage />} />
          <Route path="marketing/email/templates" element={<EmailTemplates />} />
          <Route path="marketing/sms" element={<SmsPage />} />
          <Route path="marketing/contacts" element={<Contacts />} />
          <Route path="marketing/contacts/:id" element={<ContactDetail />} />

          {/* Marketing Settings */}
          <Route path="marketing/settings" element={<MarketingSettingsLayout />}>
            <Route index element={<MarketingSettingsPage />} />
            <Route path="email" element={<MarketingSettingsEmail />} />
            <Route path="sms" element={<MarketingSettingsSms />} />
          </Route>

          <Route path="*" element={<Navigate to="/store" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
