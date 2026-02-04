import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense } from 'react'
import { lazyWithRetry as lazy } from './lib/lazyWithRetry'
import { ProtectedRoute } from './components/ProtectedRoute'
import { CurrencyProvider } from './lib/finance/CurrencyContext'
import { FinanceErrorBoundary } from './components/finance/FinanceErrorBoundary'
import { ModuleErrorBoundary } from './components/common/ModuleErrorBoundary'
import { Loader2 } from 'lucide-react'

// Pages essentielles (chargées immédiatement)
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import AuthCallback from './pages/AuthCallback'
import Dashboard from './pages/Dashboard'

// ---------------------------------------------------------------------------
// Lazy loaded pages
// ---------------------------------------------------------------------------

// Store - Tableau de bord
const StoreDashboard = lazy(() => import('./pages/store/StoreDashboard'))
// Store - Orders
const Orders = lazy(() => import('./pages/store/orders/Orders'))
const OrderDetail = lazy(() => import('./pages/store/orders/OrderDetail'))
const AbandonedCarts = lazy(() => import('./pages/store/orders/AbandonedCarts'))
// Store - Catalog
const Products = lazy(() => import('./pages/store/catalog/Products'))
const ProductDetail = lazy(() => import('./pages/store/catalog/ProductDetail'))
const ProductForm = lazy(() => import('./pages/store/catalog/ProductForm'))
const Categories = lazy(() => import('./pages/store/catalog/Categories'))
const Collections = lazy(() => import('./pages/store/catalog/Collections'))
const Bundles = lazy(() => import('./pages/store/catalog/Bundles'))
const Attributes = lazy(() => import('./pages/store/catalog/Attributes'))
const ProductImport = lazy(() => import('./pages/store/catalog/ProductImport'))
// Store - Marketing
const Coupons = lazy(() => import('./pages/store/marketing/Coupons'))
const CouponForm = lazy(() => import('./pages/store/marketing/CouponForm'))
const FlashSales = lazy(() => import('./pages/store/marketing/FlashSales'))
const Featured = lazy(() => import('./pages/store/marketing/Featured'))
const TrendingProducts = lazy(() => import('./pages/store/marketing/TrendingProducts'))
const PromoBanners = lazy(() => import('./pages/store/marketing/PromoBanners'))
const MarketingPopups = lazy(() => import('./pages/store/marketing/MarketingPopups'))
const PromoMessages = lazy(() => import('./pages/store/marketing/PromoMessages'))
const NewsletterCampaigns = lazy(() => import('./pages/store/marketing/newsletter/campaigns/page'))
const NewsletterSubscribers = lazy(() => import('./pages/store/marketing/newsletter/subscribers/page'))
const NewsletterCompose = lazy(() => import('./pages/store/marketing/newsletter/compose/page'))
// Store - Content
const HeroSlides = lazy(() => import('./pages/store/content/HeroSlides'))
const Reviews = lazy(() => import('./pages/store/content/Reviews'))
const Testimonials = lazy(() => import('./pages/store/content/Testimonials'))
const Loyalty = lazy(() => import('./pages/store/content/Loyalty'))
const FAQ = lazy(() => import('./pages/store/content/FAQ'))
const StaticPages = lazy(() => import('./pages/store/content/StaticPages'))
const Blog = lazy(() => import('./pages/store/content/Blog'))
const Menus = lazy(() => import('./pages/store/content/Menus'))
const TrustBadges = lazy(() => import('./pages/store/content/TrustBadges'))
const LiveEvents = lazy(() => import('./pages/store/content/LiveEvents'))
// Store - Homepage Builder
const HomepageBuilder = lazy(() => import('./pages/store/HomepageBuilder'))
// Store - Reports
const SalesReports = lazy(() => import('./pages/store/reports/SalesReports'))
const StoreStockAlerts = lazy(() => import('./pages/store/reports/StockAlerts'))

// Store Themes
const ThemesMarketplace = lazy(() => import('./pages/store/themes/marketplace'))
const ThemesMySubmissions = lazy(() => import('./pages/store/themes/my-submissions'))
const ThemesSubmit = lazy(() => import('./pages/store/themes/submit'))
const ThemesImport = lazy(() => import('./pages/store/themes/import'))
const ThemesPayouts = lazy(() => import('./pages/store/themes/payouts'))
const ThemesAnalytics = lazy(() => import('./pages/store/themes/analytics'))
const ThemeBuilder = lazy(() => import('./pages/store/themes/builder'))
const ThemeBuilderPreview = lazy(() => import('./pages/store/themes/builder/preview'))

// Store Settings
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
const StoreSettingsCheckoutConfig = lazy(() => import('./pages/store/settings/CheckoutConfig'))
const StoreSettingsDeliveryMethods = lazy(() => import('./pages/store/settings/DeliveryMethods'))

