#!/bin/bash
# ============================================================================
# Quelyos ERP - Installation One-Click Script
# ============================================================================
# Script d'installation automatique de Quelyos ERP
# Usage: curl -fsSL https://get.quelyos.com | bash
# ============================================================================

set -e

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Version de Quelyos
QUELYOS_VERSION="${QUELYOS_VERSION:-latest}"
QUELYOS_IMAGE="ghcr.io/quelyos/quelyos-erp:${QUELYOS_VERSION}"

# ============================================================================
# Affichage du banner
# ============================================================================
clear
cat << "EOF"
   ____              _                   _____ ____  ____
  / __ \            | |                 |  ___|  _ \|  _ \
 | |  | |_   _  ___| |_   _  ___  ___  | |_  | |_) | |_) |
 | |  | | | | |/ _ \ | | | |/ _ \/ __| |  _| |  _ <|  __/
 | |__| | |_| |  __/ | |_| | (_) \__ \ | |___| |_) | |
  \___\_\\__,_|\___|_|\__, |\___/|___/ |_____|____/|_|
                       __/ |
                      |___/

  Installation Automatique
  Version: ${QUELYOS_VERSION}

EOF

echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}  Démarrage de l'installation de Quelyos ERP${NC}"
echo -e "${BLUE}============================================================${NC}"
echo ""

# ============================================================================
# Vérification des privilèges
# ============================================================================
if [[ $EUID -ne 0 ]] && ! groups | grep -q docker; then
   echo -e "${RED}[ERREUR]${NC} Ce script nécessite les privilèges sudo ou l'appartenance au groupe docker"
   echo ""
   echo "Options:"
   echo "  1. Exécuter avec sudo: sudo bash install.sh"
   echo "  2. Ajouter votre utilisateur au groupe docker: sudo usermod -aG docker $USER"
   echo ""
   exit 1
fi

# ============================================================================
# Détection du système d'exploitation
# ============================================================================
echo -e "${BLUE}[INFO]${NC} Détection du système d'exploitation..."

OS="unknown"
ARCH=$(uname -m)

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        DISTRO=$ID
        DISTRO_VERSION=$VERSION_ID
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
    DISTRO="macos"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    OS="windows"
    echo -e "${RED}[ERREUR]${NC} Windows n'est pas supporté directement"
    echo "  Utilisez Docker Desktop for Windows ou WSL2"
    exit 1
fi

echo -e "${GREEN}[OK]${NC} Système détecté: ${OS} (${ARCH})"
echo ""

# ============================================================================
# Vérification et installation de Docker
# ============================================================================
echo -e "${BLUE}[INFO]${NC} Vérification de Docker..."

if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}[WARNING]${NC} Docker n'est pas installé"
    echo ""
    echo -e "${BLUE}[INFO]${NC} Installation de Docker..."

    if [[ "$OS" == "linux" ]]; then
        case "$DISTRO" in
            ubuntu|debian)
                # Installation Docker sur Ubuntu/Debian
                curl -fsSL https://get.docker.com -o get-docker.sh
                sh get-docker.sh
                rm get-docker.sh
                usermod -aG docker $USER || true
                systemctl enable docker
                systemctl start docker
                ;;
            centos|rhel|fedora)
                # Installation Docker sur CentOS/RHEL/Fedora
                yum install -y yum-utils
                yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
                yum install -y docker-ce docker-ce-cli containerd.io
                systemctl enable docker
                systemctl start docker
                ;;
            *)
                echo -e "${RED}[ERREUR]${NC} Distribution non supportée: $DISTRO"
                echo "  Installez Docker manuellement: https://docs.docker.com/engine/install/"
                exit 1
                ;;
        esac
    elif [[ "$OS" == "macos" ]]; then
        echo -e "${YELLOW}[INFO]${NC} Sur macOS, installez Docker Desktop:"
        echo "  https://www.docker.com/products/docker-desktop"
        exit 1
    fi

    echo -e "${GREEN}[OK]${NC} Docker installé avec succès"
else
    DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
    echo -e "${GREEN}[OK]${NC} Docker déjà installé (version ${DOCKER_VERSION})"
fi

# Vérifier que Docker fonctionne
if ! docker ps &> /dev/null; then
    echo -e "${RED}[ERREUR]${NC} Docker n'est pas démarré"
    echo "  Démarrez Docker et réessayez"
    exit 1
