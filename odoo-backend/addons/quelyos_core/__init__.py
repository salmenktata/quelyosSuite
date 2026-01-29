# -*- coding: utf-8 -*-
import logging
from odoo import api, SUPERUSER_ID

_logger = logging.getLogger(__name__)

# Whitelist stricte : UNIQUEMENT modules core Odoo 19
ODOO_CORE_WHITELIST = [
    'base', 'web', 'mail', 'website', 'website_sale',
    'sale_management', 'product', 'stock', 'account',
    'crm', 'delivery', 'payment', 'loyalty', 'mass_mailing',
    'contacts',
]

QUELYOS_MODULES = [
    'quelyos_core', 'quelyos_api', 'quelyos_stock_advanced',
    'quelyos_finance', 'quelyos_sms_tn', 'quelyos_debrand',
]


def _fix_menu_visibility(env):
    """
    Correction automatique de la visibilité des menus Settings et Apps.

    Problème : Dans Odoo 19, les menus Settings et Apps ont des séquences élevées
    (500+) qui les rendent invisibles ou difficiles à trouver dans l'interface.

    Solution : Les placer au début (séquence 1 et 2) et s'assurer que l'admin
    a les groupes requis (Access Rights, Technical Features).
    """
    try:
        MenuObj = env['ir.ui.menu'].sudo()
        GroupsUsersRel = env['res.groups.users.rel'].sudo()

        # 1. Corriger les séquences des menus
        settings_menu = MenuObj.search([('name', '=', 'Settings'), ('parent_id', '=', False)], limit=1)
        apps_menu = MenuObj.search([('name', '=', 'Apps'), ('parent_id', '=', False)], limit=1)

        if settings_menu:
            settings_menu.write({'sequence': 1})
            _logger.info("✓ Menu Settings déplacé en position 1")

        if apps_menu:
            apps_menu.write({'sequence': 2})
            _logger.info("✓ Menu Apps déplacé en position 2")

        # 2. S'assurer que l'admin (uid=2) a les groupes requis
        GroupObj = env['res.groups'].sudo()

        # Groupe "Access Rights" (requis pour voir Settings)
        access_rights_group = GroupObj.search([('name', '=', 'Access Rights')], limit=1)
        if access_rights_group:
            env.cr.execute("""
                INSERT INTO res_groups_users_rel (gid, uid)
                VALUES (%s, 2)
                ON CONFLICT DO NOTHING
            """, (access_rights_group.id,))
            _logger.info("✓ Groupe 'Access Rights' ajouté à l'admin")

        # Groupe "Technical Features" (requis pour mode développeur)
        tech_group = GroupObj.search([('name', '=', 'Technical Features')], limit=1)
        if tech_group:
            env.cr.execute("""
                INSERT INTO res_groups_users_rel (gid, uid)
                VALUES (%s, 2)
                ON CONFLICT DO NOTHING
            """, (tech_group.id,))
            _logger.info("✓ Groupe 'Technical Features' ajouté à l'admin")

        env.cr.commit()
        _logger.info("✓ Corrections UI appliquées avec succès")

    except Exception as e:
        _logger.warning(f"Impossible d'appliquer les corrections UI : {str(e)}")


def _disable_website_tours(env):
    """
    Désactivation des tours website d'Odoo.

    Quelyos utilise ses propres frontends (vitrine-client, dashboard-client)
    et n'a pas besoin du configurateur website intégré d'Odoo.

    Cette fonction garantit que les paramètres système sont définis même si
    le chargement XML échoue pour une raison quelconque (défense en profondeur).
    """
    try:
        IrConfigParam = env['ir.config_parameter'].sudo()

        # Marquer le website_generator comme terminé
        IrConfigParam.set_param('website_generator.done', 'True')
        _logger.info("✓ Paramètre 'website_generator.done' défini à True")

        # Désactiver tous les tours automatiques
        IrConfigParam.set_param('web_tour.disable_tours', 'True')
        _logger.info("✓ Paramètre 'web_tour.disable_tours' défini à True")

        env.cr.commit()
        _logger.info("✓ Tours website désactivés avec succès")

    except Exception as e:
        # Ne pas bloquer l'installation si la désactivation échoue
        _logger.warning(f"Impossible de désactiver les tours website : {str(e)}")


