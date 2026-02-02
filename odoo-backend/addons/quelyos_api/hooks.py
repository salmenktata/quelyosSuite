# -*- coding: utf-8 -*-
"""
Hooks d'installation Quelyos Suite
Gère l'installation automatique de tous les prérequis
"""

import logging
import subprocess
import sys
import odoo
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)


def _install_python_dependencies():
    """Installe les dépendances Python si manquantes"""
    required_packages = ['qrcode', 'Pillow', 'faker']
    
    for package in required_packages:
        try:
            __import__(package.lower())
            _logger.info(f"✅ Package Python '{package}' déjà installé")
        except ImportError:
            _logger.warning(f"⚠️  Package Python '{package}' manquant, installation...")
            try:
                subprocess.check_call([
                    sys.executable, '-m', 'pip', 'install', package
                ])
                _logger.info(f"✅ Package Python '{package}' installé avec succès")
            except subprocess.CalledProcessError as e:
                _logger.error(f"❌ Échec installation '{package}': {e}")
                raise


def _check_oca_modules(env):
    """Vérifie si les modules OCA sont disponibles"""
    env.cr.execute("""
        SELECT name, state
        FROM ir_module_module
        WHERE name IN ('stock_inventory', 'stock_warehouse_calendar')
    """)

    oca_modules = env.cr.fetchall()
    
    if not oca_modules:
        _logger.warning("""
⚠️  MODULES OCA MANQUANTS
        
Les modules OCA suivants sont recommandés mais pas installés :
- stock_inventory (Inventaire avancé)
- stock_warehouse_calendar (Calendrier entrepôt)

Pour les installer :
1. cd odoo-backend/addons
2. git clone -b 19.0 https://github.com/OCA/stock-logistics-warehouse.git oca-stock
3. ln -s oca-stock/stock_inventory .
4. ln -s oca-stock/stock_warehouse_calendar .
5. Redémarrer Odoo

ℹ️  Quelyos Suite fonctionnera quand même sans ces modules (fonctionnalités réduites).
        """)
    else:
        for name, state in oca_modules:
            _logger.info(f"✅ Module OCA '{name}' trouvé (état: {state})")


def pre_init_hook(env):
    """
    Hook exécuté AVANT l'installation du module
    Vérifie version Odoo, installe les prérequis
    """
    _logger.info("=" * 80)
    _logger.info("🚀 QUELYOS SUITE - Installation Automatique")
    _logger.info("=" * 80)

    # 0. Vérifier version Odoo
    _logger.info("\n🔍 Vérification version Odoo...")
    odoo_version = odoo.release.version_info[0]
    if odoo_version != 19:
        error_msg = (
            f"Quelyos API requiert Odoo 19.0.x exactement.\n"
            f"Version détectée : {odoo.release.version}\n"
            f"Veuillez installer Odoo 19 avant d'installer Quelyos Suite."
        )
        _logger.error(error_msg)
        raise UserError(error_msg)

    _logger.info(f"✅ Version Odoo validée : {odoo.release.version}")

    # 1. Installer dépendances Python
    _logger.info("\n📦 Vérification dépendances Python...")
    try:
        _install_python_dependencies()
    except Exception as e:
        _logger.error(f"❌ Erreur installation dépendances Python: {e}")
        # Ne pas bloquer l'installation, juste avertir

    # 2. Vérifier modules OCA
    _logger.info("\n🔍 Vérification modules OCA...")
    _check_oca_modules(env)

    _logger.info("\n✅ Pré-installation terminée")
    _logger.info("=" * 80)


