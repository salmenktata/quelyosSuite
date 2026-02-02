#!/bin/bash
# =============================================================================
# deploy-vps.sh - Deploiement automatise Quelyos Suite vers VPS Contabo
# =============================================================================
# Usage:
#   ./scripts/deploy-vps.sh              # Deploy complet
#   ./scripts/deploy-vps.sh --app=dashboard   # Deploy 1 app
#   ./scripts/deploy-vps.sh --dry-run    # Simulation
#   ./scripts/deploy-vps.sh --skip-backup --skip-odoo  # Options
# =============================================================================

set -eo pipefail

# ── Config ────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
VPS_HOST="quelyos-vps"
VPS_USER="deploy"
VPS_DIR="/home/deploy/quelyos-suite"
BACKUP_DIR="/home/deploy/backups"
DB_NAME="quelyos"
DB_USER="odoo"
API_DOMAIN="api.quelyos.com"

# Apps list (bash 3 compatible - no associative arrays)
APP_NAMES="vitrine ecommerce dashboard superadmin"
LOCAL_NAMES="vitrine-quelyos vitrine-client dashboard-client super-admin-client"

# Lookup functions (bash 3 compatible)
get_domain() {
  case "$1" in
    vitrine)    echo "quelyos.com" ;;
    ecommerce)  echo "shop.quelyos.com" ;;
    dashboard)  echo "backoffice.quelyos.com" ;;
    superadmin) echo "admin.quelyos.com" ;;
  esac
}

get_vps_name() {
  case "$1" in
    dashboard-client)    echo "dashboard" ;;
    vitrine-quelyos)     echo "vitrine" ;;
    vitrine-client)      echo "ecommerce" ;;
    super-admin-client)  echo "superadmin" ;;
  esac
}

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# ── Options ───────────────────────────────────────────────────────
APP_FILTER=""
SKIP_BACKUP=false
SKIP_ODOO=false
DRY_RUN=false

for arg in "$@"; do
  case $arg in
    --app=*) APP_FILTER="${arg#*=}" ;;
    --skip-backup) SKIP_BACKUP=true ;;
    --skip-odoo) SKIP_ODOO=true ;;
    --dry-run) DRY_RUN=true ;;
    --help|-h)
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --app=NAME       Deploy une seule app (vitrine|ecommerce|dashboard|superadmin)"
      echo "  --skip-backup    Skip backup PostgreSQL"
      echo "  --skip-odoo      Skip upgrade module backend"
      echo "  --dry-run        Simulation sans execution"
      echo "  --help           Afficher cette aide"
      exit 0
      ;;
    *) echo -e "${RED}Option inconnue: $arg${NC}"; exit 1 ;;
  esac
done

# ── Helpers ───────────────────────────────────────────────────────
step() { echo -e "\n${BLUE}${BOLD}[$1/7]${NC} ${CYAN}$2${NC}"; }
ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; exit 1; }
dry()  { if $DRY_RUN; then echo -e "  ${YELLOW}[DRY-RUN]${NC} $1"; return 0; fi; return 1; }

run_ssh() {
  if $DRY_RUN; then
    echo -e "  ${YELLOW}[DRY-RUN] ssh $VPS_HOST:${NC} $1"
    return 0
  fi
  ssh "$VPS_HOST" "$1"
}

# ── STEP 1: PRE-FLIGHT ───────────────────────────────────────────
step 1 "Pre-flight checks"

# Verifier branche
BRANCH=$(git -C "$PROJECT_DIR" branch --show-current)
if [ "$BRANCH" != "main" ]; then
  warn "Branche actuelle: $BRANCH (pas main)"
  read -p "  Continuer quand meme? [y/N] " -n 1 -r
  echo
  [[ $REPLY =~ ^[Yy]$ ]] || exit 1
fi
ok "Branche: $BRANCH"

# Verifier git clean
if [ -n "$(git -C "$PROJECT_DIR" status --porcelain)" ]; then
  warn "Working tree pas clean - changes non commites"
  git -C "$PROJECT_DIR" status --short
  read -p "  Continuer quand meme? [y/N] " -n 1 -r
  echo
  [[ $REPLY =~ ^[Yy]$ ]] || exit 1
