#!/bin/bash
set -e

echo "[Entrypoint] Initializing Aksara LMS..."

# Check if DATABASE_URL is pointing to localhost or is default
if [[ -z "$DATABASE_URL" || "$DATABASE_URL" == *"localhost"* || "$DATABASE_URL" == *"127.0.0.1"* || "$DATABASE_URL" == *"password_kamu"* ]]; then
  echo "[Entrypoint] Starting local PostgreSQL service..."
  service postgresql start || /etc/init.d/postgresql start || true

  for i in {1..30}; do
    if pg_isready -h localhost -p 5432; then
      echo "[Entrypoint] PostgreSQL is ready!"
      break
    fi
    echo "[Entrypoint] Waiting for postgres to start ($i/30)..."
    sleep 1
  done

  su - postgres -c "psql -c \"ALTER USER postgres WITH PASSWORD 'postgres';\"" || true
  su - postgres -c "createdb -O postgres edtech" || true
  export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/edtech?schema=public"
else
  echo "[Entrypoint] Using external database."
fi

echo "[Entrypoint] Syncing database schema with Prisma..."
npx prisma db push --skip-generate || true

echo "[Entrypoint] Checking seed data..."
npm run seed || true

echo "[Entrypoint] Starting Aksara LMS (Express API :8080 & Next.js :3000)..."
exec node scripts/start-all.js
