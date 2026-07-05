#!/bin/bash

# Function to generate a random string
generate_secret() {
  openssl rand -base64 32 | tr -d '/+=' | head -c 32
}

# Define secret variables
POSTGRES_USER=${POSTGRES_USER:-scryme}
POSTGRES_PASSWORD=$(generate_secret)
POSTGRES_DB=${POSTGRES_DB:-scryme_db}
JWT_SECRET=$(generate_secret)
BETTER_AUTH_SECRET=$(generate_secret)
INTERNAL_ADMIN_SECRET=$(generate_secret)
ENCRYPTION_KEY=$(generate_secret) # Must be 32 chars

# Define URLs
DATABASE_URL="postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@db:5432/$POSTGRES_DB?schema=public"
REDIS_URL="redis://redis:6379"

# Create .env file from .env.example if it exists, otherwise start fresh
# Don't overwrite if .env already exists to preserve manual changes
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "Created .env from .env.example"
  else
    touch .env
    echo "Created new .env file"
  fi
else
  echo ".env file already exists, updating secrets..."
fi

# Update or append secrets in .env
update_env() {
  local key=$1
  local value=$2

  # Check if key exists
  if grep -q "^$key=" .env; then
    # Portable sed -i
    sed -i.bak "s|^$key=.*|$key=$value|" .env && rm .env.bak
  else
    echo "$key=$value" >> .env
  fi
}

update_env "POSTGRES_USER" "$POSTGRES_USER"
update_env "POSTGRES_PASSWORD" "$POSTGRES_PASSWORD"
update_env "POSTGRES_DB" "$POSTGRES_DB"
update_env "DATABASE_URL" "$DATABASE_URL"
update_env "JWT_SECRET" "$JWT_SECRET"
update_env "BETTER_AUTH_SECRET" "$BETTER_AUTH_SECRET"
update_env "INTERNAL_ADMIN_SECRET" "$INTERNAL_ADMIN_SECRET"
update_env "ENCRYPTION_KEY" "$ENCRYPTION_KEY"
update_env "REDIS_URL" "$REDIS_URL"
update_env "REDIS_HOST" "redis"
update_env "REDIS_PORT" "6379"

# Also update Socket URLs.
# NOTE: For server-side, we use internal docker host.
# For client-side (NEXT_PUBLIC), we use localhost to ensure browser connectivity.
update_env "SOCKET_URL" "http://api:4000"
update_env "NEXT_PUBLIC_SOCKET_URL" "http://localhost:3002"
update_env "NEXT_PUBLIC_API_URL" "http://localhost:3002"

echo ".env file generated successfully with random secrets."