// Support
const SupportTickets = lazy(() => import('./pages/support/Tickets'))
const NewTicket = lazy(() => import('./pages/support/NewTicket'))
const TicketDetail = lazy(() => import('./pages/support/TicketDetail'))
const SatisfactionPublic = lazy(() => import('./pages/SatisfactionPublic'))

// Maintenance (GMAO)
const MaintenanceDashboard = lazy(() => import('./pages/maintenance/Dashboard'))
const EquipmentList = lazy(() => import('./pages/maintenance/EquipmentList'))
const EquipmentDetail = lazy(() => import('./pages/maintenance/EquipmentDetail'))
const EquipmentForm = lazy(() => import('./pages/maintenance/EquipmentForm'))
const EquipmentCritical = lazy(() => import('./pages/maintenance/EquipmentCritical'))
const RequestsList = lazy(() => import('./pages/maintenance/RequestsList'))
const RequestForm = lazy(() => import('./pages/maintenance/RequestForm'))
const RequestsEmergency = lazy(() => import('./pages/maintenance/RequestsEmergency'))
const MaintenanceCalendar = lazy(() => import('./pages/maintenance/Calendar'))
const MaintenanceReports = lazy(() => import('./pages/maintenance/Reports'))
const MaintenanceCosts = lazy(() => import('./pages/maintenance/Costs'))
const MaintenanceCategories = lazy(() => import('./pages/maintenance/Categories'))
const MaintenanceSettings = lazy(() => import('./pages/maintenance/Settings'))

// CRM
const Customers = lazy(() => import('./pages/crm/Customers'))
const CustomerDetail = lazy(() => import('./pages/crm/CustomerDetail'))
const CustomerSegmentation = lazy(() => import('./pages/crm/CustomerSegmentation'))
const Pipeline = lazy(() => import('./pages/crm/Pipeline'))
const Leads = lazy(() => import('./pages/crm/Leads'))
const LeadDetail = lazy(() => import('./pages/crm/LeadDetail'))
const CustomerCategories = lazy(() => import('./pages/crm/CustomerCategories'))

// CRM Settings
const CrmSettingsLayoutWrapper = lazy(() => import('./pages/crm/settings/SettingsLayoutWrapper'))
const CrmSettings = lazy(() => import('./pages/crm/settings/page'))
const CrmSettingsStages = lazy(() => import('./pages/crm/settings/stages/page'))
const CrmSettingsPricelists = lazy(() => import('./pages/crm/settings/pricelists/page'))
const CrmSettingsCategories = lazy(() => import('./pages/crm/settings/categories/page'))
const CrmSettingsScoring = lazy(() => import('./pages/crm/settings/scoring/page'))

// Stock
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

// Stock Settings
const StockSettingsLayoutWrapper = lazy(() => import('./pages/stock/settings/SettingsLayoutWrapper'))
const StockSettings = lazy(() => import('./pages/stock/settings/page'))
const StockSettingsValuation = lazy(() => import('./pages/stock/settings/valuation/page'))
const StockSettingsReordering = lazy(() => import('./pages/stock/settings/reordering/page'))
const StockSettingsUnits = lazy(() => import('./pages/stock/settings/units/page'))
const StockSettingsAlerts = lazy(() => import('./pages/stock/settings/alerts/page'))

// Finance
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
const RevenueForecast = lazy(() => import('./pages/finance/analytics/forecast/page'))
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

// Finance Settings
const SettingsLayoutWrapper = lazy(() => import('./pages/finance/settings/SettingsLayoutWrapper'))
const FinanceSettings = lazy(() => import('./pages/finance/settings/page'))
const FinanceSettingsFlux = lazy(() => import('./pages/finance/settings/flux/page'))
const FinanceSettingsNotifications = lazy(() => import('./pages/finance/settings/notifications/page'))
const FinanceSettingsIntegrations = lazy(() => import('./pages/finance/settings/integrations/page'))
const FinanceSettingsInvoicing = lazy(() => import('./pages/finance/settings/invoicing/page'))
const FinanceSettingsExportFEC = lazy(() => import('./pages/finance/settings/export-fec/page'))

// Marketing
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

// HR
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

// POS
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

// Global Settings
const GlobalSettings = lazy(() => import('./pages/settings/page'))
const GlobalSettingsPreferences = lazy(() => import('./pages/settings/preferences/page'))
const GlobalSettingsEmail = lazy(() => import('./pages/settings/email/page'))
const GlobalSettingsSMS = lazy(() => import('./pages/settings/sms/page'))
const GlobalSettingsSecurity = lazy(() => import('./pages/settings/security/page'))
const GlobalSettingsDevise = lazy(() => import('./pages/settings/devise/page'))
const GlobalSettingsTva = lazy(() => import('./pages/settings/tva/page'))
const GlobalSettingsTeam = lazy(() => import('./pages/settings/team/page'))

