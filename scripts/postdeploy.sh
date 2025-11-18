#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL must be defined to run migrations." >&2
  exit 1
fi

echo "[postdeploy] Applying Prisma migrations..."
pnpm prisma migrate deploy

echo "[postdeploy] Seeding baseline data..."
pnpm tsx lib/data/seed.ts

echo "[postdeploy] Completed migrations and seed."
