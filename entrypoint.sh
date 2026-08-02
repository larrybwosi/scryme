#!/bin/sh
# Unified entrypoint.sh for Scryme apps
set -e

# Print startup context
echo "Starting container in directory: $(pwd)"

# ---------------------------------------------------------
# 1. Static Site Environment (e.g., Bakery, Docs)
# ---------------------------------------------------------
# Static sites have their HTML/JS files in /usr/share/nginx/html, /app/dist, or ./dist
STATIC_DIR=""
if [ -d "/usr/share/nginx/html" ]; then
  STATIC_DIR="/usr/share/nginx/html"
elif [ -d "/app/dist" ]; then
  STATIC_DIR="/app/dist"
elif [ -d "dist" ]; then
  STATIC_DIR="dist"
fi

if [ -n "$STATIC_DIR" ]; then
  echo "Detected static site environment in $STATIC_DIR..."

  # Replace VITE_ placeholders in JavaScript files
  echo "Replacing VITE_ placeholders in JavaScript files..."
  VARS="VITE_API_URL"
  for var in $VARS; do
    val=$(eval echo \$$var)
    if [ -n "$val" ]; then
      echo "Injecting $var=$val"
      escaped_val=$(echo "$val" | sed 's/[/&\]/\\&/g')
      find "$STATIC_DIR" -type f -name "*.js" -exec sed -i "s/APP_${var}_PLACEHOLDER/$escaped_val/g" {} +
    fi
  done

  # Replace LISTEN_PORT in nginx config if present
  if [ -f "/etc/nginx/conf.d/default.conf" ]; then
    echo "Replacing LISTEN_PORT in nginx config..."
    sed -i "s/LISTEN_PORT/${PORT:-3003}/g" /etc/nginx/conf.d/default.conf
  fi

  # Start Nginx only if it is installed
  if command -v nginx > /dev/null 2>&1; then
    echo "Starting Nginx..."
    exec nginx -g "daemon off;"
  fi
fi

# ---------------------------------------------------------
# 2. NestJS API Environment (e.g., api app)
# ---------------------------------------------------------
# NestJS API has dist/main.js and runs migrations & seeding
if [ -f "dist/main.js" ] || [ -f "dist/main" ]; then
  echo "Detected NestJS API environment..."

  SCHEMA_PATH="./prisma/schema"

  wait_for_db() {
    echo "Waiting for database to be ready..."
    MAX_RETRIES=60
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

    # Check if database is ready by executing a simple SELECT 1
    until echo "SELECT 1;" | $PRISMA_BIN db execute --stdin > /dev/null 2>&1 || [ $COUNT -eq $MAX_RETRIES ]; do
      sleep 2
      COUNT=$((COUNT + 1))
      echo "Retry $COUNT/$MAX_RETRIES: Database not yet available..."
    done

    if [ $COUNT -eq $MAX_RETRIES ]; then
      echo "❌ Database is not ready after $MAX_RETRIES retries. Exiting."
      exit 1
    fi
    echo "✅ Database is ready!"
  }

  if [ -n "$DATABASE_URL" ]; then
    wait_for_db
    echo "Deploying database migrations..."

    PRISMA_BIN="./node_modules/.bin/prisma"
    if [ ! -f "$PRISMA_BIN" ]; then
      PRISMA_BIN="prisma"
    fi

    $PRISMA_BIN migrate deploy

    echo "Seeding database..."
    $PRISMA_BIN db seed
  else
    echo "⚠️ DATABASE_URL not set, skipping migrations."
  fi
fi

# ---------------------------------------------------------
# 3. Site App (Next.js) Sanity Environment Variable Injection & Seeding
# ---------------------------------------------------------
if [ -f "apps/site/server.js" ]; then
  echo "Detected Site App (Next.js) environment..."

  if [ -n "$NEXT_PUBLIC_SANITY_PROJECT_ID" ] && [ "$NEXT_PUBLIC_SANITY_PROJECT_ID" != "NEXT_PUBLIC_SANITY_PROJECT_ID_PLACEHOLDER" ]; then
    echo "Injecting runtime NEXT_PUBLIC_SANITY_PROJECT_ID..."
    escaped_val=$(echo "$NEXT_PUBLIC_SANITY_PROJECT_ID" | sed 's/[/&\]/\\&/g')
    find . -type f \( -name "*.js" -o -name "*.html" -o -name "*.json" -o -name "*.mjs" \) -exec sed -i "s/NEXT_PUBLIC_SANITY_PROJECT_ID_PLACEHOLDER/$escaped_val/g" {} +
  fi

  if [ -n "$NEXT_PUBLIC_SANITY_DATASET" ] && [ "$NEXT_PUBLIC_SANITY_DATASET" != "NEXT_PUBLIC_SANITY_DATASET_PLACEHOLDER" ]; then
    echo "Injecting runtime NEXT_PUBLIC_SANITY_DATASET..."
    escaped_val=$(echo "$NEXT_PUBLIC_SANITY_DATASET" | sed 's/[/&\]/\\&/g')
    find . -type f \( -name "*.js" -o -name "*.html" -o -name "*.json" -o -name "*.mjs" \) -exec sed -i "s/NEXT_PUBLIC_SANITY_DATASET_PLACEHOLDER/$escaped_val/g" {} +
  fi

  if [ -n "$SANITY_API_TOKEN" ]; then
    echo "Running Sanity seeding..."
    if [ -f "apps/site/sanity/run-seed.mjs" ]; then
      node apps/site/sanity/run-seed.mjs || echo "⚠️ Sanity seeding failed, continuing anyway."
    else
      echo "⚠️ Sanity seed script not found at apps/site/sanity/run-seed.mjs"
    fi
  else
    echo "ℹ️ SANITY_API_TOKEN not set, skipping Sanity seeding."
  fi
fi

# ---------------------------------------------------------
# 4. Running Frontend or API App CMD
# ---------------------------------------------------------
echo "Executing: $@"
exec "$@"