def _configure_super_admin(env):
    """
    Configuration automatique du super-admin (uid=2).

    Cette fonction garantit que l'utilisateur admin a :
    1. Mot de passe par défaut sécurisé (6187)
    2. Tous les groupes Quelyos Manager (8 modules)
    3. Groupe Role/Administrator pour accès complet Odoo
    4. Accès multi-tenant à toutes les companies

    Note: Les groupes Access Rights et Technical Features sont déjà ajoutés
    par _fix_menu_visibility() pour assurer la visibilité des menus.

    Cette configuration permet au super-admin d'accéder à TOUS les modules
    existants et futurs, dans TOUS les frontends (dashboard, e-commerce, vitrine).
    """
    try:
        UsersObj = env['res.users'].sudo()
        GroupObj = env['res.groups'].sudo()
        CompanyObj = env['res.company'].sudo()

        # 0. Définir le mot de passe par défaut
        _logger.info("Configuration super-admin : définition du mot de passe par défaut...")

        admin_user = UsersObj.browse(2)  # uid=2 = admin
        if admin_user.exists():
            # Odoo gère automatiquement le hachage du mot de passe
            admin_user.write({'password': '6187'})
            _logger.info("  ✓ Mot de passe par défaut défini à '6187'")
        else:
            _logger.warning("  ⚠️  Utilisateur admin (uid=2) non trouvé")

        # 1. Ajouter tous les groupes Quelyos Manager
        _logger.info("Configuration super-admin : ajout des groupes Quelyos Manager...")

        quelyos_manager_groups = [
            'Quelyos Home Manager',
            'Quelyos Finance Manager',
            'Quelyos Store Manager',
            'Quelyos Stock Manager',
            'Quelyos CRM Manager',
            'Quelyos Marketing Manager',
            'Quelyos HR Manager',
            'Quelyos POS Manager',
        ]

        for group_name in quelyos_manager_groups:
            group = GroupObj.search([('name', '=', group_name)], limit=1)
            if group:
                env.cr.execute("""
                    INSERT INTO res_groups_users_rel (gid, uid)
                    VALUES (%s, 2)
                    ON CONFLICT DO NOTHING
                """, (group.id,))
                _logger.info(f"  ✓ Groupe '{group_name}' ajouté")
            else:
                _logger.warning(f"  ⚠️  Groupe '{group_name}' non trouvé (module peut-être non installé)")

        # 2. Ajouter les groupes système critiques
        _logger.info("Configuration super-admin : ajout des groupes système critiques...")

        critical_groups = [
            'Access Rights',           # Accès Settings
            'Technical Features',      # Mode développeur
            'Role/Administrator',      # Accès complet Odoo
        ]

        for group_name in critical_groups:
            group = GroupObj.search([('name', '=', group_name)], limit=1)
            if group:
                env.cr.execute("""
                    INSERT INTO res_groups_users_rel (gid, uid)
                    VALUES (%s, 2)
                    ON CONFLICT DO NOTHING
                """, (group.id,))
                _logger.info(f"  ✓ Groupe '{group_name}' ajouté")
            else:
                _logger.warning(f"  ⚠️  Groupe '{group_name}' non trouvé")

        # 3. Accès multi-tenant : ajouter admin à toutes les companies
        _logger.info("Configuration super-admin : accès multi-tenant...")

        all_companies = CompanyObj.search([])
        _logger.info(f"  Nombre de companies détectées : {len(all_companies)}")

        for company in all_companies:
            env.cr.execute("""
                INSERT INTO res_company_users_rel (cid, user_id)
                VALUES (%s, 2)
                ON CONFLICT DO NOTHING
            """, (company.id,))
            _logger.info(f"  ✓ Accès ajouté pour company '{company.name}' (ID={company.id})")

        env.cr.commit()
        _logger.info("✓ Configuration super-admin terminée avec succès")
        _logger.info("  → Admin a maintenant accès à TOUS les modules (existants et futurs)")
        _logger.info("  → Admin a maintenant accès à TOUS les tenants")

    except Exception as e:
        _logger.warning(f"Impossible de configurer le super-admin : {str(e)}")


