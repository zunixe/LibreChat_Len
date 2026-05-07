#!/usr/bin/env bash
# Apply LEN AI branding to LibreChat
# Run this after `npm run frontend` or whenever the build overwrites custom assets.
#
# Usage:
#   bash scripts/apply-branding.sh          # apply to public/ and dist/
#   bash scripts/apply-branding.sh --dist   # apply to dist/ only
#   bash scripts/apply-branding.sh --public # apply to public/ only

set -euo pipefail

BRANDING_DIR="$(cd "$(dirname "$0")"/../custom/branding && pwd)"
PROJECT_DIR="$(cd "$(dirname "$0")"/.. && pwd)"

apply_public() {
  echo ">>> Applying LEN branding to client/public/assets/ ..."
  cp "$BRANDING_DIR/logo.svg"                   "$PROJECT_DIR/client/public/assets/logo.svg"
  cp "$BRANDING_DIR/favicon.ico"                 "$PROJECT_DIR/client/public/assets/favicon.ico"
  cp "$BRANDING_DIR/favicon.ico"                 "$PROJECT_DIR/client/public/favicon.ico"
  cp "$BRANDING_DIR/favicon-32x32.png"           "$PROJECT_DIR/client/public/assets/favicon-32x32.png"
  cp "$BRANDING_DIR/favicon-16x16.png"           "$PROJECT_DIR/client/public/assets/favicon-16x16.png"
  cp "$BRANDING_DIR/apple-touch-icon-180x180.png" "$PROJECT_DIR/client/public/assets/apple-touch-icon-180x180.png"
  cp "$BRANDING_DIR/icon-192x192.png"            "$PROJECT_DIR/client/public/assets/icon-192x192.png"
  cp "$BRANDING_DIR/maskable-icon.png"           "$PROJECT_DIR/client/public/assets/maskable-icon.png"
  echo "    Done."
}

apply_dist() {
  local dist_dir="$PROJECT_DIR/client/dist"
  if [ ! -d "$dist_dir/assets" ]; then
    echo ">>> WARNING: $dist_dir/assets/ not found — skipping dist copy."
    echo "    Run 'npm run frontend' first, then re-run this script."
    return
  fi
  echo ">>> Applying LEN branding to client/dist/ ..."
  cp "$BRANDING_DIR/logo.svg"                   "$dist_dir/assets/logo.svg"
  cp "$BRANDING_DIR/favicon.ico"                 "$dist_dir/favicon.ico"
  cp "$BRANDING_DIR/favicon-32x32.png"           "$dist_dir/assets/favicon-32x32.png"
  cp "$BRANDING_DIR/favicon-16x16.png"           "$dist_dir/assets/favicon-16x16.png"
  cp "$BRANDING_DIR/apple-touch-icon-180x180.png" "$dist_dir/assets/apple-touch-icon-180x180.png"
  cp "$BRANDING_DIR/icon-192x192.png"            "$dist_dir/assets/icon-192x192.png"
  cp "$BRANDING_DIR/maskable-icon.png"           "$dist_dir/assets/maskable-icon.png"
  cp "$BRANDING_DIR/manifest.webmanifest"        "$dist_dir/manifest.webmanifest"
  echo "    Done."
}

case "${1:-all}" in
  --public) apply_public ;;
  --dist)   apply_dist ;;
  *)
    apply_public
    apply_dist
    echo ">>> LEN branding applied successfully."
    ;;
esac
