#!/bin/bash

# ==============================================
# Quelyos ERP - Pre-Deployment Security Check
# ==============================================
# Run this BEFORE deploy.sh to verify configuration

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Quelyos - Pre-Deployment Check${NC}"
echo -e "${BLUE}========================================${NC}\n"

# ----------------------------------------------
# 1. Check .env files are not committed
# ----------------------------------------------
echo -e "${YELLOW}[1/7] Checking .env files not in git...${NC}"

ENV_IN_GIT=$(git ls-files | grep -E "^\.env$|/\.env$" | head -5 || true)
if [ -n "$ENV_IN_GIT" ]; then
    echo -e "${RED}CRITICAL: .env files found in git!${NC}"
    echo "$ENV_IN_GIT"
    ((ERRORS++))
else
    echo -e "${GREEN}OK: No .env files in git${NC}"
fi

# ----------------------------------------------
# 2. Check for hardcoded secrets
# ----------------------------------------------
echo -e "\n${YELLOW}[2/7] Checking for hardcoded secrets...${NC}"

# Check for common weak/default passwords in config files only
WEAK_SECRETS=$(grep -r --include="*.yml" --include="*.yaml" --include="docker-compose*.yml" \
    -E "(password|secret|api_key).*[:=].*['\"]?(admin|password|123456|secret|changeme)" \
    --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build --exclude-dir=.github 2>/dev/null | \
    grep -v "example\|template\|CHANGEME\|secrets\.\|SECRET_" | head -5 || true)

if [ -n "$WEAK_SECRETS" ]; then
    echo -e "${YELLOW}WARNING: Potential weak/default secrets found:${NC}"
    echo "$WEAK_SECRETS"
    ((WARNINGS++))
else
    echo -e "${GREEN}OK: No obvious weak secrets detected${NC}"
fi

# ----------------------------------------------
# 3. Check .env.production exists and has required vars
# ----------------------------------------------
echo -e "\n${YELLOW}[3/7] Checking .env.production configuration...${NC}"

if [ ! -f ".env.production" ]; then
    echo -e "${RED}CRITICAL: .env.production not found!${NC}"
    echo "Create it from .env.example"
    ((ERRORS++))
else
    # Check for placeholder values
    PLACEHOLDERS=$(grep -E "(your_|changeme|CHANGE_ME|TODO|FIXME|placeholder)" .env.production 2>/dev/null | head -5 || true)
    if [ -n "$PLACEHOLDERS" ]; then
        echo -e "${RED}CRITICAL: Placeholder values in .env.production:${NC}"
        echo "$PLACEHOLDERS"
        ((ERRORS++))
    else
        echo -e "${GREEN}OK: No obvious placeholders in .env.production${NC}"
    fi

    # Check required variables are set
    REQUIRED_VARS="DB_PASSWORD JWT_SECRET"
    for VAR in $REQUIRED_VARS; do
        VALUE=$(grep "^$VAR=" .env.production 2>/dev/null | cut -d'=' -f2 || true)
        if [ -z "$VALUE" ] || [ "$VALUE" = '""' ] || [ "$VALUE" = "''" ]; then
            echo -e "${RED}CRITICAL: $VAR is empty in .env.production${NC}"
            ((ERRORS++))
        fi
    done
fi

# ----------------------------------------------
# 4. Check nginx configuration
# ----------------------------------------------
echo -e "\n${YELLOW}[4/7] Checking nginx configuration...${NC}"

NGINX_CONF="nginx/nginx.conf"
if [ -f "$NGINX_CONF" ]; then
    # Check for placeholder domain
    if grep -q "your-domain.com\|example.com\|\${DOMAIN}" "$NGINX_CONF"; then
        echo -e "${RED}CRITICAL: Domain placeholder not replaced in nginx.conf${NC}"
        echo "Replace \${DOMAIN} with your actual domain"
        ((ERRORS++))
    else
        echo -e "${GREEN}OK: Domain configured in nginx.conf${NC}"
    fi

    # Check CORS is restricted
    if grep -q 'Access-Control-Allow-Origin "\*"' "$NGINX_CONF"; then
        echo -e "${YELLOW}WARNING: CORS allows all origins (*) - restrict in production${NC}"
        ((WARNINGS++))
    fi

    # Check HSTS is enabled
    if grep -q "^[^#]*Strict-Transport-Security" "$NGINX_CONF"; then
        echo -e "${GREEN}OK: HSTS enabled${NC}"
    else
        echo -e "${YELLOW}WARNING: HSTS not enabled (commented out)${NC}"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}CRITICAL: nginx/nginx.conf not found${NC}"
    ((ERRORS++))
