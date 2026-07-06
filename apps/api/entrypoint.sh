#!/bin/sh
# entrypoint.sh for API
set -e

# Define schema path for Prisma commands
SCHEMA_PATH="./prisma/schema"

# In Prisma 7.8 with prisma.config.ts, we might not need --schema,
# but keeping it for now if we want to be explicit.
# However, if it's a directory, Prisma might expect the main file or the directory itself.

wait_for_db() {
  echo "Waiting for database to be ready..."
  MAX_RETRIES=60 # Increased retries for slower DB startups
  COUNT=0

  # Determine which prisma binary to use
  PRISMA_BIN="./node_modules/.bin/prisma"
  if [ ! -f "$PRISMA_BIN" ]; then
    if command -v prisma > /dev/null 2>&1; then
      PRISMA_BIN="prisma"
    else
      echo "Error: Prisma binary not found."
      exit 1
    fi
  fi

  # We use --url explicitly for connectivity check to bypass potential schema loading issues during startup
  until $PRISMA_BIN db execute --stdin "SELECT 1;" --url "$DATABASE_URL" > /dev/null 2>&1 || [ $COUNT -eq $MAX_RETRIES ]; do
    sleep 2
    COUNT=$((COUNT + 1))
    echo "Retry $COUNT/$MAX_RETRIES: Database not yet available..."
  done

  if [ $COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Database is not ready after $MAX_RETRIES retries. Exiting."
    # Final attempt without redirection to show error details in logs
    $PRISMA_BIN db execute --stdin "SELECT 1;" --url "$DATABASE_URL"
    exit 1
  fi
  echo "✅ Database is ready!"
}

if [ -n "$DATABASE_URL" ]; then
  wait_for_db
  echo "Deploying database migrations..."

  # Determine prisma binary again for migrations
  PRISMA_BIN="./node_modules/.bin/prisma"
  if [ ! -f "$PRISMA_BIN" ]; then
    PRISMA_BIN="prisma"
  fi

  # Prisma will automatically use prisma.config.ts in the root directory
  $PRISMA_BIN migrate deploy

  echo "Seeding database..."
  # Prisma will automatically use prisma.config.ts in the root directory
  $PRISMA_BIN db seed
else
  echo "⚠️ DATABASE_URL not set, skipping migrations."
fi

echo "🚀 Starting NestJS application..."
exec "$@"
