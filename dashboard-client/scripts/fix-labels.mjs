#!/usr/bin/env node

/**
 * Script de correction des labels text-gray-700 → text-gray-900 dark:text-white
 */

import { readFileSync, writeFileSync } from 'fs'

const files = [
  'src/components/HeroSlideForm.tsx',
  'src/components/ImageSearcher.tsx',
  'src/components/admin/HealthDashboard.tsx',
  'src/components/admin/ai/AiProviderModal.tsx',
  'src/components/common/ImageUpload.tsx',
  'src/components/common/ImportProductsModal.tsx',
  'src/components/common/Input.tsx',
  'src/components/common/VariantManager.tsx',
  'src/components/common/VariantManagerParts/AddAttributeForm.tsx',
  'src/components/common/VariantManagerParts/EditAttributeModal.tsx',
  'src/components/pos/SessionCloseModal.tsx',
  'src/components/pricelists/PricelistFormModal.tsx',
  'src/components/pricelists/PricelistItemFormModal.tsx',
  'src/components/stock/ExportStockModal.tsx',
  'src/components/stock/LocationFormModal.tsx',
  'src/components/stock/ReorderingRuleFormModal.tsx',
  'src/components/stock/StockAdjustmentModal.tsx',
  'src/components/stock/TransferModal.tsx',
  'src/components/store/products/ProductFilters.tsx',
  'src/components/stripe/ThemeCheckoutForm.tsx',
  'src/components/theme-builder/AIGeneratorModal.tsx',
  'src/components/theme-builder/ColorPicker.tsx',
  'src/components/theme-builder/FontSelector.tsx',
  'src/components/theme-builder/SectionConfigPanel.tsx',
  'src/pages/Inventory.tsx',
  'src/pages/Invoices.tsx',
  'src/pages/Payments.tsx',
  'src/pages/Pricelists.tsx',
  'src/pages/SatisfactionPublic.tsx',
  'src/pages/StockLocations.tsx',
  'src/pages/StockMoves.tsx',
  'src/pages/Tenants.tsx',
  'src/pages/WarehouseDetail.tsx',
  'src/pages/Warehouses.tsx',
  'src/pages/crm/CustomerCategories.tsx',
  'src/pages/crm/CustomerDetail.tsx',
  'src/pages/crm/LeadDetail.tsx',
  'src/pages/crm/settings/scoring/page.tsx',
  'src/pages/finance/portfolios/page.tsx',
  'src/pages/hr/appraisals/[id]/page.tsx',
  'src/pages/hr/appraisals/page.tsx',
  'src/pages/hr/contracts/new/page.tsx',
  'src/pages/hr/employees/new/page.tsx',
  'src/pages/hr/jobs/page.tsx',
  'src/pages/hr/leaves/allocations/page.tsx',
  'src/pages/hr/settings/page.tsx',
  'src/pages/hr/skills/page.tsx',
  'src/pages/marketing/campaigns/new/page.tsx',
  'src/pages/marketing/contacts/page.tsx',
  'src/pages/marketing/settings/email/page.tsx',
  'src/pages/marketing/settings/sms/page.tsx',
  'src/pages/settings/email/page.tsx',
  'src/pages/settings/sms/page.tsx',
  'src/pages/stock/ReorderingRules.tsx',
  'src/pages/stock/settings/alerts/page.tsx',
  'src/pages/stock/settings/reordering/page.tsx',
  'src/pages/stock/turnover/page.tsx',
  'src/pages/stock/valuation/page.tsx',
  'src/pages/store/AbandonedCarts.tsx',
  'src/pages/store/Attributes.tsx',
  'src/pages/store/Blog.tsx',
  'src/pages/store/Bundles.tsx',
  'src/pages/store/Categories.tsx',
  'src/pages/store/CouponForm.tsx',
  'src/pages/store/Coupons.tsx',
  'src/pages/store/FAQ.tsx',
  'src/pages/store/FlashSales.tsx',
  'src/pages/store/LiveEvents.tsx',
  'src/pages/store/MarketingPopups.tsx',
  'src/pages/store/Menus.tsx',
  'src/pages/store/Orders.tsx',
  'src/pages/store/ProductForm.tsx',
  'src/pages/store/PromoMessages.tsx',
  'src/pages/store/StaticPages.tsx',
  'src/pages/store/Testimonials.tsx',
  'src/pages/store/settings/brand/page.tsx',
  'src/pages/store/settings/contact/page.tsx',
  'src/pages/store/settings/notifications/page.tsx',
  'src/pages/store/settings/payment-methods/page.tsx',
  'src/pages/store/settings/returns/page.tsx',
  'src/pages/store/settings/seo/page.tsx',
  'src/pages/store/settings/shipping/page.tsx',
  'src/pages/store/settings/shipping-zones/page.tsx',
  'src/pages/store/settings/social/page.tsx',
  'src/pages/store/themes/submit.tsx',
  'src/pages/support/NewTicket.tsx',
  'src/pages/support/TicketDetail.tsx',
  'src/pages/support/Tickets.tsx',
]

let fixed = 0

files.forEach(file => {
  try {
    const content = readFileSync(file, 'utf-8')

    // Remplacer text-gray-700 par text-gray-900 dark:text-white
    const newContent = content.replace(/text-gray-700/g, 'text-gray-900 dark:text-white')

    if (newContent !== content) {
      writeFileSync(file, newContent, 'utf-8')
      console.log(`✓ ${file}`)
      fixed++
    }
  } catch (_err) {
    console.error(`✗ ${file} (not found)`)
  }
})

console.log(`\n✨ ${fixed} fichiers corrigés`)
