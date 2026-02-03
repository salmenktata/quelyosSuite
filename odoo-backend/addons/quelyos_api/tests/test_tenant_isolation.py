# -*- coding: utf-8 -*-
"""
Tests d'isolation multi-tenant - SÉCURITÉ CRITIQUE

Usage:
    docker exec quelyos-odoo python3 -m odoo -d quelyos --test-tags tenant_isolation --stop-after-init
"""

from odoo.tests import TransactionCase, tagged
from unittest.mock import patch


@tagged('post_install', 'security', 'tenant_isolation')
class TestTenantIsolation(TransactionCase):
    """Tests de sécurité pour l'isolation multi-tenant"""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Créer 2 tenants pour tester l'isolation
        Tenant = cls.env['quelyos.tenant'].sudo()

        cls.tenant1 = Tenant.create({
            'name': 'Tenant Test 1',
            'code': 'tenant1_test',
            'domain': 'tenant1.test.local',
            'backoffice_domain': 'tenant1-admin.test.local',
        })

        cls.tenant2 = Tenant.create({
            'name': 'Tenant Test 2',
            'code': 'tenant2_test',
            'domain': 'tenant2.test.local',
            'backoffice_domain': 'tenant2-admin.test.local',
        })

        # Créer des produits pour chaque tenant
        Product = cls.env['product.template'].sudo()

        cls.product_tenant1 = Product.with_context(
            allowed_company_ids=[cls.tenant1.company_id.id]
        ).create({
            'name': 'Product Tenant 1',
            'company_id': cls.tenant1.company_id.id,
            'list_price': 100.0,
        })

        cls.product_tenant2 = Product.with_context(
            allowed_company_ids=[cls.tenant2.company_id.id]
        ).create({
            'name': 'Product Tenant 2',
            'company_id': cls.tenant2.company_id.id,
            'list_price': 200.0,
        })

    def test_01_cross_tenant_access_blocked(self):
        """CRITIQUE - Vérifier qu'un utilisateur ne peut PAS accéder aux données d'un autre tenant"""
        # Créer un utilisateur pour tenant1
        User = self.env['res.users'].sudo()
        user_tenant1 = User.create({
            'name': 'User Tenant 1',
            'login': 'user_tenant1@test.com',
            'company_id': self.tenant1.company_id.id,
            'company_ids': [(6, 0, [self.tenant1.company_id.id])],
        })

        # Se connecter en tant que user_tenant1
        Product = self.env['product.template'].with_user(user_tenant1)

        # Essayer d'accéder au produit de tenant2 - Devrait être VIDE
        products_tenant2 = Product.search([
            ('id', '=', self.product_tenant2.id)
        ])

        self.assertEqual(
            len(products_tenant2),
            0,
            "SECURITY VIOLATION: User from tenant1 should NOT see tenant2 products"
        )

    def test_02_indexes_composite_tenant_exist(self):
        """Vérifier que les indexes composites tenant_id existent"""
        indexes_to_check = [
            'idx_product_template_tenant_created',
            'idx_sale_order_tenant_date',
            'idx_res_partner_tenant_name',
        ]

        for index_name in indexes_to_check:
            self.env.cr.execute("""
                SELECT 1 FROM pg_indexes WHERE indexname = %s
            """, (index_name,))

            result = self.env.cr.fetchone()
            self.assertIsNotNone(
                result,
                f"Index {index_name} should exist"
            )
