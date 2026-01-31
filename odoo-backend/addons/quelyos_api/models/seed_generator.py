# -*- coding: utf-8 -*-
import logging
import random
import base64
from datetime import datetime, timedelta
from faker import Faker

_logger = logging.getLogger(__name__)

# Désactiver logs Faker
logging.getLogger('faker').setLevel(logging.ERROR)

# Volumétries prédéfinies
VOLUMETRY_PRESETS = {
    'minimal': {
        'products': 10,
        'variants': 15,
        'images': 30,
        'customers': 20,
        'leads': 10,
        'orders': 15,
        'invoices': 10,
        'payments': 8,
        'campaigns': 5,
        'lists': 3,
        'pos_sessions': 5,
        'pos_orders': 30,
        'tickets': 10,
        'ticket_messages': 30,
        'employees': 5,
    },
    'standard': {
        'products': 100,
        'variants': 150,
        'images': 300,
        'customers': 200,
        'leads': 100,
        'orders': 150,
        'invoices': 100,
        'payments': 80,
        'campaigns': 20,
        'lists': 10,
        'pos_sessions': 50,
        'pos_orders': 300,
        'tickets': 50,
        'ticket_messages': 150,
        'employees': 30,
    },
    'large': {
        'products': 500,
        'variants': 750,
        'images': 1500,
        'customers': 1000,
        'leads': 500,
        'orders': 750,
        'invoices': 500,
        'payments': 400,
        'campaigns': 50,
        'lists': 25,
        'pos_sessions': 100,
        'pos_orders': 1000,
        'tickets': 200,
        'ticket_messages': 600,
        'employees': 100,
    },
}

# Constantes Tunisie
TUNISIA_CITIES = [
    'Tunis', 'Sfax', 'Sousse', 'Kairouan', 'Bizerte',
    'Gabès', 'Ariana', 'Gafsa', 'Monastir', 'Ben Arous',
    'Kasserine', 'Médenine', 'Nabeul', 'Tataouine', 'Mahdia'
]

TUNISIA_FIRST_NAMES = [
    'Mohamed', 'Ahmed', 'Fatma', 'Amira', 'Youssef',
    'Salma', 'Ali', 'Mariem', 'Karim', 'Leila',
    'Mehdi', 'Nour', 'Rami', 'Ines', 'Samir'
]

TUNISIA_LAST_NAMES = [
    'Ben Ali', 'Trabelsi', 'Gharbi', 'Dridi', 'Mansouri',
    'Bouazizi', 'Jlassi', 'Hamdi', 'Messaoudi', 'Zaouali',
    'Kraiem', 'Tounsi', 'Mrad', 'Kacem', 'Tlili'
]

PRODUCT_CATEGORIES = [
    {'name': 'Électronique', 'keywords': ['smartphone', 'laptop', 'tablet', 'headphones', 'camera']},
    {'name': 'Mode', 'keywords': ['fashion', 'clothing', 'shoes', 'accessories', 'bag']},
    {'name': 'Maison & Décoration', 'keywords': ['furniture', 'home', 'decoration', 'kitchen', 'bedroom']},
    {'name': 'Sport & Fitness', 'keywords': ['fitness', 'sports', 'gym', 'running', 'yoga']},
    {'name': 'Beauté & Santé', 'keywords': ['beauty', 'skincare', 'cosmetics', 'health', 'wellness']},
    {'name': 'Alimentation', 'keywords': ['food', 'grocery', 'organic', 'healthy', 'nutrition']},
]


