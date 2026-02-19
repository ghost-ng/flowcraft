#!/usr/bin/env bash
# Regenerate the vendored node_modules tarball.
# Run this locally whenever package.json or package-lock.json changes.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "Installing dependencies..."
npm ci

echo "Creating node_modules.tar.gz..."
tar czf node_modules.tar.gz node_modules/

echo "Done — node_modules.tar.gz ($(du -sh node_modules.tar.gz | cut -f1))"
