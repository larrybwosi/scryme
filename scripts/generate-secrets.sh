#!/bin/bash

ENV_FILE=".env"
EXAMPLE_FILE=".env.example"

# 1. Initialize .env file if it doesn't exist
if [ ! -f "$ENV_FILE" ]; then
  if [ -f ".env.prod.example" ]; then
    cp ".env.prod.example" "$ENV_FILE"
    echo "Created .env from .env.prod.example"
  elif [ -f "$EXAMPLE_FILE" ]; then
    cp "$EXAMPLE_FILE" "$ENV_FILE"
    echo "Created .env from $EXAMPLE_FILE"
  else
    touch "$ENV_FILE"
    echo "Created a brand new empty .env file"
  fi
fi

# Function to generate a secure random string
generate_secret() {
  openssl rand -base64 32 | tr -d '/+=' | head -c 32
}

# Helper function to update or append keys safely without destroying human changes
update_env_var() {
  local key="$1"
  local default_value="$2"
  local force_overwrite="$3"

  if grep -q "^${key}=" "$ENV_FILE"; then
    local current_val
    current_val=$(grep "^${key}=" "$ENV_FILE" | cut -d'=' -f2-)

    # Overwrite if forced OR if the current value is blank or an obvious placeholder string
    if [ "$force_overwrite" = "true" ] || [ -z "$current_val" ] || [[ "$current_val" == *"your-"* ]] || [[ "$current_val" == *"fallback-"* ]] || [[ "$current_val" == *"dbpassword"* ]]; then
      sed -i.bak "s|^${key}=.*|${key}=${default_value}|" "$ENV_FILE" && rm -f "${ENV_FILE}.bak"
    fi
  else
    echo "${key}=${default_value}" >> "$ENV_FILE"
  fi
}

echo "Updating and patching environment secrets..."

# 2. Enforce your requested defaults
update_env_var "REALTIME_PROVIDER" "socketio" "true"
update_env_var "NEXT_PUBLIC_REALTIME_PROVIDER" "socketio" "true"
update_env_var "STORAGE_PROVIDER" "rustfs" "true"

# 3. Handle Database Configuration & Fallbacks
update_env_var "POSTGRES_USER" "scryme" "false"
update_env_var "POSTGRES_PASSWORD" "$(generate_secret)" "false"
update_env_var "POSTGRES_DB" "scryme_db" "false"

# Re-read them to dynamically construct the standard connection string
DB_USER=$(grep "^POSTGRES_USER=" "$ENV_FILE" | cut -d'=' -f2-)
DB_PASS=$(grep "^POSTGRES_PASSWORD=" "$ENV_FILE" | cut -d'=' -f2-)
DB_NAME=$(grep "^POSTGRES_DB=" "$ENV_FILE" | cut -d'=' -f2-)
update_env_var "DATABASE_URL" "postgresql://${DB_USER}:${DB_PASS}@db:5432/${DB_NAME}?schema=public" "true"

# 4. Generate Application Infrastructure Keys if blank/missing
update_env_var "JWT_SECRET" "$(generate_secret)" "false"
update_env_var "BETTER_AUTH_SECRET" "$(generate_secret)" "false"
update_env_var "INTERNAL_ADMIN_SECRET" "$(generate_secret)" "false"
update_env_var "ENCRYPTION_KEY" "$(generate_secret)" "false"

# 5. RustFS (S3 Compatible Storage) Credentials
update_env_var "RUSTFS_ACCESS_KEY" "$(generate_secret)" "false"
update_env_var "RUSTFS_SECRET_KEY" "$(generate_secret)" "false"
update_env_var "RUSTFS_ENDPOINT" "http://storage.scryme.local" "true"
update_env_var "RUSTFS_PUBLIC_URL" "http://storage.scryme.local" "true"
update_env_var "RUSTFS_REGION" "us-east-1" "false"
update_env_var "RUSTFS_BUCKET" "scryme-uploads" "false"
update_env_var "RUSTFS_FORCE_PATH_STYLE" "true" "false"

# 6. Traefik Routing Configuration for internal & external requests
update_env_var "NEXT_PUBLIC_API_URL" "http://api.scryme.local" "true"
update_env_var "NEXT_PUBLIC_WEB_URL" "http://scryme.local" "true"
update_env_var "NEXT_PUBLIC_CRM_URL" "http://crm.scryme.local" "true"
update_env_var "SOCKET_URL" "http://api.scryme.local" "true"
update_env_var "NEXT_PUBLIC_SOCKET_URL" "http://api.scryme.local" "true"

# 7. Redis defaults
update_env_var "REDIS_HOST" "redis" "false"
update_env_var "REDIS_PORT" "6379" "false"
update_env_var "REDIS_URL" "redis://redis:6379" "false"

# 8. Generate Zitadel database credentials and masterkey if missing
update_env_var "ZITADEL_DB_USER" "zitadel" "false"
update_env_var "ZITADEL_DB_PASSWORD" "$(generate_secret)" "false"
update_env_var "ZITADEL_DB_NAME" "zitadel" "false"
update_env_var "ZITADEL_MASTERKEY" "$(generate_secret)" "false"

# 9. Generate Windmill database credentials if missing
update_env_var "WINDMILL_DB_USER" "windmill" "false"
update_env_var "WINDMILL_DB_PASSWORD" "$(generate_secret)" "false"
update_env_var "WINDMILL_DB_NAME" "windmill" "false"

# 10. Generate RabbitMQ credentials and construct URL if missing
update_env_var "RABBITMQ_USER" "scryme" "false"
update_env_var "RABBITMQ_PASS" "$(generate_secret)" "false"

R_USER=$(grep "^RABBITMQ_USER=" "$ENV_FILE" | cut -d'=' -f2-)
R_PASS=$(grep "^RABBITMQ_PASS=" "$ENV_FILE" | cut -d'=' -f2-)
update_env_var "RABBITMQ_URL" "amqp://${R_USER}:${R_PASS}@rabbitmq:5672" "true"

# 11. Service Ports
update_env_var "API_PORT" "4000" "false"
update_env_var "WEB_PORT" "3000" "false"
update_env_var "CRM_PORT" "3001" "false"
update_env_var "BAKERY_PORT" "3003" "false"

echo "The .env file has been processed successfully with unified configurations."
