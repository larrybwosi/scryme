#!/bin/bash

# Get the version from apps/pos/package.json
VERSION=$(jq -r .version apps/pos/package.json)

if [ -z "$VERSION" ] || [ "$VERSION" == "null" ]; then
  echo "Error: Could not determine version from apps/pos/package.json"
  exit 1
fi

echo "Syncing version $VERSION to apps/bakery/package.json..."
jq --arg v "$VERSION" '.version = $v' apps/bakery/package.json > tmp.json && mv tmp.json apps/bakery/package.json

echo "Syncing version $VERSION to SDK packages..."
if [ -f "packages/sdk/package.json" ]; then
  echo "Updating packages/sdk/package.json"
  jq --arg v "$VERSION" '.version = $v | .scripts["generate:rust"] = ("openapi-generator-cli generate -i ./openapi.json -g rust -o ./rust --additional-properties=packageName=scryme-sdk,packageVersion=" + $v + " --global-property apiDocs=false,modelDocs=false")' packages/sdk/package.json > tmp.json && mv tmp.json packages/sdk/package.json
fi

if [ -f "packages/sdk/rust/Cargo.toml" ]; then
  echo "Updating packages/sdk/rust/Cargo.toml to version $VERSION"
  node -e '
    const fs = require("fs");
    const v = process.argv[1];
    let cargo = fs.readFileSync("packages/sdk/rust/Cargo.toml", "utf8");
    cargo = cargo.replace(/^version\s*=\s*"[^"]+"/m, `version = "${v}"`);
    fs.writeFileSync("packages/sdk/rust/Cargo.toml", cargo, "utf8");
  ' "$VERSION"
fi

# Sanitize version for Tauri configs (MSI target on Windows requires numeric-only prerelease identifier <= 65535)
TAURI_VERSION=$(node -e "
  const v = process.argv[1];
  if (!v.includes('-')) { console.log(v); process.exit(0); }
  const parts = v.split('-');
  const mainVersion = parts[0];
  const prerelease = parts.slice(1).join('-');
  const match = prerelease.match(/(\d+)$/);
  if (match && parseInt(match[1], 10) <= 65535) {
    console.log(\`\${mainVersion}-\${match[1]}\`);
  } else {
    console.log(mainVersion);
  }
" "$VERSION")

echo "Syncing version $TAURI_VERSION to Tauri configs..."

# List of all tauri config files in the correct directory
CONFIG_FILES=$(ls apps/pos/src-tauri/tauri.*json apps/bakery/src-tauri/tauri.conf.json)

for FILE in $CONFIG_FILES; do
  echo "Updating $FILE"
  # Update version at the root of the JSON
  jq --arg v "$TAURI_VERSION" '.version = $v' "$FILE" > tmp.json && mv tmp.json "$FILE"
done

echo "Successfully synced version to $(echo $CONFIG_FILES | wc -w) files."
