#!/bin/bash
set -e

# Run the generate-secrets.sh script to copy/generate .env
./scripts/generate-secrets.sh

# --- Database Migrations ---
# Start database and basic infra services
echo "Starting core infrastructure (db, redis, rabbitmq)..."
docker compose up -d db redis rabbitmq

# Wait for database to be fully ready
echo "Waiting for database to be ready..."
until docker compose exec -T db pg_isready -U postgres -d app_db >/dev/null 2>&1; do
  echo "Database is not ready yet, retrying in 2 seconds..."
  sleep 2
done

# Start the API service to run migrations
echo "Starting API service to deploy migrations..."
docker compose up -d api

# Run database migrations explicitly
echo "Deploying database migrations..."
MIGRATE_FAILED=false
MIGRATE_OUTPUT=$(docker compose exec -T api prisma migrate deploy 2>&1) || MIGRATE_FAILED=true
echo "$MIGRATE_OUTPUT"

if [ "$MIGRATE_FAILED" = "true" ]; then
  echo "⚠️ Database migration deployment failed. Checking for failed migrations to resolve..."
  FAILED_MIGRATIONS=$(echo "$MIGRATE_OUTPUT" | grep -oE '20[0-9]{12}_[a-zA-Z0-9_]+' | sort -u || true)
  DB_FAILED=$(echo "SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NULL AND rolled_back_at IS NULL;" | docker compose exec -T api prisma db execute --stdin 2>/dev/null | grep -oE '20[0-9]{12}_[a-zA-Z0-9_]+' | sort -u || true)
  ALL_FAILED=$(printf "%s
%s
" "$FAILED_MIGRATIONS" "$DB_FAILED" | grep -v '^$' | sort -u || true)

  if [ -n "$ALL_FAILED" ]; then
    for mig in $ALL_FAILED; do
      echo "Resolving failed migration as rolled-back: $mig"
      docker compose exec -T api prisma migrate resolve --rolled-back "$mig" || true
    done
  fi

  echo "Retrying database migrations deployment..."
  docker compose exec -T api prisma migrate deploy
fi

# Run database seeding
echo "Seeding database..."
docker compose exec -T api prisma db seed

# --- Site Seeding ---
# Seed the site app content without overwriting the data (Only seed when deploying!)
echo "Seeding site app content..."
npx tsx --env-file=.env apps/site/sanity/run-seed.ts

# --- Start All Other Services ---
echo "Starting all remaining services..."
docker compose up -d
