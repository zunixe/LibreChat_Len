import type { IRole } from '@librechat/data-schemas';
import { SystemRoles, roleDefaults } from 'librechat-data-provider';
import type {
  AdminRole,
  AdminRolesResponse,
  AdminCreateRolePayload,
} from 'librechat-data-provider';

export interface AdminRoleDeps {
  listRoles: () => Promise<Pick<IRole, 'name' | 'permissions'>[]>;
  getRoleByName: (roleName: string) => Promise<IRole | null>;
  updateRoleByName: (roleName: string, updates: Partial<IRole>) => Promise<IRole | null>;
  createRole: (roleData: { name: string; permissions: Record<string, Record<string, boolean>> }) => Promise<IRole>;
  deleteRoleByName: (roleName: string) => Promise<{ deletedCount?: number }>;
  countUsers: (filter: { role: string }) => Promise<number>;
}

function mapRoleToAdminRole(role: Pick<IRole, 'name' | 'permissions'>): AdminRole {
  return {
    name: role.name,
    permissions: (role.permissions ?? {}) as Record<string, Record<string, boolean>>,
  };
}

export async function adminListRoles(deps: AdminRoleDeps): Promise<AdminRolesResponse> {
  const roles = await deps.listRoles();
  return roles.map(mapRoleToAdminRole);
}

export async function adminCreateRole(
  payload: AdminCreateRolePayload,
  deps: AdminRoleDeps,
): Promise<AdminRole> {
  const { name, basePermissionsFrom } = payload;
  const normalizedName = name.toUpperCase().trim();

  if (Object.values(SystemRoles).includes(normalizedName as SystemRoles)) {
    throw new Error('Cannot create a role with a system role name');
  }

  const existing = await deps.getRoleByName(normalizedName);
  if (existing) {
    throw new Error('Role already exists');
  }

  const basePerms = roleDefaults[basePermissionsFrom]?.permissions ?? {};
  const role = await deps.createRole({
    name: normalizedName,
    permissions: JSON.parse(JSON.stringify(basePerms)) as Record<string, Record<string, boolean>>,
  });

  return mapRoleToAdminRole(role);
}

export async function adminDeleteRole(
  roleName: string,
  deps: AdminRoleDeps,
): Promise<{ ok: boolean }> {
  const normalizedName = roleName.toUpperCase().trim();

  if (Object.values(SystemRoles).includes(normalizedName as SystemRoles)) {
    throw new Error('Cannot delete a system role');
  }

  const existing = await deps.getRoleByName(normalizedName);
  if (!existing) {
    throw new Error('Role not found');
  }

  const usersWithRole = await deps.countUsers({ role: normalizedName });
  if (usersWithRole > 0) {
    throw new Error('Cannot delete a role that is assigned to users');
  }

  await deps.deleteRoleByName(normalizedName);
  return { ok: true };
}

export async function adminUpdateRolePermissions(
  roleName: string,
  permissions: Record<string, Record<string, boolean>>,
  deps: AdminRoleDeps,
): Promise<AdminRole> {
  const normalizedName = roleName.toUpperCase().trim();
  const existing = await deps.getRoleByName(normalizedName);
  if (!existing) {
    throw new Error('Role not found');
  }

  const updated = await deps.updateRoleByName(normalizedName, {
    permissions: permissions as IRole['permissions'],
  });

  if (!updated) {
    throw new Error('Failed to update role');
  }

  return mapRoleToAdminRole(updated);
}
