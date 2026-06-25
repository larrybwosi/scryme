#!/bin/sh
# entrypoint.sh for POS static site
set -e

# Replace VITE_ placeholders
replace_envs() {
  echo "Replacing VITE_ placeholders in JavaScript files..."
  # List of variables to replace
  VARS="VITE_API_URL"

  for var in $VARS; do
    val=$(eval echo \$$var)
    if [ -n "$val" ]; then
      echo "Injecting $var=$val"
      # Escape / and & and \ for sed
      escaped_val=$(echo "$val" | sed 's/[/&\]/\\&/g')
      find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s/APP_${var}_PLACEHOLDER/$escaped_val/g" {} +
    fi
  done
}

replace_envs

echo "Starting Nginx..."
exec nginx -g "daemon off;"
