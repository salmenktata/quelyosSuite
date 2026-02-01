import { Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Suspense, lazy } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'
import { useSessionManager } from './hooks/useSessionManager'
import { ProtectedRoute } from './components/ProtectedRoute'
import { useBranding } from './hooks/useBranding'
import { CurrencyProvider } from './lib/finance/CurrencyContext'
import { FinanceErrorBoundary } from './components/finance/FinanceErrorBoundary'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { ModuleErrorBoundary } from './components/common/ModuleErrorBoundary'
import { Loader2 } from 'lucide-react'

// Pages essentielles (chargées immédiatement)
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import AuthCallback from './pages/AuthCallback'
import Dashboard from './pages/Dashboard'

// Lazy loaded pages - Store
const StoreDashboard = lazy(() => import('./pages/store/StoreDashboard'))
const Orders = lazy(() => import('./pages/store/Orders'))
const OrderDetail = lazy(() => import('./pages/store/OrderDetail'))
const Products = lazy(() => import('./pages/store/Products'))
const ProductDetail = lazy(() => import('./pages/store/ProductDetail'))
const ProductForm = lazy(() => import('./pages/store/ProductForm'))
const Categories = lazy(() => import('./pages/store/Categories'))
const Coupons = lazy(() => import('./pages/store/Coupons'))
const CouponForm = lazy(() => import('./pages/store/CouponForm'))
const Featured = lazy(() => import('./pages/store/Featured'))
const AbandonedCarts = lazy(() => import('./pages/store/AbandonedCarts'))
const Menus = lazy(() => import('./pages/store/Menus'))
const HeroSlides = lazy(() => import('./pages/store/HeroSlides'))
const PromoBanners = lazy(() => import('./pages/store/PromoBanners'))
const PromoMessages = lazy(() => import('./pages/store/PromoMessages'))
const TrustBadges = lazy(() => import('./pages/store/TrustBadges'))
const MarketingPopups = lazy(() => import('./pages/store/MarketingPopups'))
const StaticPages = lazy(() => import('./pages/store/StaticPages'))
const Reviews = lazy(() => import('./pages/store/Reviews'))
const FAQ = lazy(() => import('./pages/store/FAQ'))
const Collections = lazy(() => import('./pages/store/Collections'))
const FlashSales = lazy(() => import('./pages/store/FlashSales'))
const Bundles = lazy(() => import('./pages/store/Bundles'))
const Testimonials = lazy(() => import('./pages/store/Testimonials'))
const LiveEvents = lazy(() => import('./pages/store/LiveEvents'))
const TrendingProducts = lazy(() => import('./pages/store/TrendingProducts'))
const Blog = lazy(() => import('./pages/store/Blog'))
const Loyalty = lazy(() => import('./pages/store/Loyalty'))
const SalesReports = lazy(() => import('./pages/store/SalesReports'))
const StoreStockAlerts = lazy(() => import('./pages/store/StockAlerts'))
const Attributes = lazy(() => import('./pages/store/Attributes'))
const ProductImport = lazy(() => import('./pages/store/ProductImport'))

// Lazy loaded pages - Support
const SupportTickets = lazy(() => import('./pages/support/Tickets'))
const NewTicket = lazy(() => import('./pages/support/NewTicket'))
const TicketDetail = lazy(() => import('./pages/support/TicketDetail'))
const SatisfactionPublic = lazy(() => import('./pages/SatisfactionPublic'))

// Lazy loaded pages - Store Themes
const ThemesMarketplace = lazy(() => import('./pages/store/themes/marketplace'))
const ThemesMySubmissions = lazy(() => import('./pages/store/themes/my-submissions'))
const ThemesSubmit = lazy(() => import('./pages/store/themes/submit'))
const ThemesImport = lazy(() => import('./pages/store/themes/import'))
const ThemesPayouts = lazy(() => import('./pages/store/themes/payouts'))
const ThemesAnalytics = lazy(() => import('./pages/store/themes/analytics'))
const ThemeBuilder = lazy(() => import('./pages/store/themes/builder'))
const ThemeBuilderPreview = lazy(() => import('./pages/store/themes/builder/preview'))

// Lazy loaded pages - Store Settings
const StoreSettingsLayoutWrapper = lazy(() => import('./pages/store/settings/SettingsLayoutWrapper'))
const StoreSettings = lazy(() => import('./pages/store/settings/page'))
const StoreSettingsBrand = lazy(() => import('./pages/store/settings/brand/page'))
const StoreSettingsContact = lazy(() => import('./pages/store/settings/contact/page'))
const StoreSettingsShipping = lazy(() => import('./pages/store/settings/shipping/page'))
const StoreSettingsShippingZones = lazy(() => import('./pages/store/settings/shipping-zones/page'))
const StoreSettingsFeatures = lazy(() => import('./pages/store/settings/features/page'))
const StoreSettingsReturns = lazy(() => import('./pages/store/settings/returns/page'))
const StoreSettingsSocial = lazy(() => import('./pages/store/settings/social/page'))
const StoreSettingsSeo = lazy(() => import('./pages/store/settings/seo/page'))
const StoreSettingsPaymentMethods = lazy(() => import('./pages/store/settings/payment-methods/page'))
const StoreSettingsNotifications = lazy(() => import('./pages/store/settings/notifications/page'))