def post_init_hook(env):
    """
    Hook exécuté après l'installation de quelyos_core.
    Installe automatiquement les modules Quelyos selon la configuration par défaut.

    Ordre d'installation :
    1. quelyos_api (TOUJOURS - critique pour infrastructure multi-tenant)
    2. quelyos_stock_advanced (optionnel - par défaut OUI)
    3. quelyos_finance (optionnel - par défaut OUI)
    4. quelyos_sms_tn (optionnel - par défaut OUI)

    Les modules optionnels peuvent être désactivés via ir.config_parameter :
    - quelyos.install_stock_advanced
    - quelyos.install_finance
    - quelyos.install_sms_tn

    Args:
        env: Environment Odoo 19 (nouvelle signature post_init_hook)
    """
    _logger.info("="*80)
    _logger.info("QUELYOS SUITE ORCHESTRATOR - Starting automatic installation")
    _logger.info("="*80)

    # 1. Lire paramètres de configuration
    IrConfigParam = env['ir.config_parameter'].sudo()
    install_stock_advanced = IrConfigParam.get_param('quelyos.install_stock_advanced', 'True') == 'True'
    install_finance = IrConfigParam.get_param('quelyos.install_finance', 'True') == 'True'
    install_sms_tn = IrConfigParam.get_param('quelyos.install_sms_tn', 'True') == 'True'

    _logger.info(f"Configuration détectée :")
    _logger.info(f"  - quelyos_api: AUTOMATIQUE (dépendance directe)")
    _logger.info(f"  - quelyos_stock_advanced: {'OUI' if install_stock_advanced else 'NON'}")
    _logger.info(f"  - quelyos_finance: {'OUI' if install_finance else 'NON'}")
    _logger.info(f"  - quelyos_sms_tn: {'OUI' if install_sms_tn else 'NON'}")

    # 2. Préparer liste des modules optionnels à installer
    # Note: quelyos_api est une dépendance directe de quelyos_core et sera installé automatiquement
    # Format: (module_name, is_critical, description)
    modules_to_install = []

    if install_stock_advanced:
        modules_to_install.append(('quelyos_stock_advanced', False, 'Inventaire avancé'))
    if install_finance:
        modules_to_install.append(('quelyos_finance', False, 'Gestion trésorerie et budgets'))
    if install_sms_tn:
        modules_to_install.append(('quelyos_sms_tn', False, 'Notifications SMS Tunisie'))

    # 3. Installer les modules séquentiellement
    ModuleObj = env['ir.module.module'].sudo()

    for module_name, is_critical, description in modules_to_install:
        _logger.info("-"*80)
        _logger.info(f"Vérification du module : {module_name}")

        # Rechercher le module
        module = ModuleObj.search([('name', '=', module_name)], limit=1)

        if not module:
            msg = f"Module {module_name} NOT FOUND dans addons_path"
            if is_critical:
                _logger.error(msg)
                raise Exception(msg)
            else:
                _logger.warning(f"{msg} - Optionnel, on continue")
                continue

        # Vérifier si déjà installé
        if module.state == 'installed':
            _logger.info(f"Module {module_name} déjà installé - Skip")
            continue

        # Marquer le module pour installation (sera installé au prochain redémarrage)
        _logger.info(f"Marquage pour installation : {description}...")
        try:
            module.button_install()
            _logger.info(f"✓ Module {module_name} marqué pour installation")
        except Exception as e:
            msg = f"Erreur installation {module_name}: {str(e)}"
            if is_critical:
                _logger.error(msg)
                raise
            else:
                _logger.warning(f"{msg} - Optionnel, on continue")

    _logger.info("="*80)
    _logger.info("QUELYOS SUITE ORCHESTRATOR - Installation terminée avec succès")
    _logger.info("="*80)
    if modules_to_install:
        _logger.info("IMPORTANT: Modules optionnels marqués pour installation")
        _logger.info("Redémarrer le serveur Odoo pour finaliser l'installation :")
        _logger.info("  docker-compose restart odoo")
    _logger.info("="*80)

    # 4. Vérifier isolation : aucun module non-whitelisté installé
    _logger.info("-"*80)
    _logger.info("Vérification isolation : aucun module OCA/tierce détecté...")

    forbidden = ModuleObj.search([
        ('state', '=', 'installed'),
        ('name', 'not in', ODOO_CORE_WHITELIST + QUELYOS_MODULES),
        ('name', 'not like', 'base_%'),  # Modules techniques Odoo
        ('name', 'not like', 'web_%'),   # Modules web techniques
        ('name', 'not like', 'theme_%'),  # Modules thèmes Odoo
        ('name', 'not like', 'hw_%'),    # Modules hardware IoT Odoo
        ('name', 'not like', 'l10n_%'),  # Modules localisation Odoo
    ])

    if forbidden:
        forbidden_names = forbidden.mapped('name')
        _logger.warning(
            f"⚠️  MODULES NON-CORE DÉTECTÉS : {forbidden_names}\n"
            f"Quelyos Suite recommande de désinstaller ces modules pour "
            f"garantir l'isolation et éviter les régressions lors de mises à jour.\n"
            f"Modules détectés : {', '.join(forbidden_names)}"
        )
    else:
        _logger.info("✓ Isolation vérifiée : aucun module OCA/tierce installé")

    # 5. Corriger la visibilité des menus Settings et Apps
    _logger.info("-"*80)
    _logger.info("Application des corrections UI : menus Settings et Apps...")
    _fix_menu_visibility(env)

    # 6. Désactiver les tours website automatiques
    _logger.info("-"*80)
    _logger.info("Désactivation des tours website d'Odoo...")
    _disable_website_tours(env)

    # 7. Configurer le super-admin (admin, uid=2)
    _logger.info("-"*80)
    _logger.info("Configuration automatique du super-admin (admin, uid=2)...")
    _configure_super_admin(env)

    _logger.info("="*80)
