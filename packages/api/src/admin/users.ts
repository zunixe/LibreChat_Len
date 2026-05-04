import type { FilterQuery } from 'mongoose';
import type { IUser, CreateUserRequest, BalanceConfig } from '@librechat/data-schemas';
import { SystemRoles } from 'librechat-data-provider';
import type {
  AdminUser,
  AdminUserListParams,
  AdminUserListResponse,
  AdminUpdateUserPayload,
  AdminResetPasswordPayload,
} from 'librechat-data-provider';

export interface AdminUserDeps {
  listUsers: (params: {
    limit: number;
    cursor?: string | null;
    search?: string;
    role?: string;
  }) => Promise<{ users: Partial<IUser>[]; nextCursor: string | null }>;
  createUser: (
    data: CreateUserRequest,
    balanceConfig?: BalanceConfig,
    disableTTL?: boolean,
    returnUser?: boolean,
  ) => Promise<Partial<IUser>>;
  updateUser: (userId: string, updateData: Partial<IUser>) => Promise<IUser | null>;
  getUserById: (userId: string) => Promise<IUser | null>;
  deleteUserById: (userId: string) => Promise<{ deletedCount: number; message: string }>;
  countUsers: (filter?: FilterQuery<IUser>) => Promise<number>;
}

export interface HashPasswordDeps {
  hash: (password: string, saltRounds: number) => string;
}

function mapUserToAdminUser(user: Partial<IUser>): AdminUser {
  return {
    id: (user._id?.toString() ?? user.id ?? '') as string,
    name: user.name ?? '',
    email: user.email ?? '',
    role: user.role ?? SystemRoles.USER,
    provider: user.provider ?? 'local',
    emailVerified: user.emailVerified ?? false,
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : '',
    updatedAt: user.updatedAt ? new Date(user.updatedAt).toISOString() : '',
  };
}

export async function adminListUsers(
  params: AdminUserListParams,
  deps: AdminUserDeps,
): Promise<AdminUserListResponse> {
  const limit = Math.min(params.limit ?? 20, 100);
  const result = await deps.listUsers({
    limit,
    cursor: params.cursor ?? null,
    search: params.search,
    role: params.role,
  });

  return {
    users: result.users.map(mapUserToAdminUser),
    nextCursor: result.nextCursor,
  };
}

export async function adminCreateUser(
  payload: CreateUserRequest,
  deps: AdminUserDeps,
  hashDeps: HashPasswordDeps,
): Promise<AdminUser> {
  if (!payload.email) {
    throw new Error('Email is required');
  }

  const userData: CreateUserRequest = {
    ...payload,
    provider: payload.provider ?? 'local',
  };

  if (payload.password) {
    userData.password = hashDeps.hash(payload.password, 10);
  }

  const user = await deps.createUser(userData, undefined, true, true);
  return mapUserToAdminUser(user);
}

export async function adminUpdateUser(
  userId: string,
  payload: AdminUpdateUserPayload,
  deps: AdminUserDeps,
): Promise<AdminUser> {
  const existing = await deps.getUserById(userId);
  if (!existing) {
    throw new Error('User not found');
  }

  const updateData: Partial<IUser> = {};
  if (payload.name !== undefined) {
    updateData.name = payload.name;
  }
  if (payload.role !== undefined) {
    updateData.role = payload.role;
  }
  if (payload.emailVerified !== undefined) {
    updateData.emailVerified = payload.emailVerified;
  }

  const updated = await deps.updateUser(userId, updateData);
  if (!updated) {
    throw new Error('Failed to update user');
  }

  return mapUserToAdminUser(updated);
}

export async function adminDeleteUser(
  userId: string,
  deps: AdminUserDeps,
): Promise<{ ok: boolean }> {
  const existing = await deps.getUserById(userId);
  if (!existing) {
    throw new Error('User not found');
  }

  if (existing.role === SystemRoles.ADMIN) {
    const adminCount = await deps.countUsers({ role: SystemRoles.ADMIN });
    if (adminCount <= 1) {
      throw new Error('Cannot delete the last admin user');
    }
  }

  await deps.deleteUserById(userId);
  return { ok: true };
}

export async function adminResetPassword(
  userId: string,
  payload: AdminResetPasswordPayload,
  deps: AdminUserDeps,
  hashDeps: HashPasswordDeps,
): Promise<{ ok: boolean }> {
  const existing = await deps.getUserById(userId);
  if (!existing) {
    throw new Error('User not found');
  }

  if (!payload.password || payload.password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  await deps.updateUser(userId, { password: hashDeps.hash(payload.password, 10) });
  return { ok: true };
}
