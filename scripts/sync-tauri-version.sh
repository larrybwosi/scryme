#!/bin/bash

# Get the version from apps/pos/package.json
VERSION=$(jq -r .version apps/pos/package.json)

if [ -z "$VERSION" ] || [ "$VERSION" == "null" ]; then
  echo "Error: Could not determine version from apps/pos/package.json"
  exit 1
fi

echo "Syncing version $VERSION to apps/bakery/package.json..."
jq --arg v "$VERSION" '.version = $v' apps/bakery/package.json > tmp.json && mv tmp.json apps/bakery/package.json

echo "Syncing version $VERSION to Tauri configs..."

# List of all tauri config files in the correct directory
CONFIG_FILES=$(ls apps/pos/src-tauri/tauri.*json apps/bakery/src-tauri/tauri.conf.json)

for FILE in $CONFIG_FILES; do
  echo "Updating $FILE"
  # Update version at the root of the JSON
  jq --arg v "$VERSION" '.version = $v' "$FILE" > tmp.json && mv tmp.json "$FILE"
done

echo "Successfully synced version to $(echo $CONFIG_FILES | wc -w) files."