fi

echo ""

# ============================================================================
# Configuration interactive (optionnelle)
# ============================================================================
echo -e "${MAGENTA}============================================================${NC}"
echo -e "${MAGENTA}  Configuration de Quelyos ERP${NC}"
echo -e "${MAGENTA}============================================================${NC}"
echo ""

# Port
read -p "$(echo -e ${CYAN}'Port d'écoute [80]:'${NC} )" QUELYOS_PORT
QUELYOS_PORT=${QUELYOS_PORT:-80}

# Email admin
read -p "$(echo -e ${CYAN}'Email administrateur [admin@quelyos.local]:'${NC} )" QUELYOS_ADMIN_EMAIL
QUELYOS_ADMIN_EMAIL=${QUELYOS_ADMIN_EMAIL:-admin@quelyos.local}

# Mot de passe admin
read -sp "$(echo -e ${CYAN}'Mot de passe administrateur [admin]:'${NC} )" QUELYOS_ADMIN_PASSWORD
echo ""
QUELYOS_ADMIN_PASSWORD=${QUELYOS_ADMIN_PASSWORD:-admin}

# Nom de domaine
read -p "$(echo -e ${CYAN}'Nom de domaine (optionnel) [localhost]:'${NC} )" QUELYOS_DOMAIN
QUELYOS_DOMAIN=${QUELYOS_DOMAIN:-localhost}

echo ""
echo -e "${BLUE}[INFO]${NC} Configuration:"
echo "  Port:     ${QUELYOS_PORT}"
echo "  Email:    ${QUELYOS_ADMIN_EMAIL}"
echo "  Domaine:  ${QUELYOS_DOMAIN}"
echo ""

read -p "$(echo -e ${CYAN}'Confirmer et continuer ? [Y/n]:'${NC} )" CONFIRM
CONFIRM=${CONFIRM:-Y}

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}[INFO]${NC} Installation annulée"
    exit 0
fi

echo ""

# ============================================================================
# Création du répertoire de données
# ============================================================================
echo -e "${BLUE}[INFO]${NC} Création du répertoire de données..."

QUELYOS_DATA_DIR="${QUELYOS_DATA_DIR:-$HOME/.quelyos}"
mkdir -p "$QUELYOS_DATA_DIR"

echo -e "${GREEN}[OK]${NC} Répertoire de données: ${QUELYOS_DATA_DIR}"
echo ""

# ============================================================================
# Téléchargement de l'image Docker
# ============================================================================
echo -e "${BLUE}[INFO]${NC} Téléchargement de l'image Quelyos ERP..."
echo ""

if ! docker pull "$QUELYOS_IMAGE"; then
    echo -e "${YELLOW}[WARNING]${NC} Impossible de télécharger l'image depuis le registry"
    echo -e "${BLUE}[INFO]${NC} Construction de l'image localement..."

    # Cloner le dépôt si nécessaire
    if [ ! -d "QuelyosERP" ]; then
        git clone https://github.com/quelyos/QuelyosERP.git
    fi

    cd QuelyosERP
    docker build -t "$QUELYOS_IMAGE" -f Dockerfile.allinone .
    cd ..
fi

echo -e "${GREEN}[OK]${NC} Image téléchargée"
echo ""