// Lazy loaded pages - CRM
const Customers = lazy(() => import('./pages/crm/Customers'))
const CustomerDetail = lazy(() => import('./pages/crm/CustomerDetail'))
const Pipeline = lazy(() => import('./pages/crm/Pipeline'))
const Leads = lazy(() => import('./pages/crm/Leads'))
const LeadDetail = lazy(() => import('./pages/crm/LeadDetail'))
const CustomerCategories = lazy(() => import('./pages/crm/CustomerCategories'))

// Lazy loaded pages - CRM Settings
const CrmSettingsLayoutWrapper = lazy(() => import('./pages/crm/settings/SettingsLayoutWrapper'))
const CrmSettings = lazy(() => import('./pages/crm/settings/page'))
const CrmSettingsStages = lazy(() => import('./pages/crm/settings/stages/page'))
const CrmSettingsPricelists = lazy(() => import('./pages/crm/settings/pricelists/page'))
const CrmSettingsCategories = lazy(() => import('./pages/crm/settings/categories/page'))
const CrmSettingsScoring = lazy(() => import('./pages/crm/settings/scoring/page'))

// Lazy loaded pages - Stock
const Stock = lazy(() => import('./pages/Stock'))
const Inventory = lazy(() => import('./pages/Inventory'))
const StockMoves = lazy(() => import('./pages/StockMoves'))
const StockTransfers = lazy(() => import('./pages/StockTransfers'))
const StockLocations = lazy(() => import('./pages/StockLocations'))
const ReorderingRules = lazy(() => import('./pages/stock/ReorderingRules'))
const StockValuation = lazy(() => import('./pages/stock/valuation/page'))
const StockTurnover = lazy(() => import('./pages/stock/turnover/page'))
const InventoryGroups = lazy(() => import('./pages/stock/InventoryGroups'))
const WarehouseCalendars = lazy(() => import('./pages/stock/WarehouseCalendars'))
const Warehouses = lazy(() => import('./pages/Warehouses'))
const WarehouseDetail = lazy(() => import('./pages/WarehouseDetail'))

// Lazy loaded pages - Stock Settings
const StockSettingsLayoutWrapper = lazy(() => import('./pages/stock/settings/SettingsLayoutWrapper'))
const StockSettings = lazy(() => import('./pages/stock/settings/page'))
const StockSettingsValuation = lazy(() => import('./pages/stock/settings/valuation/page'))
const StockSettingsReordering = lazy(() => import('./pages/stock/settings/reordering/page'))
const StockSettingsUnits = lazy(() => import('./pages/stock/settings/units/page'))
const StockSettingsAlerts = lazy(() => import('./pages/stock/settings/alerts/page'))

// Lazy loaded pages - Finance
const FinanceDashboard = lazy(() => import('./pages/finance/FinanceDashboard'))
const FinanceAccounts = lazy(() => import('./pages/finance/accounts/page'))
const FinanceAccountNew = lazy(() => import('./pages/finance/accounts/new/page'))
const FinanceAccountDetail = lazy(() => import('./pages/finance/accounts/[id]/page'))
const FinanceBudgets = lazy(() => import('./pages/finance/budgets/page'))
const FinanceBudgetNew = lazy(() => import('./pages/finance/budgets/new/page'))
const FinanceBudgetDetail = lazy(() => import('./pages/finance/budgets/[id]/page'))
const FinanceForecast = lazy(() => import('./pages/finance/forecast/page'))
const FinanceArchives = lazy(() => import('./pages/finance/archives/page'))
const FinancePaymentPlanning = lazy(() => import('./pages/finance/payment-planning/page'))
const FinanceExpenses = lazy(() => import('./pages/finance/expenses/page'))
const FinanceExpenseNew = lazy(() => import('./pages/finance/expenses/new/page'))
const FinanceIncomes = lazy(() => import('./pages/finance/incomes/page'))
const FinanceIncomeNew = lazy(() => import('./pages/finance/incomes/new/page'))
const FinanceCategories = lazy(() => import('./pages/finance/categories/page'))
const FinanceSuppliers = lazy(() => import('./pages/finance/suppliers/page'))
const FinanceSupplierNew = lazy(() => import('./pages/finance/suppliers/new/page'))
const FinancePortfolios = lazy(() => import('./pages/finance/portfolios/page'))
const FinanceScenarios = lazy(() => import('./pages/finance/scenarios/page'))
const FinanceAlerts = lazy(() => import('./pages/finance/alerts/page'))
const FinanceCharts = lazy(() => import('./pages/finance/charts/page'))
const FinanceImport = lazy(() => import('./pages/finance/import/page'))
const FinanceReporting = lazy(() => import('./pages/finance/reporting/page'))
const FinanceReportingCashflow = lazy(() => import('./pages/finance/reporting/cashflow/page'))
const FinanceReportingByCategory = lazy(() => import('./pages/finance/reporting/by-category/page'))
const FinanceReportingByAccount = lazy(() => import('./pages/finance/reporting/by-account/page'))
const FinanceReportingByPortfolio = lazy(() => import('./pages/finance/reporting/by-portfolio/page'))
const FinanceReportingByFlow = lazy(() => import('./pages/finance/reporting/by-flow/page'))
const FinanceReportingForecast = lazy(() => import('./pages/finance/reporting/forecast/page'))
const FinanceReportingForecasts = lazy(() => import('./pages/finance/reporting/forecasts/page'))
const FinanceReportingProfitability = lazy(() => import('./pages/finance/reporting/profitability/page'))
const FinanceReportingEbitda = lazy(() => import('./pages/finance/reporting/ebitda/page'))
const FinanceReportingBfr = lazy(() => import('./pages/finance/reporting/bfr/page'))
const FinanceReportingDso = lazy(() => import('./pages/finance/reporting/dso/page'))
const FinanceReportingBreakeven = lazy(() => import('./pages/finance/reporting/breakeven/page'))
const FinanceReportingDataQuality = lazy(() => import('./pages/finance/reporting/data-quality/page'))

