-- =============================================================================
-- Migration: Enable Row Level Security (RLS) pour isolation multi-tenant
-- =============================================================================
-- Date: 2026-01-30
-- Description: Active RLS PostgreSQL sur toutes les tables avec tenant_id
--              pour garantir une isolation complète des données par tenant
--
-- CRITIQUE SÉCURITÉ: Cette migration renforce l'isolation multi-tenant au niveau
--                   base de données, empêchant les requêtes SQL directes de
--                   contourner les filtres applicatifs.
--
-- Usage:
--   psql -d quelyos_db -f enable_rls_tenant_isolation.sql
-- =============================================================================

-- Configuration: Définir le tenant courant pour la session
-- L'application doit appeler ceci au début de chaque requête:
-- SET LOCAL app.current_tenant = '<tenant_id>';

-- =============================================================================
-- FONCTION HELPER: Récupérer le tenant courant depuis la config session
-- =============================================================================

CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS INTEGER AS $$
BEGIN
  RETURN nullif(current_setting('app.current_tenant', true), '')::integer;
EXCEPTION
  WHEN OTHERS THEN
    -- Si app.current_tenant n'est pas défini, retourner NULL
    -- Cela bloquera l'accès (policy échouera)
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_current_tenant_id() IS
'Récupère le tenant_id depuis current_setting(''app.current_tenant''). Utilisé par les policies RLS.';

-- =============================================================================
-- STORE / E-COMMERCE
-- =============================================================================

-- product.template
ALTER TABLE product_template ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_product_template ON product_template
  USING (
    -- Accès uniquement aux produits du tenant courant
    tenant_id = get_current_tenant_id()
    OR
    -- OU si c'est un produit global (tenant_id NULL) pour templates partagés
    tenant_id IS NULL
  );

COMMENT ON POLICY tenant_isolation_product_template ON product_template IS
'Isolation RLS: Accès uniquement aux produits du tenant courant ou globaux (templates)';

-- product.product (variantes)
ALTER TABLE product_product ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_product_product ON product_product
  USING (
    -- Accès via le template parent
    EXISTS (
      SELECT 1 FROM product_template pt
      WHERE pt.id = product_product.product_tmpl_id
        AND (pt.tenant_id = get_current_tenant_id() OR pt.tenant_id IS NULL)
    )
  );

-- sale.order
ALTER TABLE sale_order ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_sale_order ON sale_order
  USING (tenant_id = get_current_tenant_id());

-- sale.order.line
ALTER TABLE sale_order_line ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_sale_order_line ON sale_order_line
  USING (
    EXISTS (
      SELECT 1 FROM sale_order so
      WHERE so.id = sale_order_line.order_id
        AND so.tenant_id = get_current_tenant_id()
    )
  );

-- product.category
ALTER TABLE product_category ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_product_category ON product_category
  USING (tenant_id = get_current_tenant_id() OR tenant_id IS NULL);

-- =============================================================================
-- CRM
-- =============================================================================

-- res.partner (clients/fournisseurs)
ALTER TABLE res_partner ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_res_partner ON res_partner
  USING (tenant_id = get_current_tenant_id() OR tenant_id IS NULL);

-- crm.lead
ALTER TABLE crm_lead ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_crm_lead ON crm_lead
  USING (tenant_id = get_current_tenant_id());

-- =============================================================================
-- FINANCE
-- =============================================================================

-- account.move (factures/écritures comptables)
ALTER TABLE account_move ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_account_move ON account_move
  USING (tenant_id = get_current_tenant_id());

-- account.move.line
ALTER TABLE account_move_line ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_account_move_line ON account_move_line
  USING (
    EXISTS (
      SELECT 1 FROM account_move am
      WHERE am.id = account_move_line.move_id
        AND am.tenant_id = get_current_tenant_id()
    )
  );

-- =============================================================================
-- STOCK
-- =============================================================================

-- stock.location
ALTER TABLE stock_location ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_stock_location ON stock_location
  USING (tenant_id = get_current_tenant_id() OR tenant_id IS NULL);

-- stock.move
ALTER TABLE stock_move ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_stock_move ON stock_move
  USING (tenant_id = get_current_tenant_id());

-- stock.quant (inventaire)
ALTER TABLE stock_quant ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_stock_quant ON stock_quant
  USING (tenant_id = get_current_tenant_id());

-- =============================================================================
-- HR
-- =============================================================================

-- hr.employee
ALTER TABLE hr_employee ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_hr_employee ON hr_employee
  USING (tenant_id = get_current_tenant_id());

-- hr.department
ALTER TABLE hr_department ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_hr_department ON hr_department
  USING (tenant_id = get_current_tenant_id());

-- hr.contract
ALTER TABLE hr_contract ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_hr_contract ON hr_contract
  USING (tenant_id = get_current_tenant_id());

