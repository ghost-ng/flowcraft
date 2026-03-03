#!/usr/bin/env bash
# Regenerate the vendored node_modules tarball for Linux CI.
# Run this locally whenever package.json or package-lock.json changes.
#
# The tarball contains Linux-x64 native binaries only (not Windows) to keep
# the size down. Local dev uses npm ci which installs the correct platform
# binaries automatically.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "Installing dependencies..."
npm ci

# Install Linux-x64 native binaries so the tarball works in Linux CI.
# These are optional deps that npm only installs for the current platform,
# so we force-install the Linux variants alongside the Windows ones.
echo "Adding Linux x64 native binaries for CI..."
npm install --no-save --force \
  @rollup/rollup-linux-x64-gnu@4.57.1 \
  @esbuild/linux-x64@0.27.3 \
  lightningcss-linux-x64-gnu@1.30.2 \
  @tailwindcss/oxide-linux-x64-gnu@4.1.18

# Strip Windows native binaries — CI only runs on Linux.
# This saves ~27 MB from the tarball.
echo "Removing Windows native binaries..."
rm -rf \
  node_modules/@esbuild/win32-* \
  node_modules/@rollup/rollup-win32-* \
  node_modules/lightningcss-win32-* \
  node_modules/@tailwindcss/oxide-win32-*

echo "Creating node_modules.tar.gz..."
tar czf node_modules.tar.gz node_modules/

echo "Done — node_modules.tar.gz ($(du -sh node_modules.tar.gz | cut -f1))"
echo "Remember: run 'npm ci' after this script to restore Windows binaries for local dev."
