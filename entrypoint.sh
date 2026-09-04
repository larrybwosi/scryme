#!/bin/sh
# Unified entrypoint.sh for Scryme apps
set -e

# Print startup context
echo "Starting container in directory: $(pwd)"

# ---------------------------------------------------------
# 0. Dynamic NEXT_PUBLIC_ and VITE_ Environment Variable Injection
# ---------------------------------------------------------
inject_env_placeholders() {
  echo "Injecting runtime NEXT_PUBLIC_ and VITE_ environment variables..."

  # Fallback defaults for core endpoints if unset
  : "${NEXT_PUBLIC_API_URL:=https://api.scryme.tech}"
  : "${NEXT_PUBLIC_ADMIN_URL:=https://admin.scryme.tech}"
  : "${NEXT_PUBLIC_WEB_URL:=https://app.scryme.tech}"
  : "${NEXT_PUBLIC_APP_URL:=https://app.scryme.tech}"
  : "${NEXT_PUBLIC_CRM_URL:=https://crm.scryme.tech}"
  : "${NEXT_PUBLIC_SOCKET_URL:=https://api.scryme.tech}"
  : "${VITE_API_URL:=https://api.scryme.tech}"

  # Get list of all environment variables starting with NEXT_PUBLIC_ or VITE_
  DYNAMIC_VARS=$(env | grep -E '^(NEXT_PUBLIC_|VITE_)' | cut -d= -f1 || true)

  KNOWN_VARS="
    NEXT_PUBLIC_API_URL
    NEXT_PUBLIC_APP_URL
    NEXT_PUBLIC_WEB_URL
    NEXT_PUBLIC_CRM_URL
    NEXT_PUBLIC_ADMIN_URL
    NEXT_PUBLIC_SOCKET_URL
    NEXT_PUBLIC_COOKIE_DOMAIN
    NEXT_PUBLIC_REALTIME_PROVIDER
    NEXT_PUBLIC_POSTHOG_KEY
    NEXT_PUBLIC_POSTHOG_HOST
    NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
    NEXT_PUBLIC_SENTRY_DSN
    NEXT_PUBLIC_SITE_SANITY_DATASET
    NEXT_PUBLIC_SITE_SANITY_PROJECT_ID
    NEXT_PUBLIC_SANITY_PROJECT_ID
    NEXT_PUBLIC_SANITY_DATASET
    NEXT_PUBLIC_OPENPANEL_CLIENT_ID
    NEXT_PUBLIC_OPENPANEL_HOST
    NEXT_PUBLIC_SITE_URL
    NEXT_PUBLIC_SCRYME_ORG_SLUG
    NEXT_PUBLIC_SCRYME_API_URL
    VITE_API_URL
    VITE_SOCKET_URL
    VITE_OPENPANEL_CLIENT_ID
    VITE_OPENPANEL_HOST
    VITE_PUBLIC_POSTHOG_KEY
    VITE_PUBLIC_POSTHOG_HOST
    VITE_PUBLIC_SENTRY_DSN
    VITE_BUSINESS_MODE
  "

  ALL_VARS=$(printf "%s\n%s\n" "$DYNAMIC_VARS" "$KNOWN_VARS" | grep -v '^$' | sort -u)

  TARGET_DIR="."
  if [ -d "/usr/share/nginx/html" ]; then
    TARGET_DIR="/usr/share/nginx/html"
  elif [ -d "/app/dist" ]; then
    TARGET_DIR="/app/dist"
  fi

  for var in $ALL_VARS; do
    val=$(eval echo \$$var)
    if [ -n "$val" ]; then
      escaped_val=$(echo "$val" | sed 's/[/&\]/\\&/g')
      for placeholder in "APP_${var}_PLACEHOLDER" "${var}_PLACEHOLDER" "NEXT_PUBLIC_${var}_PLACEHOLDER"; do
        if [ "$val" != "$placeholder" ]; then
          find "$TARGET_DIR" -type f \( -name "*.js" -o -name "*.html" -o -name "*.json" -o -name "*.mjs" \) -exec sed -i "s/$placeholder/$escaped_val/g" {} + 2>/dev/null || true
        fi
      done
    fi
  done
}

inject_env_placeholders

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
# 3. Site App (Next.js) Sanity Seeding
# ---------------------------------------------------------
if [ -f "apps/site/server.js" ]; then
  echo "Detected Site App (Next.js) environment..."

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
