# Rancangan Halaman Admin & Manage Role — LibreChat

> Dokumen ini adalah rancangan teknis untuk menambahkan halaman admin internal
> di LibreChat (open-source). Ditulis sebelum implementasi sebagai referensi tim.

## 1. Latar Belakang

LibreChat saat ini **tidak memiliki halaman admin internal** untuk manajemen
user. Operasi admin masih dilakukan via script manual:

- `add_user.js` — buat user lewat MongoClient langsung
- `delete-user.js` — hapus user via ObjectId
- `update_user.js` — update role/password via MongoClient

Hal ini tidak scalable, tidak auditable, dan rentan kesalahan operator.

### Yang Sudah Ada di Codebase

| Komponen | Lokasi | Status |
|---|---|---|
| Enum `SystemRoles` (`ADMIN`, `USER`) | `packages/data-provider/src/roles.ts` | ✅ |
| `roleSchema` & `roleDefaults` | `packages/data-provider/src/roles.ts` | ✅ |
| Middleware `checkAdmin` | `api/server/middleware/roles/admin.js` | ✅ |
| Capability system (`ACCESS_ADMIN`, `MANAGE_ROLES`) | `api/server/middleware/roles/capabilities.js` | ✅ |
| Endpoint `GET /api/roles/:roleName` | `api/server/routes/roles.js` | ✅ |
| Endpoint `PUT /api/roles/:roleName/{prompts,agents,memories,...}` | `api/server/routes/roles.js` | ✅ (per kategori) |
| Route `/api/admin/auth/*` (OAuth ke admin panel komersial eksternal) | `api/server/routes/admin/auth.js` | ✅ |
| Halaman admin internal di SPA | — | ❌ |
| Endpoint CRUD user | — | ❌ |
| UI manage role permission | — | ❌ |
| Endpoint atomic `PUT /api/roles/:roleName` | — | ❌ |

## 2. Keputusan Desain

| Aspek | Keputusan |
|---|---|
| Role model | Full custom role (selain `ADMIN` & `USER`, contoh `HC` didukung) |
| Layout permission editor | Sidebar kategori + **matrix view** ringkas |
| Form generation | Auto-generated dari Zod schema (`permissions.ts`) |
| Save strategy | **1 endpoint atomic** `PUT /api/roles/:roleName` (full permissions object) |
| Frontend route | `/d/admin` dengan guard `user.role === SystemRoles.ADMIN` |
| Backend location | Logic TS di `/packages/api/src/admin/`, thin wrapper di `/api/server/routes/admin/` |
| Data layer | React Query + `packages/data-provider` (mengikuti AGENTS.md) |
| Akses kontrol | `requireCapability(SystemCapabilities.ACCESS_ADMIN)` di semua endpoint admin |

## 3. Scope Fitur

### MVP (Fase 1)

**User Management**
- List user paginated (cursor-based) dengan filter role + search email/name
- Create user (email, name, password, role)
- Edit user (name, role, emailVerified)
- Reset password user
- Delete user (cascade ke conversations, files)

**Role Management**
- List semua role (system + custom)
- Edit permission per role (matrix view)
- Create custom role (clone permission dari `USER` atau `ADMIN`)
- Delete custom role (tolak hapus `ADMIN`/`USER`)

### Fase 2 (Opsional)

- Statistik (jumlah user aktif, conversation, token usage)
- Ban/unban user
- Audit log perubahan role/user
- View `librechat.yaml` (read-only)

## 4. Arsitektur Backend

### Struktur File Baru

```
api/server/routes/admin/
  auth.js          (sudah ada — JANGAN diubah)
  users.js         BARU — CRUD user
  roles.js         BARU — CRUD custom role (extend list/create/delete)
  index.js         BARU — mount semua admin route

packages/api/src/admin/
  users.service.ts BARU
  roles.service.ts BARU
  index.ts         BARU
```

### Endpoint Baru

Semua diproteksi: `requireJwtAuth` + `requireCapability(SystemCapabilities.ACCESS_ADMIN)`.

| Method | Path | Body / Query | Response |
|---|---|---|---|
| `GET` | `/api/admin/users` | `?cursor=&limit=20&search=&role=` | `{ users: User[], nextCursor }` |
| `POST` | `/api/admin/users` | `{ email, name, password, role }` | `User` |
| `GET` | `/api/admin/users/:id` | — | `User` |
| `PATCH` | `/api/admin/users/:id` | `{ name?, role?, emailVerified? }` | `User` |
| `POST` | `/api/admin/users/:id/reset-password` | `{ password }` | `{ ok: true }` |
| `DELETE` | `/api/admin/users/:id` | — | `{ ok: true }` |
| `GET` | `/api/admin/roles` | — | `Role[]` |
| `POST` | `/api/admin/roles` | `{ name, basePermissionsFrom?: 'USER'\|'ADMIN' }` | `Role` |
| `DELETE` | `/api/admin/roles/:name` | — | `{ ok: true }` (tolak `ADMIN`/`USER`) |

