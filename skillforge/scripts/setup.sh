#!/usr/bin/env bash
# One-time local setup: copies env file, installs dependencies for all
# three services. Run from the repository root: ./scripts/setup.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example — review and update secrets before running in production."
fi

echo "Installing backend dependencies..."
(cd backend && npm install)

echo "Installing frontend dependencies..."
(cd frontend && npm install)

echo "Installing Python service dependencies..."
(cd python-service && pip install -r requirements.txt)

echo ""
echo "Setup complete. Next steps:"
echo "  1. Review .env and set a strong JWT_SECRET."
echo "  2. Start MongoDB locally, or use docker-compose up mongo."
echo "  3. Run 'npm run seed' from backend/ to load demo data."
echo "  4. Start services: docker-compose up --build (or run each service individually)."
