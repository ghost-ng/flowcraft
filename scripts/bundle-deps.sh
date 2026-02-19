#!/usr/bin/env bash
# Regenerate the vendored node_modules tarball.
# Run this locally whenever package.json or package-lock.json changes.
#
# The tarball includes BOTH Windows and Linux native binaries so it works
# on local dev (Windows) AND GitLab CI (Linux node:20 image).
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
  lightningcss-linux-x64-gnu@1.30.2

echo "Creating node_modules.tar.gz..."
tar czf node_modules.tar.gz node_modules/

echo "Done — node_modules.tar.gz ($(du -sh node_modules.tar.gz | cut -f1))"