fi
ok "Git status clean"

# Verifier SSH
if ! dry "SSH check"; then
  if ! ssh -o ConnectTimeout=5 "$VPS_HOST" "echo ok" &>/dev/null; then
    fail "Connexion SSH impossible vers $VPS_HOST"
  fi
  ok "SSH connecte a $VPS_HOST"
fi

# ── STEP 2: BACKUP ───────────────────────────────────────────────
step 2 "Backup PostgreSQL"

if $SKIP_BACKUP; then
  warn "Backup skip (--skip-backup)"
else
  BACKUP_FILE="quelyos_$(date +%Y%m%d_%H%M%S).sql.gz"
  if ! dry "pg_dump -> $BACKUP_FILE"; then
    run_ssh "mkdir -p $BACKUP_DIR && docker exec quelyos-db pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/$BACKUP_FILE"
    # Garder les 5 derniers backups
    run_ssh "ls -t $BACKUP_DIR/quelyos_*.sql.gz | tail -n +6 | xargs -r rm"
    ok "Backup: $BACKUP_FILE"
  fi
fi

# ── STEP 3: SYNC ─────────────────────────────────────────────────
step 3 "Sync fichiers vers VPS"

RSYNC_OPTS="-avz --delete --exclude=node_modules --exclude=.next --exclude=dist --exclude=.git --exclude=.env.local --exclude=.turbo"

sync_dir() {
  local src="$1"
  local dest="$2"
  local label="$3"
  if $DRY_RUN; then
    echo -e "  ${YELLOW}[DRY-RUN] rsync${NC} $label -> $dest"
    return
  fi
  rsync $RSYNC_OPTS "$src/" "$VPS_HOST:$VPS_DIR/$dest/"
  ok "$label -> $dest"
}

# Sync packages et shared
sync_dir "$PROJECT_DIR/packages" "packages" "packages/"
sync_dir "$PROJECT_DIR/shared" "shared" "shared/"

# Sync deploy config
sync_dir "$PROJECT_DIR/deploy/vps" "deploy/vps" "deploy/vps/"

# Sync workspace config VPS
if ! dry "pnpm-workspace.yaml (VPS)"; then
  scp "$PROJECT_DIR/deploy/vps/pnpm-workspace.yaml" "$VPS_HOST:$VPS_DIR/pnpm-workspace.yaml"
  ok "pnpm-workspace.yaml (version VPS)"
fi

# Copier package.json et lockfile racine
if ! dry "package.json + pnpm-lock.yaml"; then
  scp "$PROJECT_DIR/package.json" "$VPS_HOST:$VPS_DIR/package.json"
  scp "$PROJECT_DIR/pnpm-lock.yaml" "$VPS_HOST:$VPS_DIR/pnpm-lock.yaml" 2>/dev/null || warn "pnpm-lock.yaml absent"
  ok "package.json + pnpm-lock.yaml"
fi

# Sync apps (avec mapping noms)
sync_app() {
  local local_name="$1"
  local vps_name
  vps_name=$(get_vps_name "$local_name")

  if [ -n "$APP_FILTER" ] && [ "$APP_FILTER" != "$vps_name" ]; then
    return
  fi

  if [ -d "$PROJECT_DIR/$local_name" ]; then
    sync_dir "$PROJECT_DIR/$local_name" "$vps_name" "$local_name"
  else
    warn "$local_name/ introuvable"
  fi
}

sync_app "dashboard-client"
sync_app "vitrine-quelyos"
sync_app "vitrine-client"
sync_app "super-admin-client"

# ── STEP 4: ODOO UPGRADE ─────────────────────────────────────────
step 4 "Backend upgrade"

if $SKIP_ODOO; then
  warn "Backend skip (--skip-odoo)"
