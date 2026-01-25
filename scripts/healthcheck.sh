#!/bin/bash

# ==============================================
# Quelyos ERP - Healthcheck Complet
# ==============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Domain (from env or default)
DOMAIN=${DOMAIN:-localhost}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Quelyos ERP - Healthcheck${NC}"
echo -e "${GREEN}========================================${NC}\n"

# ----------------------------------------------
# Function: Check HTTP endpoint
# ----------------------------------------------
check_http() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    echo -n "Checking ${name}... "

    status_code=$(curl -o /dev/null -s -w "%{http_code}" -m 10 "$url" || echo "000")

    if [ "$status_code" == "$expected_code" ]; then
        echo -e "${GREEN}✓ OK${NC} (HTTP $status_code)"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $status_code, expected $expected_code)"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

# ----------------------------------------------
# Function: Check TCP port
# ----------------------------------------------
check_port() {
    local name=$1
    local host=$2
    local port=$3

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    echo -n "Checking ${name} port... "

    if timeout 5 bash -c "cat < /dev/null > /dev/tcp/${host}/${port}" 2>/dev/null; then
        echo -e "${GREEN}✓ OK${NC} (${host}:${port})"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}✗ FAILED${NC} (${host}:${port})"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

# ----------------------------------------------
# Function: Check Docker container
# ----------------------------------------------
check_container() {
    local name=$1
    local container=$2

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    echo -n "Checking ${name} container... "

    status=$(docker inspect -f '{{.State.Status}}' "$container" 2>/dev/null || echo "not found")

    if [ "$status" == "running" ]; then
        echo -e "${GREEN}✓ RUNNING${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}✗ NOT RUNNING${NC} (status: $status)"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

# ----------------------------------------------
# Function: Check database connection
# ----------------------------------------------
check_database() {
    local name=$1
    local container=$2

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    echo -n "Checking ${name}... "

    if docker exec "$container" pg_isready -q 2>/dev/null; then
        echo -e "${GREEN}✓ READY${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}✗ NOT READY${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

# ----------------------------------------------
# Checks: Conteneurs Docker
# ----------------------------------------------
echo -e "${YELLOW}[1/5] Docker Containers${NC}\n"

check_container "PostgreSQL" "quelyos-db-prod"
check_container "Odoo" "quelyos-odoo-prod"
check_container "Frontend" "quelyos-frontend-prod"
check_container "Backoffice" "quelyos-backoffice-prod"
check_container "Nginx" "quelyos-nginx-prod"

echo ""

# ----------------------------------------------
# Checks: Ports réseau
# ----------------------------------------------
echo -e "${YELLOW}[2/5] Network Ports${NC}\n"

check_port "HTTP" "localhost" "80"
check_port "HTTPS" "localhost" "443"
check_port "PostgreSQL" "localhost" "5432"

echo ""

# ----------------------------------------------
# Checks: Base de données
# ----------------------------------------------
echo -e "${YELLOW}[3/5] Database${NC}\n"

check_database "PostgreSQL" "quelyos-db-prod"

echo ""

# ----------------------------------------------
# Checks: HTTP Endpoints
# ----------------------------------------------
echo -e "${YELLOW}[4/5] HTTP Endpoints${NC}\n"

# Protocole (http pour local, https pour prod)
PROTOCOL="http"
if [ "$DOMAIN" != "localhost" ]; then
    PROTOCOL="https"
fi

check_http "Nginx Health" "${PROTOCOL}://${DOMAIN}/health" "200"
check_http "Frontend" "${PROTOCOL}://${DOMAIN}/" "200"
check_http "Backoffice" "${PROTOCOL}://${DOMAIN}/admin" "200"
check_http "Odoo API" "${PROTOCOL}://${DOMAIN}/api/health" "200"

echo ""

# ----------------------------------------------
# Checks: Monitoring (optionnel)
# ----------------------------------------------
if docker ps --format '{{.Names}}' | grep -q "quelyos-prometheus"; then
    echo -e "${YELLOW}[5/5] Monitoring Stack${NC}\n"

    check_container "Prometheus" "quelyos-prometheus"
    check_container "Grafana" "quelyos-grafana"
    check_container "Loki" "quelyos-loki"
    check_http "Prometheus" "http://localhost:9090/-/healthy" "200"
    check_http "Grafana" "http://localhost:3001/api/health" "200"

    echo ""
else
    echo -e "${YELLOW}[5/5] Monitoring Stack${NC}\n"
    echo -e "${YELLOW}⚠ Monitoring stack not deployed (optional)${NC}\n"
fi

# ----------------------------------------------
# Résumé
# ----------------------------------------------
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Healthcheck Summary${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "Total checks: ${TOTAL_CHECKS}"
echo -e "Passed: ${GREEN}${PASSED_CHECKS}${NC}"
echo -e "Failed: ${RED}${FAILED_CHECKS}${NC}"

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "\n${GREEN}✓ All checks passed!${NC}\n"
    exit 0
else
    echo -e "\n${RED}✗ Some checks failed${NC}\n"
    exit 1
fi
