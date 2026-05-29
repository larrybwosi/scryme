#!/bin/bash

# Get the version from apps/pos/package.json
VERSION=$(jq -r .version apps/pos/package.json)

echo "Syncing version $VERSION to Tauri configs..."

# List of all tauri config files
CONFIG_FILES=$(ls apps/pos/src-tauri/tauri.*conf.json)

for FILE in $CONFIG_FILES; do
  echo "Updating $FILE"
  jq --arg v "$VERSION" '.version = $v' "$FILE" > tmp.json && mv tmp.json "$FILE"
done

echo "Done."