fi

# ----------------------------------------------
# 5. Check SSL certificates
# ----------------------------------------------
echo -e "\n${YELLOW}[5/7] Checking SSL certificates...${NC}"

SSL_DIR="nginx/ssl"
if [ -d "$SSL_DIR" ] && [ -f "$SSL_DIR/fullchain.pem" ] && [ -f "$SSL_DIR/privkey.pem" ]; then
    # Check certificate expiry
    EXPIRY=$(openssl x509 -enddate -noout -in "$SSL_DIR/fullchain.pem" 2>/dev/null | cut -d= -f2 || true)
    if [ -n "$EXPIRY" ]; then
        EXPIRY_EPOCH=$(date -j -f "%b %d %T %Y %Z" "$EXPIRY" +%s 2>/dev/null || date -d "$EXPIRY" +%s 2>/dev/null || echo "0")
        NOW_EPOCH=$(date +%s)
        DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))
        if [ "$DAYS_LEFT" -lt 30 ]; then
            echo -e "${YELLOW}INFO: SSL certificate expires in $DAYS_LEFT days${NC}"
        else
            echo -e "${GREEN}OK: SSL certificate valid ($DAYS_LEFT days remaining)${NC}"
        fi
    fi
else
    echo -e "${GREEN}OK: SSL will be auto-generated during deployment (Let's Encrypt)${NC}"
fi

# ----------------------------------------------
# 6. Check TypeScript/Build errors
# ----------------------------------------------
echo -e "\n${YELLOW}[6/7] Checking for build errors...${NC}"

# Check dashboard-client
if [ -d "dashboard-client" ]; then
    echo -n "  dashboard-client: "
    cd dashboard-client
    if npm run type-check > /dev/null 2>&1; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${YELLOW}TypeScript errors (run 'npm run type-check' for details)${NC}"
        ((WARNINGS++))
    fi
    cd ..
fi

# ----------------------------------------------
# 7. Check Docker configuration
# ----------------------------------------------
echo -e "\n${YELLOW}[7/7] Checking Docker configuration...${NC}"

if [ -f "docker-compose.prod.yml" ]; then
    # Validate docker-compose
    if docker compose -f docker-compose.prod.yml config > /dev/null 2>&1; then
        echo -e "${GREEN}OK: docker-compose.prod.yml is valid${NC}"
    else
        echo -e "${RED}CRITICAL: docker-compose.prod.yml has syntax errors${NC}"
        ((ERRORS++))
    fi

    # Check no ports exposed directly (should go through nginx)
    EXPOSED_PORTS=$(grep -E "^\s+- \"?[0-9]+:[0-9]+\"?" docker-compose.prod.yml | grep -v "80:\|443:" | head -5 || true)
    if [ -n "$EXPOSED_PORTS" ]; then
        echo -e "${YELLOW}WARNING: Non-standard ports exposed:${NC}"
        echo "$EXPOSED_PORTS"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}CRITICAL: docker-compose.prod.yml not found${NC}"
    ((ERRORS++))
fi

# ----------------------------------------------
# Summary
# ----------------------------------------------
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}  Summary${NC}"
echo -e "${BLUE}========================================${NC}"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}All checks passed! Ready for deployment.${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}$WARNINGS warning(s) found. Review before deployment.${NC}"
    exit 0
else
    echo -e "${RED}$ERRORS critical error(s), $WARNINGS warning(s) found.${NC}"
    echo -e "${RED}Fix critical errors before deploying!${NC}"
    exit 1
fi
