#!/usr/bin/env bash
# Script de vérification et installation automatique des dépendances

set -e

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
RESET='\033[0m'

echo -e "${YELLOW}🔍 Vérification des dépendances...${RESET}"

# Vérifier si node_modules existe
if [ ! -d "node_modules" ]; then
    echo -e "${RED}❌ node_modules manquant${RESET}"
    echo -e "${YELLOW}📦 Installation des dépendances...${RESET}"
    npm ci
    exit 0
fi

# Vérifier si package-lock.json est plus récent que node_modules
if [ "package-lock.json" -nt "node_modules" ]; then
    echo -e "${YELLOW}⚠️  package-lock.json modifié${RESET}"
    echo -e "${YELLOW}📦 Mise à jour des dépendances...${RESET}"
    npm ci
    exit 0
fi

echo -e "${GREEN}✅ Dépendances à jour${RESET}"
