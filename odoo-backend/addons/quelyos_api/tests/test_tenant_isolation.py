# -*- coding: utf-8 -*-
"""
Tests d'isolation multi-tenant.

Ces tests vérifient que les règles ir.rule fonctionnent correctement
et qu'un utilisateur d'un tenant ne peut pas accéder aux données d'un autre tenant.
"""

from odoo.tests import TransactionCase, tagged
from odoo.exceptions import AccessError


@tagged('post_install', '-at_install', 'tenant_isolation')
class TestTenantIsolation(TransactionCase):
    """Tests d'isolation des données entre tenants."""

    @classmethod
    def setUpClass(cls):
        """Créer deux tenants avec leurs utilisateurs et données."""
        super().setUpClass()

        # Créer Company A
        cls.company_a = cls.env['res.company'].create({
            'name': 'Company Tenant A',
        })

        # Créer Company B
        cls.company_b = cls.env['res.company'].create({
            'name': 'Company Tenant B',
        })

        # Créer Tenant A
        cls.tenant_a = cls.env['quelyos.tenant'].create({
            'name': 'Tenant A',
            'code': 'tenant-a',
            'domain': 'tenant-a.quelyos.com',
            'company_id': cls.company_a.id,
        })

        # Créer Tenant B
        cls.tenant_b = cls.env['quelyos.tenant'].create({
            'name': 'Tenant B',
            'code': 'tenant-b',
            'domain': 'tenant-b.quelyos.com',
            'company_id': cls.company_b.id,
        })

        # Créer User A (appartenant à Company A)
        cls.user_a = cls.env['res.users'].create({
            'name': 'User Tenant A',
            'login': 'user_tenant_a',
            'email': 'user_a@tenant-a.com',
            'company_id': cls.company_a.id,
            'company_ids': [(6, 0, [cls.company_a.id])],
            'group_ids': [(6, 0, [cls.env.ref('base.group_user').id])],
        })

        # Créer User B (appartenant à Company B)
        cls.user_b = cls.env['res.users'].create({
            'name': 'User Tenant B',
            'login': 'user_tenant_b',
            'email': 'user_b@tenant-b.com',
            'company_id': cls.company_b.id,
            'company_ids': [(6, 0, [cls.company_b.id])],
            'group_ids': [(6, 0, [cls.env.ref('base.group_user').id])],
        })

        # Forcer le calcul de tenant_id sur les utilisateurs
        cls.user_a._compute_tenant_id()
        cls.user_b._compute_tenant_id()

    # ==========================================================================
    # TESTS ISOLATION TENANT MODEL
    # ==========================================================================

    def test_user_tenant_id_computed(self):
        """Vérifie que tenant_id est correctement calculé sur les utilisateurs."""
        self.assertEqual(
            self.user_a.tenant_id, self.tenant_a,
            "User A devrait avoir tenant_id = Tenant A"
        )
        self.assertEqual(
            self.user_b.tenant_id, self.tenant_b,
            "User B devrait avoir tenant_id = Tenant B"
        )

    def test_tenant_isolation_own_tenant_only(self):
        """Vérifie qu'un utilisateur ne voit que son propre tenant."""
        # User A ne devrait voir que Tenant A
        tenants_for_a = self.env['quelyos.tenant'].with_user(self.user_a).search([])
        self.assertIn(self.tenant_a, tenants_for_a, "User A devrait voir Tenant A")
        self.assertNotIn(self.tenant_b, tenants_for_a, "User A ne devrait PAS voir Tenant B")

        # User B ne devrait voir que Tenant B
        tenants_for_b = self.env['quelyos.tenant'].with_user(self.user_b).search([])
        self.assertIn(self.tenant_b, tenants_for_b, "User B devrait voir Tenant B")
        self.assertNotIn(self.tenant_a, tenants_for_b, "User B ne devrait PAS voir Tenant A")

    # ==========================================================================
    # TESTS ISOLATION PRODUITS (company_id)
    # ==========================================================================

    def test_product_isolation_by_company(self):
        """Vérifie l'isolation des produits par company."""
        # Créer un produit pour Company A
        product_a = self.env['product.template'].sudo().create({
            'name': 'Product Tenant A',
            'company_id': self.company_a.id,
        })

        # Créer un produit pour Company B
        product_b = self.env['product.template'].sudo().create({
            'name': 'Product Tenant B',
            'company_id': self.company_b.id,
        })

        # User A ne devrait voir que les produits de Company A
        products_for_a = self.env['product.template'].with_user(self.user_a).search([
            ('name', 'in', ['Product Tenant A', 'Product Tenant B'])
        ])
        self.assertIn(product_a, products_for_a, "User A devrait voir Product A")
        self.assertNotIn(product_b, products_for_a, "User A ne devrait PAS voir Product B")

        # User B ne devrait voir que les produits de Company B
        products_for_b = self.env['product.template'].with_user(self.user_b).search([
            ('name', 'in', ['Product Tenant A', 'Product Tenant B'])
        ])
        self.assertIn(product_b, products_for_b, "User B devrait voir Product B")
        self.assertNotIn(product_a, products_for_b, "User B ne devrait PAS voir Product A")

    # ==========================================================================
    # TESTS ISOLATION CONTACTS (res.partner)
    # ==========================================================================

    def test_partner_isolation_by_company(self):
        """Vérifie l'isolation des contacts par company."""
        # Créer un contact pour Company A
        partner_a = self.env['res.partner'].sudo().create({
            'name': 'Partner Tenant A',
            'company_id': self.company_a.id,
        })

        # Créer un contact pour Company B
        partner_b = self.env['res.partner'].sudo().create({
            'name': 'Partner Tenant B',
            'company_id': self.company_b.id,
        })

        # User A ne devrait voir que les contacts de Company A (+ contacts globaux)
        partners_for_a = self.env['res.partner'].with_user(self.user_a).search([
            ('name', 'in', ['Partner Tenant A', 'Partner Tenant B'])
        ])
        self.assertIn(partner_a, partners_for_a, "User A devrait voir Partner A")
        self.assertNotIn(partner_b, partners_for_a, "User A ne devrait PAS voir Partner B")

    # ==========================================================================
    # TESTS ISOLATION MODELES QUELYOS (tenant_id)
    # ==========================================================================

    def test_hero_slide_isolation_by_tenant(self):
        """Vérifie l'isolation des hero slides par tenant."""
        # Créer un hero slide pour Tenant A (champs obligatoires: title, cta_text, cta_link)
        slide_a = self.env['quelyos.hero.slide'].sudo().create({
            'name': 'Slide Tenant A',
            'title': 'Slide A Title',
            'cta_text': 'CTA A',
            'cta_link': '/test-a',
            'tenant_id': self.tenant_a.id,
        })

        # Créer un hero slide pour Tenant B
        slide_b = self.env['quelyos.hero.slide'].sudo().create({
            'name': 'Slide Tenant B',
            'title': 'Slide B Title',
            'cta_text': 'CTA B',
            'cta_link': '/test-b',
            'tenant_id': self.tenant_b.id,
        })

        # User A ne devrait voir que les slides de Tenant A
        slides_for_a = self.env['quelyos.hero.slide'].with_user(self.user_a).search([
            ('name', 'in', ['Slide Tenant A', 'Slide Tenant B'])
        ])
        self.assertIn(slide_a, slides_for_a, "User A devrait voir Slide A")
        self.assertNotIn(slide_b, slides_for_a, "User A ne devrait PAS voir Slide B")

        # User B ne devrait voir que les slides de Tenant B
        slides_for_b = self.env['quelyos.hero.slide'].with_user(self.user_b).search([
            ('name', 'in', ['Slide Tenant A', 'Slide Tenant B'])
        ])
        self.assertIn(slide_b, slides_for_b, "User B devrait voir Slide B")
        self.assertNotIn(slide_a, slides_for_b, "User B ne devrait PAS voir Slide A")

    def test_promo_banner_isolation_by_tenant(self):
        """Vérifie l'isolation des promo banners par tenant."""
        # Créer un promo banner pour Tenant A
        banner_a = self.env['quelyos.promo.banner'].sudo().create({
            'name': 'Banner Tenant A',
            'tenant_id': self.tenant_a.id,
        })

        # Créer un promo banner pour Tenant B
        banner_b = self.env['quelyos.promo.banner'].sudo().create({
            'name': 'Banner Tenant B',
            'tenant_id': self.tenant_b.id,
        })

        # User A ne devrait voir que les banners de Tenant A
        banners_for_a = self.env['quelyos.promo.banner'].with_user(self.user_a).search([
            ('name', 'in', ['Banner Tenant A', 'Banner Tenant B'])
        ])
        self.assertIn(banner_a, banners_for_a, "User A devrait voir Banner A")
        self.assertNotIn(banner_b, banners_for_a, "User A ne devrait PAS voir Banner B")

    def test_menu_isolation_by_tenant(self):
        """Vérifie l'isolation des menus par tenant."""
        # Créer un menu pour Tenant A
        menu_a = self.env['quelyos.menu'].sudo().create({
            'name': 'Menu Tenant A',
            'tenant_id': self.tenant_a.id,
        })

        # Créer un menu pour Tenant B
        menu_b = self.env['quelyos.menu'].sudo().create({
            'name': 'Menu Tenant B',
            'tenant_id': self.tenant_b.id,
        })

        # User A ne devrait voir que les menus de Tenant A
        menus_for_a = self.env['quelyos.menu'].with_user(self.user_a).search([
            ('name', 'in', ['Menu Tenant A', 'Menu Tenant B'])
        ])
        self.assertIn(menu_a, menus_for_a, "User A devrait voir Menu A")
        self.assertNotIn(menu_b, menus_for_a, "User A ne devrait PAS voir Menu B")

    # ==========================================================================
    # TESTS ISOLATION SHARED DATA (tenant_id = False)
    # ==========================================================================

    def test_shared_data_visible_to_all(self):
        """Vérifie que les données partagées (tenant_id=False) sont visibles par tous."""
        # Créer un hero slide partagé (pas de tenant, champs obligatoires)
        shared_slide = self.env['quelyos.hero.slide'].sudo().create({
            'name': 'Shared Slide',
            'title': 'Shared Slide Title',
            'cta_text': 'Shared CTA',
            'cta_link': '/shared',
            'tenant_id': False,
        })

        # User A devrait voir le slide partagé
        slides_for_a = self.env['quelyos.hero.slide'].with_user(self.user_a).search([
            ('name', '=', 'Shared Slide')
        ])
        self.assertIn(shared_slide, slides_for_a, "User A devrait voir le Shared Slide")

        # User B devrait aussi voir le slide partagé
        slides_for_b = self.env['quelyos.hero.slide'].with_user(self.user_b).search([
            ('name', '=', 'Shared Slide')
        ])
        self.assertIn(shared_slide, slides_for_b, "User B devrait aussi voir le Shared Slide")

    # ==========================================================================
    # TESTS CROSS-TENANT ACCESS DENIAL
    # ==========================================================================

    def test_cross_tenant_write_denied(self):
        """Vérifie qu'un utilisateur ne peut pas modifier les données d'un autre tenant."""
        # Créer un hero slide pour Tenant B (champs obligatoires)
        slide_b = self.env['quelyos.hero.slide'].sudo().create({
            'name': 'Slide Tenant B',
            'title': 'Slide B Title',
            'cta_text': 'CTA B',
            'cta_link': '/test-b',
            'tenant_id': self.tenant_b.id,
        })

        # User A essaie de modifier le slide de Tenant B - devrait échouer
        with self.assertRaises(AccessError):
            slide_b.with_user(self.user_a).write({'name': 'Hacked by A'})

    def test_cross_tenant_unlink_denied(self):
        """Vérifie qu'un utilisateur ne peut pas supprimer les données d'un autre tenant."""
        # Créer un promo banner pour Tenant B
        banner_b = self.env['quelyos.promo.banner'].sudo().create({
            'name': 'Banner Tenant B',
            'tenant_id': self.tenant_b.id,
        })

        # User A essaie de supprimer le banner de Tenant B - devrait échouer
        with self.assertRaises(AccessError):
            banner_b.with_user(self.user_a).unlink()


