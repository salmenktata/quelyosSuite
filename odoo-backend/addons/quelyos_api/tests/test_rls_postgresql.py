# -*- coding: utf-8 -*-
"""
Tests Row Level Security (RLS) PostgreSQL

Vérifie que les policies RLS PostgreSQL fonctionnent correctement
pour isolation au niveau base de données (couche supplémentaire
en plus des ir.rule Odoo).

Lancer :
  docker exec quelyos-odoo odoo-bin -c /etc/odoo/odoo.conf \
    -d quelyos --test-tags=rls_postgresql --stop-after-init
"""

import time
import logging
from odoo.tests.common import TransactionCase, tagged

_logger = logging.getLogger(__name__)


@tagged('post_install', '-at_install', 'rls_postgresql')
class TestRLSPostgreSQL(TransactionCase):
    """Tests RLS PostgreSQL pour isolation multi-tenant"""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        Tenant = cls.env['quelyos.tenant'].sudo()
        Company = cls.env['res.company'].sudo()

        cls.company_a = Company.create({'name': 'RLS Company A'})
        cls.company_b = Company.create({'name': 'RLS Company B'})

        cls.tenant_a = Tenant.create({
            'name': 'RLS Tenant A',
            'code': 'rls-a',
            'domain': 'rls-a.quelyos.local',
            'company_id': cls.company_a.id,
        })

        cls.tenant_b = Tenant.create({
            'name': 'RLS Tenant B',
            'code': 'rls-b',
            'domain': 'rls-b.quelyos.local',
            'company_id': cls.company_b.id,
        })

        _logger.info(
            'RLS test tenants: A=%s, B=%s', cls.tenant_a.id, cls.tenant_b.id
        )

    # =========================================================================
    # INFRASTRUCTURE RLS
    # =========================================================================

    def test_rls_function_exists(self):
        """Fonction get_current_tenant_id() existe dans pg_proc"""
        self.env.cr.execute("""
            SELECT COUNT(*) FROM pg_proc
            WHERE proname = 'get_current_tenant_id'
        """)
        count = self.env.cr.fetchone()[0]
        self.assertGreaterEqual(count, 1,
                               "Fonction get_current_tenant_id() absente")

    def test_rls_function_returns_null_without_context(self):
        """Sans SET app.current_tenant, retourne NULL"""
        self.env.cr.execute("RESET app.current_tenant")
        self.env.cr.execute("SELECT get_current_tenant_id()")
        result = self.env.cr.fetchone()[0]
        self.assertIsNone(result,
                         "get_current_tenant_id() devrait retourner NULL sans contexte")

    def test_rls_function_returns_tenant_id(self):
        """Après SET app.current_tenant, retourne le bon ID"""
        self.env.cr.execute(
            "SET LOCAL app.current_tenant = %s", (self.tenant_a.id,)
        )
        self.env.cr.execute("SELECT get_current_tenant_id()")
        result = self.env.cr.fetchone()[0]
        self.assertEqual(result, self.tenant_a.id)

    # =========================================================================
    # RLS ACTIVÉ SUR TABLES CRITIQUES
    # =========================================================================

    def test_rls_enabled_product_template(self):
        """RLS activé sur product_template"""
        self._assert_rls_enabled('product_template')

    def test_rls_enabled_product_product(self):
        """RLS activé sur product_product"""
        self._assert_rls_enabled('product_product')

    def test_rls_enabled_sale_order(self):
        """RLS activé sur sale_order"""
        self._assert_rls_enabled('sale_order')

    def test_rls_enabled_sale_order_line(self):
        """RLS activé sur sale_order_line"""
        self._assert_rls_enabled('sale_order_line')

    def _assert_rls_enabled(self, table_name):
        """Helper : vérifie que RLS est activé sur une table"""
        self.env.cr.execute("""
            SELECT relrowsecurity FROM pg_class WHERE relname = %s
        """, (table_name,))
        row = self.env.cr.fetchone()
        if row is None:
            self.skipTest(f"Table {table_name} non trouvée")
        self.assertTrue(row[0], f"RLS NON activé sur {table_name}")

    # =========================================================================
    # POLICIES RLS
    # =========================================================================

    def test_policies_exist(self):
        """Au moins une policy tenant_isolation_* existe"""
        self.env.cr.execute("""
            SELECT COUNT(*) FROM pg_policies
            WHERE policyname LIKE 'tenant_isolation_%%'
        """)
        count = self.env.cr.fetchone()[0]
        self.assertGreater(count, 0, "Aucune policy tenant_isolation_* trouvée")

    def test_policy_on_product_template(self):
        """Policy RLS existe sur product_template"""
        self._assert_policy_exists('product_template')

    def test_policy_on_sale_order(self):
        """Policy RLS existe sur sale_order"""
        self._assert_policy_exists('sale_order')

    def _assert_policy_exists(self, table_name):
        """Helper : vérifie qu'une policy existe sur une table"""
        self.env.cr.execute("""
            SELECT COUNT(*) FROM pg_policies
            WHERE tablename = %s
            AND policyname LIKE 'tenant_isolation_%%'
        """, (table_name,))
        count = self.env.cr.fetchone()[0]
        self.assertGreater(count, 0,
                          f"Policy tenant_isolation_* absente sur {table_name}")

    # =========================================================================
    # ISOLATION SQL DIRECTE
    # =========================================================================

    def test_product_isolation_via_sql(self):
        """Produits isolés via SQL raw (pas ORM) avec RLS"""
        Product = self.env['product.template'].sudo()

        prod_a = Product.create({
            'name': 'RLS SQL Product A',
            'tenant_id': self.tenant_a.id,
            'list_price': 10.0,
        })
        prod_b = Product.create({
            'name': 'RLS SQL Product B',
            'tenant_id': self.tenant_b.id,
            'list_price': 20.0,
        })

        # Activer RLS tenant A
        self.env.cr.execute(
            "SET LOCAL app.current_tenant = %s", (self.tenant_a.id,)
        )

        # Requête SQL directe
        self.env.cr.execute("""
            SELECT id FROM product_template
            WHERE id IN %s
        """, ((prod_a.id, prod_b.id),))
        visible_ids = [r[0] for r in self.env.cr.fetchall()]

        self.assertIn(prod_a.id, visible_ids,
                     "Produit A devrait être visible pour tenant A")
        self.assertNotIn(prod_b.id, visible_ids,
                        "Produit B ne devrait PAS être visible pour tenant A")

    def test_cross_tenant_sql_blocked(self):
        """SELECT SQL direct ne retourne PAS les données autre tenant"""
        Product = self.env['product.template'].sudo()

        prod_a = Product.create({
            'name': 'RLS Cross Test',
            'tenant_id': self.tenant_a.id,
            'list_price': 99.0,
        })

        # Activer RLS tenant B
        self.env.cr.execute(
            "SET LOCAL app.current_tenant = %s", (self.tenant_b.id,)
        )

        self.env.cr.execute("""
            SELECT COUNT(*) FROM product_template WHERE id = %s
        """, (prod_a.id,))
        count = self.env.cr.fetchone()[0]

        self.assertEqual(count, 0,
                        "SÉCURITÉ COMPROMISE : accès cross-tenant via SQL")

    def test_global_products_visible_all_tenants(self):
        """Produits sans tenant_id (NULL) visibles par tous"""
        Product = self.env['product.template'].sudo()

        global_prod = Product.create({
            'name': 'RLS Global Product',
            'tenant_id': False,
            'list_price': 1.0,
        })

        # Tenant A voit le produit global
        self.env.cr.execute(
            "SET LOCAL app.current_tenant = %s", (self.tenant_a.id,)
        )
        self.env.cr.execute("""
            SELECT COUNT(*) FROM product_template WHERE id = %s
        """, (global_prod.id,))
        count_a = self.env.cr.fetchone()[0]

        # Tenant B aussi
        self.env.cr.execute(
            "SET LOCAL app.current_tenant = %s", (self.tenant_b.id,)
        )
        self.env.cr.execute("""
            SELECT COUNT(*) FROM product_template WHERE id = %s
        """, (global_prod.id,))
        count_b = self.env.cr.fetchone()[0]

        self.assertEqual(count_a, 1, "Produit global invisible pour tenant A")
        self.assertEqual(count_b, 1, "Produit global invisible pour tenant B")

    # =========================================================================
    # RLS CONTEXT SET / RESET
    # =========================================================================

    def test_rls_context_set_via_lib(self):
        """rls_context.set_rls_tenant() configure correctement"""
        from odoo.addons.quelyos_api.lib.rls_context import (
            set_rls_tenant,
            reset_rls_tenant,
        )

        set_rls_tenant(self.env.cr, self.tenant_a.id)

        self.env.cr.execute(
            "SELECT current_setting('app.current_tenant', true)"
        )
        val = self.env.cr.fetchone()[0]
        self.assertEqual(val, str(self.tenant_a.id))

        reset_rls_tenant(self.env.cr)

    def test_rls_context_manager(self):
        """rls_tenant_context() context manager fonctionne"""
        from odoo.addons.quelyos_api.lib.rls_context import (
            rls_tenant_context,
            reset_rls_tenant,
        )

        with rls_tenant_context(self.env.cr, self.tenant_b.id):
            self.env.cr.execute(
                "SELECT current_setting('app.current_tenant', true)"
            )
            val = self.env.cr.fetchone()[0]
            self.assertEqual(val, str(self.tenant_b.id))

        # Après le context manager, réinitialisé
        # (Selon implémentation, peut être resté ou réinitialisé)
        reset_rls_tenant(self.env.cr)

    # =========================================================================
    # PERFORMANCE RLS
    # =========================================================================

    def test_rls_performance_acceptable(self):
        """Recherche avec RLS < 200ms sur 200 produits"""
        Product = self.env['product.template'].sudo()

        # Créer 100 produits par tenant
        for i in range(100):
            Product.create({
                'name': f'Perf A {i}',
                'tenant_id': self.tenant_a.id,
                'list_price': float(i),
            })
            Product.create({
                'name': f'Perf B {i}',
                'tenant_id': self.tenant_b.id,
                'list_price': float(i),
            })

        # Activer RLS
        self.env.cr.execute(
            "SET LOCAL app.current_tenant = %s", (self.tenant_a.id,)
        )

        start = time.time()
        self.env.cr.execute("SELECT COUNT(*) FROM product_template")
        _count = self.env.cr.fetchone()[0]
        duration = time.time() - start

        self.assertLess(duration, 0.2,
                       f"Performance RLS dégradée : {duration:.3f}s")
        _logger.info('RLS perf: %d produits en %.3fms', _count, duration * 1000)


