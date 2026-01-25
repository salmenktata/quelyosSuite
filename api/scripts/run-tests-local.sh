#!/usr/bin/env bash
set -euo pipefail

# Convenience wrapper to provision the test Postgres container,
# apply Prisma migrations, then run the Jest API suite locally.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "🚀 Provisioning test database and applying migrations..."
./scripts/setup-test-db.sh

echo "🧪 Running Jest API tests in band..."
TEST_DATABASE_URL="${TEST_DATABASE_URL:-postgresql://quelyos:changeme@localhost:5442/quelyos_finance_test}" \
DATABASE_URL="${TEST_DATABASE_URL}" \
npm test -- --runInBand "$@"

echo "✅ Done."
