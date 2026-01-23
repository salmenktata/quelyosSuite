# -*- coding: utf-8 -*-

from . import models


def _post_install_frontend(env):
    """
    Hook post-installation pour déployer le frontend.

    Étapes:
    1. Vérifier Node.js installé (>= 18)
    2. Générer .env.local depuis config Odoo
    3. Exécuter npm install
    4. Exécuter npm run build
    5. Installer service systemd
    6. Démarrer le service
    """
    import logging
    import os
    import subprocess

    _logger = logging.getLogger(__name__)

    # Chemin du module
    module_path = os.path.dirname(os.path.abspath(__file__))
    frontend_path = os.path.join(module_path, 'frontend')
    scripts_path = os.path.join(module_path, 'scripts')

    _logger.info("=== Démarrage installation Frontend Quelyos ===")

    # Vérifier que le dossier frontend existe
    if not os.path.exists(frontend_path):
        _logger.warning(f"Le dossier frontend n'existe pas: {frontend_path}")
        _logger.info("Pour installer le frontend, copiez le code Next.js dans: backend/addons/quelyos_frontend/frontend/")
        _logger.info("Ensuite, exécutez manuellement les scripts d'installation")
        return

    try:
        # Étape 1: Vérifier Node.js
        _logger.info("Vérification Node.js...")
        result = subprocess.run(
            [os.path.join(scripts_path, 'check_nodejs.sh')],
            capture_output=True,
            text=True,
            cwd=scripts_path
        )
        if result.returncode != 0:
            _logger.error(f"Node.js non installé ou version < 18: {result.stderr}")
            raise Exception("Node.js >= 18 requis. Installez-le avec: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs")
        _logger.info(f"Node.js OK: {result.stdout}")

        # Étape 2: Générer .env.local
        _logger.info("Génération .env.local...")
        config = env['quelyos.frontend.config'].get_config()
        env_content = f"""# Généré automatiquement par quelyos_frontend
NEXT_PUBLIC_ODOO_URL={config['backend_url']}
NEXT_PUBLIC_SITE_URL={config['frontend_url']}
NEXT_PUBLIC_PRIMARY_COLOR={config['primary_color']}
NEXT_PUBLIC_SECONDARY_COLOR={config['secondary_color']}
NEXT_PUBLIC_LOGO_URL={config['logo_url']}
"""
        env_file_path = os.path.join(frontend_path, '.env.local')
        with open(env_file_path, 'w') as f:
            f.write(env_content)
        _logger.info(".env.local créé")

        # Étape 3: npm install
        _logger.info("Installation des dépendances npm (cela peut prendre plusieurs minutes)...")
        result = subprocess.run(
            ['npm', 'install'],
            cwd=frontend_path,
            capture_output=True,
            text=True,
            timeout=600  # 10 minutes max
        )
        if result.returncode != 0:
            _logger.error(f"npm install échoué: {result.stderr}")
            raise Exception(f"npm install a échoué")
        _logger.info("npm install terminé")

        # Étape 4: npm run build
        _logger.info("Build du frontend Next.js (cela peut prendre plusieurs minutes)...")
        result = subprocess.run(
            ['npm', 'run', 'build'],
            cwd=frontend_path,
            capture_output=True,
            text=True,
            timeout=600
        )
        if result.returncode != 0:
            _logger.error(f"npm run build échoué: {result.stderr}")
            raise Exception("npm run build a échoué")
        _logger.info("Build terminé")

        # Étape 5: Installer service systemd
        _logger.info("Installation service systemd...")
        systemd_installed = False
        result = subprocess.run(
            [os.path.join(scripts_path, 'install_systemd.sh'), frontend_path],
            capture_output=True,
            text=True,
            cwd=scripts_path
        )
        if result.returncode != 0:
            _logger.warning(f"Installation systemd échouée (nécessite sudo): {result.stderr}")
            _logger.info("Utilisez manuellement: sudo bash scripts/install_systemd.sh")
        else:
            _logger.info("Service systemd installé et activé")
            systemd_installed = True

        # Étape 6: Démarrer le frontend
        if systemd_installed:
            _logger.info("Le service systemd a démarré automatiquement")
            _logger.info("Vérifiez l'état avec: systemctl status quelyos-frontend")
            _logger.info("Logs: journalctl -u quelyos-frontend -f")
        else:
            # Fallback: démarrer en mode dev en background
            _logger.info("Démarrage du frontend en mode développement...")
            try:
                subprocess.Popen(
                    ['npm', 'run', 'dev'],
                    cwd=frontend_path,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    start_new_session=True
                )
                _logger.info("Frontend démarré en arrière-plan (mode dev)")
                _logger.info("Pour le voir tourner: ps aux | grep next")
                _logger.info("Pour l'arrêter: pkill -f 'next-server'")
            except Exception as e:
                _logger.warning(f"Impossible de démarrer automatiquement: {e}")
                _logger.info("Démarrez manuellement avec: cd backend/addons/quelyos_frontend/frontend && npm run dev")

        _logger.info("=== Installation Frontend Quelyos terminée avec succès ===")
        _logger.info(f"Frontend accessible sur: {config['frontend_url']}")

    except Exception as e:
        _logger.error(f"Erreur lors de l'installation du frontend: {str(e)}")
        _logger.error("Le module Odoo est installé mais le frontend nécessite une configuration manuelle")
        _logger.error("Consultez: backend/addons/quelyos_frontend/README.md")
