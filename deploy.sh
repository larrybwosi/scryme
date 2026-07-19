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
docker compose exec -T api prisma migrate deploy

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
