#!/usr/bin/env bash
# Runs the backend seed script against whatever MONGO_URI is configured
# (local .env by default). Safe to re-run — the seed script is idempotent.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR/backend"
npm run seed
