#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script pour charger des données de démonstration dans le module quelyos_subscription.
Usage: docker-compose exec odoo python3 /mnt/extra-addons/../load_demo_subscriptions.py
"""

import xmlrpc.client
from datetime import datetime, timedelta

# Configuration
url = 'http://localhost:8069'
db = 'quelyos'
username = 'admin'
password = 'admin'

def main():
    print("=== Chargement des données de démonstration quelyos_subscription ===\n")

    # Connexion à Odoo
    common = xmlrpc.client.ServerProxy(f'{url}/xmlrpc/2/common')
    uid = common.authenticate(db, username, password, {})

    if not uid:
        print("❌ Échec de l'authentification. Vérifiez vos identifiants.")
        return

    print(f"✅ Authentifié en tant que user ID: {uid}\n")

    models = xmlrpc.client.ServerProxy(f'{url}/xmlrpc/2/object')

    # Récupérer les plans existants
    print("📋 Récupération des plans d'abonnement...")
    plans = models.execute_kw(db, uid, password, 'subscription.plan', 'search_read',
                              [[]], {'fields': ['id', 'name', 'code']})

    if not plans:
        print("❌ Aucun plan trouvé. Installez d'abord le module quelyos_subscription.")
        return

    plan_dict = {plan['code']: plan['id'] for plan in plans}
    print(f"✅ {len(plans)} plans trouvés: {', '.join([p['name'] for p in plans])}\n")

    # Créer des clients de démonstration
    print("👥 Création des clients de démonstration...")
    partners_data = [
        {
            'name': 'Tech Startup SAS',
            'email': 'contact@techstartup.fr',
            'phone': '+33 1 42 00 00 01',
            'street': '15 Rue de la Tech',
            'city': 'Paris',
            'zip': '75001',
            'country_id': 75,  # France
            'is_company': True,
        },
        {
            'name': 'E-commerce Pro SARL',
            'email': 'admin@ecommercepro.fr',
            'phone': '+33 4 91 00 00 02',
            'street': '42 Avenue du Commerce',
            'city': 'Marseille',
            'zip': '13001',
            'country_id': 75,
            'is_company': True,
        },
        {
            'name': 'Grande Distribution SA',
            'email': 'it@grandedistrib.fr',
            'phone': '+33 5 56 00 00 03',
            'street': '100 Boulevard de l\'Enterprise',
            'city': 'Bordeaux',
            'zip': '33000',
            'country_id': 75,
            'is_company': True,
        },
        {
            'name': 'Boutique Bio EURL',
            'email': 'contact@boutiquebio.fr',
            'phone': '+33 4 78 00 00 04',
            'street': '8 Rue du Bio',
            'city': 'Lyon',
            'zip': '69001',
            'country_id': 75,
            'is_company': True,
        },
        {
            'name': 'Fashion Store',
            'email': 'hello@fashionstore.fr',
            'phone': '+33 2 40 00 00 05',
            'street': '25 Place de la Mode',
            'city': 'Nantes',
            'zip': '44000',
            'country_id': 75,
            'is_company': True,
        },
    ]

    partner_ids = []
    for partner_data in partners_data:
        # Vérifier si le client existe déjà
        existing = models.execute_kw(db, uid, password, 'res.partner', 'search',
                                      [[('email', '=', partner_data['email'])]])

        if existing:
            partner_ids.append(existing[0])
            print(f"  ℹ️  Client existant: {partner_data['name']}")
        else:
            partner_id = models.execute_kw(db, uid, password, 'res.partner', 'create', [partner_data])
            partner_ids.append(partner_id)
            print(f"  ✅ Client créé: {partner_data['name']}")

    print(f"\n✅ {len(partner_ids)} clients disponibles\n")

    # Créer des abonnements de démonstration
    print("📝 Création des abonnements de démonstration...\n")

    today = datetime.now().date()

    subscriptions_data = [
        {
            'partner_id': partner_ids[0],
            'plan_id': plan_dict.get('starter'),
            'state': 'trial',
            'billing_cycle': 'monthly',
            'start_date': (today - timedelta(days=5)).strftime('%Y-%m-%d'),
            'trial_end_date': (today + timedelta(days=9)).strftime('%Y-%m-%d'),
            'next_billing_date': (today + timedelta(days=9)).strftime('%Y-%m-%d'),
        },
        {
            'partner_id': partner_ids[1],
            'plan_id': plan_dict.get('pro'),
            'state': 'active',
            'billing_cycle': 'monthly',
            'start_date': (today - timedelta(days=45)).strftime('%Y-%m-%d'),
            'next_billing_date': (today + timedelta(days=15)).strftime('%Y-%m-%d'),
            'stripe_subscription_id': 'sub_demo_123456789',
            'stripe_customer_id': 'cus_demo_987654321',
        },
        {
            'partner_id': partner_ids[2],
            'plan_id': plan_dict.get('enterprise'),
            'state': 'active',
            'billing_cycle': 'yearly',
            'start_date': (today - timedelta(days=180)).strftime('%Y-%m-%d'),
            'next_billing_date': (today + timedelta(days=185)).strftime('%Y-%m-%d'),
            'stripe_subscription_id': 'sub_demo_enterprise_001',
            'stripe_customer_id': 'cus_demo_enterprise_001',
        },
        {
            'partner_id': partner_ids[3],
            'plan_id': plan_dict.get('starter'),
            'state': 'active',
            'billing_cycle': 'yearly',
            'start_date': (today - timedelta(days=90)).strftime('%Y-%m-%d'),
            'next_billing_date': (today + timedelta(days=275)).strftime('%Y-%m-%d'),
            'stripe_subscription_id': 'sub_demo_starter_002',
            'stripe_customer_id': 'cus_demo_starter_002',
        },
        {
            'partner_id': partner_ids[4],
            'plan_id': plan_dict.get('pro'),
            'state': 'past_due',
            'billing_cycle': 'monthly',
            'start_date': (today - timedelta(days=120)).strftime('%Y-%m-%d'),
            'next_billing_date': (today - timedelta(days=5)).strftime('%Y-%m-%d'),
            'stripe_subscription_id': 'sub_demo_pastdue_003',
            'stripe_customer_id': 'cus_demo_pastdue_003',
        },
    ]

    created_count = 0
    for i, sub_data in enumerate(subscriptions_data):
        # Vérifier si l'abonnement existe déjà pour ce client
        existing = models.execute_kw(db, uid, password, 'subscription', 'search',
                                      [[('partner_id', '=', sub_data['partner_id'])]])

        if existing:
            print(f"  ℹ️  Abonnement existant pour {partners_data[i]['name']}")
        else:
            sub_id = models.execute_kw(db, uid, password, 'subscription', 'create', [sub_data])
            created_count += 1

            # Récupérer le nom généré
            subscription = models.execute_kw(db, uid, password, 'subscription', 'read',
                                              [sub_id], {'fields': ['name']})

            plan_name = next((p['name'] for p in plans if p['id'] == sub_data['plan_id']), 'Unknown')
            state_emoji = {'trial': '🆓', 'active': '✅', 'past_due': '⚠️'}.get(sub_data['state'], '📝')

            print(f"  {state_emoji} Abonnement créé: {subscription[0]['name']} - {partners_data[i]['name']} ({plan_name} - {sub_data['state']})")

    print(f"\n✅ {created_count} nouveaux abonnements créés\n")

    # Résumé final
    total_subs = models.execute_kw(db, uid, password, 'subscription', 'search_count', [[]])

    print("=" * 60)
    print(f"🎉 Données de démonstration chargées avec succès !")
    print("=" * 60)
    print(f"📊 Total abonnements en base : {total_subs}")
    print(f"👥 Total clients : {len(partner_ids)}")
    print("\n🔗 Accès Odoo : http://localhost:8069")
    print("   Menu : Abonnements → Abonnements / Plans")
    print()

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"\n❌ Erreur : {str(e)}")
        import traceback
        traceback.print_exc()
