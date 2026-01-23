# -*- coding: utf-8 -*-

from odoo.tests.common import TransactionCase


class TestCoreConfig(TransactionCase):
    """Tests pour le module quelyos_core."""

    def setUp(self):
        super(TestCoreConfig, self).setUp()
        self.params = self.env['ir.config_parameter'].sudo()

    def test_module_category_exists(self):
        """Vérifie que la catégorie Quelyos existe."""
        category = self.env['ir.module.category'].search([
            ('name', '=', 'Quelyos')
        ])
        self.assertTrue(category, "La catégorie Quelyos doit exister")
        self.assertEqual(category.name, 'Quelyos')
        self.assertEqual(category.sequence, 1)

    def test_core_parameters_created(self):
        """Vérifie que les paramètres core sont créés."""
        company_name = self.params.get_param('quelyos.core.company_name')
        self.assertEqual(company_name, 'Quelyos', "Le nom de l'entreprise doit être 'Quelyos'")

        company_url = self.params.get_param('quelyos.core.company_url')
        self.assertEqual(company_url, 'https://quelyos.com')

        support_url = self.params.get_param('quelyos.core.support_url')
        self.assertEqual(support_url, 'https://support.quelyos.com')

        docs_url = self.params.get_param('quelyos.core.docs_url')
        self.assertEqual(docs_url, 'https://docs.quelyos.com')

        contact_email = self.params.get_param('quelyos.core.contact_email')
        self.assertEqual(contact_email, 'contact@quelyos.com')

    def test_config_settings_fields(self):
        """Vérifie que les champs de configuration sont accessibles."""
        settings = self.env['res.config.settings'].create({})
        self.assertIn('quelyos_company_name', settings._fields)
        self.assertIn('quelyos_company_url', settings._fields)
        self.assertIn('quelyos_support_url', settings._fields)
        self.assertIn('quelyos_docs_url', settings._fields)
        self.assertIn('quelyos_contact_email', settings._fields)

    def test_parameter_read_write(self):
        """Vérifie qu'on peut lire et écrire les paramètres."""
        # Écrire un nouveau nom
        self.params.set_param('quelyos.core.company_name', 'Test Company')

        # Lire la valeur
        company_name = self.params.get_param('quelyos.core.company_name')
        self.assertEqual(company_name, 'Test Company')

        # Restaurer la valeur par défaut
        self.params.set_param('quelyos.core.company_name', 'Quelyos')

    def test_config_settings_save(self):
        """Vérifie qu'on peut sauvegarder via res.config.settings."""
        settings = self.env['res.config.settings'].create({
            'quelyos_company_name': 'New Company Name',
            'quelyos_contact_email': 'new@example.com',
        })

        settings.execute()

        # Vérifier que les valeurs ont été sauvegardées
        company_name = self.params.get_param('quelyos.core.company_name')
        self.assertEqual(company_name, 'New Company Name')

        contact_email = self.params.get_param('quelyos.core.contact_email')
        self.assertEqual(contact_email, 'new@example.com')
