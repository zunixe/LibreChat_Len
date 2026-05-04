import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { dataService, QueryKeys } from 'librechat-data-provider';
import type {
  QueryObserverResult,
  UseQueryOptions,
  UseInfiniteQueryOptions,
} from '@tanstack/react-query';
import type * as t from 'librechat-data-provider';

export const defaultAdminUserParams: t.AdminUserListParams = {
  limit: 20,
};

export const useAdminUsersQuery = (
  params: t.AdminUserListParams = defaultAdminUserParams,
  config?: UseQueryOptions<t.AdminUserListResponse>,
): QueryObserverResult<t.AdminUserListResponse> => {
  return useQuery<t.AdminUserListResponse>(
    [QueryKeys.adminUsers, params],
    () => dataService.listAdminUsers(params),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      retry: false,
      ...config,
    },
  );
};

export const useAdminUsersInfiniteQuery = (
  params: t.AdminUserListParams = defaultAdminUserParams,
  config?: UseInfiniteQueryOptions<t.AdminUserListResponse>,
) => {
  return useInfiniteQuery<t.AdminUserListResponse>({
    queryKey: [QueryKeys.adminUsers, params],
    queryFn: ({ pageParam }) => {
      return dataService.listAdminUsers({
        ...params,
        cursor: pageParam as string | undefined,
      });
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: false,
    ...config,
  });
};

export const useAdminRolesQuery = (
  config?: UseQueryOptions<t.AdminRolesResponse>,
): QueryObserverResult<t.AdminRolesResponse> => {
  return useQuery<t.AdminRolesResponse>(
    [QueryKeys.adminRoles],
    () => dataService.listAdminRoles(),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      retry: false,
      ...config,
    },
  );
};
