#!/usr/bin/env bash
set -euo pipefail

# This script starts a dedicated Postgres container for Jest tests
# and applies Prisma migrations against the test database.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

export TEST_DB_NAME="${TEST_DB_NAME:-quelyos_finance_test}"
export TEST_DB_USER="${TEST_DB_USER:-quelyos}"
export TEST_DB_PASSWORD="${TEST_DB_PASSWORD:-changeme}"
export TEST_DB_PORT="${TEST_DB_PORT:-5442}"

TEST_DATABASE_URL="postgresql://${TEST_DB_USER}:${TEST_DB_PASSWORD}@localhost:${TEST_DB_PORT}/${TEST_DB_NAME}"

echo "📦 Starting Postgres test container on port ${TEST_DB_PORT}..."
docker compose -f docker-compose.test.yml up -d postgres-test

echo "⏳ Waiting for Postgres to be ready..."
for i in {1..20}; do
  if docker exec quelyos-postgres-test pg_isready -U "${TEST_DB_USER}" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "🚀 Applying Prisma migrations to ${TEST_DATABASE_URL}..."
TEST_DATABASE_URL="${TEST_DATABASE_URL}" DATABASE_URL="${TEST_DATABASE_URL}" npx prisma migrate deploy --schema prisma/schema.prisma

echo "✅ Test database ready."
echo "   TEST_DATABASE_URL=${TEST_DATABASE_URL}"
