#!/usr/bin/env bash
# Starts all services locally via docker-compose for development.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -f .env ]; then
  echo ".env not found. Run ./scripts/setup.sh first, or copy .env.example to .env manually."
  exit 1
fi

docker-compose up --build
