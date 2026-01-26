import { Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'
import { useSessionManager } from './hooks/useSessionManager'
import { ProtectedRoute } from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
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
import StockTransfers from './pages/StockTransfers'
import StockLocations from './pages/StockLocations'
import ReorderingRules from './pages/stock/ReorderingRules'
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
// import Tenants from './pages/Tenants' // Désactivé - réservé super-admin
import Menus from './pages/Menus'
import HeroSlides from './pages/HeroSlides'
import PromoBanners from './pages/PromoBanners'
import PromoMessages from './pages/PromoMessages'
import TrustBadges from './pages/TrustBadges'
import SeoMetadata from './pages/SeoMetadata'
import MarketingPopups from './pages/MarketingPopups'
import StaticPages from './pages/StaticPages'
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
              {/* Route Tenants désactivée - réservée super-admin */}
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
                path="/api-guide"
                element={
                  <ProtectedRoute>
                    <ApiGuide />
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
                path="/static-pages"
                element={
                  <ProtectedRoute>
                    <StaticPages />
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
                      <CurrencyProvider>
                        <FinanceSettings />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/settings/categories"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceSettingsCategories />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/settings/devise"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceSettingsDevise />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/settings/flux"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceSettingsFlux />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/settings/tva"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceSettingsTva />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/settings/billing"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceSettingsBilling />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/settings/notifications"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceSettingsNotifications />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/settings/integrations"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceSettingsIntegrations />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/settings/security"
                element={
                  <ProtectedRoute>
                    <FinanceErrorBoundary>
                      <CurrencyProvider>
                        <FinanceSettingsSecurity />
                      </CurrencyProvider>
                    </FinanceErrorBoundary>
                  </ProtectedRoute>
                }
              />
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
