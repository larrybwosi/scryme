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
  : "${VITE_PUBLIC_API_URL:=https://api.scryme.tech}"
  : "${VITE_API_URL:=https://api.scryme.tech}"
  : "${VITE_AUTH_URL:=https://auth.scryme.tech}"

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
    NEXT_PUBLIC_AUTH_URL
    VITE_PUBLIC_API_URL
    VITE_API_URL
    VITE_AUTH_URL
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
    target_url="$1"
    db_label="${2:-database}"
    echo "Waiting for $db_label to be ready..."
    MAX_RETRIES=60
    COUNT=0

    # Determine which prisma binary to use
    PRISMA_BIN="./node_modules/.bin/prisma"
    if [ ! -f "$PRISMA_BIN" ]; then
      if command -v prisma > /dev/null 2>&1; then
        PRISMA_BIN="prisma"
      else
        echo "Error: Prisma binary not found."
        return 1
      fi
    fi

    LAST_ERR=""
    until
      ERR_OUTPUT=$(DATABASE_URL="$target_url" CUSTOMER_DB="$target_url" echo "SELECT 1;" | DATABASE_URL="$target_url" CUSTOMER_DB="$target_url" $PRISMA_BIN db execute --stdin 2>&1)
    do
      COUNT=$((COUNT + 1))
      LAST_ERR=$(echo "$ERR_OUTPUT" | tr "\n" " " | sed "s/  */ /g")

      # Check if error indicates database does not exist
      if echo "$ERR_OUTPUT" | grep -qiE "database \".*\" does not exist|does not exist"; then
        DB_NAME=$(echo "$target_url" | sed -nE "s|^.*://[^/]+/([^?#/]+).*|\1|p")
        BASE_URL=$(echo "$target_url" | sed -E "s|^(.*://[^/]+/)[^?#/]+(.*)|\1postgres\2|")

        if [ -n "$DB_NAME" ] && [ "$DB_NAME" != "postgres" ]; then
          echo "Database '$DB_NAME' does not exist on target server. Attempting auto-creation..."
          CREATE_OUTPUT=$(DATABASE_URL="$BASE_URL" CUSTOMER_DB="$BASE_URL" echo "CREATE DATABASE \"$DB_NAME\";" | DATABASE_URL="$BASE_URL" CUSTOMER_DB="$BASE_URL" $PRISMA_BIN db execute --stdin 2>&1 || true)
          echo "Database creation output: $CREATE_OUTPUT"
        fi
      fi

      if [ $COUNT -eq $MAX_RETRIES ]; then
        break
      fi

      echo "Retry $COUNT/$MAX_RETRIES: $db_label not yet available... [Last error: ${LAST_ERR:-connection pending}]"
      sleep 2
    done

    if [ $COUNT -eq $MAX_RETRIES ]; then
      echo "❌ $db_label is not ready after $MAX_RETRIES retries. Last error: $LAST_ERR"
      return 1
    fi
    echo "✅ $db_label is ready!"
  }

  if [ -n "$DATABASE_URL" ]; then
    wait_for_db "$DATABASE_URL" "main database"
    echo "Deploying database migrations..."

    PRISMA_BIN="./node_modules/.bin/prisma"
    if [ ! -f "$PRISMA_BIN" ]; then
      PRISMA_BIN="prisma"
    fi

    MIGRATE_FAILED=false
    MIGRATE_OUTPUT=$($PRISMA_BIN migrate deploy 2>&1) || MIGRATE_FAILED=true
    echo "$MIGRATE_OUTPUT"

    if [ "$MIGRATE_FAILED" = "true" ]; then
      echo "⚠️ Database migration deployment failed. Checking for failed migrations to resolve..."

      # Extract failed migration names directly from the Prisma migrate error output
      FAILED_MIGRATIONS=$(echo "$MIGRATE_OUTPUT" | grep -oE "20[0-9]{12}_[a-zA-Z0-9_]+" | sort -u || true)

      # Also query _prisma_migrations table to capture any unfinished/failed migrations in DB
      DB_FAILED=$(echo "SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NULL AND rolled_back_at IS NULL;" | $PRISMA_BIN db execute --stdin 2>/dev/null | grep -oE "20[0-9]{12}_[a-zA-Z0-9_]+" | sort -u || true)

      ALL_FAILED=$(printf "%s\n%s\n" "$FAILED_MIGRATIONS" "$DB_FAILED" | grep -v "^$" | sort -u || true)

      if [ -n "$ALL_FAILED" ]; then
        for mig in $ALL_FAILED; do
          echo "Resolving failed migration as rolled-back: $mig"
          $PRISMA_BIN migrate resolve --rolled-back "$mig" || true
        done
      fi

      echo "Retrying database migrations deployment..."
      $PRISMA_BIN migrate deploy
    fi

    echo "Database migrations deployed successfully. Skipping automatic seeding."

  else
    echo "⚠️ DATABASE_URL not set, skipping migrations."
  fi

  C_DB_URL="${CUSTOMER_DB:-$CUSTOMER_DATABASE_URL}"
  if [ -n "$C_DB_URL" ]; then
    wait_for_db "$C_DB_URL" "customer database"
    echo "Deploying customer database migrations..."
    PRISMA_BIN="./node_modules/.bin/prisma"
    if [ ! -f "$PRISMA_BIN" ]; then
      PRISMA_BIN="prisma"
    fi

    if [ -f "./src/customer-auth/prisma/schema.prisma" ]; then
      DATABASE_URL="$C_DB_URL" $PRISMA_BIN migrate deploy --schema=./src/customer-auth/prisma/schema.prisma || DATABASE_URL="$C_DB_URL" $PRISMA_BIN db push --schema=./src/customer-auth/prisma/schema.prisma --accept-data-loss || echo "⚠️ Customer DB deployment failed, continuing anyway."
    fi
  else
    echo "ℹ️ CUSTOMER_DB / CUSTOMER_DATABASE_URL not set, skipping customer DB deployment."
  fi
fi



# ---------------------------------------------------------
# 4. Running Frontend or API App CMD
# ---------------------------------------------------------
echo "Executing: $@"
exec "$@"