@tagged('post_install', '-at_install', 'rls_postgresql')
class TestRLSTenantSecurity(TransactionCase):
    """Tests header validation et tenant_security"""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        Tenant = cls.env['quelyos.tenant'].sudo()
        Company = cls.env['res.company'].sudo()

        cls.company = Company.create({'name': 'Header Test Co'})
        cls.tenant = Tenant.create({
            'name': 'Header Tenant',
            'code': 'hdr-test',
            'domain': 'header-test.quelyos.local',
            'backoffice_domain': 'header-bo.quelyos.local',
            'company_id': cls.company.id,
        })

    def test_get_tenant_valid_domain(self):
        """get_tenant_from_header() retourne bon tenant pour domaine valide"""
        from unittest.mock import patch, Mock

        with patch('odoo.addons.quelyos_api.lib.tenant_security.request') as mock_req:
            mock_req.httprequest.headers = Mock()
            mock_req.httprequest.headers.get = Mock(
                return_value='header-test.quelyos.local'
            )
            mock_req.env = self.env

            from odoo.addons.quelyos_api.lib.tenant_security import (
                get_tenant_from_header,
            )

            tenant = get_tenant_from_header()
            self.assertIsNotNone(tenant)
            self.assertEqual(tenant.id, self.tenant.id)

    def test_get_tenant_backoffice_domain(self):
        """get_tenant_from_header() fonctionne avec backoffice_domain"""
        from unittest.mock import patch, Mock

        with patch('odoo.addons.quelyos_api.lib.tenant_security.request') as mock_req:
            mock_req.httprequest.headers = Mock()
            mock_req.httprequest.headers.get = Mock(
                return_value='header-bo.quelyos.local'
            )
            mock_req.env = self.env

            from odoo.addons.quelyos_api.lib.tenant_security import (
                get_tenant_from_header,
            )

            tenant = get_tenant_from_header()
            self.assertIsNotNone(tenant)
            self.assertEqual(tenant.id, self.tenant.id)

    def test_get_tenant_missing_header(self):
        """get_tenant_from_header() retourne None si header manquant"""
        from unittest.mock import patch, Mock

        with patch('odoo.addons.quelyos_api.lib.tenant_security.request') as mock_req:
            mock_req.httprequest.headers = Mock()
            mock_req.httprequest.headers.get = Mock(return_value=None)
            mock_req.env = self.env

            from odoo.addons.quelyos_api.lib.tenant_security import (
                get_tenant_from_header,
            )

            tenant = get_tenant_from_header()
            self.assertIsNone(tenant)

    def test_get_tenant_unknown_domain(self):
        """get_tenant_from_header() retourne None pour domaine inconnu"""
        from unittest.mock import patch, Mock

        with patch('odoo.addons.quelyos_api.lib.tenant_security.request') as mock_req:
            mock_req.httprequest.headers = Mock()
            mock_req.httprequest.headers.get = Mock(
                return_value='unknown.evil.com'
            )
            mock_req.env = self.env

            from odoo.addons.quelyos_api.lib.tenant_security import (
                get_tenant_from_header,
            )

            tenant = get_tenant_from_header()
            self.assertIsNone(tenant)

    def test_get_tenant_empty_domain(self):
        """get_tenant_from_header() retourne None pour domaine vide"""
        from unittest.mock import patch, Mock

        with patch('odoo.addons.quelyos_api.lib.tenant_security.request') as mock_req:
            mock_req.httprequest.headers = Mock()
            mock_req.httprequest.headers.get = Mock(return_value='')
            mock_req.env = self.env

            from odoo.addons.quelyos_api.lib.tenant_security import (
                get_tenant_from_header,
            )

            tenant = get_tenant_from_header()
            self.assertIsNone(tenant)