else
  # Verifier si des modifs backend existent
  BACKEND_CHANGED=$(git -C "$PROJECT_DIR" diff HEAD~1 --name-only -- odoo-backend/ 2>/dev/null | head -1)
  if [ -n "$BACKEND_CHANGED" ]; then
    ok "Modifications backend detectees"
    if ! dry "upgrade quelyos_api"; then
      run_ssh "docker exec quelyos-db psql -U $DB_USER -d $DB_NAME -c \"UPDATE ir_module_module SET state = 'to upgrade' WHERE name = 'quelyos_api';\""
      run_ssh "docker restart quelyos-odoo"
      ok "Module quelyos_api upgrade lance"
      # Attendre que le backend soit pret
      echo -e "  ${YELLOW}Attente backend (30s)...${NC}"
      if ! $DRY_RUN; then sleep 30; fi
    fi
  else
    ok "Pas de modif backend - skip upgrade"
  fi
fi

# ── STEP 5: BUILD ────────────────────────────────────────────────
step 5 "Docker build sur VPS"

COMPOSE_CMD="cd $VPS_DIR && docker compose -f deploy/vps/docker-compose.yml"

if [ -n "$APP_FILTER" ]; then
  if ! dry "docker compose build $APP_FILTER"; then
    run_ssh "$COMPOSE_CMD build --no-cache $APP_FILTER"
    ok "Build $APP_FILTER termine"
  fi
else
  if ! dry "docker compose build (all)"; then
    run_ssh "$COMPOSE_CMD build --no-cache"
    ok "Build all termine"
  fi
fi

# ── STEP 6: DEPLOY ───────────────────────────────────────────────
step 6 "Docker deploy"

if [ -n "$APP_FILTER" ]; then
  if ! dry "docker compose up -d $APP_FILTER"; then
    run_ssh "$COMPOSE_CMD up -d --force-recreate $APP_FILTER"
    ok "Deploy $APP_FILTER termine"
  fi
else
  if ! dry "docker compose up -d (all)"; then
    run_ssh "$COMPOSE_CMD up -d --force-recreate"
    ok "Deploy all termine"
  fi
fi

# ── STEP 7: HEALTH CHECK ─────────────────────────────────────────
step 7 "Health checks"

HEALTH_OK=true

check_health() {
  local name="$1"
  local url="$2"
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
  if [ "$status" = "200" ] || [ "$status" = "301" ] || [ "$status" = "302" ]; then
    ok "$name ($url) -> HTTP $status"
  else
    warn "$name ($url) -> HTTP $status"
    HEALTH_OK=false
  fi
}

if $DRY_RUN; then
  for svc in $APP_NAMES; do
    if [ -n "$APP_FILTER" ] && [ "$APP_FILTER" != "$svc" ]; then
      continue
    fi
    domain=$(get_domain "$svc")
    echo -e "  ${YELLOW}[DRY-RUN] curl${NC} https://$domain/"
  done
  echo -e "  ${YELLOW}[DRY-RUN] curl${NC} https://$API_DOMAIN/api/health"
  echo -e "\n${GREEN}${BOLD}[DRY-RUN] Deploiement simule avec succes${NC}"
  exit 0
fi

# Attendre que les conteneurs demarrent
echo -e "  ${YELLOW}Attente demarrage (15s)...${NC}"
sleep 15

for svc in $APP_NAMES; do
  if [ -n "$APP_FILTER" ] && [ "$APP_FILTER" != "$svc" ]; then
    continue
  fi
  domain=$(get_domain "$svc")
  check_health "$svc" "https://$domain/"
done

check_health "api" "https://$API_DOMAIN/api/health"

# ── Resultat ──────────────────────────────────────────────────────
echo ""
if $HEALTH_OK; then
  echo -e "${GREEN}${BOLD}Deploiement termine avec succes !${NC}"
else
  echo -e "${YELLOW}${BOLD}Deploiement termine avec avertissements${NC}"
  echo -e "${YELLOW}Verifier les services en erreur ci-dessus${NC}"
fi

# Afficher versions conteneurs
echo -e "\n${CYAN}Conteneurs actifs:${NC}"
run_ssh "docker ps --filter name=quelyos- --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