// Subscriptions
const Subscriptions = lazy(() => import('./pages/subscriptions/page'))

// Others
const Analytics = lazy(() => import('./pages/Analytics'))
const Invoices = lazy(() => import('./pages/Invoices'))

// Invoicing - Factures & Devis
const InvoicesList = lazy(() => import('./pages/finance/invoices/page'))
const InvoiceDetail = lazy(() => import('./pages/finance/invoices/[id]/page'))
const InvoiceNew = lazy(() => import('./pages/finance/invoices/new/page'))
const InvoiceQuick = lazy(() => import('./pages/finance/invoices/quick/page'))
const InvoiceOCR = lazy(() => import('./pages/finance/invoices/ocr/page'))
const InvoicingSubscriptions = lazy(() => import('./pages/finance/subscriptions/page'))
const InvoiceFacturX = lazy(() => import('./pages/finance/invoices/[id]/facturx'))
const AnalyticAccounts = lazy(() => import('./pages/finance/analytics/analytic-accounts/page'))
const PaymentRisk = lazy(() => import('./pages/finance/payment-risk/page'))
const InvoicingSettingsCurrencies = lazy(() => import('./pages/finance/settings/currencies/page'))
const InvoicingApprovals = lazy(() => import('./pages/finance/approvals/page'))

// Sales - Quotes
const QuotesList = lazy(() => import('./pages/sales/quotes/page'))
const QuoteDetail = lazy(() => import('./pages/sales/quotes/[id]/page'))
const Payments = lazy(() => import('./pages/Payments'))
const Pricelists = lazy(() => import('./pages/Pricelists'))
const PricelistDetail = lazy(() => import('./pages/PricelistDetail'))
const ApiGuide = lazy(() => import('./pages/ApiGuide'))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
    </div>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>
}

function FinanceWrapper({ children }: { children: React.ReactNode }) {
  return (
    <FinanceErrorBoundary>
      <CurrencyProvider>{children}</CurrencyProvider>
    </FinanceErrorBoundary>
  )
}

function FP({ children }: { children: React.ReactNode }) {
  return <P><FinanceWrapper>{children}</FinanceWrapper></P>
}

function Module({ name, children }: { name: string; children: React.ReactNode }) {
  return <ModuleErrorBoundary moduleName={name} fallbackPath="/dashboard">{children}</ModuleErrorBoundary>
}

