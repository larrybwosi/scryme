#!/bin/sh
# Unified entrypoint.sh for Scryme apps
set -e

# Print startup context
echo "Starting container in directory: $(pwd)"

# ---------------------------------------------------------
# 1. Nginx / Static Site Environment (e.g., Bakery)
# ---------------------------------------------------------
# Static sites have their HTML/JS files in /usr/share/nginx/html
if [ -d "/usr/share/nginx/html" ]; then
  echo "Detected Nginx static site environment..."

  # Replace VITE_ placeholders in JavaScript files
  echo "Replacing VITE_ placeholders in JavaScript files..."
  VARS="VITE_API_URL"
  for var in $VARS; do
    val=$(eval echo \$$var)
    if [ -n "$val" ]; then
      echo "Injecting $var=$val"
      escaped_val=$(echo "$val" | sed 's/[/&\]/\\&/g')
      find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s/APP_${var}_PLACEHOLDER/$escaped_val/g" {} +
    fi
  done

  # Replace LISTEN_PORT in nginx config if present
  if [ -f "/etc/nginx/conf.d/default.conf" ]; then
    echo "Replacing LISTEN_PORT in nginx config..."
    sed -i "s/LISTEN_PORT/${PORT:-3003}/g" /etc/nginx/conf.d/default.conf
  fi

  echo "Starting Nginx..."
  exec nginx -g "daemon off;"
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
    until $PRISMA_BIN db execute --stdin "SELECT 1;" --schema "$SCHEMA_PATH" > /dev/null 2>&1 || [ $COUNT -eq $MAX_RETRIES ]; do
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

    $PRISMA_BIN migrate deploy --schema "$SCHEMA_PATH"

    echo "Seeding database..."
    $PRISMA_BIN db seed --schema "$SCHEMA_PATH"
  else
    echo "⚠️ DATABASE_URL not set, skipping migrations."
  fi
fi

# ---------------------------------------------------------
# 3. Running Frontend or API App CMD
# ---------------------------------------------------------
echo "Executing: $@"
exec "$@"
