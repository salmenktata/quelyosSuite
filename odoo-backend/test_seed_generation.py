#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de test pour la génération de données seed
"""
import sys
import json
from datetime import datetime

# Initialiser environnement Odoo
import odoo
from odoo import api, SUPERUSER_ID

# Configuration
DB_NAME = 'quelyos'
TENANT_ID = 1  # Admin Quelyos
VOLUMETRY = 'minimal'  # minimal pour test rapide (~30s)
MODULES = ['store', 'stock', 'crm', 'marketing', 'support']

def test_seed_generation():
    """Test de génération de données seed"""
    print(f"\n{'='*60}")
    print(f"TEST GÉNÉRATION SEED DATA")
    print(f"{'='*60}")
    print(f"Tenant ID: {TENANT_ID}")
    print(f"Volumétrie: {VOLUMETRY}")
    print(f"Modules: {', '.join(MODULES)}")
    print(f"{'='*60}\n")

    # Se connecter à la DB
    registry = odoo.registry(DB_NAME)

    with registry.cursor() as cr:
        env = api.Environment(cr, SUPERUSER_ID, {})

        # 1. Vérifier tenant
        print("1. Vérification tenant...")
        Tenant = env['quelyos.tenant'].sudo()
        tenant = Tenant.browse(TENANT_ID)

        if not tenant.exists():
            print(f"❌ Tenant {TENANT_ID} introuvable")
            return False

        print(f"✅ Tenant trouvé: {tenant.name} (status: {tenant.status})")

        # Forcer status active pour test (bypass validation)
        if tenant.status != 'active':
            print(f"⚠️  Tenant non actif, passage en 'active' pour test...")
            tenant.write({'status': 'active'})
            cr.commit()

        # 2. Créer job seed
        print("\n2. Création job seed...")
        SeedJob = env['quelyos.seed.job'].sudo()

        config = {
            'volumetry': VOLUMETRY,
            'modules': MODULES,
            'reset_before_seed': False,
            'enable_relations': True,
            'enable_unsplash_images': False,  # Désactivé pour plus rapide
        }

        try:
            job = SeedJob.create_job(TENANT_ID, config)
            print(f"✅ Job créé: {job.job_id}")
        except Exception as e:
            print(f"❌ Erreur création job: {e}")
            return False

        # 3. Lancer génération
        print("\n3. Lancement génération...")
        print(f"⏳ Début génération : {datetime.now().strftime('%H:%M:%S')}")

        from odoo.addons.quelyos_api.models.seed_generator import SeedGenerator

        try:
            job.mark_running()
            generator = SeedGenerator(env, TENANT_ID, config, job)

            print("\n--- LOGS GÉNÉRATION ---")
            generator.generate_all()
            print("--- FIN LOGS ---\n")

            # Récupérer résultats
            job_data = job.get_status_data()

            print(f"✅ Génération terminée : {datetime.now().strftime('%H:%M:%S')}")
            print(f"Status: {job_data['status']}")
            print(f"Progression: {job_data['progress_percent']}%")

            if job_data['status'] == 'completed':
                print("\n4. Résultats détaillés:")
                print(f"{'='*60}")
                results = job_data.get('results', {})
                total_records = 0
                total_duration = 0

                for module, data in results.items():
                    count = data.get('count', 0)
                    duration = data.get('duration_seconds', 0)
                    total_records += count
                    total_duration += duration
                    print(f"  {module:20s}: {count:5d} records en {duration:5.1f}s")

                print(f"{'='*60}")
                print(f"  {'TOTAL':20s}: {total_records:5d} records en {total_duration:5.1f}s")
                print(f"{'='*60}")

                # 5. Vérifier isolation tenant
                print("\n5. Vérification isolation multi-tenant:")

                # Compter produits
                products_count = env['product.template'].sudo().search_count([
                    ('tenant_id', '=', TENANT_ID)
                ])
                print(f"  Produits tenant {TENANT_ID}: {products_count}")

                # Compter clients
                customers_count = env['res.partner'].sudo().search_count([
                    ('tenant_id', '=', TENANT_ID),
                    ('customer_rank', '>', 0)
                ])
                print(f"  Clients tenant {TENANT_ID}: {customers_count}")

                # Compter commandes
                orders_count = env['sale.order'].sudo().search_count([
                    ('tenant_id', '=', TENANT_ID)
                ])
                print(f"  Commandes tenant {TENANT_ID}: {orders_count}")

                # Vérifier qu'aucun record n'a tenant_id différent
                wrong_products = env['product.template'].sudo().search_count([
                    ('tenant_id', '!=', TENANT_ID),
                    ('create_date', '>=', job.start_time)
                ])

                if wrong_products > 0:
                    print(f"  ❌ ERREUR: {wrong_products} produits créés avec mauvais tenant_id !")
                    return False
                else:
                    print(f"  ✅ Isolation multi-tenant OK")

                print("\n✅ TEST RÉUSSI !")
                return True

            elif job_data['status'] == 'error':
                print(f"\n❌ Erreur génération: {job_data.get('error_message')}")
                return False

        except Exception as e:
            print(f"\n❌ Exception durant génération: {e}")
            import traceback
            traceback.print_exc()
            job.mark_error(str(e))
            return False

if __name__ == '__main__':
    success = test_seed_generation()
    sys.exit(0 if success else 1)
