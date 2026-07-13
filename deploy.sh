#!/bin/bash
set -e

# Run the generate-secrets.sh script to copy/generate .env
./scripts/generate-secrets.sh

# Run docker compose
docker compose up -d
