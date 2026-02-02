# ============================================================================
# DOCKERFILE MULTI-STAGE - QUELYOS ÉDITIONS
# ============================================================================
# Build image séparée par édition (finance, store, copilote, sales, retail, team, support)
# Usage : docker build --build-arg EDITION=finance -t quelyos-finance:latest .

# ============================================================================
# STAGE 1 : BUILDER
# ============================================================================
FROM node:20-alpine AS builder

# Arg pour sélectionner l'édition à builder
ARG EDITION=full
ENV VITE_EDITION=${EDITION}

WORKDIR /app

# Installation pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copie des fichiers de dépendances (layer cache)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY dashboard-client/package.json ./dashboard-client/
COPY packages/ ./packages/
COPY shared/ ./shared/

# Installation dépendances
RUN pnpm install --frozen-lockfile

# Copie du code source
COPY dashboard-client/ ./dashboard-client/

# Build de l'édition spécifique (direct vite build, skip shared packages build)
WORKDIR /app/dashboard-client
RUN VITE_EDITION=${EDITION} npx vite build

# ============================================================================
# STAGE 2 : RUNNER (NGINX)
# ============================================================================
FROM nginx:alpine

# Arg pour récupérer l'édition (utilisé dans labels)
ARG EDITION=full

# Labels Docker
LABEL org.opencontainers.image.title="Quelyos ${EDITION}"
LABEL org.opencontainers.image.description="Quelyos ${EDITION} Edition"
LABEL org.opencontainers.image.vendor="Quelyos"
LABEL edition="${EDITION}"

# Copie des fichiers buildés depuis le builder
# Note: vite produit 'dist' pour edition=full, 'dist-${EDITION}' pour les autres
COPY --from=builder /app/dashboard-client/dist /usr/share/nginx/html

# Configuration Nginx optimisée pour SPA
COPY dashboard-client/nginx.conf /etc/nginx/nginx.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# Exposition port 80
EXPOSE 80

# Démarrage Nginx
CMD ["nginx", "-g", "daemon off;"]
