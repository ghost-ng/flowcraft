#!/bin/bash
# Download Google Fonts for local hosting (enterprise/offline use)
# This script fetches WOFF2 font files and generates @font-face CSS

set -euo pipefail

FONTS_DIR="$(cd "$(dirname "$0")/../public/fonts" && pwd)"
CSS_FILE="$(cd "$(dirname "$0")/../src/styles" && pwd)/fonts.css"

echo "Downloading fonts to: $FONTS_DIR"
echo "Writing CSS to: $CSS_FILE"

# Use Chrome user-agent to get WOFF2 format
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# Google Fonts CSS URL
GFONTS_URL="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Caveat:wght@400;500;600;700&family=Patrick+Hand&family=VT323&family=Courier+Prime:wght@400;700&family=Space+Mono:wght@400;700&family=Roboto:wght@400;500;700&family=Nunito:wght@400;600;700&family=Poppins:wght@400;500;600;700&family=Share+Tech+Mono&family=IBM+Plex+Mono:wght@400;500;600&family=Lora:wght@400;500;700&family=Fira+Code:wght@400;500&display=swap"

# Fetch the CSS from Google Fonts
echo "Fetching Google Fonts CSS..."
CSS_CONTENT=$(curl -sS -A "$UA" "$GFONTS_URL")

if [ -z "$CSS_CONTENT" ]; then
  echo "ERROR: Failed to fetch Google Fonts CSS"
  exit 1
fi

# Extract all WOFF2 URLs
URLS=$(echo "$CSS_CONTENT" | grep -oP 'url\(\K[^)]+\.woff2')

echo "Found $(echo "$URLS" | wc -l) font files to download"

# Download each font file
for url in $URLS; do
  filename=$(basename "$url")
  if [ ! -f "$FONTS_DIR/$filename" ]; then
    echo "  Downloading: $filename"
    curl -sS -o "$FONTS_DIR/$filename" "$url"
  else
    echo "  Skipping (exists): $filename"
  fi
done

# Generate local @font-face CSS by replacing remote URLs with local paths
echo "Generating local @font-face CSS..."
LOCAL_CSS="/* Auto-generated local font declarations — do not edit manually */\n/* Run scripts/download-fonts.sh to regenerate */\n\n"
LOCAL_CSS+=$(echo "$CSS_CONTENT" | sed -E "s|url\(https://fonts\.gstatic\.com/s/[^/]+/[^/]+/|url(/fonts/|g")

echo -e "$LOCAL_CSS" > "$CSS_FILE"

echo ""
echo "Done! Downloaded $(ls "$FONTS_DIR"/*.woff2 2>/dev/null | wc -l) font files"
echo "Generated CSS at: $CSS_FILE"
echo ""
echo "To use local fonts, in src/styles/app.css replace:"
echo '  @import url("https://fonts.googleapis.com/...");'
echo "with:"
echo '  @import "./fonts.css";'