// Lazy loaded pages - Finance Settings
const SettingsLayoutWrapper = lazy(() => import('./pages/finance/settings/SettingsLayoutWrapper'))
const FinanceSettingsCategories = lazy(() => import('./pages/finance/settings/categories/page'))
const FinanceSettingsDevise = lazy(() => import('./pages/finance/settings/devise/page'))
const FinanceSettingsFlux = lazy(() => import('./pages/finance/settings/flux/page'))
const FinanceSettingsTva = lazy(() => import('./pages/finance/settings/tva/page'))
const FinanceSettingsNotifications = lazy(() => import('./pages/finance/settings/notifications/page'))
const FinanceSettingsIntegrations = lazy(() => import('./pages/finance/settings/integrations/page'))
const FinanceSettingsSecurity = lazy(() => import('./pages/finance/settings/security/page'))

// Lazy loaded pages - Marketing
const MarketingDashboard = lazy(() => import('./pages/marketing/MarketingDashboard'))
const MarketingCampaigns = lazy(() => import('./pages/marketing/campaigns/page'))
const MarketingCampaignNew = lazy(() => import('./pages/marketing/campaigns/new/page'))
const MarketingCampaignDetail = lazy(() => import('./pages/marketing/campaigns/[id]/page'))
const MarketingEmail = lazy(() => import('./pages/marketing/email/page'))
const MarketingEmailTemplates = lazy(() => import('./pages/marketing/email/templates/page'))
const MarketingSMS = lazy(() => import('./pages/marketing/sms/page'))
const MarketingContacts = lazy(() => import('./pages/marketing/contacts/page'))
const MarketingContactDetail = lazy(() => import('./pages/marketing/contacts/[id]/page'))
const MarketingSettingsLayoutWrapper = lazy(() => import('./pages/marketing/settings/SettingsLayoutWrapper'))
const MarketingSettings = lazy(() => import('./pages/marketing/settings/page'))
const MarketingSettingsEmail = lazy(() => import('./pages/marketing/settings/email/page'))
const MarketingSettingsSMS = lazy(() => import('./pages/marketing/settings/sms/page'))
const CampaignTrackingDetail = lazy(() => import('./pages/marketing/CampaignTrackingDetail'))
const AutomationWorkflows = lazy(() => import('./pages/marketing/AutomationWorkflows'))

// Lazy loaded pages - HR
const HRDashboard = lazy(() => import('./pages/hr/page'))
const HREmployees = lazy(() => import('./pages/hr/employees/page'))
const HREmployeeNew = lazy(() => import('./pages/hr/employees/new/page'))
const HREmployeeDetail = lazy(() => import('./pages/hr/employees/[id]/page'))
const HRDepartments = lazy(() => import('./pages/hr/departments/page'))
const HRJobs = lazy(() => import('./pages/hr/jobs/page'))
const HRContracts = lazy(() => import('./pages/hr/contracts/page'))
const HRContractNew = lazy(() => import('./pages/hr/contracts/new/page'))
const HRAttendance = lazy(() => import('./pages/hr/attendance/page'))
const HRLeaves = lazy(() => import('./pages/hr/leaves/page'))
const HRLeavesCalendar = lazy(() => import('./pages/hr/leaves/calendar/page'))
const HRLeavesAllocations = lazy(() => import('./pages/hr/leaves/allocations/page'))
const HRLeavesTypes = lazy(() => import('./pages/hr/leaves/types/page'))
const HRSettings = lazy(() => import('./pages/hr/settings/page'))
const HRAppraisals = lazy(() => import('./pages/hr/appraisals/page'))
const HRAppraisalDetail = lazy(() => import('./pages/hr/appraisals/[id]/page'))
const HRSkills = lazy(() => import('./pages/hr/skills/page'))