@tagged('post_install', '-at_install', 'tenant_isolation', 'superadmin')
class TestSuperAdminAccess(TransactionCase):
    """Tests d'accès super admin (bypass isolation)."""

    @classmethod
    def setUpClass(cls):
        """Créer un super admin et des données multi-tenant."""
        super().setUpClass()

        # Créer Company A et B
        cls.company_a = cls.env['res.company'].create({'name': 'Company A'})
        cls.company_b = cls.env['res.company'].create({'name': 'Company B'})

        # Créer Tenants
        cls.tenant_a = cls.env['quelyos.tenant'].create({
            'name': 'Tenant A',
            'code': 'tenant-a-admin',
            'domain': 'a-admin.quelyos.com',
            'company_id': cls.company_a.id,
        })
        cls.tenant_b = cls.env['quelyos.tenant'].create({
            'name': 'Tenant B',
            'code': 'tenant-b-admin',
            'domain': 'b-admin.quelyos.com',
            'company_id': cls.company_b.id,
        })

        # Super admin a accès à toutes les companies
        cls.super_admin = cls.env['res.users'].create({
            'name': 'Super Admin',
            'login': 'superadmin_test',
            'email': 'superadmin@quelyos.com',
            'company_id': cls.company_a.id,
            'company_ids': [(6, 0, [cls.company_a.id, cls.company_b.id])],
            'group_ids': [(6, 0, [
                cls.env.ref('base.group_system').id,
                cls.env.ref('base.group_user').id,
            ])],
        })

    def test_superadmin_sees_all_tenants(self):
        """Vérifie que le super admin voit tous les tenants."""
        tenants = self.env['quelyos.tenant'].with_user(self.super_admin).search([])
        self.assertIn(self.tenant_a, tenants, "Super admin devrait voir Tenant A")
        self.assertIn(self.tenant_b, tenants, "Super admin devrait voir Tenant B")

    def test_superadmin_can_modify_any_tenant_data(self):
        """Vérifie que le super admin peut modifier les données de n'importe quel tenant."""
        # Créer des données pour chaque tenant (champs obligatoires)
        slide_a = self.env['quelyos.hero.slide'].sudo().create({
            'name': 'Slide A',
            'title': 'Slide A Title',
            'cta_text': 'CTA A',
            'cta_link': '/test-a',
            'tenant_id': self.tenant_a.id,
        })
        slide_b = self.env['quelyos.hero.slide'].sudo().create({
            'name': 'Slide B',
            'title': 'Slide B Title',
            'cta_text': 'CTA B',
            'cta_link': '/test-b',
            'tenant_id': self.tenant_b.id,
        })

        # Super admin modifie les deux - devrait réussir
        slide_a.with_user(self.super_admin).write({'name': 'Slide A Modified'})
        slide_b.with_user(self.super_admin).write({'name': 'Slide B Modified'})

        self.assertEqual(slide_a.name, 'Slide A Modified')
        self.assertEqual(slide_b.name, 'Slide B Modified')
