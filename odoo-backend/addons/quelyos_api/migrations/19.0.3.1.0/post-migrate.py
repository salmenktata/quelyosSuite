# -*- coding: utf-8 -*-
"""
Migration 19.0.3.1.0 - Index Composites Tenant Performance

Ajoute des indexes composites (tenant_id, ...) sur les tables volumineuses
pour optimiser les requêtes multi-tenant.

Impact attendu : Requêtes 3-5x plus rapides
"""

import logging

_logger = logging.getLogger(__name__)


def migrate(cr, version):
    """
    Crée des indexes composites pour optimiser les requêtes tenant-based
    """
    if not version:
        return

    _logger.info("Migration 19.0.3.1.0: Création indexes composites tenant_id")

    # Index composites sur tables principales
    indexes = [
        # Products (table volumineuse)
        (
            'idx_product_template_tenant_created',
            'product_template',
            '(company_id, create_date DESC)',
            'Optimise requêtes produits par tenant + date création'
        ),
        (
            'idx_product_template_tenant_name',
            'product_template',
            '(company_id, name)',
            'Optimise recherche produits par tenant + nom'
        ),
        (
            'idx_product_template_tenant_active',
            'product_template',
            '(company_id, active, write_date DESC)',
            'Optimise filtrage produits actifs par tenant'
        ),

        # Orders (requêtes fréquentes)
        (
            'idx_sale_order_tenant_date',
            'sale_order',
            '(company_id, date_order DESC)',
            'Optimise requêtes commandes par tenant + date'
        ),
        (
            'idx_sale_order_tenant_state',
            'sale_order',
            '(company_id, state, date_order DESC)',
            'Optimise filtrage commandes par tenant + statut'
        ),
        (
            'idx_sale_order_tenant_partner',
            'sale_order',
            '(company_id, partner_id)',
            'Optimise recherche commandes par tenant + client'
        ),

        # Partners/Customers (recherches fréquentes)
        (
            'idx_res_partner_tenant_name',
            'res_partner',
            '(company_id, name)',
            'Optimise recherche contacts par tenant + nom'
        ),
        (
            'idx_res_partner_tenant_email',
            'res_partner',
            '(company_id, email)',
            'Optimise recherche contacts par tenant + email'
        ),
        (
            'idx_res_partner_tenant_active',
            'res_partner',
            '(company_id, active, customer_rank DESC)',
            'Optimise filtrage clients actifs par tenant'
        ),

        # Invoices (comptabilité)
        (
            'idx_account_move_tenant_date',
            'account_move',
            '(company_id, invoice_date DESC)',
            'Optimise requêtes factures par tenant + date'
        ),
        (
            'idx_account_move_tenant_state',
            'account_move',
            '(company_id, state, move_type)',
            'Optimise filtrage factures par tenant + type'
        ),

        # Stock (inventaire)
        (
            'idx_stock_quant_tenant_product',
            'stock_quant',
            '(company_id, product_id, location_id)',
            'Optimise requêtes stock par tenant + produit'
        ),
        (
            'idx_stock_move_tenant_date',
            'stock_move',
            '(company_id, date, state)',
            'Optimise requêtes mouvements stock par tenant'
        ),

        # CRM Leads
        (
            'idx_crm_lead_tenant_stage',
            'crm_lead',
            '(company_id, stage_id, create_date DESC)',
            'Optimise requêtes leads par tenant + étape'
        ),
        (
            'idx_crm_lead_tenant_partner',
            'crm_lead',
            '(company_id, partner_id)',
            'Optimise recherche leads par tenant + contact'
        ),

        # Marketing (campagnes)
        (
            'idx_mailing_mailing_tenant_date',
            'mailing_mailing',
            '(company_id, create_date DESC)',
            'Optimise requêtes campagnes par tenant'
        ),

        # Employees (RH)
        (
            'idx_hr_employee_tenant_active',
            'hr_employee',
            '(company_id, active, name)',
            'Optimise recherche employés par tenant'
        ),
    ]

    created_count = 0
    skipped_count = 0

    for index_name, table_name, columns, description in indexes:
        # Vérifier si l'index existe déjà
        cr.execute("""
            SELECT 1
            FROM pg_indexes
            WHERE indexname = %s
        """, (index_name,))

        if cr.fetchone():
            _logger.info(f"  ⏭️  Index déjà existant : {index_name}")
            skipped_count += 1
            continue

        # Vérifier si la table existe
        cr.execute("""
            SELECT 1
            FROM information_schema.tables
            WHERE table_name = %s
        """, (table_name,))

        if not cr.fetchone():
            _logger.warning(f"  ⚠️  Table inexistante : {table_name} - Skip index {index_name}")
            skipped_count += 1
            continue

        try:
            # Créer l'index de manière concurrente (ne bloque pas la table)
            _logger.info(f"  ✅ Création index : {index_name} sur {table_name}")
            _logger.info(f"     Description : {description}")

            # Note: CONCURRENTLY ne peut pas être utilisé dans un bloc de transaction
            # On utilise donc CREATE INDEX normal (nécessite EXCLUSIVE LOCK mais rapide)
            cr.execute(f"""
                CREATE INDEX IF NOT EXISTS {index_name}
                ON {table_name} {columns}
            """)

            created_count += 1
            _logger.info(f"     ✅ Index {index_name} créé avec succès")

        except Exception as e:
            _logger.error(f"  ❌ Erreur création index {index_name}: {str(e)}")
            # Continuer avec les autres indexes même si un échoue
            skipped_count += 1

    _logger.info(f"""
Migration 19.0.3.1.0 terminée :
  ✅ {created_count} indexes créés
  ⏭️  {skipped_count} indexes skippés (déjà existants ou erreurs)
  📊 Total : {created_count + skipped_count} indexes traités

Impact attendu :
  - Requêtes produits : 3-5x plus rapides
  - Requêtes commandes : 3-4x plus rapides
  - Requêtes contacts : 2-3x plus rapides
  - Requêtes stock : 4-6x plus rapides
""")
