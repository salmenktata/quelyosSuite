#!/bin/bash
# Script de vérification VPS Contabo - Prêt pour déploiement Quelyos Suite
# Usage: ./check-vps-readiness.sh

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Compteurs
PASSED=0
FAILED=0
WARNINGS=0

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Vérification Prêt Déploiement VPS Contabo - Quelyos Suite${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"

# Fonction de vérification
check() {
    local name="$1"
    local command="$2"
    local expected="$3"
    local type="${4:-critical}" # critical, warning, info

    echo -n "🔍 Vérification: $name... "

    if eval "$command" &>/dev/null; then
        if [ -n "$expected" ]; then
            result=$(eval "$command" 2>/dev/null)
            if [[ "$result" == *"$expected"* ]] || [[ "$result" =~ $expected ]]; then
                echo -e "${GREEN}✓ PASS${NC} ($result)"
                ((PASSED++))
                return 0
            else
                if [ "$type" == "critical" ]; then
                    echo -e "${RED}✗ FAIL${NC} (attendu: $expected, obtenu: $result)"
                    ((FAILED++))
                else
                    echo -e "${YELLOW}⚠ WARNING${NC} (attendu: $expected, obtenu: $result)"
                    ((WARNINGS++))
                fi
                return 1
            fi
        else
            echo -e "${GREEN}✓ PASS${NC}"
            ((PASSED++))
            return 0
        fi
    else
        if [ "$type" == "critical" ]; then
            echo -e "${RED}✗ FAIL${NC} (commande échouée)"
            ((FAILED++))
        else
            echo -e "${YELLOW}⚠ WARNING${NC} (commande échouée)"
            ((WARNINGS++))
        fi
        return 1
    fi
}

# Fonction info
info() {
    local name="$1"
    local command="$2"

    echo -n "ℹ️  Info: $name... "
    result=$(eval "$command" 2>/dev/null || echo "N/A")
    echo -e "${BLUE}$result${NC}"
}

echo -e "${YELLOW}[1/8] SYSTÈME D'EXPLOITATION${NC}\n"
check "OS Linux" "uname -s" "Linux"
info "Distribution" "cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2 | tr -d '\"'"
info "Version Kernel" "uname -r"
info "Architecture" "uname -m"
echo ""

echo -e "${YELLOW}[2/8] RESSOURCES SYSTÈME${NC}\n"
info "RAM Totale" "free -h | grep Mem | awk '{print \$2}'"
info "RAM Disponible" "free -h | grep Mem | awk '{print \$7}'"
info "CPU Cores" "nproc"
info "Charge CPU" "uptime | awk -F'load average:' '{print \$2}'"
info "Disque Total" "df -h / | tail -1 | awk '{print \$2}'"
info "Disque Disponible" "df -h / | tail -1 | awk '{print \$4}'"

# Vérifier si au moins 2GB RAM disponible
RAM_AVAILABLE=$(free -m | grep Mem | awk '{print $7}')
if [ "$RAM_AVAILABLE" -lt 2048 ]; then
    echo -e "${YELLOW}⚠ WARNING${NC}: RAM disponible < 2GB ($RAM_AVAILABLE MB)"
    ((WARNINGS++))
else
    echo -e "${GREEN}✓${NC} RAM disponible suffisante (${RAM_AVAILABLE}MB)"
fi

# Vérifier si au moins 10GB disque disponible
DISK_AVAILABLE=$(df / | tail -1 | awk '{print $4}')
if [ "$DISK_AVAILABLE" -lt 10485760 ]; then
    echo -e "${YELLOW}⚠ WARNING${NC}: Disque disponible < 10GB"
    ((WARNINGS++))
else
    echo -e "${GREEN}✓${NC} Disque disponible suffisant"
fi
echo ""

echo -e "${YELLOW}[3/8] DOCKER${NC}\n"
check "Docker installé" "command -v docker" ""
if command -v docker &>/dev/null; then
    DOCKER_VERSION=$(docker --version | grep -oP '\d+\.\d+\.\d+' | head -1)
    info "Version Docker" "echo $DOCKER_VERSION"

    # Vérifier version >= 24.0
    DOCKER_MAJOR=$(echo $DOCKER_VERSION | cut -d. -f1)
    if [ "$DOCKER_MAJOR" -ge 24 ]; then
        echo -e "${GREEN}✓${NC} Version Docker >= 24.0"
    else
        echo -e "${RED}✗ FAIL${NC}: Docker version < 24.0 (actuelle: $DOCKER_VERSION)"
        ((FAILED++))
    fi

    check "Docker service actif" "systemctl is-active docker" "active"
    check "Docker daemon répond" "docker ps" ""
fi
echo ""

echo -e "${YELLOW}[4/8] DOCKER COMPOSE${NC}\n"
check "Docker Compose installé" "command -v docker-compose" ""
if command -v docker-compose &>/dev/null; then
    COMPOSE_VERSION=$(docker-compose --version | grep -oP '\d+\.\d+\.\d+' | head -1)
    info "Version Docker Compose" "echo $COMPOSE_VERSION"

    # Vérifier version >= 2.20
    COMPOSE_MAJOR=$(echo $COMPOSE_VERSION | cut -d. -f1)
    COMPOSE_MINOR=$(echo $COMPOSE_VERSION | cut -d. -f2)
    if [ "$COMPOSE_MAJOR" -ge 2 ] && [ "$COMPOSE_MINOR" -ge 20 ]; then
        echo -e "${GREEN}✓${NC} Version Docker Compose >= 2.20"
    else
        echo -e "${YELLOW}⚠ WARNING${NC}: Docker Compose version < 2.20 (actuelle: $COMPOSE_VERSION)"
        ((WARNINGS++))
    fi
fi
echo ""

echo -e "${YELLOW}[5/8] OUTILS REQUIS${NC}\n"
check "Git installé" "command -v git" ""
check "Curl installé" "command -v curl" ""
check "Wget installé" "command -v wget" ""
check "Nginx installé" "command -v nginx" "" "warning"
if command -v nginx &>/dev/null; then
    info "Version Nginx" "nginx -v 2>&1 | cut -d/ -f2"
    check "Nginx service actif" "systemctl is-active nginx" "active" "warning"
fi
check "PM2 installé" "command -v pm2" "" "warning"
check "Node.js installé" "command -v node" "" "warning"
if command -v node &>/dev/null; then
    info "Version Node.js" "node --version"
fi
check "pnpm installé" "command -v pnpm" "" "warning"
if command -v pnpm &>/dev/null; then
    info "Version pnpm" "pnpm --version"
fi
echo ""

echo -e "${YELLOW}[6/8] RÉSEAU & PORTS${NC}\n"
info "IP Publique" "curl -s ifconfig.me || echo 'N/A'"
info "Hostname" "hostname"

# Vérifier ports disponibles
for port in 80 443 8069 3000 3001 5175 9000; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠${NC} Port $port déjà utilisé par: $(lsof -Pi :$port -sTCP:LISTEN | tail -1 | awk '{print $1}')"
        if [ "$port" == "80" ] || [ "$port" == "443" ]; then
            echo -e "  ${BLUE}→${NC} Normal si Nginx déjà configuré"
        else
            ((WARNINGS++))
        fi
    else
        echo -e "${GREEN}✓${NC} Port $port disponible"
    fi
done
echo ""

echo -e "${YELLOW}[7/8] SSL/TLS CERTIFICATS${NC}\n"
if [ -d "/etc/letsencrypt/live" ]; then
    CERT_COUNT=$(ls -1 /etc/letsencrypt/live 2>/dev/null | wc -l)
    if [ "$CERT_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✓${NC} Certificats Let's Encrypt trouvés ($CERT_COUNT)"
        ls -1 /etc/letsencrypt/live | while read domain; do
            if [ -f "/etc/letsencrypt/live/$domain/fullchain.pem" ]; then
                EXPIRY=$(openssl x509 -enddate -noout -in "/etc/letsencrypt/live/$domain/fullchain.pem" | cut -d= -f2)
                echo -e "  ${BLUE}→${NC} $domain (expire: $EXPIRY)"
            fi
        done
    else
        echo -e "${YELLOW}⚠ WARNING${NC}: Aucun certificat Let's Encrypt trouvé"
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}⚠ WARNING${NC}: Dossier Let's Encrypt non trouvé (/etc/letsencrypt/live)"
    echo -e "  ${BLUE}→${NC} Vous devrez générer les certificats SSL avant déploiement"
    ((WARNINGS++))
fi
echo ""

echo -e "${YELLOW}[8/8] DOMAINES DNS${NC}\n"
echo "Vérification résolution DNS des domaines requis:"

DOMAINS=(
    "quelyos.com"
    "shop.quelyos.com"
    "app.quelyos.com"
    "admin.quelyos.com"
    "api.quelyos.com"
    "finance.quelyos.com"
    "store.quelyos.com"
    "copilote.quelyos.com"
    "sales.quelyos.com"
    "retail.quelyos.com"
    "team.quelyos.com"
    "support.quelyos.com"
)

VPS_IP=$(curl -s ifconfig.me || echo "")

for domain in "${DOMAINS[@]}"; do
    RESOLVED_IP=$(dig +short "$domain" @8.8.8.8 | tail -1 2>/dev/null || echo "")

    if [ -z "$RESOLVED_IP" ]; then
        echo -e "${RED}✗${NC} $domain - Non résolu"
        ((FAILED++))
    elif [ "$RESOLVED_IP" == "$VPS_IP" ]; then
        echo -e "${GREEN}✓${NC} $domain → $RESOLVED_IP"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠${NC} $domain → $RESOLVED_IP (VPS IP: $VPS_IP)"
        ((WARNINGS++))
    fi
done
echo ""

# Résumé
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   RÉSUMÉ VÉRIFICATION${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Tests réussis:${NC} $PASSED"
echo -e "${YELLOW}⚠ Avertissements:${NC} $WARNINGS"
echo -e "${RED}✗ Tests échoués:${NC} $FAILED"
echo ""

# Statut final
if [ "$FAILED" -eq 0 ]; then
    if [ "$WARNINGS" -eq 0 ]; then
        echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}✅ VPS PRÊT POUR DÉPLOIEMENT${NC}"
        echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
        echo ""
        echo "Vous pouvez déployer Quelyos Suite maintenant."
        exit 0
    else
        echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
        echo -e "${YELLOW}⚠️  VPS PRÊT AVEC AVERTISSEMENTS${NC}"
        echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
        echo ""
        echo "Le VPS peut fonctionner mais certaines configurations sont recommandées."
        echo "Corrigez les warnings si possible avant déploiement."
        exit 0
    fi
else
    echo -e "${RED}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}❌ VPS NON PRÊT - CORRECTIFS REQUIS${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Corrigez les erreurs critiques (✗) avant déploiement."
    echo ""
    echo "Actions recommandées:"
    if ! command -v docker &>/dev/null; then
        echo "  1. Installer Docker: curl -fsSL https://get.docker.com | sh"
    fi
    if ! command -v docker-compose &>/dev/null; then
        echo "  2. Installer Docker Compose: apt install docker-compose-plugin"
    fi
    if ! command -v nginx &>/dev/null; then
        echo "  3. Installer Nginx: apt install nginx"
    fi
    if ! command -v node &>/dev/null; then
        echo "  4. Installer Node.js 20: curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt install -y nodejs"
    fi
    if ! command -v pnpm &>/dev/null; then
        echo "  5. Installer pnpm: npm install -g pnpm"
    fi
    if ! command -v pm2 &>/dev/null; then
        echo "  6. Installer PM2: npm install -g pm2"
    fi
    echo ""
    exit 1
fi
