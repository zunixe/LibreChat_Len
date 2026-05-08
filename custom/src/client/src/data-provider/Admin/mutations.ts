import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dataService, MutationKeys, QueryKeys } from 'librechat-data-provider';
import type {
  UseMutationResult,
  UseMutationOptions,
  UseQueryResult,
  UseQueryOptions,
} from '@tanstack/react-query';
import type * as t from 'librechat-data-provider';

type EndpointDefinition = t.EndpointDefinition;

export const useCreateAdminUserMutation = (
  options?: UseMutationOptions<t.AdminUser, Error, t.AdminCreateUserPayload>,
): UseMutationResult<t.AdminUser, Error, t.AdminCreateUserPayload> => {
  const queryClient = useQueryClient();
  return useMutation(
    (payload: t.AdminCreateUserPayload) => dataService.createAdminUser(payload),
    {
      mutationKey: [MutationKeys.createAdminUser],
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries([QueryKeys.adminUsers]);
        options?.onSuccess?.(data, variables, context);
      },
    },
  );
};

export const useUpdateAdminUserMutation = (
  options?: UseMutationOptions<
    t.AdminUser,
    Error,
    { id: string; payload: t.AdminUpdateUserPayload }
  >,
): UseMutationResult<t.AdminUser, Error, { id: string; payload: t.AdminUpdateUserPayload }> => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, payload }: { id: string; payload: t.AdminUpdateUserPayload }) =>
      dataService.updateAdminUser(id, payload),
    {
      mutationKey: [MutationKeys.updateAdminUser],
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries([QueryKeys.adminUsers]);
        queryClient.invalidateQueries([QueryKeys.adminUser, variables.id]);
        options?.onSuccess?.(data, variables, context);
      },
    },
  );
};

export const useDeleteAdminUserMutation = (
  options?: UseMutationOptions<{ ok: boolean }, Error, string>,
): UseMutationResult<{ ok: boolean }, Error, string> => {
  const queryClient = useQueryClient();
  return useMutation((id: string) => dataService.deleteAdminUser(id), {
    mutationKey: [MutationKeys.deleteAdminUser],
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries([QueryKeys.adminUsers]);
      options?.onSuccess?.(data, variables, context);
    },
  });
};

export const useResetAdminUserPasswordMutation = (
  options?: UseMutationOptions<
    { ok: boolean },
    Error,
    { id: string; payload: t.AdminResetPasswordPayload }
  >,
): UseMutationResult<
  { ok: boolean },
  Error,
  { id: string; payload: t.AdminResetPasswordPayload }
> => {
  return useMutation(
    ({ id, payload }: { id: string; payload: t.AdminResetPasswordPayload }) =>
      dataService.resetAdminUserPassword(id, payload),
    {
      mutationKey: [MutationKeys.resetAdminUserPassword],
      ...options,
    },
  );
};

export const useCreateAdminRoleMutation = (
  options?: UseMutationOptions<t.AdminRole, Error, t.AdminCreateRolePayload>,
): UseMutationResult<t.AdminRole, Error, t.AdminCreateRolePayload> => {
  const queryClient = useQueryClient();
  return useMutation(
    (payload: t.AdminCreateRolePayload) => dataService.createAdminRole(payload),
    {
      mutationKey: [MutationKeys.createAdminRole],
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries([QueryKeys.adminRoles]);
        options?.onSuccess?.(data, variables, context);
      },
    },
  );
};

export const useDeleteAdminRoleMutation = (
  options?: UseMutationOptions<{ ok: boolean }, Error, string>,
): UseMutationResult<{ ok: boolean }, Error, string> => {
  const queryClient = useQueryClient();
  return useMutation((name: string) => dataService.deleteAdminRole(name), {
    mutationKey: [MutationKeys.deleteAdminRole],
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries([QueryKeys.adminRoles]);
      options?.onSuccess?.(data, variables, context);
    },
  });
};

export const useUpdateRolePermissionsMutation = (
  options?: UseMutationOptions<
    t.AdminRole,
    Error,
    { roleName: string; permissions: Record<string, Record<string, boolean>> }
  >,
): UseMutationResult<
  t.AdminRole,
  Error,
  { roleName: string; permissions: Record<string, Record<string, boolean>> }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ roleName, permissions }: { roleName: string; permissions: Record<string, Record<string, boolean>> }) =>
      dataService.updateRolePermissions(roleName, permissions),
    {
      mutationKey: [MutationKeys.updateRolePermissions],
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries([QueryKeys.adminRoles]);
        queryClient.invalidateQueries([QueryKeys.roles, variables.roleName]);
        options?.onSuccess?.(data, variables, context);
      },
    },
  );
};

export const useUpdateRoleModelAccessMutation = (
  options?: UseMutationOptions<
    t.AdminRole,
    Error,
    { roleName: string; endpointAccess: t.EndpointAccess[] }
  >,
): UseMutationResult<
  t.AdminRole,
  Error,
  { roleName: string; endpointAccess: t.EndpointAccess[] }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ roleName, endpointAccess }) =>
      dataService.updateRoleModelAccess(roleName, { endpointAccess }),
    {
      mutationKey: [MutationKeys.updateRoleModelAccess],
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries([QueryKeys.adminRoles]);
        options?.onSuccess?.(data, variables, context);
      },
    },
  );
};

export const useRenameRoleMutation = (
  options?: UseMutationOptions<
    { name: string },
    Error,
    { roleName: string; newName: string }
  >,
): UseMutationResult<
  { name: string },
  Error,
  { roleName: string; newName: string }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ roleName, newName }) =>
      dataService.renameRole(roleName, { newName }),
    {
      mutationKey: [MutationKeys.renameRole],
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries([QueryKeys.adminRoles]);
        options?.onSuccess?.(data, variables, context);
      },
    },
  );
};

export const useEndpointDefinitionsQuery = (
  config?: UseQueryOptions<EndpointDefinition[], Error>,
): UseQueryResult<EndpointDefinition[], Error> => {
  return useQuery(
    [QueryKeys.endpointDefinitions],
    () => dataService.getEndpointDefinitions(),
    {
      staleTime: 1000 * 60 * 5,
      ...config,
    },
  );
};

export const useUpdateEndpointDefinitionsMutation = (
  options?: UseMutationOptions<
    EndpointDefinition[],
    Error,
    EndpointDefinition[]
  >,
): UseMutationResult<
  EndpointDefinition[],
  Error,
  EndpointDefinition[]
> => {
  const queryClient = useQueryClient();
  return useMutation(
    (definitions) => dataService.updateEndpointDefinitions(definitions),
    {
      mutationKey: [MutationKeys.updateEndpointDefinitions],
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries([QueryKeys.endpointDefinitions]);
        options?.onSuccess?.(data, variables, context);
      },
    },
  );
};