// Lazy loaded pages - POS
const POSDashboard = lazy(() => import('./pages/pos/POSDashboard'))
const POSTerminal = lazy(() => import('./pages/pos/POSTerminal'))
const POSKiosk = lazy(() => import('./pages/pos/POSKiosk'))
const POSKDS = lazy(() => import('./pages/pos/POSKDS'))
const POSRush = lazy(() => import('./pages/pos/POSRush'))
const POSMobile = lazy(() => import('./pages/pos/POSMobile'))
const POSAnalytics = lazy(() => import('./pages/pos/POSAnalytics'))
const POSClickCollect = lazy(() => import('./pages/pos/POSClickCollect'))
const POSCustomerDisplay = lazy(() => import('./pages/pos/POSCustomerDisplay'))
const POSSessionOpen = lazy(() => import('./pages/pos/POSSessionOpen'))
const POSOrders = lazy(() => import('./pages/pos/POSOrders'))
const POSSessions = lazy(() => import('./pages/pos/POSSessions'))
const POSReportsSales = lazy(() => import('./pages/pos/reports/sales/page'))
const POSReportsPayments = lazy(() => import('./pages/pos/reports/payments/page'))
const POSSettings = lazy(() => import('./pages/pos/settings/page'))
const POSSettingsTerminals = lazy(() => import('./pages/pos/settings/terminals/page'))
const POSSettingsPayments = lazy(() => import('./pages/pos/settings/payments/page'))
const POSSettingsReceipts = lazy(() => import('./pages/pos/settings/receipts/page'))

// Lazy loaded pages - Global Settings
const GlobalSettings = lazy(() => import('./pages/settings/page'))
const GlobalSettingsEmail = lazy(() => import('./pages/settings/email/page'))
const GlobalSettingsSMS = lazy(() => import('./pages/settings/sms/page'))

// Lazy loaded pages - Others
const Analytics = lazy(() => import('./pages/Analytics'))
const Invoices = lazy(() => import('./pages/Invoices'))
const Payments = lazy(() => import('./pages/Payments'))
const Pricelists = lazy(() => import('./pages/Pricelists'))
const PricelistDetail = lazy(() => import('./pages/PricelistDetail'))
const ApiGuide = lazy(() => import('./pages/ApiGuide'))
const NoticeAnalytics = lazy(() => import('./pages/NoticeAnalytics'))
const SitemapMonitoring = lazy(() => import('./pages/admin/SitemapMonitoring'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

// Spinner de chargement pour Suspense
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
    </div>
  )
}

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

// Wrapper pour les routes Finance avec ErrorBoundary et CurrencyProvider
function FinanceWrapper({ children }: { children: React.ReactNode }) {
  return (
    <FinanceErrorBoundary>
      <CurrencyProvider>
        {children}
      </CurrencyProvider>
    </FinanceErrorBoundary>
  )
}

// Wrapper pour les routes Finance Settings avec layout
function FinanceSettingsWrapper() {
  return (
    <FinanceErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <SettingsLayoutWrapper />
      </Suspense>
    </FinanceErrorBoundary>
  )
}

// Module Error Boundary Wrappers
function StoreModule({ children }: { children: React.ReactNode }) {
  return <ModuleErrorBoundary moduleName="Boutique" fallbackPath="/dashboard">{children}</ModuleErrorBoundary>
}

function StockModule({ children }: { children: React.ReactNode }) {
  return <ModuleErrorBoundary moduleName="Stock" fallbackPath="/dashboard">{children}</ModuleErrorBoundary>
}

function CrmModule({ children }: { children: React.ReactNode }) {
  return <ModuleErrorBoundary moduleName="CRM" fallbackPath="/dashboard">{children}</ModuleErrorBoundary>
}

function MarketingModule({ children }: { children: React.ReactNode }) {
  return <ModuleErrorBoundary moduleName="Marketing" fallbackPath="/dashboard">{children}</ModuleErrorBoundary>
}

function HrModule({ children }: { children: React.ReactNode }) {
  return <ModuleErrorBoundary moduleName="Ressources Humaines" fallbackPath="/dashboard">{children}</ModuleErrorBoundary>
}

function PosModule({ children }: { children: React.ReactNode }) {
  return <ModuleErrorBoundary moduleName="Point de Vente" fallbackPath="/dashboard">{children}</ModuleErrorBoundary>
}