-- hr.attendance
ALTER TABLE hr_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_hr_attendance ON hr_attendance
  USING (tenant_id = get_current_tenant_id());

-- hr.leave
ALTER TABLE hr_leave ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_hr_leave ON hr_leave
  USING (tenant_id = get_current_tenant_id());

-- =============================================================================
-- QUELYOS CUSTOM MODELS
-- =============================================================================

-- quelyos.tenant (table principale tenants)
-- PAS de RLS ici car accès par super-admin uniquement

-- quelyos.product.review
ALTER TABLE quelyos_product_review ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_quelyos_product_review ON quelyos_product_review
  USING (tenant_id = get_current_tenant_id());

-- quelyos.collection
ALTER TABLE quelyos_collection ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_quelyos_collection ON quelyos_collection
  USING (tenant_id = get_current_tenant_id());

-- quelyos.bundle
ALTER TABLE quelyos_bundle ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_quelyos_bundle ON quelyos_bundle
  USING (tenant_id = get_current_tenant_id());

-- quelyos.flash.sale
ALTER TABLE quelyos_flash_sale ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_quelyos_flash_sale ON quelyos_flash_sale
  USING (tenant_id = get_current_tenant_id());

-- quelyos.faq.category
ALTER TABLE quelyos_faq_category ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_quelyos_faq_category ON quelyos_faq_category
  USING (tenant_id = get_current_tenant_id());

-- quelyos.testimonial
ALTER TABLE quelyos_testimonial ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_quelyos_testimonial ON quelyos_testimonial
  USING (tenant_id = get_current_tenant_id());

-- quelyos.api.key
ALTER TABLE quelyos_api_key ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_quelyos_api_key ON quelyos_api_key
  USING (tenant_id = get_current_tenant_id());

-- quelyos.subscription
ALTER TABLE quelyos_subscription ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_quelyos_subscription ON quelyos_subscription
  USING (tenant_id = get_current_tenant_id());

-- quelyos.theme
ALTER TABLE quelyos_theme ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_quelyos_theme ON quelyos_theme
  USING (tenant_id = get_current_tenant_id());

-- =============================================================================
-- POS (Point of Sale)
-- =============================================================================

-- pos.config
ALTER TABLE pos_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_pos_config ON pos_config
  USING (tenant_id = get_current_tenant_id());

-- pos.order
ALTER TABLE pos_order ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_pos_order ON pos_order
  USING (tenant_id = get_current_tenant_id());

-- pos.session
ALTER TABLE pos_session ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_pos_session ON pos_session
  USING (tenant_id = get_current_tenant_id());

-- =============================================================================
-- INDEX COMPOSITES pour performances RLS
-- =============================================================================
-- Les policies RLS utilisent tenant_id intensivement, ces index améliorent les perfs

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_template_tenant_id
  ON product_template(tenant_id) WHERE tenant_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sale_order_tenant_id
  ON sale_order(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_res_partner_tenant_id
  ON res_partner(tenant_id) WHERE tenant_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_lead_tenant_id
  ON crm_lead(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_account_move_tenant_id
  ON account_move(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stock_location_tenant_id
  ON stock_location(tenant_id) WHERE tenant_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hr_employee_tenant_id
  ON hr_employee(tenant_id);

-- =============================================================================
-- VÉRIFICATION
-- =============================================================================

-- Pour tester l'isolation, exécuter:
/*
-- En tant que tenant 1:
SET app.current_tenant = '1';
SELECT * FROM product_template;  -- Doit voir uniquement produits tenant 1

-- En tant que tenant 2:
SET app.current_tenant = '2';
SELECT * FROM product_template;  -- Doit voir uniquement produits tenant 2

-- Sans tenant (doit échouer):
RESET app.current_tenant;
SELECT * FROM product_template;  -- Doit retourner 0 résultats ou erreur
*/

-- =============================================================================
-- NOTES IMPORTANTES
-- =============================================================================
/*
1. ACTIVATION BACKEND:
   Le code Python Odoo doit appeler au début de chaque requête HTTP:

   @http.route(...)
   def my_endpoint(self, **kwargs):
       tenant_id = get_tenant_from_header()
       if tenant_id:
           request.env.cr.execute(
               "SET LOCAL app.current_tenant = %s",
               (tenant_id,)
           )
       # ... reste du code

2. SUPER-ADMIN:
   Pour contourner RLS (admin global):
   SET SESSION AUTHORIZATION postgres;  -- Postgres superuser

3. ROLLBACK:
   Pour désactiver RLS sur une table:
   ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
   DROP POLICY tenant_isolation_table_name ON table_name;

4. MONITORING:
   Vérifier les policies actives:
   SELECT schemaname, tablename, policyname, permissive, roles, qual
   FROM pg_policies
   WHERE schemaname = 'public'
   ORDER BY tablename;
*/
