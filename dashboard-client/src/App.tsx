import { Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'
import { useSessionManager } from './hooks/useSessionManager'
import { ProtectedRoute } from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import Orders from './pages/store/Orders'
import OrderDetail from './pages/store/OrderDetail'
import Customers from './pages/crm/Customers'
import CustomerDetail from './pages/crm/CustomerDetail'
import Pipeline from './pages/crm/Pipeline'
import Leads from './pages/crm/Leads'
import LeadDetail from './pages/crm/LeadDetail'
import Products from './pages/store/Products'
import ProductDetail from './pages/store/ProductDetail'
import ProductForm from './pages/store/ProductForm'
import Categories from './pages/store/Categories'
import Coupons from './pages/store/Coupons'
import CouponForm from './pages/store/CouponForm'
import Stock from './pages/Stock'
import Inventory from './pages/Inventory'
import StockMoves from './pages/StockMoves'
import StockTransfers from './pages/StockTransfers'
import StockLocations from './pages/StockLocations'
import ReorderingRules from './pages/stock/ReorderingRules'
import StockChangeReasons from './pages/stock/StockChangeReasons'
import InventoriesOCA from './pages/stock/InventoriesOCA'
import LocationLocks from './pages/stock/LocationLocks'
import ExpiryAlerts from './pages/stock/ExpiryAlerts'
import WarehouseRoutes from './pages/stock/WarehouseRoutes'
import ABCAnalysis from './pages/stock/ABCAnalysis'
import StockForecast from './pages/stock/StockForecast'
import UnitOfMeasure from './pages/stock/UnitOfMeasure'
import LotTraceability from './pages/stock/LotTraceability'
import AdvancedReports from './pages/stock/AdvancedReports'
import DeliveryMethods from './pages/store/DeliveryMethods'
import SiteConfig from './pages/store/SiteConfig'
import Payments from './pages/Payments'
import Featured from './pages/store/Featured'
import Analytics from './pages/Analytics'
import Invoices from './pages/Invoices'
import AbandonedCarts from './pages/store/AbandonedCarts'
import Pricelists from './pages/Pricelists'
import PricelistDetail from './pages/PricelistDetail'
import CustomerCategories from './pages/crm/CustomerCategories'
import Warehouses from './pages/Warehouses'
import WarehouseDetail from './pages/WarehouseDetail'
import MyShop from './pages/store/MyShop'
// import Tenants from './pages/Tenants' // Désactivé - réservé super-admin
import Menus from './pages/store/Menus'
import HeroSlides from './pages/store/HeroSlides'
import PromoBanners from './pages/store/PromoBanners'
import PromoMessages from './pages/store/PromoMessages'
import TrustBadges from './pages/store/TrustBadges'
import SeoMetadata from './pages/store/SeoMetadata'
import MarketingPopups from './pages/store/MarketingPopups'
import StaticPages from './pages/store/StaticPages'
import ApiGuide from './pages/ApiGuide'
// Finance module
import FinanceDashboard from './pages/finance/FinanceDashboard'
import FinanceAccounts from './pages/finance/accounts/page'
import FinanceAccountNew from './pages/finance/accounts/new/page'
import FinanceAccountDetail from './pages/finance/accounts/[id]/page'
import FinanceTransactions from './pages/finance/transactions/page'
import FinanceBudgets from './pages/finance/budgets/page'
import FinanceBudgetNew from './pages/finance/budgets/new/page'
import FinanceBudgetDetail from './pages/finance/budgets/[id]/page'
import FinanceForecast from './pages/finance/forecast/page'
import FinanceArchives from './pages/finance/archives/page'
import FinancePaymentPlanning from './pages/finance/payment-planning/page'
import FinanceExpenses from './pages/finance/expenses/page'
import FinanceExpenseNew from './pages/finance/expenses/new/page'
import FinanceIncomes from './pages/finance/incomes/page'
import FinanceIncomeNew from './pages/finance/incomes/new/page'
import FinanceCategories from './pages/finance/categories/page'
import FinanceSuppliers from './pages/finance/suppliers/page'
import FinanceSupplierNew from './pages/finance/suppliers/new/page'
import FinancePortfolios from './pages/finance/portfolios/page'
import FinanceScenarios from './pages/finance/scenarios/page'
import FinanceAlerts from './pages/finance/alerts/page'
import FinanceCharts from './pages/finance/charts/page'
import FinanceImport from './pages/finance/import/page'
import FinanceReporting from './pages/finance/reporting/page'
import FinanceReportingOverview from './pages/finance/reporting/overview/page'
import FinanceReportingCashflow from './pages/finance/reporting/cashflow/page'
import FinanceReportingByCategory from './pages/finance/reporting/by-category/page'
import FinanceReportingByAccount from './pages/finance/reporting/by-account/page'
import FinanceReportingByPortfolio from './pages/finance/reporting/by-portfolio/page'
import FinanceReportingByFlow from './pages/finance/reporting/by-flow/page'
import FinanceReportingForecast from './pages/finance/reporting/forecast/page'
import FinanceReportingForecasts from './pages/finance/reporting/forecasts/page'
import FinanceReportingProfitability from './pages/finance/reporting/profitability/page'
import FinanceReportingEbitda from './pages/finance/reporting/ebitda/page'
import FinanceReportingBfr from './pages/finance/reporting/bfr/page'
import FinanceReportingDso from './pages/finance/reporting/dso/page'
import FinanceReportingBreakeven from './pages/finance/reporting/breakeven/page'
import FinanceReportingDataQuality from './pages/finance/reporting/data-quality/page'
import SettingsLayoutWrapper from './pages/finance/settings/SettingsLayoutWrapper'
import FinanceSettings from './pages/finance/settings/page'
import FinanceSettingsCategories from './pages/finance/settings/categories/page'
import FinanceSettingsDevise from './pages/finance/settings/devise/page'
import FinanceSettingsFlux from './pages/finance/settings/flux/page'
import FinanceSettingsTva from './pages/finance/settings/tva/page'
import FinanceSettingsBilling from './pages/finance/settings/billing/page'
import FinanceSettingsNotifications from './pages/finance/settings/notifications/page'
import FinanceSettingsIntegrations from './pages/finance/settings/integrations/page'
import FinanceSettingsSecurity from './pages/finance/settings/security/page'
import FinanceStockValuation from './pages/finance/stock/valuation/page'
import FinanceStockTurnover from './pages/finance/stock/turnover/page'
import NoticeAnalytics from './pages/NoticeAnalytics'
import { CurrencyProvider } from './lib/finance/CurrencyContext'
import { FinanceErrorBoundary } from './components/finance/FinanceErrorBoundary'
import { ErrorBoundary } from './components/common/ErrorBoundary'

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
      <ErrorBoundary>
        <ThemeProvider>
          <ToastProvider>
              <SessionManager />
              <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth-callback" element={<AuthCallback />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/store" element={<Navigate to="/store/my-shop" replace />} />
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
              <Route path="/crm" element={<Navigate to="/crm/customers" replace />} />
              <Route
                path="/crm/customers"
                element={
                  <ProtectedRoute>
                    <Customers />
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
                path="/stock/change-reasons"
                element={
                  <ProtectedRoute>
                    <StockChangeReasons />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stock/inventories-oca"
                element={
                  <ProtectedRoute>
                    <InventoriesOCA />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stock/location-locks"
                element={
                  <ProtectedRoute>
                    <LocationLocks />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stock/expiry-alerts"
                element={
                  <ProtectedRoute>
                    <ExpiryAlerts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stock/warehouse-routes"
                element={
                  <ProtectedRoute>
                    <WarehouseRoutes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stock/abc-analysis"
                element={
                  <ProtectedRoute>
                    <ABCAnalysis />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stock/forecast"
                element={
                  <ProtectedRoute>
                    <StockForecast />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stock/uom"
                element={
                  <ProtectedRoute>
                    <UnitOfMeasure />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stock/lot-traceability"
                element={
                  <ProtectedRoute>
                    <LotTraceability />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stock/advanced-reports"
                element={
                  <ProtectedRoute>
                    <AdvancedReports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/delivery"
                element={
                  <ProtectedRoute>
                    <DeliveryMethods />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/store/site-config"
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
                path="/store/featured"
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
                path="/store/abandoned-carts"
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
              {/* Route Tenants désactivée - réservée super-admin */}
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
                path="/store/seo-metadata"
                element={
                  <ProtectedRoute>
                    <SeoMetadata />
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
                path="/store/my-shop"
                element={
                  <ProtectedRoute>
                    <MyShop />
                  </ProtectedRoute>
                }
              />
              {/* Finance routes */}
              <Route
                path="/finance"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceDashboard />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/accounts"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceAccounts />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/transactions"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceTransactions />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/budgets"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceBudgets />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/forecast"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceForecast />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/archives"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceArchives />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/payment-planning"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinancePaymentPlanning />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/expenses"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceExpenses />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/incomes"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceIncomes />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/expenses/new"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceExpenseNew />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/incomes/new"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceIncomeNew />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/accounts/new"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceAccountNew />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/accounts/:id"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceAccountDetail />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/budgets/new"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceBudgetNew />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/budgets/:id"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceBudgetDetail />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/categories"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceCategories />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/suppliers"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceSuppliers />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/suppliers/new"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceSupplierNew />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/portfolios"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinancePortfolios />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/scenarios"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceScenarios />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/alerts"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceAlerts />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/charts"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceCharts />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/import"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceImport />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/reporting"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceReporting />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/reporting/overview"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceReportingOverview />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/reporting/cashflow"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceReportingCashflow />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/reporting/by-category"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceReportingByCategory />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/reporting/by-account"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceReportingByAccount />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/reporting/by-portfolio"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceReportingByPortfolio />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/reporting/by-flow"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceReportingByFlow />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/reporting/forecast"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceReportingForecast />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/reporting/forecasts"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceReportingForecasts />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/reporting/profitability"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceReportingProfitability />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/reporting/ebitda"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceReportingEbitda />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/reporting/bfr"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceReportingBfr />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/reporting/dso"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceReportingDso />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/reporting/breakeven"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceReportingBreakeven />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/reporting/data-quality"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceReportingDataQuality />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/settings"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <SettingsLayoutWrapper />
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              >
                <Route index element={<FinanceSettings />} />
                <Route path="devise" element={<FinanceSettingsDevise />} />
                <Route path="tva" element={<FinanceSettingsTva />} />
                <Route path="categories" element={<FinanceSettingsCategories />} />
                <Route path="flux" element={<FinanceSettingsFlux />} />
                <Route path="billing" element={<FinanceSettingsBilling />} />
                <Route path="security" element={<FinanceSettingsSecurity />} />
                <Route path="notifications" element={<FinanceSettingsNotifications />} />
                <Route path="integrations" element={<FinanceSettingsIntegrations />} />
              </Route>
              <Route
                path="/finance/stock/valuation"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceStockValuation />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/stock/turnover"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceStockTurnover />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </ToastProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  )
}