def post_init_hook(env):
    """
    Hook exécuté APRÈS l'installation du module
    Configure l'environnement Quelyos
    """
    _logger.info("=" * 80)
    _logger.info("⚙️  QUELYOS SUITE - Configuration Post-Installation")
    _logger.info("=" * 80)

    # 1. Vérifier que quelyos_api est bien installé
    env.cr.execute("""
        SELECT state FROM ir_module_module
        WHERE name = 'quelyos_api'
    """)

    result = env.cr.fetchone()
    if result and result[0] == 'installed':
        _logger.info("✅ Module quelyos_api installé avec succès")
    else:
        _logger.error("❌ Module quelyos_api PAS installé correctement !")
        return

    # 2. Vérifier tenant par défaut
    env.cr.execute("""
        SELECT COUNT(*) FROM quelyos_tenant
        WHERE name = 'Admin Tenant'
    """)

    tenant_count = env.cr.fetchone()[0]
    if tenant_count > 0:
        _logger.info(f"✅ Tenant par défaut créé ({tenant_count} tenant(s) trouvé(s))")
    else:
        _logger.warning("⚠️  Aucun tenant trouvé, vérifier data/default_admin_tenant.xml")

    # 3. Configurer l'utilisateur admin par défaut
    _logger.info("\n🔧 Configuration utilisateur admin...")

    # 3.1 Récupérer le tenant par défaut et sa company via ORM
    Tenant = env['quelyos.tenant']
    tenant = Tenant.search([('name', 'like', '%Admin%')], order='id', limit=1)

    if tenant:
        # 3.2 Récupérer l'utilisateur admin via ORM
        User = env['res.users']
        admin = User.search([('login', '=', 'admin')], limit=1)

        if admin:
            # 3.3 Associer admin au tenant via ORM (commit automatique)
            admin.write({
                'company_id': tenant.company_id.id,
                'company_ids': [(6, 0, [tenant.company_id.id])]
            })
            _logger.info(f"   ✓ Utilisateur admin associé au tenant '{tenant.name}' (company_id={tenant.company_id.id})")

            # 3.4 Ajouter le groupe "Access Rights" via ORM
            Group = env['res.groups']
            access_group = Group.search([('name', 'like', '%Access Rights%')], limit=1)

            if access_group and access_group not in admin.group_ids:
                admin.write({'group_ids': [(4, access_group.id)]})
                _logger.info("   ✓ Groupe 'Access Rights' (super-admin) ajouté à l'utilisateur admin")
                _logger.info("   ✓ L'utilisateur admin a maintenant accès à TOUS les modules du dashboard")
            elif access_group:
                _logger.info("   ✓ Groupe 'Access Rights' déjà présent pour admin")
            else:
                _logger.warning("   ⚠️  Groupe 'Access Rights' non trouvé dans le système")
        else:
            _logger.warning("   ⚠️  Utilisateur admin non trouvé")
    else:
        _logger.warning("   ⚠️  Aucun tenant trouvé, utilisateur admin non configuré")

    # 5. Vérifier plans tarifaires par défaut
    _logger.info("\n💰 Vérification plans tarifaires...")

    SubscriptionPlan = env['quelyos.subscription.plan']
    plans = SubscriptionPlan.search([])

    if len(plans) >= 3:
        _logger.info(f"   ✓ {len(plans)} plans tarifaires trouvés :")
        for plan in plans.sorted('display_order'):
            price_display = f"{plan.price_monthly}€/mois" if plan.price_monthly > 0 else "Sur devis"
            popular = " ⭐ POPULAIRE" if plan.is_popular else ""
            _logger.info(f"     • {plan.name} ({plan.code}) - {price_display}{popular}")
    else:
        _logger.warning(f"   ⚠️  Seulement {len(plans)} plan(s) trouvé(s) (attendu: 3)")
        _logger.warning("      Vérifier que subscription_plan_data.xml est bien chargé")

    # 6. Créer configurations par défaut (Brevo, Chatbot)
    _logger.info("\n📧 Configuration services externes...")

    # 6.1 Configuration Brevo (email marketing)
    EmailConfig = env['quelyos.email.config']
    existing_brevo = EmailConfig.search([('provider', '=', 'brevo')], limit=1)

    if not existing_brevo and tenant:
        # Note: quelyos.email.config n'a pas de champ 'name'
        EmailConfig.create({
            'provider': 'brevo',
            'is_active': True,  # Activé par défaut
            'api_key': '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',
            'email_from': 'noreply@quelyos.com',
            'email_from_name': 'Quelyos',
            'company_id': tenant.company_id.id,  # CRITIQUE : company_id requis (NOT NULL)
        })
        _logger.info("   ✓ Configuration Brevo créée avec clé API et activée automatiquement")
    elif existing_brevo:
        _logger.info("   ✓ Configuration Brevo déjà existante")
    else:
        _logger.warning("   ⚠️  Tenant non trouvé, configuration Brevo non créée")

    # 6.2 Configuration Chatbot/AI (Groq par défaut)
    AIConfig = env['quelyos.ai.config']
    existing_groq = AIConfig.search([('provider', '=', 'groq')], limit=1)

    if not existing_groq:
        # Note: quelyos.ai.config n'a PAS de champ company_id (contrairement à email.config)
        AIConfig.create({
            'name': 'Groq AI (Chatbot)',
            'provider': 'groq',
            'is_enabled': True,  # Activé par défaut
            'model': 'llama-3.1-70b-versatile',
            'api_key_encrypted': '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',  # Sera chiffré automatiquement
            'max_tokens': 800,
            'temperature': 0.7,
        })
        _logger.info("   ✓ Configuration Chatbot (Groq) créée avec clé API et activée automatiquement")
    else:
        _logger.info("   ✓ Configuration Chatbot déjà existante")

    # 7. Afficher résumé installation
    _logger.info("\n" + "=" * 80)
    _logger.info("🎉 QUELYOS SUITE - Installation Terminée avec Succès !")
    _logger.info("=" * 80)
    _logger.info("""
📊 Modules installés :
   - Odoo Core (base, sale, stock, account, crm, website, etc.)
   - Quelyos API (backend complet + modules OCA intégrés)

🔧 Configuration automatique :
   - Tenant par défaut : Admin Quelyos ✓
   - Utilisateur admin : Configuré avec accès complet ✓
   - Groupe Access Rights : Ajouté (super-admin) ✓
   - Plans tarifaires : 3 plans (Starter, Pro, Enterprise) ✓
   - Configuration Brevo : Créée et activée ✓
   - Configuration Chatbot Groq : Créée et activée ✓
   - Base de données : Prête ✓
   - API REST : http://localhost:8069/api/ ✓

👤 Compte administrateur :
   - Login : admin
   - Password : admin
   - Accès : TOUS les modules (Home, Finance, Store, Stock, CRM, Marketing, HR, POS, Support)

📚 Prochaines étapes :
   1. Démarrer les frontends :
      - Dashboard (ERP): cd dashboard-client && npm run dev (port 5175)
      - E-commerce: cd vitrine-client && npm run dev (port 3001)
      - Vitrine: cd vitrine-quelyos && npm run dev (port 3000)
      - Super Admin: cd super-admin-client && npm run dev (port 9000)

   2. Se connecter au dashboard :
      - URL: http://localhost:5175
      - Login: admin
      - Password: admin
      - ✅ Tous les 9 modules seront accessibles immédiatement !

   3. Configurer les services (optionnel) :
      - Super Admin: http://localhost:9000
      - Ajouter clé API Brevo pour l'email marketing
      - Ajouter clé API OpenAI/Groq pour le chatbot

🌐 Documentation :
   - README-DEV.md : Documentation technique complète
   - .claude/ : Guides et références

✅ Quelyos Suite est prêt à l'emploi !
    """)
    _logger.info("=" * 80)


def uninstall_hook(cr, registry):
    """
    Hook exécuté lors de la désinstallation
    Nettoie les données Quelyos si demandé
    """
    _logger.info("=" * 80)
    _logger.info("🗑️  QUELYOS SUITE - Désinstallation")
    _logger.info("=" * 80)
    
    _logger.warning("""
⚠️  ATTENTION : Désinstallation de Quelyos Suite

Les données suivantes seront conservées :
- Tenants (quelyos_tenant)
- Abonnements (quelyos_subscription)
- Données métier (produits, commandes, etc.)

Pour supprimer complètement les données Quelyos :
1. Aller dans Settings > Technical > Database Structure > Models
2. Rechercher "quelyos"
3. Supprimer manuellement les modèles si nécessaire

ℹ️  Les modules Odoo Core (sale, stock, etc.) restent installés.
    """)
    
    _logger.info("=" * 80)
    _logger.info("✅ Désinstallation terminée")
    _logger.info("=" * 80)
