#!/bin/sh
# entrypoint.sh for API
set -e

# Function to wait for database
wait_for_db() {
  echo "Waiting for database to be ready..."
  MAX_RETRIES=30
  COUNT=0
  # Using prisma to check connection as it's already available
  until ./node_modules/.bin/prisma db execute --stdin "SELECT 1;" > /dev/null 2>&1 || [ $COUNT -eq $MAX_RETRIES ]; do
    sleep 2
    COUNT=$((COUNT + 1))
    echo "Retry $COUNT/$MAX_RETRIES..."
  done

  if [ $COUNT -eq $MAX_RETRIES ]; then
    echo "Database is not ready after $MAX_RETRIES retries. Exiting."
    exit 1
  fi
  echo "Database is ready!"
}

if [ -n "$DATABASE_URL" ]; then
  wait_for_db
  echo "Deploying database migrations..."
  ./node_modules/.bin/prisma migrate deploy
else
  echo "DATABASE_URL not set, skipping migrations."
fi

echo "Starting NestJS application..."
exec node apps/api/dist/main.js
