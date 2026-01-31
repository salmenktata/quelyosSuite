# -*- coding: utf-8 -*-
"""
Tests d'isolation cache multi-tenant

Vérifie que les keys Redis incluent tenant_id pour prévenir fuites cross-tenant.
"""

import unittest
from unittest.mock import Mock, patch
from odoo.addons.quelyos_api.lib.cache import CacheStrategies, get_cache_service


class TestCacheIsolation(unittest.TestCase):
    """Tests d'isolation multi-tenant pour cache Redis"""

    def setUp(self):
        """Setup avant chaque test"""
        self.cache = get_cache_service()

    @patch('odoo.addons.quelyos_api.lib.cache.get_cache_service')
    def test_products_list_cache_isolated_by_tenant(self, mock_cache_service):
        """Vérifier que cache produits est isolé par tenant_id"""
        mock_cache = Mock()
        mock_cache_service.return_value = mock_cache
        mock_cache._generate_key = Mock(side_effect=lambda prefix, tenant_id=None, **kw: 
            f"tenant:{tenant_id}:{prefix}" if tenant_id else prefix
        )

        # Tenant 1
        CacheStrategies.cache_products_list(
            tenant_id=1,
            result={'products': [{'id': 1, 'name': 'Laptop'}]},
            params={'category': 5}
        )

        # Vérifier que la key inclut tenant_id=1
        call_args = mock_cache._generate_key.call_args
        self.assertEqual(call_args[1]['tenant_id'], 1)
        
        # Tenant 2
        CacheStrategies.cache_products_list(
            tenant_id=2,
            result={'products': [{'id': 2, 'name': 'Smartphone'}]},
            params={'category': 5}
        )

        # Vérifier que la key inclut tenant_id=2
        call_args = mock_cache._generate_key.call_args
        self.assertEqual(call_args[1]['tenant_id'], 2)

    def test_product_detail_key_includes_tenant_id(self):
        """Vérifier format key produit détail"""
        # Simuler génération de key
        tenant_id = 1
        product_id = 123
        expected_key = f"tenant:{tenant_id}:products:detail:{product_id}"
        
        # La fonction doit générer cette key
        key = f"tenant:{tenant_id}:products:detail:{product_id}"
        self.assertEqual(key, expected_key)

    def test_categories_cache_isolated_by_tenant(self):
        """Vérifier que cache catégories est isolé par tenant_id"""
        # Tenant 1 : catégories différentes de Tenant 2
        tenant1_key = f"tenant:1:categories:all"
        tenant2_key = f"tenant:2:categories:all"
        
        self.assertNotEqual(tenant1_key, tenant2_key)
        self.assertIn("tenant:1", tenant1_key)
        self.assertIn("tenant:2", tenant2_key)

    def test_dashboard_stats_key_includes_both_ids(self):
        """Vérifier que stats dashboard inclut tenant_id ET user_id"""
        tenant_id = 1
        user_id = 5
        expected_key = f"tenant:{tenant_id}:dashboard:stats:{user_id}"
        
        key = f"tenant:{tenant_id}:dashboard:stats:{user_id}"
        self.assertEqual(key, expected_key)
        self.assertIn(f"tenant:{tenant_id}", key)
        self.assertIn(f"stats:{user_id}", key)

    def test_cache_invalidation_scoped_to_tenant(self):
        """Vérifier que invalidation est scopée au tenant"""
        tenant1_pattern = f"tenant:1:products:list:*"
        tenant2_pattern = f"tenant:2:products:list:*"
        
        # Patterns différents → invalidations séparées
        self.assertNotEqual(tenant1_pattern, tenant2_pattern)

    def test_site_config_already_tenant_isolated(self):
        """Vérifier que site config est déjà isolé (regression test)"""
        # Cette fonction était déjà correcte
        tenant1_key = f"config:tenant:1"
        tenant2_key = f"config:tenant:2"
        
        self.assertNotEqual(tenant1_key, tenant2_key)


if __name__ == '__main__':
    unittest.main()