class SeedGenerator:
    """Générateur de données seed pour Quelyos Suite"""

    def __init__(self, env, tenant_id, config, job):
        """Initialiser le générateur

        Args:
            env: Environnement Odoo
            tenant_id (int): ID du tenant cible
            config (dict): Configuration (volumetry, modules, options)
            job (quelyos.seed.job): Job de suivi
        """
        self.env = env
        self.tenant = env['quelyos.tenant'].browse(tenant_id)
        self.config = config
        self.job = job
        self.faker = Faker(['fr_FR'])
        Faker.seed(42)  # Reproductibilité

        # Récupérer volumétrie
        volumetry_name = config.get('volumetry', 'standard')
        self.volumetry = VOLUMETRY_PRESETS.get(volumetry_name, VOLUMETRY_PRESETS['standard'])

        # Modules à générer
        self.modules = config.get('modules', [])

        # Options
        self.reset_before_seed = config.get('reset_before_seed', False)
        self.enable_relations = config.get('enable_relations', True)
        self.enable_unsplash_images = config.get('enable_unsplash_images', True)

        # Caches pour relations
        self.cache = {
            'products': [],
            'variants': [],
            'customers': [],
            'leads': [],
            'orders': [],
            'invoices': [],
            'campaigns': [],
            'lists': [],
            'pos_configs': [],
            'pos_sessions': [],
            'tickets': [],
            'employees': [],
            'categories': [],
            'taxes': [],
            'pricelists': [],
            'locations': [],
            'crm_stages': [],
        }

        # Résultats par module
        self.results = {}

        # Context optimisé
        self.ctx = {
            'tracking_disable': True,
            'mail_notrack': True,
            'mail_create_nolog': True,
        }

    def generate_all(self):
        """Orchestrateur principal - exécute toutes les phases"""
        try:
            self.job.update_progress(0, None, "🚀 Démarrage génération seed data...")

            # Reset données si demandé
            if self.reset_before_seed:
                self._reset_tenant_data()

            # Phase 1 : Configuration (5%)
            self._phase_1_configuration()
            self.job.update_progress(5, 'configuration', "✓ Configuration terminée")

            # Phase 2 : Store (20%)
            if 'store' in self.modules:
                self._phase_2_store()
                self.job.update_progress(20, 'store', "✓ Store terminé")

            # Phase 3 : Stock (30%)
            if 'stock' in self.modules:
                self._phase_3_stock()
                self.job.update_progress(30, 'stock', "✓ Stock terminé")

            # Phase 4 : CRM (40%)
            if 'crm' in self.modules:
                self._phase_4_crm()
                self.job.update_progress(40, 'crm', "✓ CRM terminé")

            # Phase 5 : Orders (50%)
            if 'store' in self.modules:
                self._phase_5_orders()
                self.job.update_progress(50, 'orders', "✓ Commandes terminées")

            # Phase 6 : Finance (60%)
            if 'finance' in self.modules:
                self._phase_6_finance()
                self.job.update_progress(60, 'finance', "✓ Finance terminée")

            # Phase 7 : Marketing (70%)
            if 'marketing' in self.modules:
                self._phase_7_marketing()
                self.job.update_progress(70, 'marketing', "✓ Marketing terminé")

            # Phase 8 : POS (80%)
            if 'pos' in self.modules:
                self._phase_8_pos()
                self.job.update_progress(80, 'pos', "✓ POS terminé")

            # Phase 9 : Support (90%)
            if 'support' in self.modules:
                self._phase_9_support()
                self.job.update_progress(90, 'support', "✓ Support terminé")

            # Phase 10 : HR (95%)
            if 'hr' in self.modules:
                self._phase_10_hr()
                self.job.update_progress(95, 'hr', "✓ HR terminé")

            # Commit final
            self.env.cr.commit()

            # Marquer terminé
            self.job.mark_completed(self.results)
            self.job.update_progress(100, None, "✅ Génération terminée avec succès !")

        except Exception as e:
            _logger.error(f"Seed generation failed: {e}", exc_info=True)
            self.job.mark_error(str(e))
            raise

    def _reset_tenant_data(self):
        """Supprimer toutes les données seed du tenant (DANGER)"""
        self.job.update_progress(0, None, "⚠️ Suppression données existantes...")

        models_to_clean = [
            'quelyos.pos.order',
            'quelyos.pos.session',
            'quelyos.pos.config',
            'quelyos.ticket',
            'quelyos.marketing.campaign',
            'quelyos.contact.list',
            'account.payment',
            'account.move',
            'sale.order',
            'crm.lead',
            'res.partner',
            'stock.quant',
            'stock.location',
            'product.image',
            'product.product',
            'product.template',
            'product.category',
        ]

        for model_name in models_to_clean:
            try:
                Model = self.env[model_name].with_context(self.ctx).sudo()
                records = Model.search([('tenant_id', '=', self.tenant.id)])
                if records:
                    count = len(records)
                    records.unlink()
                    self.job.update_progress(0, None, f"  ✓ {count} {model_name} supprimés")
            except Exception as e:
                _logger.warning(f"Could not clean {model_name}: {e}")

        self.env.cr.commit()
        self.job.update_progress(0, None, "✓ Nettoyage terminé")

    def _phase_1_configuration(self):
        """Phase 1 : Configuration de base (catégories, taxes, pricelists, etc.)"""
        self.job.update_progress(1, 'configuration', "Création configuration de base...")

        # Créer catégories produits
        categories = []
        for cat_data in PRODUCT_CATEGORIES:
            cat = self.env['product.category'].with_context(self.ctx).sudo().create({
                'name': cat_data['name'],
                'tenant_id': self.tenant.id,
            })
            categories.append(cat)
            self.cache['categories'].append(cat)

        # Créer taxes TVA Tunisie
        tax_19 = self.env['account.tax'].with_context(self.ctx).sudo().create({
            'name': 'TVA 19%',
            'amount': 19.0,
            'type_tax_use': 'sale',
            'tenant_id': self.tenant.id,
            'company_id': self.tenant.company_id.id,
        })
        tax_7 = self.env['account.tax'].with_context(self.ctx).sudo().create({
            'name': 'TVA 7%',
            'amount': 7.0,
            'type_tax_use': 'sale',
            'tenant_id': self.tenant.id,
            'company_id': self.tenant.company_id.id,
        })
        self.cache['taxes'] = [tax_19, tax_7]

        # Créer pricelists
        pricelist = self.env['product.pricelist'].with_context(self.ctx).sudo().create({
            'name': 'TND Public',
            'currency_id': self.env.ref('base.TND').id,
            'tenant_id': self.tenant.id,
            'company_id': self.tenant.company_id.id,
        })
        self.cache['pricelists'].append(pricelist)

        # Créer stages CRM
        stage_names = ['Nouveau', 'Qualifié', 'Proposition', 'Négociation', 'Gagné', 'Perdu']
        for i, stage_name in enumerate(stage_names):
            stage = self.env['crm.stage'].with_context(self.ctx).sudo().create({
                'name': stage_name,
                'sequence': i,
                'tenant_id': self.tenant.id,
            })
            self.cache['crm_stages'].append(stage)

        # Créer locations stock
        warehouse = self.env['stock.warehouse'].sudo().search([
            ('company_id', '=', self.tenant.company_id.id)
        ], limit=1)

        if warehouse:
            self.cache['locations'].append(warehouse.lot_stock_id)

        self.results['configuration'] = {
            'count': len(categories) + len(self.cache['taxes']) + len(self.cache['pricelists']) + len(self.cache['crm_stages']),
            'duration_seconds': 0,
        }

    def _phase_2_store(self):
        """Phase 2 : Produits, variants, images"""
        start_time = datetime.now()
        self.job.update_progress(10, 'store', "Génération produits...")

        products_count = self.volumetry['products']
        variants_count = self.volumetry['variants']
        images_count = self.volumetry['images']

        # Créer produits par batch
        batch_size = 50
        for i in range(0, products_count, batch_size):
            batch = []
            for j in range(batch_size):
                if i + j >= products_count:
                    break

                category = random.choice(self.cache['categories'])
                tax = random.choice(self.cache['taxes'])

                # Nom produit réaliste
                product_name = self.faker.catch_phrase()[:50]

                batch.append({
                    'name': product_name,
                    'list_price': round(random.uniform(10.0, 500.0), 2),
                    'standard_price': round(random.uniform(5.0, 250.0), 2),
                    'type': 'product',
                    'categ_id': category.id,
                    'taxes_id': [(6, 0, [tax.id])],
                    'tenant_id': self.tenant.id,
                    'company_id': self.tenant.company_id.id,
                    'sale_ok': True,
                    'purchase_ok': True,
                    'x_is_featured': random.choice([True, False]),
                })

            products = self.env['product.template'].with_context(self.ctx).sudo().create(batch)
            self.cache['products'].extend(products)

            if (i + batch_size) % 100 == 0:
                self.env.cr.commit()
                self.job.update_progress(
                    10 + int((i + batch_size) / products_count * 10),
                    'store',
                    f"  Créés {i + batch_size}/{products_count} produits"
                )

        # Générer variants (taille/couleur)
        colors = ['Rouge', 'Bleu', 'Vert', 'Noir', 'Blanc']
        sizes = ['S', 'M', 'L', 'XL']

        variants_created = 0
        for product in random.sample(self.cache['products'], min(50, len(self.cache['products']))):
            for _ in range(random.randint(1, 3)):
                if variants_created >= variants_count:
                    break

                variant = self.env['product.product'].with_context(self.ctx).sudo().create({
                    'product_tmpl_id': product.id,
                    'default_code': f"VAR-{self.faker.bothify('####')}",
                    'tenant_id': self.tenant.id,
                    'company_id': self.tenant.company_id.id,
                })
                self.cache['variants'].append(variant)
                variants_created += 1

        self.env.cr.commit()

        duration = (datetime.now() - start_time).total_seconds()
        self.results['store'] = {
            'count': len(self.cache['products']) + len(self.cache['variants']),
            'duration_seconds': duration,
        }

    def _phase_3_stock(self):
        """Phase 3 : Stock (quants)"""
        start_time = datetime.now()
        self.job.update_progress(25, 'stock', "Génération stock...")

        if not self.cache['locations']:
            self.job.update_progress(30, 'stock', "⚠️ Pas de location stock trouvée, skip")
            return

        location = self.cache['locations'][0]
        quants_count = self.volumetry.get('products', 100) * 2

        batch = []
        for product in self.cache['products'][:quants_count // 2]:
            batch.append({
                'product_id': product.product_variant_id.id,
                'location_id': location.id,
                'quantity': random.randint(0, 100),
                'tenant_id': self.tenant.id,
                'company_id': self.tenant.company_id.id,
            })

        quants = self.env['stock.quant'].with_context(self.ctx).sudo().create(batch)
        self.env.cr.commit()

        duration = (datetime.now() - start_time).total_seconds()
        self.results['stock'] = {
            'count': len(quants),
            'duration_seconds': duration,
        }

    def _phase_4_crm(self):
        """Phase 4 : CRM (customers, leads)"""
        start_time = datetime.now()
        self.job.update_progress(35, 'crm', "Génération clients...")

        customers_count = self.volumetry['customers']
        leads_count = self.volumetry['leads']

        # Créer clients
        batch_size = 100
        for i in range(0, customers_count, batch_size):
            batch = []
            for j in range(batch_size):
                if i + j >= customers_count:
                    break

                first_name = random.choice(TUNISIA_FIRST_NAMES)
                last_name = random.choice(TUNISIA_LAST_NAMES)
                city = random.choice(TUNISIA_CITIES)

                batch.append({
                    'name': f"{first_name} {last_name}",
                    'email': f"{first_name.lower()}.{last_name.lower().replace(' ', '')}@example.com",
                    'phone': f"+216 {self.faker.numerify('## ### ###')}",
                    'street': self.faker.street_address(),
                    'city': city,
                    'zip': self.faker.postcode(),
                    'country_id': self.env.ref('base.tn').id,
                    'tenant_id': self.tenant.id,
                    'company_id': self.tenant.company_id.id,
                    'customer_rank': 1,
                })

            customers = self.env['res.partner'].with_context(self.ctx).sudo().create(batch)
            self.cache['customers'].extend(customers)

            if (i + batch_size) % 200 == 0:
                self.env.cr.commit()

        # Créer leads
        batch = []
        for _ in range(leads_count):
            customer = random.choice(self.cache['customers']) if self.cache['customers'] else None
            stage = random.choice(self.cache['crm_stages']) if self.cache['crm_stages'] else None

            batch.append({
                'name': self.faker.catch_phrase(),
                'partner_id': customer.id if customer else None,
                'email_from': self.faker.email() if not customer else customer.email,
                'phone': self.faker.phone_number() if not customer else customer.phone,
                'stage_id': stage.id if stage else None,
                'tenant_id': self.tenant.id,
                'company_id': self.tenant.company_id.id,
                'type': 'opportunity',
                'expected_revenue': round(random.uniform(500.0, 10000.0), 2),
            })

        leads = self.env['crm.lead'].with_context(self.ctx).sudo().create(batch)
        self.cache['leads'].extend(leads)
        self.env.cr.commit()

        duration = (datetime.now() - start_time).total_seconds()
        self.results['crm'] = {
            'count': len(self.cache['customers']) + len(self.cache['leads']),
            'duration_seconds': duration,
        }

    def _phase_5_orders(self):
        """Phase 5 : Commandes (sale.order)"""
        start_time = datetime.now()
        self.job.update_progress(45, 'orders', "Génération commandes...")

        if not self.cache['customers'] or not self.cache['products']:
            self.job.update_progress(50, 'orders', "⚠️ Pas de clients ou produits, skip")
            return

        orders_count = self.volumetry['orders']

        batch = []
        for _ in range(orders_count):
            customer = random.choice(self.cache['customers'])

            batch.append({
                'partner_id': customer.id,
                'tenant_id': self.tenant.id,
                'company_id': self.tenant.company_id.id,
                'date_order': datetime.now() - timedelta(days=random.randint(0, 90)),
                'state': random.choice(['draft', 'sent', 'sale', 'done']),
            })

        orders = self.env['sale.order'].with_context(self.ctx).sudo().create(batch)
        self.cache['orders'].extend(orders)

        # Créer order lines
        for order in orders:
            num_lines = random.randint(1, 5)
            for _ in range(num_lines):
                product = random.choice(self.cache['products'])

                self.env['sale.order.line'].with_context(self.ctx).sudo().create({
                    'order_id': order.id,
                    'product_id': product.product_variant_id.id,
                    'product_uom_qty': random.randint(1, 10),
                    'price_unit': product.list_price,
                    'tenant_id': self.tenant.id,
                })

        self.env.cr.commit()

        duration = (datetime.now() - start_time).total_seconds()
        self.results['orders'] = {
            'count': len(self.cache['orders']),
            'duration_seconds': duration,
        }

    def _phase_6_finance(self):
        """Phase 6 : Finance (factures, paiements)"""
        start_time = datetime.now()
        self.job.update_progress(55, 'finance', "Génération factures...")

        # Simplification : skip pour éviter complexité account.move
        self.job.update_progress(60, 'finance', "⚠️ Finance skip (complexité account.move)")

        duration = (datetime.now() - start_time).total_seconds()
        self.results['finance'] = {
            'count': 0,
            'duration_seconds': duration,
        }

    def _phase_7_marketing(self):
        """Phase 7 : Marketing (campagnes, listes)"""
        start_time = datetime.now()
        self.job.update_progress(65, 'marketing', "Génération campagnes marketing...")

        lists_count = self.volumetry['lists']
        campaigns_count = self.volumetry['campaigns']

        # Créer listes contacts
        batch = []
        for i in range(lists_count):
            batch.append({
                'name': f"Liste {i + 1} - {self.faker.catch_phrase()}",
                'tenant_id': self.tenant.id,
            })

        lists = self.env['quelyos.contact.list'].with_context(self.ctx).sudo().create(batch)
        self.cache['lists'].extend(lists)

        # Créer campagnes
        batch = []
        for _ in range(campaigns_count):
            contact_list = random.choice(self.cache['lists']) if self.cache['lists'] else None

            batch.append({
                'name': f"Campagne {self.faker.catch_phrase()}",
                'subject': self.faker.sentence(),
                'body_html': f"<p>{self.faker.text()}</p>",
                'contact_list_id': contact_list.id if contact_list else None,
                'tenant_id': self.tenant.id,
                'state': random.choice(['draft', 'running', 'done']),
            })

        campaigns = self.env['quelyos.marketing.campaign'].with_context(self.ctx).sudo().create(batch)
        self.cache['campaigns'].extend(campaigns)
        self.env.cr.commit()

        duration = (datetime.now() - start_time).total_seconds()
        self.results['marketing'] = {
            'count': len(self.cache['lists']) + len(self.cache['campaigns']),
            'duration_seconds': duration,
        }

    def _phase_8_pos(self):
        """Phase 8 : POS (sessions, orders)"""
        start_time = datetime.now()
        self.job.update_progress(75, 'pos', "Génération POS...")

        # Simplification : skip car complexité quelyos.pos.* models
        self.job.update_progress(80, 'pos', "⚠️ POS skip (complexité pos models)")

        duration = (datetime.now() - start_time).total_seconds()
        self.results['pos'] = {
            'count': 0,
            'duration_seconds': duration,
        }

    def _phase_9_support(self):
        """Phase 9 : Support (tickets)"""
        start_time = datetime.now()
        self.job.update_progress(85, 'support', "Génération tickets support...")

        tickets_count = self.volumetry['tickets']
        messages_count = self.volumetry['ticket_messages']

        if not self.cache['customers']:
            self.job.update_progress(90, 'support', "⚠️ Pas de clients, skip support")
            return

        # Créer tickets
        batch = []
        for _ in range(tickets_count):
            customer = random.choice(self.cache['customers'])

            batch.append({
                'name': f"Ticket {self.faker.sentence()}",
                'partner_id': customer.id,
                'description': self.faker.text(),
                'tenant_id': self.tenant.id,
                'priority': random.choice(['0', '1', '2', '3']),
                'stage_id': 1,  # Nouveau
            })

        tickets = self.env['quelyos.ticket'].with_context(self.ctx).sudo().create(batch)
        self.cache['tickets'].extend(tickets)
        self.env.cr.commit()

        duration = (datetime.now() - start_time).total_seconds()
        self.results['support'] = {
            'count': len(self.cache['tickets']),
            'duration_seconds': duration,
        }

    def _phase_10_hr(self):
        """Phase 10 : HR (employés) - Skip si module désactivé"""
        start_time = datetime.now()
        self.job.update_progress(93, 'hr', "Génération employés...")

        # HR module désactivé (bug Odoo 19)
        self.job.update_progress(95, 'hr', "⚠️ HR module désactivé (bug Odoo 19), skip")

        duration = (datetime.now() - start_time).total_seconds()
        self.results['hr'] = {
            'count': 0,
            'duration_seconds': duration,
        }
