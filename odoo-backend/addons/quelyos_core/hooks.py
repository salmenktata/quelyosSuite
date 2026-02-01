# -*- coding: utf-8 -*-
"""
Hooks d'installation Quelyos Core
Exécute la configuration automatique après installation quelyos_api
"""

import logging

_logger = logging.getLogger(__name__)


def post_init_hook(env):
    """
    Hook exécuté APRÈS l'installation du module quelyos_core

    Note: quelyos_core s'installe AVANT quelyos_api (dépendance),
    donc quand ce hook s'exécute, quelyos_api est déjà installé.

    On peut donc configurer :
    - Utilisateur admin
    - Groupe Access Rights
    - Configurations Brevo + Groq
    """
    _logger.info("=" * 80)
    _logger.info("⚙️  QUELYOS CORE - Configuration Post-Installation")
    _logger.info("=" * 80)

    # Récupérer le tenant par défaut
    try:
        Tenant = env['quelyos.tenant']
        tenant = Tenant.search([('name', 'like', '%Admin%')], order='id', limit=1)

        if not tenant:
            _logger.warning("   ⚠️  Aucun tenant trouvé, configuration limitée")
            return
    except Exception as e:
        _logger.error(f"   ❌ Erreur récupération tenant : {e}")
        return

    # 1. Configurer l'utilisateur admin par défaut
    _logger.info("\n🔧 Configuration utilisateur admin...")

    try:
        User = env['res.users']
        admin = User.search([('login', '=', 'admin')], limit=1)

        if admin:
            # Associer admin au tenant + définir password par défaut
            try:
                admin.sudo().write({
                    'company_id': tenant.company_id.id,
                    'company_ids': [(6, 0, [tenant.company_id.id])],
                    'password': '6187',  # Password par défaut
                })
                env.cr.commit()  # Commit immédiat
                _logger.info(f"   ✓ Utilisateur admin associé au tenant '{tenant.name}' (company_id={tenant.company_id.id})")
                _logger.info("   ✓ Password par défaut défini : 6187")
            except Exception as e:
                _logger.error(f"   ❌ Erreur association admin : {e}")

            # Ajouter le groupe "Access Rights"
            try:
                Group = env['res.groups']
                access_group = Group.search([('name', 'like', '%Access Rights%')], limit=1)

                if access_group and access_group not in admin.group_ids:
                    admin.sudo().write({'group_ids': [(4, access_group.id)]})
                    env.cr.commit()  # Commit immédiat
                    _logger.info("   ✓ Groupe 'Access Rights' (super-admin) ajouté à l'utilisateur admin")
                elif access_group:
                    _logger.info("   ✓ Groupe 'Access Rights' déjà présent pour admin")
                else:
                    _logger.warning("   ⚠️  Groupe 'Access Rights' non trouvé")
            except Exception as e:
                _logger.error(f"   ❌ Erreur ajout Access Rights : {e}")
        else:
            _logger.warning("   ⚠️  Utilisateur admin non trouvé")
    except Exception as e:
        _logger.error(f"   ❌ Erreur configuration admin : {e}")

    # 2. Configuration Brevo (email marketing)
    _logger.info("\n📧 Configuration services externes...")

    try:
        EmailConfig = env['quelyos.email.config']
        existing_brevo = EmailConfig.search([('provider', '=', 'brevo')], limit=1)

        if not existing_brevo:
            EmailConfig.sudo().create({
                'provider': 'brevo',
                'is_active': True,
                'api_key': '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',
                'email_from': 'noreply@quelyos.com',
                'email_from_name': 'Quelyos',
                'company_id': tenant.company_id.id,
            })
            env.cr.commit()  # Commit immédiat
            _logger.info("   ✓ Configuration Brevo créée avec clé API et activée")
        else:
            _logger.info("   ✓ Configuration Brevo déjà existante")
    except Exception as e:
        _logger.error(f"   ❌ Erreur création Brevo : {e}")

    # 3. Configuration Chatbot/AI (Groq par défaut)
    try:
        AIConfig = env['quelyos.ai.config']
        existing_groq = AIConfig.search([('provider', '=', 'groq')], limit=1)

        if not existing_groq:
            AIConfig.sudo().create({
                'name': 'Groq AI (Chatbot)',
                'provider': 'groq',
                'is_enabled': True,
                'model': 'llama-3.1-70b-versatile',
                'api_key_encrypted': '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',
                'max_tokens': 800,
                'temperature': 0.7,
            })
            env.cr.commit()  # Commit immédiat
            _logger.info("   ✓ Configuration Chatbot (Groq) créée avec clé API et activée")
        else:
            _logger.info("   ✓ Configuration Chatbot déjà existante")
    except Exception as e:
        _logger.error(f"   ❌ Erreur création Groq : {e}")

    _logger.info("\n" + "=" * 80)
    _logger.info("✅ QUELYOS CORE - Configuration Terminée avec Succès !")
    _logger.info("=" * 80)