### Endpoint Diperluas

| Method | Path | Catatan |
|---|---|---|
| `PUT` | `/api/roles/:roleName` | **BARU** — atomic full update `{ permissions: TPermissions }`. Reuse `updateRoleByName`. Tetap proteksi `MANAGE_ROLES`. |

Endpoint per-kategori existing (`PUT /api/roles/:roleName/prompts`, dll.)
**tetap dipertahankan** untuk backward compat, tidak dihapus.

### Validasi & Keamanan

- Password di-hash dengan `bcryptjs` (`salt = 10`), reuse pola di
  `AuthService.registerUser` (`api/server/services/AuthService.js:225`).
- Email unik, validasi format via Zod.
- **Tidak boleh hapus user yang sedang login** (`req.user.id !== :id`).
- **Tidak boleh demote admin terakhir** (cek `count({role: ADMIN}) > 1` sebelum
  ubah role ADMIN → lain).
- **Tidak boleh hapus role** yang masih dipakai user (cek `User.find({role})`).
- Rate limit `loginLimiter` untuk endpoint reset-password admin.

## 5. Arsitektur Frontend

### Routing

```
/d/admin                 AdminLayout (default → /users)
/d/admin/users           UsersPage
/d/admin/roles           RolesPage
/d/admin/roles/:name     RolePermissionsPage (matrix view)
```

`AdminGuard.tsx` redirect ke `/c/new` kalau `user.role !== 'ADMIN'`.

### Struktur Komponen

```
client/src/components/Admin/
  AdminLayout.tsx
  AdminGuard.tsx
  AdminSidebar.tsx
  Users/
    UsersTable.tsx
    UserFormDialog.tsx
    DeleteUserDialog.tsx
    ResetPasswordDialog.tsx
    RoleSelect.tsx
  Roles/
    RolesTable.tsx
    CreateRoleDialog.tsx
    RolePermissionsMatrix.tsx
    PermissionMatrixCell.tsx
    SingleToggleFeatures.tsx
  index.ts

client/src/data-provider/Admin/
  queries.ts             useAdminUsersQuery, useAdminRolesQuery, dst.
  mutations.ts           useCreate/Update/DeleteUserMutation, dst.
  index.ts

client/src/routes/admin.tsx    lazy-loaded route entry
```

### Data Layer (mengikuti AGENTS.md)

- `packages/data-provider/src/api-endpoints.ts` — tambah:
  - `adminUsers()`, `adminUserById(id)`
  - `adminUserResetPassword(id)`
  - `adminRoles()`, `adminRoleByName(name)`
  - `roleByName(name)` (untuk PUT atomic)
- `packages/data-provider/src/data-service.ts` — fungsi `listAdminUsers`,
  `createAdminUser`, `updateAdminUser`, `deleteAdminUser`,
  `resetAdminUserPassword`, `listAdminRoles`, `createAdminRole`,
  `deleteAdminRole`, `updateRolePermissions`.
- `packages/data-provider/src/types/queries.ts` — tipe `TAdminUser`,
  `TAdminUserListParams`, `TAdminUserListResponse`,
  `TCreateAdminUserPayload`, `TUpdateAdminUserPayload`,
  `TCreateRolePayload`, `TUpdateRolePermissionsPayload`.
- `packages/data-provider/src/keys.ts` — `QueryKeys.adminUsers`,
  `QueryKeys.adminRoles`, `QueryKeys.adminUser`, `QueryKeys.adminRole`,
  `MutationKeys.{createAdminUser, updateAdminUser, deleteAdminUser,
  resetAdminUserPassword, createAdminRole, deleteAdminRole,
  updateRolePermissions}`.

### UI Permission Matrix

Total **14 PermissionType** × kombinasi `Permissions`:

| PermissionType | Toggles |
|---|---|
| PROMPTS | USE, CREATE, SHARE, SHARE_PUBLIC |
| BOOKMARKS | USE |
| MEMORIES | USE, CREATE, UPDATE, READ, OPT_OUT |
| AGENTS | USE, CREATE, SHARE, SHARE_PUBLIC |
| MULTI_CONVO | USE |
| TEMPORARY_CHAT | USE |
| RUN_CODE | USE |
| WEB_SEARCH | USE |
| PEOPLE_PICKER | VIEW_USERS, VIEW_GROUPS, VIEW_ROLES |
| MARKETPLACE | USE |
| FILE_SEARCH | USE |
| FILE_CITATIONS | USE |
| MCP_SERVERS | USE, CREATE, SHARE, SHARE_PUBLIC |
| REMOTE_AGENTS | USE, CREATE, SHARE, SHARE_PUBLIC |

