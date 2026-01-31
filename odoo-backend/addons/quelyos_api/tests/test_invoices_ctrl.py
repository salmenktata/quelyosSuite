# -*- coding: utf-8 -*-
"""Tests pour le contrôleur Factures Clients"""

from odoo.tests.common import TransactionCase


class TestInvoicesController(TransactionCase):
    """Tests API Factures Clients"""

    def setUp(self):
        super(TestInvoicesController, self).setUp()
        
        # Créer tenant de test
        self.tenant = self.env['quelyos.tenant'].create({
            'name': 'Test Tenant Finance',
            'code': 'TEST_FIN',
        })
        
        # Créer utilisateur de test
        self.user = self.env['res.users'].create({
            'name': 'Test User Finance',
            'login': 'testfinance',
            'password': 'test123',
        })
        
        # Créer client
        self.customer = self.env['res.partner'].create({
            'name': 'Test Customer',
            'email': 'customer@test.com',
        })

    def test_create_invoice(self):
        """Test création facture client"""
        
        # Créer facture
        invoice = self.env['account.move'].create({
            'move_type': 'out_invoice',
            'partner_id': self.customer.id,
            'tenant_id': self.tenant.id,
            'invoice_line_ids': [(0, 0, {
                'name': 'Test Product',
                'quantity': 1,
                'price_unit': 100.0,
            })],
        })
        
        # Vérifications
        self.assertEqual(invoice.move_type, 'out_invoice')
        self.assertEqual(invoice.partner_id, self.customer)
        self.assertEqual(invoice.state, 'draft')
        self.assertEqual(len(invoice.invoice_line_ids), 1)
        self.assertEqual(invoice.amount_total, 100.0)

    def test_validate_invoice(self):
        """Test validation facture"""
        
        # Créer facture brouillon
        invoice = self.env['account.move'].create({
            'move_type': 'out_invoice',
            'partner_id': self.customer.id,
            'tenant_id': self.tenant.id,
            'invoice_line_ids': [(0, 0, {
                'name': 'Test Service',
                'quantity': 1,
                'price_unit': 200.0,
            })],
        })
        
        self.assertEqual(invoice.state, 'draft')
        
        # Valider
        invoice.action_post()
        
        # Vérifications
        self.assertEqual(invoice.state, 'posted')
        self.assertIsNotNone(invoice.name)
        self.assertTrue(invoice.name.startswith('INV') or invoice.name.startswith('FACT'))

    def test_duplicate_invoice(self):
        """Test duplication facture"""
        
        # Créer facture originale
        original = self.env['account.move'].create({
            'move_type': 'out_invoice',
            'partner_id': self.customer.id,
            'tenant_id': self.tenant.id,
            'ref': 'ORIGINAL-001',
            'invoice_line_ids': [(0, 0, {
                'name': 'Product to duplicate',
                'quantity': 2,
                'price_unit': 50.0,
            })],
        })
        
        # Dupliquer
        duplicate = original.copy({
            'invoice_date': False,
            'date': False,
        })
        
        # Vérifications
        self.assertEqual(duplicate.partner_id, original.partner_id)
        self.assertEqual(duplicate.amount_total, original.amount_total)
        self.assertEqual(len(duplicate.invoice_line_ids), len(original.invoice_line_ids))
        self.assertEqual(duplicate.state, 'draft')
        self.assertNotEqual(duplicate.id, original.id)

    def test_tenant_isolation(self):
        """Test isolation multi-tenant"""
        
        # Créer second tenant
        tenant2 = self.env['quelyos.tenant'].create({
            'name': 'Tenant 2',
            'code': 'TENANT2',
        })
        
        # Créer facture tenant 1
        invoice1 = self.env['account.move'].create({
            'move_type': 'out_invoice',
            'partner_id': self.customer.id,
            'tenant_id': self.tenant.id,
            'invoice_line_ids': [(0, 0, {
                'name': 'Tenant 1 Product',
                'quantity': 1,
                'price_unit': 100.0,
            })],
        })
        
        # Créer facture tenant 2
        invoice2 = self.env['account.move'].create({
            'move_type': 'out_invoice',
            'partner_id': self.customer.id,
            'tenant_id': tenant2.id,
            'invoice_line_ids': [(0, 0, {
                'name': 'Tenant 2 Product',
                'quantity': 1,
                'price_unit': 200.0,
            })],
        })
        
        # Rechercher factures tenant 1
        tenant1_invoices = self.env['account.move'].search([
            ('tenant_id', '=', self.tenant.id),
            ('move_type', '=', 'out_invoice'),
        ])
        
        # Vérifications isolation
        self.assertIn(invoice1, tenant1_invoices)
        self.assertNotIn(invoice2, tenant1_invoices)
