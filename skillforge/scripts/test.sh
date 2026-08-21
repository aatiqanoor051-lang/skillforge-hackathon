#!/usr/bin/env bash
# Runs the full test suite: backend (Jest) and python-service (pytest).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=== Backend tests (Jest) ==="
(cd "$ROOT_DIR/backend" && npm test)

echo ""
echo "=== Python analysis service tests (pytest) ==="
(cd "$ROOT_DIR/python-service" && python -m pytest test_analyzer.py -v)
