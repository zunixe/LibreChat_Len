#!/usr/bin/env bash
# Post-build script for LibreChat with LEN AI customizations
# This ensures all changes are reflected in running containers.
#
# What this does:
#   1. Apply LEN branding to client/public/assets/ and client/dist/
#   2. Sync client/dist/ to NGINX container
#   3. Restart API container (so expressStaticGzip picks up new files)
#   4. Reload NGINX config
#
# Usage:
#   bash scripts/post-build.sh          # full post-build
#   bash scripts/post-build.sh --quick # restart only, skip branding & sync

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")"/.. && pwd)"
cd "$PROJECT_DIR"

if [ "${1:-}" != "--quick" ]; then
  echo ">>> [1/4] Applying LEN branding..."
  bash scripts/apply-branding.sh
else
  echo ">>> [1/4] Skipping branding (quick mode)"
fi

echo ">>> [2/4] Syncing dist to NGINX container..."
NGINX_CONTAINER=$(docker ps --format '{{.Names}}' | grep -i nginx | head -1 || true)
if [ -n "$NGINX_CONTAINER" ]; then
  docker cp client/dist/. "$NGINX_CONTAINER:/usr/share/nginx/html/"
  echo "    Synced to $NGINX_CONTAINER"
else
  echo "    No NGINX container found, skipping."
fi

echo ">>> [3/4] Restarting API container..."
docker compose -f docker-compose.yml -f docker-compose.override.yml restart api 2>/dev/null \
  || docker compose restart api 2>/dev/null \
  || echo "    WARNING: Could not restart API container. Run manually: docker compose restart api"

echo ">>> [4/4] Reloading NGINX..."
if [ -n "$NGINX_CONTAINER" ]; then
  docker exec "$NGINX_CONTAINER" nginx -s reload 2>/dev/null || echo "    WARNING: Could not reload NGINX."
fi

echo ""
echo ">>> Post-build complete! Site should be live with latest changes."
echo "    If browser shows old content, hard-refresh (Ctrl+Shift+R)."
