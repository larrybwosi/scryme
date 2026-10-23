#!/bin/bash
set -e

# Run the generate-secrets.sh script to copy/generate .env
./scripts/generate-secrets.sh

# --- Pull Latest Images ---
echo "Pulling latest container images..."
docker compose pull || echo "⚠️ Some images could not be pulled, proceeding with existing or local images..."

# --- Database & Core Infra ---
# Start database and basic infra services in parallel
echo "Starting core infrastructure (db, customer-db, redis, rabbitmq)..."
docker compose up -d db customer-db redis rabbitmq

# Wait for databases to be fully ready
echo "Waiting for main database to be ready..."
until docker compose exec -T db pg_isready -U postgres -d app_db >/dev/null 2>&1 || docker compose exec -T db pg_isready >/dev/null 2>&1; do
  echo "Database is not ready yet, retrying in 2 seconds..."
  sleep 2
done

if docker compose config --services | grep -q "^customer-db$"; then
  echo "Waiting for customer database to be ready..."
  until docker compose exec -T customer-db pg_isready -U postgres -d customer_db >/dev/null 2>&1 || docker compose exec -T customer-db pg_isready >/dev/null 2>&1; do
    echo "Customer database is not ready yet, retrying in 2 seconds..."
    sleep 2
  done
fi

# --- Run Database Migrations in Ephemeral Container ---
echo "Deploying database migrations..."
MIGRATE_FAILED=false
MIGRATE_OUTPUT=$(docker compose run --rm --no-deps api prisma migrate deploy 2>&1) || MIGRATE_FAILED=true
echo "$MIGRATE_OUTPUT"

if [ "$MIGRATE_FAILED" = "true" ]; then
  echo "⚠️ Database migration deployment failed. Checking for failed migrations to resolve..."
  FAILED_MIGRATIONS=$(echo "$MIGRATE_OUTPUT" | grep -oE '20[0-9]{12}_[a-zA-Z0-9_]+' | sort -u || true)
  DB_FAILED=$(echo "SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NULL AND rolled_back_at IS NULL;" | docker compose run --rm --no-deps api prisma db execute --stdin 2>/dev/null | grep -oE '20[0-9]{12}_[a-zA-Z0-9_]+' | sort -u || true)
  ALL_FAILED=$(printf "%s\n%s\n" "$FAILED_MIGRATIONS" "$DB_FAILED" | grep -v '^$' | sort -u || true)

  if [ -n "$ALL_FAILED" ]; then
    for mig in $ALL_FAILED; do
      echo "Resolving failed migration as rolled-back: $mig"
      docker compose run --rm --no-deps api prisma migrate resolve --rolled-back "$mig" || true
    done
  fi

  echo "Retrying database migrations deployment..."
  docker compose run --rm --no-deps api prisma migrate deploy
fi

# Export SKIP_MIGRATIONS=true so starting apps skip redundant migration runs
export SKIP_MIGRATIONS=true

# --- Start/Upgrade All Application Services ---
echo "Starting and upgrading all application services..."
docker compose up -d --remove-orphans

echo "✅ Upgrade completed successfully!"
