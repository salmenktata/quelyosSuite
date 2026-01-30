FROM node:20-alpine AS base
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/_template/package.json ./apps/_template/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY apps/_template/ ./apps/_template/
WORKDIR /app/apps/_template
RUN pnpm build

FROM nginx:alpine AS runner
COPY --from=builder /app/apps/_template/dist /usr/share/nginx/html
COPY apps/_template/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