// ---------------------------------------------------------------------------
// Route definitions
// ---------------------------------------------------------------------------

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth-callback" element={<AuthCallback />} />
        <Route path="/satisfaction/:token" element={<SatisfactionPublic />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<P><Dashboard /></P>} />
        <Route path="/dashboard/subscriptions" element={<P><Subscriptions /></P>} />
        <Route path="/dashboard/settings" element={<Navigate to="/settings" replace />} />

        {/* ---- Store ---- */}
        <Route path="/store" element={<P><Module name="Boutique"><StoreDashboard /></Module></P>} />

        {/* Store - Orders */}
        <Route path="/store/orders" element={<P><Orders /></P>} />
        <Route path="/store/orders/:id" element={<P><OrderDetail /></P>} />
        <Route path="/store/orders/abandoned-carts" element={<P><AbandonedCarts /></P>} />

        {/* Store - Catalog */}
        <Route path="/store/catalog/products" element={<P><Products /></P>} />
        <Route path="/store/catalog/products/create" element={<P><ProductForm /></P>} />
        <Route path="/store/catalog/products/:id" element={<P><ProductDetail /></P>} />
        <Route path="/store/catalog/products/:id/edit" element={<P><ProductForm /></P>} />
        <Route path="/store/catalog/categories" element={<P><Categories /></P>} />
        <Route path="/store/catalog/collections" element={<P><Collections /></P>} />
        <Route path="/store/catalog/bundles" element={<P><Bundles /></P>} />
        <Route path="/store/catalog/attributes" element={<P><Attributes /></P>} />
        <Route path="/store/catalog/import-export" element={<P><ProductImport /></P>} />

        {/* Store - Marketing */}
        <Route path="/store/marketing/coupons" element={<P><Coupons /></P>} />
        <Route path="/store/marketing/coupons/create" element={<P><CouponForm /></P>} />
        <Route path="/store/marketing/flash-sales" element={<P><FlashSales /></P>} />
        <Route path="/store/marketing/featured" element={<P><Featured /></P>} />
        <Route path="/store/marketing/trending" element={<P><TrendingProducts /></P>} />
        <Route path="/store/marketing/banners" element={<P><PromoBanners /></P>} />
        <Route path="/store/marketing/popups" element={<P><MarketingPopups /></P>} />
        <Route path="/store/marketing/messages" element={<P><PromoMessages /></P>} />
        <Route path="/store/marketing/newsletter/campaigns" element={<P><NewsletterCampaigns /></P>} />
        <Route path="/store/marketing/newsletter/subscribers" element={<P><NewsletterSubscribers /></P>} />
        <Route path="/store/marketing/newsletter/compose" element={<P><NewsletterCompose /></P>} />

        {/* Store - Content */}
        <Route path="/store/content/hero-slides" element={<P><HeroSlides /></P>} />
        <Route path="/store/content/reviews" element={<P><Reviews /></P>} />
        <Route path="/store/content/testimonials" element={<P><Testimonials /></P>} />
        <Route path="/store/content/loyalty" element={<P><Loyalty /></P>} />
        <Route path="/store/content/faq" element={<P><FAQ /></P>} />
        <Route path="/store/content/pages" element={<P><StaticPages /></P>} />
        <Route path="/store/content/blog" element={<P><Blog /></P>} />
        <Route path="/store/content/menus" element={<P><Menus /></P>} />
        <Route path="/store/content/trust-badges" element={<P><TrustBadges /></P>} />
        <Route path="/store/content/live-events" element={<P><LiveEvents /></P>} />

        {/* Store - Homepage Builder */}
        <Route path="/store/homepage-builder" element={<P><HomepageBuilder /></P>} />

        {/* Store - Reports */}
        <Route path="/store/reports/sales" element={<P><SalesReports /></P>} />
        <Route path="/store/reports/stock-alerts" element={<P><StoreStockAlerts /></P>} />

        {/* Compatibility redirects (old URLs -> new URLs) */}
        <Route path="/store/products" element={<Navigate to="/store/catalog/products" replace />} />
        <Route path="/store/products/:id" element={<Navigate to="/store/catalog/products/:id" replace />} />
        <Route path="/store/categories" element={<Navigate to="/store/catalog/categories" replace />} />
        <Route path="/store/collections" element={<Navigate to="/store/catalog/collections" replace />} />
        <Route path="/store/bundles" element={<Navigate to="/store/catalog/bundles" replace />} />
        <Route path="/store/attributes" element={<Navigate to="/store/catalog/attributes" replace />} />
        <Route path="/store/import-export" element={<Navigate to="/store/catalog/import-export" replace />} />
        <Route path="/store/coupons" element={<Navigate to="/store/marketing/coupons" replace />} />
        <Route path="/store/flash-sales" element={<Navigate to="/store/marketing/flash-sales" replace />} />
        <Route path="/store/featured" element={<Navigate to="/store/marketing/featured" replace />} />
        <Route path="/store/trending-products" element={<Navigate to="/store/marketing/trending" replace />} />
        <Route path="/store/promo-banners" element={<Navigate to="/store/marketing/banners" replace />} />
        <Route path="/store/marketing-popups" element={<Navigate to="/store/marketing/popups" replace />} />
        <Route path="/store/promo-messages" element={<Navigate to="/store/marketing/messages" replace />} />
        <Route path="/store/hero-slides" element={<Navigate to="/store/content/hero-slides" replace />} />
        <Route path="/store/reviews" element={<Navigate to="/store/content/reviews" replace />} />
        <Route path="/store/testimonials" element={<Navigate to="/store/content/testimonials" replace />} />
        <Route path="/store/loyalty" element={<Navigate to="/store/content/loyalty" replace />} />
        <Route path="/store/faq" element={<Navigate to="/store/content/faq" replace />} />
        <Route path="/store/static-pages" element={<Navigate to="/store/content/pages" replace />} />
        <Route path="/store/blog" element={<Navigate to="/store/content/blog" replace />} />
        <Route path="/store/menus" element={<Navigate to="/store/content/menus" replace />} />
        <Route path="/store/trust-badges" element={<Navigate to="/store/content/trust-badges" replace />} />
        <Route path="/store/live-events" element={<Navigate to="/store/content/live-events" replace />} />
        <Route path="/store/abandoned-carts" element={<Navigate to="/store/orders/abandoned-carts" replace />} />
        <Route path="/store/sales-reports" element={<Navigate to="/store/reports/sales" replace />} />
        <Route path="/store/stock-alerts" element={<Navigate to="/store/reports/stock-alerts" replace />} />

        {/* Store Themes */}
        <Route path="/store/themes" element={<P><ThemesMarketplace /></P>} />
        <Route path="/store/themes/marketplace" element={<P><ThemesMarketplace /></P>} />
        <Route path="/store/themes/my-submissions" element={<P><ThemesMySubmissions /></P>} />
        <Route path="/store/themes/submit" element={<P><ThemesSubmit /></P>} />
        <Route path="/store/themes/import" element={<P><ThemesImport /></P>} />
        <Route path="/store/themes/payouts" element={<P><ThemesPayouts /></P>} />
        <Route path="/store/themes/analytics" element={<P><ThemesAnalytics /></P>} />
        <Route path="/store/themes/builder" element={<P><ThemeBuilder /></P>} />
        <Route path="/store/themes/builder/preview" element={<ThemeBuilderPreview />} />

        {/* Store Redirections */}
        <Route path="/store/tickets" element={<Navigate to="/support/tickets" replace />} />
        <Route path="/store/delivery" element={<Navigate to="/store/settings/shipping" replace />} />
        <Route path="/store/site-config" element={<Navigate to="/store/settings" replace />} />
        <Route path="/store/seo-metadata" element={<Navigate to="/store/settings/seo" replace />} />
        <Route path="/store/my-shop" element={<Navigate to="/store/settings/brand" replace />} />

        {/* Store Settings */}
        <Route path="/store/settings" element={<P><StoreSettingsLayoutWrapper /></P>}>
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
          <Route path="checkout-config" element={<StoreSettingsCheckoutConfig />} />
          <Route path="delivery-methods" element={<StoreSettingsDeliveryMethods />} />
        </Route>

        {/* ---- Support ---- */}
        <Route path="/support/tickets" element={<P><SupportTickets /></P>} />
        <Route path="/support/tickets/new" element={<P><NewTicket /></P>} />
        <Route path="/support/tickets/:id" element={<P><TicketDetail /></P>} />

        {/* ---- Maintenance (GMAO) ---- */}
        <Route path="/maintenance" element={<P><MaintenanceDashboard /></P>} />
        <Route path="/maintenance/equipment" element={<P><EquipmentList /></P>} />
        <Route path="/maintenance/equipment/new" element={<P><EquipmentForm /></P>} />
        <Route path="/maintenance/equipment/:id" element={<P><EquipmentDetail /></P>} />
        <Route path="/maintenance/equipment/critical" element={<P><EquipmentCritical /></P>} />
        <Route path="/maintenance/requests" element={<P><RequestsList /></P>} />
        <Route path="/maintenance/requests/new" element={<P><RequestForm /></P>} />
        <Route path="/maintenance/requests/emergency" element={<P><RequestsEmergency /></P>} />
        <Route path="/maintenance/calendar" element={<P><MaintenanceCalendar /></P>} />
        <Route path="/maintenance/reports" element={<P><MaintenanceReports /></P>} />
        <Route path="/maintenance/costs" element={<P><MaintenanceCosts /></P>} />
        <Route path="/maintenance/categories" element={<P><MaintenanceCategories /></P>} />
        <Route path="/maintenance/settings" element={<P><MaintenanceSettings /></P>} />

        {/* ---- CRM ---- */}
        <Route path="/crm" element={<Navigate to="/crm/customers" replace />} />
        <Route path="/crm/customers" element={<P><Module name="CRM"><Customers /></Module></P>} />
        <Route path="/crm/customers/:id" element={<P><CustomerDetail /></P>} />
        <Route path="/crm/customer-segmentation" element={<P><CustomerSegmentation /></P>} />
        <Route path="/crm/customer-categories" element={<P><CustomerCategories /></P>} />
        <Route path="/crm/pipeline" element={<P><Pipeline /></P>} />
        <Route path="/crm/leads" element={<P><Leads /></P>} />
        <Route path="/crm/leads/:id" element={<P><LeadDetail /></P>} />

        {/* CRM Settings */}
        <Route path="/crm/settings" element={<P><CrmSettingsLayoutWrapper /></P>}>
          <Route index element={<CrmSettings />} />
          <Route path="stages" element={<CrmSettingsStages />} />
          <Route path="pricelists" element={<CrmSettingsPricelists />} />
          <Route path="categories" element={<CrmSettingsCategories />} />
          <Route path="scoring" element={<CrmSettingsScoring />} />
        </Route>

        {/* ---- Stock ---- */}
        <Route path="/stock" element={<P><Module name="Stock"><Stock /></Module></P>} />
        <Route path="/inventory" element={<P><Inventory /></P>} />
        <Route path="/stock/moves" element={<P><StockMoves /></P>} />
        <Route path="/stock/transfers" element={<P><StockTransfers /></P>} />
        <Route path="/stock/locations" element={<P><StockLocations /></P>} />
        <Route path="/stock/reordering-rules" element={<P><ReorderingRules /></P>} />
        <Route path="/stock/valuation" element={<P><CurrencyProvider><StockValuation /></CurrencyProvider></P>} />
        <Route path="/stock/turnover" element={<P><CurrencyProvider><StockTurnover /></CurrencyProvider></P>} />
        <Route path="/stock/inventory-groups" element={<P><InventoryGroups /></P>} />
        <Route path="/stock/warehouse-calendars" element={<P><WarehouseCalendars /></P>} />
        <Route path="/warehouses" element={<P><Warehouses /></P>} />
        <Route path="/warehouses/:id" element={<P><WarehouseDetail /></P>} />

        {/* Stock Settings */}
        <Route path="/stock/settings" element={<P><StockSettingsLayoutWrapper /></P>}>
          <Route index element={<StockSettings />} />
          <Route path="valuation" element={<StockSettingsValuation />} />
          <Route path="reordering" element={<StockSettingsReordering />} />
          <Route path="units" element={<StockSettingsUnits />} />
          <Route path="alerts" element={<StockSettingsAlerts />} />
        </Route>

        {/* ---- Finance ---- */}
        <Route path="/finance" element={<FP><FinanceDashboard /></FP>} />
        <Route path="/finance/accounts" element={<FP><FinanceAccounts /></FP>} />
        <Route path="/finance/accounts/new" element={<FP><FinanceAccountNew /></FP>} />
        <Route path="/finance/accounts/:id" element={<FP><FinanceAccountDetail /></FP>} />
        <Route path="/finance/budgets" element={<FP><FinanceBudgets /></FP>} />
        <Route path="/finance/budgets/new" element={<FP><FinanceBudgetNew /></FP>} />
        <Route path="/finance/budgets/:id" element={<FP><FinanceBudgetDetail /></FP>} />
        <Route path="/finance/forecast" element={<FP><FinanceForecast /></FP>} />
        <Route path="/finance/archives" element={<FP><FinanceArchives /></FP>} />
        <Route path="/finance/payment-planning" element={<FP><FinancePaymentPlanning /></FP>} />
        <Route path="/finance/expenses" element={<FP><FinanceExpenses /></FP>} />
        <Route path="/finance/expenses/new" element={<FP><FinanceExpenseNew /></FP>} />
        <Route path="/finance/incomes" element={<FP><FinanceIncomes /></FP>} />
        <Route path="/finance/incomes/new" element={<FP><FinanceIncomeNew /></FP>} />
        <Route path="/finance/categories" element={<FP><FinanceCategories /></FP>} />
        <Route path="/finance/suppliers" element={<FP><FinanceSuppliers /></FP>} />
        <Route path="/finance/suppliers/new" element={<FP><FinanceSupplierNew /></FP>} />
        <Route path="/finance/portfolios" element={<FP><FinancePortfolios /></FP>} />
        <Route path="/finance/scenarios" element={<FP><FinanceScenarios /></FP>} />
        <Route path="/finance/alerts" element={<FP><FinanceAlerts /></FP>} />
        <Route path="/finance/charts" element={<FP><FinanceCharts /></FP>} />
        <Route path="/finance/import" element={<FP><FinanceImport /></FP>} />
        <Route path="/finance/reporting" element={<FP><FinanceReporting /></FP>} />
        <Route path="/finance/reporting/cashflow" element={<FP><FinanceReportingCashflow /></FP>} />
        <Route path="/finance/reporting/by-category" element={<FP><FinanceReportingByCategory /></FP>} />
        <Route path="/finance/reporting/by-account" element={<FP><FinanceReportingByAccount /></FP>} />
        <Route path="/finance/reporting/by-portfolio" element={<FP><FinanceReportingByPortfolio /></FP>} />
        <Route path="/finance/reporting/by-flow" element={<FP><FinanceReportingByFlow /></FP>} />
        <Route path="/finance/reporting/forecast" element={<FP><FinanceReportingForecast /></FP>} />
        <Route path="/finance/reporting/forecasts" element={<FP><FinanceReportingForecasts /></FP>} />
        <Route path="/finance/reporting/profitability" element={<FP><FinanceReportingProfitability /></FP>} />
        <Route path="/finance/reporting/ebitda" element={<FP><FinanceReportingEbitda /></FP>} />
        <Route path="/finance/reporting/bfr" element={<FP><FinanceReportingBfr /></FP>} />
        <Route path="/finance/reporting/dso" element={<FP><FinanceReportingDso /></FP>} />
        <Route path="/finance/reporting/breakeven" element={<FP><FinanceReportingBreakeven /></FP>} />
        <Route path="/finance/reporting/data-quality" element={<FP><FinanceReportingDataQuality /></FP>} />

        {/* Finance Redirections */}
        <Route path="/finance/transactions" element={<Navigate to="/finance/expenses" replace />} />
        <Route path="/finance/reporting/overview" element={<Navigate to="/finance/reporting" replace />} />

        {/* Finance Settings */}
        <Route path="/finance/settings" element={<P><FinanceErrorBoundary><Suspense fallback={<PageLoader />}><SettingsLayoutWrapper /></Suspense></FinanceErrorBoundary></P>}>
          <Route index element={<FinanceSettings />} />
          <Route path="flux" element={<FinanceSettingsFlux />} />
          <Route path="notifications" element={<FinanceSettingsNotifications />} />
          <Route path="integrations" element={<FinanceSettingsIntegrations />} />
          <Route path="invoicing" element={<FinanceSettingsInvoicing />} />
          <Route path="export-fec" element={<FinanceSettingsExportFEC />} />
        </Route>

        {/* ---- Invoicing ---- */}
        <Route path="/invoicing" element={<Navigate to="/invoicing/invoices" replace />} />
        <Route path="/invoicing/invoices" element={<FP><InvoicesList /></FP>} />
        <Route path="/invoicing/invoices/new" element={<FP><InvoiceNew /></FP>} />
        <Route path="/invoicing/invoices/quick" element={<FP><InvoiceQuick /></FP>} />
        <Route path="/invoicing/invoices/ocr" element={<FP><InvoiceOCR /></FP>} />
        <Route path="/invoicing/subscriptions" element={<FP><InvoicingSubscriptions /></FP>} />
        <Route path="/invoicing/invoices/:id/facturx" element={<FP><InvoiceFacturX /></FP>} />
        <Route path="/invoicing/analytics/analytic-accounts" element={<FP><AnalyticAccounts /></FP>} />
        <Route path="/invoicing/risk" element={<FP><PaymentRisk /></FP>} />
        <Route path="/invoicing/settings/currencies" element={<FP><InvoicingSettingsCurrencies /></FP>} />
        <Route path="/invoicing/settings/fec" element={<P><FinanceErrorBoundary><Suspense fallback={<PageLoader />}><FinanceSettingsExportFEC /></Suspense></FinanceErrorBoundary></P>} />
        <Route path="/invoicing/approvals" element={<FP><InvoicingApprovals /></FP>} />
        <Route path="/invoicing/invoices/:id" element={<FP><InvoiceDetail /></FP>} />
        <Route path="/invoicing/analytics/forecast" element={<FP><RevenueForecast /></FP>} />
        <Route path="/invoicing/quotes" element={<P><QuotesList /></P>} />
        <Route path="/invoicing/quotes/:id" element={<P><QuoteDetail /></P>} />

        {/* Redirects - Old routes to new Invoicing module */}
        <Route path="/finance/invoices" element={<Navigate to="/invoicing/invoices" replace />} />
        <Route path="/finance/invoices/new" element={<Navigate to="/invoicing/invoices/new" replace />} />
        <Route path="/finance/invoices/quick" element={<Navigate to="/invoicing/invoices/quick" replace />} />
        <Route path="/finance/invoices/ocr" element={<Navigate to="/invoicing/invoices/ocr" replace />} />
        <Route path="/finance/invoices/:id" element={<Navigate to="/invoicing/invoices/:id" replace />} />
        <Route path="/finance/invoices/:id/facturx" element={<Navigate to="/invoicing/invoices/:id/facturx" replace />} />
        <Route path="/finance/subscriptions" element={<Navigate to="/invoicing/subscriptions" replace />} />
        <Route path="/finance/approvals" element={<Navigate to="/invoicing/approvals" replace />} />
        <Route path="/finance/analytics/forecast" element={<Navigate to="/invoicing/analytics/forecast" replace />} />
        <Route path="/finance/analytics/analytic-accounts" element={<Navigate to="/invoicing/analytics/analytic-accounts" replace />} />
        <Route path="/finance/payment-risk" element={<Navigate to="/invoicing/risk" replace />} />
        <Route path="/finance/settings/currencies" element={<Navigate to="/invoicing/settings/currencies" replace />} />
        <Route path="/finance/settings/export-fec" element={<Navigate to="/invoicing/settings/fec" replace />} />
        <Route path="/sales/quotes" element={<Navigate to="/invoicing/quotes" replace />} />
        <Route path="/sales/quotes/:id" element={<Navigate to="/invoicing/quotes/:id" replace />} />

        {/* ---- Marketing ---- */}
        <Route path="/marketing" element={<P><Module name="Marketing"><MarketingDashboard /></Module></P>} />
        <Route path="/marketing/campaigns" element={<P><MarketingCampaigns /></P>} />
        <Route path="/marketing/campaigns/new" element={<P><MarketingCampaignNew /></P>} />
        <Route path="/marketing/campaigns/:id" element={<P><MarketingCampaignDetail /></P>} />
        <Route path="/marketing/campaigns/:id/tracking" element={<P><CampaignTrackingDetail /></P>} />
        <Route path="/marketing/automation" element={<P><AutomationWorkflows /></P>} />
        <Route path="/marketing/email" element={<P><MarketingEmail /></P>} />
        <Route path="/marketing/email/templates" element={<P><MarketingEmailTemplates /></P>} />
        <Route path="/marketing/sms" element={<P><MarketingSMS /></P>} />
        <Route path="/marketing/contacts" element={<P><MarketingContacts /></P>} />
        <Route path="/marketing/contacts/:id" element={<P><MarketingContactDetail /></P>} />

        {/* Marketing Settings */}
        <Route path="/marketing/settings" element={<P><MarketingSettingsLayoutWrapper /></P>}>
          <Route index element={<MarketingSettings />} />
          <Route path="email" element={<MarketingSettingsEmail />} />
          <Route path="sms" element={<MarketingSettingsSMS />} />
        </Route>

        {/* ---- HR ---- */}
        <Route path="/hr" element={<P><Module name="Ressources Humaines"><HRDashboard /></Module></P>} />
        <Route path="/hr/employees" element={<P><HREmployees /></P>} />
        <Route path="/hr/employees/new" element={<P><HREmployeeNew /></P>} />
        <Route path="/hr/employees/:id" element={<P><HREmployeeDetail /></P>} />
        <Route path="/hr/departments" element={<P><HRDepartments /></P>} />
        <Route path="/hr/jobs" element={<P><HRJobs /></P>} />
        <Route path="/hr/contracts" element={<P><HRContracts /></P>} />
        <Route path="/hr/contracts/new" element={<P><HRContractNew /></P>} />
        <Route path="/hr/attendance" element={<P><HRAttendance /></P>} />
        <Route path="/hr/leaves" element={<P><HRLeaves /></P>} />
        <Route path="/hr/leaves/calendar" element={<P><HRLeavesCalendar /></P>} />
        <Route path="/hr/leaves/allocations" element={<P><HRLeavesAllocations /></P>} />
        <Route path="/hr/leaves/types" element={<P><HRLeavesTypes /></P>} />
        <Route path="/hr/settings" element={<P><HRSettings /></P>} />
        <Route path="/hr/appraisals" element={<P><HRAppraisals /></P>} />
        <Route path="/hr/appraisals/:id" element={<P><HRAppraisalDetail /></P>} />
        <Route path="/hr/skills" element={<P><HRSkills /></P>} />

        {/* ---- POS ---- */}
        <Route path="/pos" element={<P><Module name="Point de Vente"><POSDashboard /></Module></P>} />
        <Route path="/pos/terminal" element={<P><POSTerminal /></P>} />
        <Route path="/pos/kiosk" element={<P><POSKiosk /></P>} />
        <Route path="/pos/kds" element={<P><POSKDS /></P>} />
        <Route path="/pos/rush" element={<P><POSRush /></P>} />
        <Route path="/pos/mobile" element={<P><POSMobile /></P>} />
        <Route path="/pos/analytics" element={<P><POSAnalytics /></P>} />
        <Route path="/pos/click-collect" element={<P><POSClickCollect /></P>} />
        <Route path="/pos/session/open" element={<P><POSSessionOpen /></P>} />
        <Route path="/pos/orders" element={<P><POSOrders /></P>} />
        <Route path="/pos/sessions" element={<P><POSSessions /></P>} />
        <Route path="/pos/reports/sales" element={<P><POSReportsSales /></P>} />
        <Route path="/pos/reports/payments" element={<P><POSReportsPayments /></P>} />
        <Route path="/pos/settings" element={<P><POSSettings /></P>} />
        <Route path="/pos/settings/terminals" element={<P><POSSettingsTerminals /></P>} />
        <Route path="/pos/settings/payments" element={<P><POSSettingsPayments /></P>} />
        <Route path="/pos/settings/receipts" element={<P><POSSettingsReceipts /></P>} />
        <Route path="/pos/customer-display" element={<P><POSCustomerDisplay /></P>} />

        {/* ---- Global Settings ---- */}
        <Route path="/settings" element={<P><GlobalSettings /></P>} />
        <Route path="/settings/preferences" element={<P><GlobalSettingsPreferences /></P>} />
        <Route path="/settings/email" element={<P><GlobalSettingsEmail /></P>} />
        <Route path="/settings/sms" element={<P><GlobalSettingsSMS /></P>} />
        <Route path="/settings/security" element={<P><GlobalSettingsSecurity /></P>} />
        <Route path="/settings/devise" element={<P><GlobalSettingsDevise /></P>} />
        <Route path="/settings/tva" element={<P><GlobalSettingsTva /></P>} />
        <Route path="/settings/team" element={<P><GlobalSettingsTeam /></P>} />

        {/* ---- Others ---- */}
        <Route path="/analytics" element={<P><Analytics /></P>} />
        <Route path="/invoices" element={<P><Invoices /></P>} />
        <Route path="/payments" element={<P><Payments /></P>} />
        <Route path="/pricelists" element={<P><Pricelists /></P>} />
        <Route path="/pricelists/:id" element={<P><PricelistDetail /></P>} />
        <Route path="/api-guide" element={<P><ApiGuide /></P>} />
      </Routes>
    </Suspense>
  )
}