# ============================================================================
# Arrêt du conteneur existant (si présent)
# ============================================================================
if docker ps -a | grep -q quelyos-erp; then
    echo -e "${YELLOW}[WARNING]${NC} Un conteneur Quelyos existe déjà"
    read -p "$(echo -e ${CYAN}'Voulez-vous le remplacer ? [Y/n]:'${NC} )" REPLACE
    REPLACE=${REPLACE:-Y}

    if [[ "$REPLACE" =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}[INFO]${NC} Arrêt et suppression du conteneur existant..."
        docker stop quelyos-erp || true
        docker rm quelyos-erp || true
    else
        echo -e "${YELLOW}[INFO]${NC} Installation annulée"
        exit 0
    fi
fi

# ============================================================================
# Lancement du conteneur Quelyos
# ============================================================================
echo -e "${BLUE}[INFO]${NC} Démarrage de Quelyos ERP..."
echo ""

docker run -d \
    --name quelyos-erp \
    --restart unless-stopped \
    -p ${QUELYOS_PORT}:80 \
    -v "${QUELYOS_DATA_DIR}:/var/lib/quelyos" \
    -e "QUELYOS_DB_USER=quelyos" \
    -e "QUELYOS_DB_PASSWORD=$(openssl rand -base64 32)" \
    -e "QUELYOS_DB_NAME=quelyos" \
    -e "QUELYOS_ADMIN_EMAIL=${QUELYOS_ADMIN_EMAIL}" \
    -e "QUELYOS_ADMIN_PASSWORD=${QUELYOS_ADMIN_PASSWORD}" \
    -e "QUELYOS_PORT=${QUELYOS_PORT}" \
    -e "QUELYOS_DOMAIN=${QUELYOS_DOMAIN}" \
    "$QUELYOS_IMAGE"

echo -e "${GREEN}[OK]${NC} Conteneur démarré"
echo ""

# ============================================================================
# Attente du démarrage complet
# ============================================================================
echo -e "${BLUE}[INFO]${NC} Initialisation de Quelyos ERP (peut prendre 1-2 minutes)..."

MAX_TRIES=60
TRIES=0

while [ $TRIES -lt $MAX_TRIES ]; do
    if docker exec quelyos-erp wget --quiet --tries=1 --spider http://localhost/health 2>/dev/null; then
        break
    fi

    TRIES=$((TRIES + 1))
    echo -ne "\r  Tentative ${TRIES}/${MAX_TRIES}..."
    sleep 2
done

echo ""

if [ $TRIES -eq $MAX_TRIES ]; then
    echo -e "${RED}[ERREUR]${NC} Le conteneur ne répond pas"
    echo "  Vérifiez les logs: docker logs quelyos-erp"
    exit 1
fi

echo -e "${GREEN}[OK]${NC} Quelyos ERP est prêt !"
echo ""

# ============================================================================
# Affichage des informations de connexion
# ============================================================================
cat << EOF
${GREEN}============================================================
  ✓ Installation terminée avec succès !
============================================================${NC}

${CYAN}Informations de connexion:${NC}

  ${GREEN}✓${NC} Boutique E-commerce:
    http://${QUELYOS_DOMAIN}:${QUELYOS_PORT}/

  ${GREEN}✓${NC} Backoffice Admin:
    http://${QUELYOS_DOMAIN}:${QUELYOS_PORT}/admin

    Email:     ${QUELYOS_ADMIN_EMAIL}
    Password:  ${QUELYOS_ADMIN_PASSWORD}

${YELLOW}Commandes utiles:${NC}

  • Voir les logs:        docker logs -f quelyos-erp
  • Arrêter:              docker stop quelyos-erp
  • Démarrer:             docker start quelyos-erp
  • Redémarrer:           docker restart quelyos-erp
  • Supprimer:            docker rm -f quelyos-erp
  • Accès shell:          docker exec -it quelyos-erp bash

${BLUE}Documentation:${NC}
  https://docs.quelyos.com

${MAGENTA}============================================================${NC}

EOF

# ============================================================================
# Création d'un alias de commande (optionnel)
# ============================================================================
read -p "$(echo -e ${CYAN}'Créer un alias '\''quelyos'\'' pour gérer le conteneur ? [Y/n]:'${NC} )" CREATE_ALIAS
CREATE_ALIAS=${CREATE_ALIAS:-Y}

if [[ "$CREATE_ALIAS" =~ ^[Yy]$ ]]; then
    SHELL_RC="$HOME/.bashrc"
    if [[ "$SHELL" == *"zsh"* ]]; then
        SHELL_RC="$HOME/.zshrc"
    fi

    cat >> "$SHELL_RC" << 'ALIASEOF'

# Quelyos ERP aliases
alias quelyos='docker exec -it quelyos-erp'
alias quelyos-logs='docker logs -f quelyos-erp'
alias quelyos-restart='docker restart quelyos-erp'
alias quelyos-stop='docker stop quelyos-erp'
alias quelyos-start='docker start quelyos-erp'
ALIASEOF

    echo -e "${GREEN}[OK]${NC} Alias créés ! Rechargez votre terminal: source $SHELL_RC"
    echo ""
fi

echo -e "${GREEN}Profitez de Quelyos ERP ! 🚀${NC}"
echo ""