export default function App() {
  useBranding() // Appliquer branding dynamique selon édition
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <ThemeProvider>
          <ToastProvider>
              <SessionManager />
              <Suspense fallback={<PageLoader />}>
              <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth-callback" element={<AuthCallback />} />
              {/* Route publique satisfaction (sans authentification) */}
              <Route path="/satisfaction/:token" element={<SatisfactionPublic />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              {/* Store routes */}
              <Route
                path="/store"
                element={
                  <ProtectedRoute>
                    <StoreModule><StoreDashboard /></StoreModule>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/orders"
                element={
                  <ProtectedRoute>
                    <Orders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/orders/:id"
                element={
                  <ProtectedRoute>
                    <OrderDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/products"
                element={
                  <ProtectedRoute>
                    <Products />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/products/create"
                element={
                  <ProtectedRoute>
                    <ProductForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/products/:id"
                element={
                  <ProtectedRoute>
                    <ProductDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/products/:id/edit"
                element={
                  <ProtectedRoute>
                    <ProductForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/categories"
                element={
                  <ProtectedRoute>
                    <Categories />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/coupons"
                element={
                  <ProtectedRoute>
                    <Coupons />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/coupons/create"
                element={
                  <ProtectedRoute>
                    <CouponForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/featured"
                element={
                  <ProtectedRoute>
                    <Featured />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/abandoned-carts"
                element={
                  <ProtectedRoute>
                    <AbandonedCarts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/menus"
                element={
                  <ProtectedRoute>
                    <Menus />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/hero-slides"
                element={
                  <ProtectedRoute>
                    <HeroSlides />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/promo-banners"
                element={
                  <ProtectedRoute>
                    <PromoBanners />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/promo-messages"
                element={
                  <ProtectedRoute>
                    <PromoMessages />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/trust-badges"
                element={
                  <ProtectedRoute>
                    <TrustBadges />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/marketing-popups"
                element={
                  <ProtectedRoute>
                    <MarketingPopups />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/static-pages"
                element={
                  <ProtectedRoute>
                    <StaticPages />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/reviews"
                element={
                  <ProtectedRoute>
                    <Reviews />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/faq"
                element={
                  <ProtectedRoute>
                    <FAQ />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/collections"
                element={
                  <ProtectedRoute>
                    <Collections />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/flash-sales"
                element={
                  <ProtectedRoute>
                    <FlashSales />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/bundles"
                element={
                  <ProtectedRoute>
                    <Bundles />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/testimonials"
                element={
                  <ProtectedRoute>
                    <Testimonials />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/live-events"
                element={
                  <ProtectedRoute>
                    <LiveEvents />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/trending-products"
                element={
                  <ProtectedRoute>
                    <TrendingProducts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/blog"
                element={
                  <ProtectedRoute>
                    <Blog />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/loyalty"
                element={
                  <ProtectedRoute>
                    <Loyalty />
                  </ProtectedRoute>
                }
              />
              {/* Redirection ancienne route vers nouveau module Support */}
              <Route path="/store/tickets" element={<Navigate to="/support/tickets" replace />} />
              <Route
                path="/store/sales-reports"
                element={
                  <ProtectedRoute>
                    <SalesReports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/stock-alerts"
                element={
                  <ProtectedRoute>
                    <StoreStockAlerts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/attributes"
                element={
                  <ProtectedRoute>
                    <Attributes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/import-export"
                element={
                  <ProtectedRoute>
                    <ProductImport />
                  </ProtectedRoute>
                }
              />
              {/* Store Themes */}
              <Route
                path="/store/themes"
                element={
                  <ProtectedRoute>
                    <ThemesMarketplace />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/themes/my-submissions"
                element={
                  <ProtectedRoute>
                    <ThemesMySubmissions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/themes/submit"
                element={
                  <ProtectedRoute>
                    <ThemesSubmit />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/themes/import"
                element={
                  <ProtectedRoute>
                    <ThemesImport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/themes/payouts"
                element={
                  <ProtectedRoute>
                    <ThemesPayouts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/themes/analytics"
                element={
                  <ProtectedRoute>
                    <ThemesAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/themes/builder"
                element={
                  <ProtectedRoute>
                    <ThemeBuilder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/themes/builder/preview"
                element={
                  <ThemeBuilderPreview />
                }
              />
              {/* Redirections Store */}
              <Route path="/store/delivery" element={<Navigate to="/store/settings/shipping" replace />} />
              <Route path="/store/site-config" element={<Navigate to="/store/settings" replace />} />
              <Route path="/store/seo-metadata" element={<Navigate to="/store/settings/seo" replace />} />
              <Route path="/store/my-shop" element={<Navigate to="/store/settings/brand" replace />} />
              {/* Store Settings */}
              <Route
                path="/store/settings"
                element={
                  <ProtectedRoute>
                    <StoreSettingsLayoutWrapper />
                  </ProtectedRoute>
                }
              >
                <Route index element={<StoreSettings />} />
                <Route path="brand" element={<StoreSettingsBrand />} />
                <Route path="contact" element={<StoreSettingsContact />} />
                <Route path="shipping" element={<StoreSettingsShipping />} />
                <Route path="shipping-zones" element={<StoreSettingsShippingZones />} />
                <Route path="features" element={<StoreSettingsFeatures />} />
                <Route path="returns" element={<StoreSettingsReturns />} />
                <Route path="social" element={<StoreSettingsSocial />} />
                <Route path="seo" element={<StoreSettingsSeo />} />
                <Route path="payment-methods" element={<StoreSettingsPaymentMethods />} />
                <Route path="notifications" element={<StoreSettingsNotifications />} />
              </Route>
              {/* Support routes */}
              <Route
                path="/support/tickets"
                element={
                  <ProtectedRoute>
                    <SupportTickets />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/support/tickets/new"
                element={
                  <ProtectedRoute>
                    <NewTicket />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/support/tickets/:id"
                element={
                  <ProtectedRoute>
                    <TicketDetail />
                  </ProtectedRoute>
                }
              />
              {/* CRM routes */}
              <Route path="/crm" element={<Navigate to="/crm/customers" replace />} />
              <Route
                path="/crm/customers"
                element={
                  <ProtectedRoute>
                    <CrmModule><Customers /></CrmModule>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/crm/customers/:id"
                element={
                  <ProtectedRoute>
                    <CustomerDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/crm/customer-categories"
                element={
                  <ProtectedRoute>
                    <CustomerCategories />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/crm/pipeline"
                element={
                  <ProtectedRoute>
                    <Pipeline />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/crm/leads"
                element={
                  <ProtectedRoute>
                    <Leads />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/crm/leads/:id"
                element={
                  <ProtectedRoute>
                    <LeadDetail />
                  </ProtectedRoute>
                }
              />
              {/* CRM Settings */}
              <Route
                path="/crm/settings"
                element={
                  <ProtectedRoute>
                    <CrmSettingsLayoutWrapper />
                  </ProtectedRoute>
                }
              >
                <Route index element={<CrmSettings />} />
                <Route path="stages" element={<CrmSettingsStages />} />
                <Route path="pricelists" element={<CrmSettingsPricelists />} />
                <Route path="categories" element={<CrmSettingsCategories />} />
                <Route path="scoring" element={<CrmSettingsScoring />} />
              </Route>
              {/* Stock routes */}
              <Route
                path="/stock"
                element={
                  <ProtectedRoute>
                    <StockModule><Stock /></StockModule>
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
                path="/stock/transfers"
                element={
                  <ProtectedRoute>
                    <StockTransfers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stock/locations"
                element={
                  <ProtectedRoute>
                    <StockLocations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stock/reordering-rules"
                element={
                  <ProtectedRoute>
                    <ReorderingRules />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stock/valuation"
                element={
                  <ProtectedRoute>
                    <CurrencyProvider>
                      <StockValuation />
                    </CurrencyProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stock/turnover"
                element={
                  <ProtectedRoute>
                    <CurrencyProvider>
                      <StockTurnover />
                    </CurrencyProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stock/inventory-groups"
                element={
                  <ProtectedRoute>
                    <InventoryGroups />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stock/warehouse-calendars"
                element={
                  <ProtectedRoute>
                    <WarehouseCalendars />
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
              {/* Stock Settings */}
              <Route
                path="/stock/settings"
                element={
                  <ProtectedRoute>
                    <StockSettingsLayoutWrapper />
                  </ProtectedRoute>
                }
              >
                <Route index element={<StockSettings />} />
                <Route path="valuation" element={<StockSettingsValuation />} />
                <Route path="reordering" element={<StockSettingsReordering />} />
                <Route path="units" element={<StockSettingsUnits />} />
                <Route path="alerts" element={<StockSettingsAlerts />} />
              </Route>
              {/* Finance routes */}
              <Route
                path="/finance"
                element={
                  <ProtectedRoute>
                    <FinanceWrapper>
                      <FinanceDashboard />
                    </FinanceWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/accounts"
                element={
                  <ProtectedRoute>
                    <FinanceWrapper>
                      <FinanceAccounts />
                    </FinanceWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/accounts/new"
                element={
                  <ProtectedRoute>
                    <FinanceWrapper>
                      <FinanceAccountNew />
                    </FinanceWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/accounts/:id"
                element={
                  <ProtectedRoute>
                    <FinanceWrapper>
                      <FinanceAccountDetail />
                    </FinanceWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/budgets"
                element={
                  <ProtectedRoute>
                    <FinanceWrapper>
                      <FinanceBudgets />
                    </FinanceWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/budgets/new"
                element={
                  <ProtectedRoute>
                    <FinanceWrapper>
                      <FinanceBudgetNew />
                    </FinanceWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/budgets/:id"
                element={
                  <ProtectedRoute>
                    <FinanceWrapper>
                      <FinanceBudgetDetail />
                    </FinanceWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/forecast"
                element={
                  <ProtectedRoute>
                    <FinanceWrapper>
                      <FinanceForecast />
                    </FinanceWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/archives"
                element={
                  <ProtectedRoute>
                    <FinanceWrapper>
                      <FinanceArchives />
                    </FinanceWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/payment-planning"
                element={
                  <ProtectedRoute>
                    <FinanceWrapper>
                      <FinancePaymentPlanning />
                    </FinanceWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/expenses"
                element={
                  <ProtectedRoute>
                    <FinanceWrapper>
                      <FinanceExpenses />
                    </FinanceWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/expenses/new"
                element={
                  <ProtectedRoute>
                    <FinanceWrapper>
                      <FinanceExpenseNew />
                    </FinanceWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/incomes"
                element={
                  <ProtectedRoute>
                    <FinanceWrapper>
                      <FinanceIncomes />
                    </FinanceWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/incomes/new"
                element={
                  <ProtectedRoute>
                    <FinanceWrapper>
                      <FinanceIncomeNew />
                    </FinanceWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/categories"
                element={
                  <ProtectedRoute>
                    <FinanceWrapper>
                      <FinanceCategories />
                    </FinanceWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/suppliers"
                element={
                  <ProtectedRoute>
                    <FinanceWrapper>
                      <FinanceSuppliers />
                    </FinanceWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/suppliers/new"
                element={
                  <ProtectedRoute>
                    <FinanceWrapper>
                      <FinanceSupplierNew />
                    </FinanceWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/portfolios"
                element={
                  <ProtectedRoute>
                    <FinanceWrapper>
                      <FinancePortfolios />
                    </FinanceWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/scenarios"
                element={
                  <ProtectedRoute>
                    <FinanceWrapper>
                      <FinanceScenarios />
                    </FinanceWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/alerts"
                element={
                  <ProtectedRoute>
                    <FinanceWrapper>
                      <FinanceAlerts />
                    </FinanceWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/charts"
                element={
                  <ProtectedRoute>
                    <FinanceWrapper>
                      <FinanceCharts />
                    </FinanceWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/import"
                element={
                  <ProtectedRoute>
                    <FinanceWrapper>
                      <FinanceImport />
                    </FinanceWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/reporting"
                element={
                  <ProtectedRoute>
                    <FinanceWrapper>
                      <FinanceReporting />
                    </FinanceWrapper>
                  </ProtectedRoute>
                }
              />
              {/* Redirection /finance/transactions vers /finance/expenses */}
              <Route path="/finance/transactions" element={<Navigate to="/finance/expenses" replace />} />
              <Route path="/finance/reporting/overview" element={<Navigate to="/finance/reporting" replace />} />
              <Route
                path="/finance/reporting/cashflow"
                element={
                  <ProtectedRoute>
                    <FinanceWrapper>
                      <FinanceReportingCashflow />
                    </FinanceWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/reporting/by-category"
                element={
                  <ProtectedRoute>
                    <FinanceWrapper>
                      <FinanceReportingByCategory />
                    </FinanceWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/reporting/by-account"
                element={
                  <ProtectedRoute>
                    <FinanceWrapper>
                      <FinanceReportingByAccount />
                    </FinanceWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/reporting/by-portfolio"
                element={
                  <ProtectedRoute>
                    <FinanceWrapper>
                      <FinanceReportingByPortfolio />
                    </FinanceWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/reporting/by-flow"
                element={
                  <ProtectedRoute>
                    <FinanceWrapper>
                      <FinanceReportingByFlow />
                    </FinanceWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/reporting/forecast"
                element={
                  <ProtectedRoute>
                    <FinanceWrapper>
                      <FinanceReportingForecast />
                    </FinanceWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/reporting/forecasts"
                element={
                  <ProtectedRoute>
                    <FinanceWrapper>
                      <FinanceReportingForecasts />
                    </FinanceWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/reporting/profitability"
                element={
                  <ProtectedRoute>
                    <FinanceWrapper>
                      <FinanceReportingProfitability />
                    </FinanceWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/reporting/ebitda"
                element={
                  <ProtectedRoute>
                    <FinanceWrapper>
                      <FinanceReportingEbitda />
                    </FinanceWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/reporting/bfr"
                element={
                  <ProtectedRoute>
                    <FinanceWrapper>
                      <FinanceReportingBfr />
                    </FinanceWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/reporting/dso"
                element={
                  <ProtectedRoute>
                    <FinanceWrapper>
                      <FinanceReportingDso />
                    </FinanceWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/reporting/breakeven"
                element={
                  <ProtectedRoute>
                    <FinanceWrapper>
                      <FinanceReportingBreakeven />
                    </FinanceWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/reporting/data-quality"
                element={
                  <ProtectedRoute>
                    <FinanceWrapper>
                      <FinanceReportingDataQuality />
                    </FinanceWrapper>
                  </ProtectedRoute>
                }
              />
              {/* Finance Settings */}
              <Route
                path="/finance/settings"
                element={
                  <ProtectedRoute>
                    <FinanceSettingsWrapper />
                  </ProtectedRoute>
                }
              >
                <Route path="devise" element={<FinanceSettingsDevise />} />
                <Route path="tva" element={<FinanceSettingsTva />} />
                <Route path="categories" element={<FinanceSettingsCategories />} />
                <Route path="flux" element={<FinanceSettingsFlux />} />
                <Route path="security" element={<FinanceSettingsSecurity />} />
                <Route path="notifications" element={<FinanceSettingsNotifications />} />
                <Route path="integrations" element={<FinanceSettingsIntegrations />} />
              </Route>
              {/* Marketing routes */}
              <Route
                path="/marketing"
                element={
                  <ProtectedRoute>
                    <MarketingModule><MarketingDashboard /></MarketingModule>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/marketing/campaigns"
                element={
                  <ProtectedRoute>
                    <MarketingCampaigns />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/marketing/campaigns/new"
                element={
                  <ProtectedRoute>
                    <MarketingCampaignNew />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/marketing/campaigns/:id"
                element={
                  <ProtectedRoute>
                    <MarketingCampaignDetail />
              <Route
                path="/marketing/campaigns/:id/tracking"
                element={
                  <ProtectedRoute>
                    <CampaignTrackingDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/marketing/automation"
                element={
                  <ProtectedRoute>
                    <AutomationWorkflows />
                  </ProtectedRoute>
                }
              />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/marketing/email"
                element={
                  <ProtectedRoute>
                    <MarketingEmail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/marketing/email/templates"
                element={
                  <ProtectedRoute>
                    <MarketingEmailTemplates />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/marketing/sms"
                element={
                  <ProtectedRoute>
                    <MarketingSMS />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/marketing/contacts"
                element={
                  <ProtectedRoute>
                    <MarketingContacts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/marketing/contacts/:id"
                element={
                  <ProtectedRoute>
                    <MarketingContactDetail />
                  </ProtectedRoute>
                }
              />
              {/* Marketing Settings */}
              <Route
                path="/marketing/settings"
                element={
                  <ProtectedRoute>
                    <MarketingSettingsLayoutWrapper />
                  </ProtectedRoute>
                }
              >
                <Route index element={<MarketingSettings />} />
                <Route path="email" element={<MarketingSettingsEmail />} />
                <Route path="sms" element={<MarketingSettingsSMS />} />
              </Route>
              {/* HR routes */}
              <Route
                path="/hr"
                element={
                  <ProtectedRoute>
                    <HrModule><HRDashboard /></HrModule>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hr/employees"
                element={
                  <ProtectedRoute>
                    <HREmployees />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hr/employees/new"
                element={
                  <ProtectedRoute>
                    <HREmployeeNew />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hr/employees/:id"
                element={
                  <ProtectedRoute>
                    <HREmployeeDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hr/departments"
                element={
                  <ProtectedRoute>
                    <HRDepartments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hr/jobs"
                element={
                  <ProtectedRoute>
                    <HRJobs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hr/contracts"
                element={
                  <ProtectedRoute>
                    <HRContracts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hr/contracts/new"
                element={
                  <ProtectedRoute>
                    <HRContractNew />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hr/attendance"
                element={
                  <ProtectedRoute>
                    <HRAttendance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hr/leaves"
                element={
                  <ProtectedRoute>
                    <HRLeaves />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hr/leaves/calendar"
                element={
                  <ProtectedRoute>
                    <HRLeavesCalendar />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hr/leaves/allocations"
                element={
                  <ProtectedRoute>
                    <HRLeavesAllocations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hr/leaves/types"
                element={
                  <ProtectedRoute>
                    <HRLeavesTypes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hr/settings"
                element={
                  <ProtectedRoute>
                    <HRSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hr/appraisals"
                element={
                  <ProtectedRoute>
                    <HRAppraisals />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hr/appraisals/:id"
                element={
                  <ProtectedRoute>
                    <HRAppraisalDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hr/skills"
                element={
                  <ProtectedRoute>
                    <HRSkills />
                  </ProtectedRoute>
                }
              />
              {/* POS routes */}
              <Route
                path="/pos"
                element={
                  <ProtectedRoute>
                    <PosModule><POSDashboard /></PosModule>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pos/terminal"
                element={
                  <ProtectedRoute>
                    <POSTerminal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pos/kiosk"
                element={
                  <ProtectedRoute>
                    <POSKiosk />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pos/kds"
                element={
                  <ProtectedRoute>
                    <POSKDS />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pos/rush"
                element={
                  <ProtectedRoute>
                    <POSRush />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pos/mobile"
                element={
                  <ProtectedRoute>
                    <POSMobile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pos/analytics"
                element={
                  <ProtectedRoute>
                    <POSAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pos/click-collect"
                element={
                  <ProtectedRoute>
                    <POSClickCollect />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pos/session/open"
                element={
                  <ProtectedRoute>
                    <POSSessionOpen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pos/orders"
                element={
                  <ProtectedRoute>
                    <POSOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pos/sessions"
                element={
                  <ProtectedRoute>
                    <POSSessions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pos/reports/sales"
                element={
                  <ProtectedRoute>
                    <POSReportsSales />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pos/reports/payments"
                element={
                  <ProtectedRoute>
                    <POSReportsPayments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pos/settings"
                element={
                  <ProtectedRoute>
                    <POSSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pos/settings/terminals"
                element={
                  <ProtectedRoute>
                    <POSSettingsTerminals />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pos/settings/payments"
                element={
                  <ProtectedRoute>
                    <POSSettingsPayments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pos/settings/receipts"
                element={
                  <ProtectedRoute>
                    <POSSettingsReceipts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pos/customer-display"
                element={
                  <ProtectedRoute>
                    <POSCustomerDisplay />
                  </ProtectedRoute>
                }
              />
              {/* Global Settings */}
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <GlobalSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/email"
                element={
                  <ProtectedRoute>
                    <GlobalSettingsEmail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/sms"
                element={
                  <ProtectedRoute>
                    <GlobalSettingsSMS />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/security"
                element={
                  <ProtectedRoute>
                    <GlobalSettingsSecurity />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/settings"
                element={<Navigate to="/settings" replace />}
              />
              {/* Other routes */}
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
                path="/payments"
                element={
                  <ProtectedRoute>
                    <Payments />
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
                path="/api-guide"
                element={
                  <ProtectedRoute>
                    <ApiGuide />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/notice-analytics"
                element={
                  <ProtectedRoute>
                    <NoticeAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/sitemap"
                element={
                  <ProtectedRoute>
                    <SitemapMonitoring />
                  </ProtectedRoute>
                }
              />
            </Routes>
            </Suspense>
          </ToastProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  )
}
