#!/usr/bin/env bash
# Restore ALL LEN AI customizations to LibreChat
# This restores: branding, frontend source, backend API, and packages
#
# Usage:
#   bash scripts/restore-custom.sh            # restore everything
#   bash scripts/restore-custom.sh --branding # branding only
#   bash scripts/restore-custom.sh --src      # source code only
#   bash scripts/restore-custom.sh --backend  # backend + packages only

set -euo pipefail

CUSTOM_DIR="$(cd "$(dirname "$0")"/../custom && pwd)"
PROJECT_DIR="$(cd "$(dirname "$0")"/.. && pwd)"

restore_branding() {
  echo ">>> Restoring LEN branding..."
  local b="$CUSTOM_DIR/branding"
  local pub="$PROJECT_DIR/client/public/assets"
  local dist="$PROJECT_DIR/client/dist"

  cp "$b/logo.svg"                     "$pub/logo.svg"
  cp "$b/favicon.ico"                   "$pub/favicon.ico"
  cp "$b/favicon-32x32.png"             "$pub/favicon-32x32.png"
  cp "$b/favicon-16x16.png"             "$pub/favicon-16x16.png"
  cp "$b/apple-touch-icon-180x180.png"  "$pub/apple-touch-icon-180x180.png"
  cp "$b/icon-192x192.png"              "$pub/icon-192x192.png"
  cp "$b/maskable-icon.png"             "$pub/maskable-icon.png"

  if [ -d "$dist/assets" ]; then
    cp "$b/logo.svg"                     "$dist/assets/logo.svg"
    cp "$b/favicon.ico"                   "$dist/favicon.ico"
    cp "$b/favicon-32x32.png"             "$dist/assets/favicon-32x32.png"
    cp "$b/favicon-16x16.png"             "$dist/assets/favicon-16x16.png"
    cp "$b/apple-touch-icon-180x180.png"  "$dist/assets/apple-touch-icon-180x180.png"
    cp "$b/icon-192x192.png"              "$dist/assets/icon-192x192.png"
    cp "$b/maskable-icon.png"             "$dist/assets/maskable-icon.png"
    cp "$b/manifest.webmanifest"          "$dist/manifest.webmanifest"
  fi
  echo "    Done."
}

restore_src() {
  echo ">>> Restoring custom frontend source..."
  local s="$CUSTOM_DIR/src/client/src"
  local t="$PROJECT_DIR/client/src"

  # Admin components
  cp "$s/components/Admin/AdminGuard.tsx"       "$t/components/Admin/"
  cp "$s/components/Admin/AdminLayout.tsx"      "$t/components/Admin/"
  cp "$s/components/Admin/AdminSidebar.tsx"     "$t/components/Admin/"
  cp "$s/components/Admin/index.ts"             "$t/components/Admin/"
  cp "$s/components/Admin/Users/DeleteUserDialog.tsx"  "$t/components/Admin/Users/"
  cp "$s/components/Admin/Users/ResetPasswordDialog.tsx" "$t/components/Admin/Users/"
  cp "$s/components/Admin/Users/UserFormDialog.tsx"    "$t/components/Admin/Users/"
  cp "$s/components/Admin/Users/UsersTable.tsx"        "$t/components/Admin/Users/"
  cp "$s/components/Admin/Roles/RolePermissionsMatrix.tsx" "$t/components/Admin/Roles/"
  cp "$s/components/Admin/Roles/RolesTable.tsx"        "$t/components/Admin/Roles/"

  # Data provider
  cp "$s/data-provider/Admin/index.ts"         "$t/data-provider/Admin/"
  cp "$s/data-provider/Admin/mutations.ts"     "$t/data-provider/Admin/"
  cp "$s/data-provider/Admin/queries.ts"       "$t/data-provider/Admin/"
  cp "$s/data-provider/index.ts"               "$t/data-provider/"

  # Routes & other
  cp "$s/routes/admin.tsx"                     "$t/routes/"
  cp "$s/routes/Dashboard.tsx"                 "$t/routes/"
  cp "$s/components/Nav/AccountSettings.tsx"   "$t/components/Nav/"
  cp "$s/locales/en/translation.json"          "$t/locales/en/"
  cp "$s/style.css"                            "$t/"
  echo "    Done."
}

restore_backend() {
  echo ">>> Restoring custom backend API..."
  local s="$CUSTOM_DIR/src/api/server"
  local t="$PROJECT_DIR/api/server"

  cp "$s/routes/admin/index.js"    "$t/routes/admin/"
  cp "$s/routes/admin/users.js"    "$t/routes/admin/"
  cp "$s/routes/admin/roles.js"    "$t/routes/admin/"
  cp "$s/routes/index.js"          "$t/routes/"
  cp "$s/routes/roles.js"          "$t/routes/"
  cp "$s/routes/config.js"         "$t/routes/"
  cp "$s/routes/endpoints.js"      "$t/routes/"
  cp "$s/routes/models.js"         "$t/routes/"
  cp "$s/controllers/EndpointController.js" "$t/controllers/"
  cp "$s/controllers/ModelController.js"    "$t/controllers/"
  cp "$s/services/Config/EndpointService.js" "$t/services/Config/"
  cp "$s/index.js"                 "$t/"
  cp "$s/utils/roleEndpointFilter.js" "$t/utils/"

  if [ -f "$s/controllers/agents/openai.js" ]; then
    cp "$s/controllers/agents/openai.js" "$t/controllers/agents/" 2>/dev/null || true
  fi
  echo "    Done."

  echo ">>> Restoring custom packages..."
  local sp="$CUSTOM_DIR/src/packages"

  cp "$sp/api/src/admin/index.ts"   "$PROJECT_DIR/packages/api/src/admin/"
  cp "$sp/api/src/admin/roles.ts"   "$PROJECT_DIR/packages/api/src/admin/"
  cp "$sp/api/src/admin/users.ts"   "$PROJECT_DIR/packages/api/src/admin/"
  cp "$sp/api/src/index.ts"         "$PROJECT_DIR/packages/api/src/"
  cp "$sp/api/src/files/documents/crud.ts" "$PROJECT_DIR/packages/api/src/files/documents/"

  cp "$sp/data-provider/src/api-endpoints.ts" "$PROJECT_DIR/packages/data-provider/src/"
  cp "$sp/data-provider/src/data-service.ts"  "$PROJECT_DIR/packages/data-provider/src/"
  cp "$sp/data-provider/src/keys.ts"          "$PROJECT_DIR/packages/data-provider/src/"
  cp "$sp/data-provider/src/types/queries.ts" "$PROJECT_DIR/packages/data-provider/src/types/"

  cp "$sp/data-schemas/src/methods/role.ts" "$PROJECT_DIR/packages/data-schemas/src/methods/"
  cp "$sp/data-schemas/src/methods/user.ts" "$PROJECT_DIR/packages/data-schemas/src/methods/"
  echo "    Done."
}

case "${1:-all}" in
  --branding) restore_branding ;;
  --src)      restore_src ;;
  --backend)  restore_backend ;;
  *)
    restore_branding
    restore_src
    restore_backend
    echo ">>> All LEN customizations restored successfully."
    ;;
esac
