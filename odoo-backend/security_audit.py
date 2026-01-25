#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script d'audit de sécurité pour les endpoints Quelyos API
Analyse tous les endpoints et vérifie :
- Endpoints auth='user' sans _require_admin()
- Endpoints avec cors='*' (vulnérable)
- Endpoints admin sans vérification groupe
"""

import os
import re
from pathlib import Path

# Couleurs pour terminal
class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    RESET = '\033[0m'


def analyze_controller(file_path):
    """Analyse un fichier controller et retourne les problèmes de sécurité"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        lines = content.split('\n')

    endpoints = []
    current_endpoint = None

    for i, line in enumerate(lines):
        # Détecter @http.route
        route_match = re.search(r"@http\.route\('([^']+)'.*auth='(\w+)'.*cors='([^']*)'", line)
        if route_match:
            path, auth, cors = route_match.groups()
            current_endpoint = {
                'file': os.path.basename(file_path),
                'line': i + 1,
                'path': path,
                'auth': auth,
                'cors': cors,
                'has_require_admin': False,
                'has_check_cors': False,
                'has_admin_check': False,
                'function_lines': []
            }

        # Détecter la fonction associée
        if current_endpoint and line.strip().startswith('def '):
            # Chercher _require_admin() dans les 50 lignes suivantes
            func_end = min(i + 100, len(lines))
            function_content = '\n'.join(lines[i:func_end])

            current_endpoint['has_require_admin'] = '_require_admin()' in function_content
            current_endpoint['has_check_cors'] = '_check_cors()' in function_content
            current_endpoint['has_admin_check'] = "has_group('base.group_system')" in function_content

            endpoints.append(current_endpoint)
            current_endpoint = None

    return endpoints


def main():
    controllers_dir = Path('addons/quelyos_api/controllers')

    if not controllers_dir.exists():
        print(f"{Colors.RED}Erreur: Répertoire {controllers_dir} non trouvé{Colors.RESET}")
        print(f"Exécutez ce script depuis le répertoire backend/")
        return

    all_endpoints = []

    # Analyser tous les fichiers .py dans controllers/
    for controller_file in controllers_dir.glob('*.py'):
        if controller_file.name in ['__init__.py', 'base.py']:
            continue

        endpoints = analyze_controller(controller_file)
        all_endpoints.extend(endpoints)

    # Générer le rapport
    print(f"\n{Colors.BOLD}{Colors.CYAN}═══════════════════════════════════════════════════════════════{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}   RAPPORT D'AUDIT DE SÉCURITÉ - QUELYOS API ENDPOINTS{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}═══════════════════════════════════════════════════════════════{Colors.RESET}\n")

    # Statistiques globales
    total = len(all_endpoints)
    auth_user = [e for e in all_endpoints if e['auth'] == 'user']
    auth_public = [e for e in all_endpoints if e['auth'] == 'public']
    cors_wildcard = [e for e in all_endpoints if e['cors'] == '*']

    print(f"{Colors.BOLD}📊 STATISTIQUES GLOBALES{Colors.RESET}")
    print(f"  Total endpoints analysés: {Colors.BOLD}{total}{Colors.RESET}")
    print(f"  Endpoints auth='user': {Colors.YELLOW}{len(auth_user)}{Colors.RESET}")
    print(f"  Endpoints auth='public': {Colors.GREEN}{len(auth_public)}{Colors.RESET}")
    print(f"  Endpoints avec cors='*': {Colors.RED}{len(cors_wildcard)}{Colors.RESET}\n")

    # PROBLÈME 1: Endpoints auth='user' sans protection admin
    print(f"{Colors.BOLD}{Colors.RED}🚨 CRITIQUE: Endpoints auth='user' SANS vérification admin{Colors.RESET}")
    print(f"{Colors.RED}   (Ces endpoints sont accessibles à TOUT utilisateur authentifié, même non-admin){Colors.RESET}\n")

    vulnerable_auth = [
        e for e in auth_user
        if not e['has_require_admin'] and not e['has_admin_check']
        and ('/create' in e['path'] or '/update' in e['path'] or '/delete' in e['path'] or 'admin' in e['path'].lower())
    ]

    if vulnerable_auth:
        for endpoint in vulnerable_auth:
            print(f"  {Colors.RED}✗{Colors.RESET} {Colors.BOLD}{endpoint['path']}{Colors.RESET}")
            print(f"    Fichier: {endpoint['file']}:{endpoint['line']}")
            print(f"    {Colors.YELLOW}Action requise: Ajouter error = self._require_admin(); if error: return error{Colors.RESET}\n")
    else:
        print(f"  {Colors.GREEN}✓ Aucun endpoint vulnérable détecté{Colors.RESET}\n")

    # PROBLÈME 2: Endpoints avec CORS wildcard
    print(f"{Colors.BOLD}{Colors.YELLOW}⚠️  IMPORTANT: Endpoints avec CORS wildcard (cors='*'){Colors.RESET}")
    print(f"{Colors.YELLOW}   (N'importe quel site web peut appeler ces endpoints){Colors.RESET}\n")

    if cors_wildcard:
        # Grouper par fichier
        by_file = {}
        for e in cors_wildcard:
            if e['file'] not in by_file:
                by_file[e['file']] = []
            by_file[e['file']].append(e)

        for file, endpoints in by_file.items():
            print(f"  {Colors.CYAN}{file}{Colors.RESET}: {len(endpoints)} endpoints")

        print(f"\n  {Colors.YELLOW}Action requise: Remplacer cors='*' par cors=None et implémenter validation CORS{Colors.RESET}\n")
    else:
        print(f"  {Colors.GREEN}✓ Aucun endpoint avec CORS wildcard{Colors.RESET}\n")

    # PROBLÈME 3: Endpoints auth='user' avec protection admin OK
    print(f"{Colors.BOLD}{Colors.GREEN}✓ SÉCURISÉ: Endpoints auth='user' AVEC vérification admin{Colors.RESET}\n")

    secured_auth = [
        e for e in auth_user
        if e['has_require_admin'] or e['has_admin_check']
    ]

    if secured_auth:
        files_count = {}
        for e in secured_auth:
            files_count[e['file']] = files_count.get(e['file'], 0) + 1

        for file, count in files_count.items():
            print(f"  {Colors.GREEN}✓{Colors.RESET} {file}: {count} endpoints sécurisés")
    print()

    # RÉSUMÉ FINAL
    print(f"{Colors.BOLD}{Colors.CYAN}═══════════════════════════════════════════════════════════════{Colors.RESET}")
    print(f"{Colors.BOLD}📋 RÉSUMÉ ET ACTIONS PRIORITAIRES{Colors.RESET}\n")

    if vulnerable_auth:
        print(f"{Colors.RED}❌ {len(vulnerable_auth)} endpoints critiques à sécuriser{Colors.RESET}")
        print(f"   Priorité: P0 (URGENT - 24-48h)")
        print(f"   Action: Ajouter _require_admin() dans chaque endpoint\n")

    if cors_wildcard:
        print(f"{Colors.YELLOW}⚠️  {len(cors_wildcard)} endpoints avec CORS wildcard{Colors.RESET}")
        print(f"   Priorité: P1 (Important - 48-72h)")
        print(f"   Action: Remplacer cors='*' par validation CORS stricte\n")

    if not vulnerable_auth and not cors_wildcard:
        print(f"{Colors.GREEN}✅ Aucun problème critique détecté !{Colors.RESET}\n")

    print(f"{Colors.BOLD}{Colors.CYAN}═══════════════════════════════════════════════════════════════{Colors.RESET}\n")


if __name__ == '__main__':
    main()