Layout matrix view (mock):

```
Resource permissions
                       USE  CREATE  UPDATE  READ  SHARE  SHARE_PUBLIC
Prompts                 ☑     ☑      —      —      ☐         ☐
Agents                  ☑     ☑      —      —      ☐         ☐
Memories                ☑     ☑      ☑     ☑      —         —
MCP Servers             ☑     ☑      —      —      ☐         ☐
Marketplace             ☐     —      —      —      —         —
Remote Agents           ☐     ☐      —      —      ☐         ☐

Single-toggle features (USE only)
  Bookmarks ☑   Multi-convo ☑   Temp chat ☑   Run code ☑
  Web search ☑  File search ☑   File citations ☑

People Picker
  VIEW_USERS ☑   VIEW_GROUPS ☑   VIEW_ROLES ☑
```

Cell `—` = permission tidak berlaku untuk type tersebut.

### Generasi Form dari Zod

```ts
const permissionFields: Record<PermissionTypes, Permissions[]> = {
  [PermissionTypes.PROMPTS]: Object.keys(promptPermissionsSchema.shape) as Permissions[],
  ...
};
```

Form dibuat dengan `react-hook-form` + `zodResolver(permissionsSchema)`.
Tidak ada hard-coded list manual — selalu sinkron dengan schema.

## 6. Localization

Semua teks user-facing pakai `useLocalize()`. Key prefix: `com_admin_`.

Contoh key (di `client/src/locales/en/translation.json`):

```
"com_admin_title": "Admin",
"com_admin_users_title": "User Management",
"com_admin_users_create": "Create User",
"com_admin_users_email": "Email",
"com_admin_users_name": "Name",
"com_admin_users_role": "Role",
"com_admin_users_delete_confirm": "Delete user {{email}}?",
"com_admin_roles_title": "Roles & Permissions",
"com_admin_roles_create": "Create Role",
"com_admin_roles_delete_in_use": "Cannot delete role in use by {{count}} user(s).",
"com_admin_perms_resource": "Resource permissions",
"com_admin_perms_features": "Feature permissions",
...
```

## 7. Testing

Mengikuti AGENTS.md (real logic over mocks).

### Backend
- `packages/api/src/admin/__tests__/users.service.test.ts` — pakai
  `mongodb-memory-server`, test create/update/delete flow.
- `packages/api/src/admin/__tests__/roles.service.test.ts` — test create
  custom role + clone permission, delete role in-use ditolak.
- `api/server/routes/admin/__tests__/users.spec.js` — supertest endpoint
  dengan auth middleware real.

### Frontend
- `client/src/components/Admin/__tests__/UsersTable.test.tsx` — render
  loading/success/error.
- `client/src/components/Admin/__tests__/RolePermissionsMatrix.test.tsx` —
  render matrix dari role mock, toggle, save mutation dipanggil dengan
  payload benar.

## 8. Roadmap Implementasi (8 Langkah)

1. **`packages/data-provider`** — types, endpoints, data-service, keys.
   Build: `npm run build:data-provider`.
2. **`packages/api/src/admin/`** — services TS (users, roles).
3. **`api/server/routes/admin/users.js` + `index.js`** — thin wrapper.
4. **`api/server/routes/roles.js`** — tambah `PUT /:roleName` atomic.
5. **Frontend** hooks (`data-provider/Admin/`) + `AdminGuard` + lazy route.
6. **`UsersTable`** + dialogs (create/edit/delete/reset password).
7. **`RolePermissionsMatrix`** auto-generated dari Zod.
8. **i18n keys** + jest tests (backend & frontend).

## 9. Estimasi & Risiko

| Aspek | Nilai |
|---|---|
| Backend | ~600 LoC TypeScript |
| Frontend | ~1200 LoC TSX |
| Tests | ~400 LoC |
| Estimasi waktu | 3–5 hari kerja fokus |

### Risiko
- **Custom role tanpa seed permission** — user dengan role baru tidak bisa
  apa-apa karena `hasCapabilityForPrincipals` false. Mitigasi: `POST /api/admin/roles`
  WAJIB clone dari `USER` atau `ADMIN`.
- **Demote admin terakhir** — bisa lock-out semua admin. Mitigasi: validasi
  count di service layer.
- **Hapus user yang sedang login** — bisa nge-bug session. Mitigasi: cek
  `req.user.id !== :id`.
- **Backward compat endpoint role per-kategori** — tetap dipertahankan.

## 10. Out of Scope

- SSO/OAuth user provisioning
- Group/team management (sudah ada `peoplePicker` permission tapi UI groups
  belum ada di scope ini)
- Quota/billing per user
- Multi-tenant isolation
- Migrasi data role lama (assumsi: hanya `HC` di env ini, bisa di-handle manual)

---

**Status:** Rancangan — menunggu persetujuan tim sebelum implementasi.
