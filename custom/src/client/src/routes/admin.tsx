import { lazy, Suspense } from 'react';

const AdminLayout = lazy(() => import('~/components/Admin/AdminLayout'));
const UsersTable = lazy(() => import('~/components/Admin/Users/UsersTable'));
const RolesTable = lazy(() => import('~/components/Admin/Roles/RolesTable'));

const LazyAdminLayout = () => (
  <Suspense fallback={<div />}> {/* empty fallback to avoid layout shift */}
    <AdminLayout />
  </Suspense>
);

const LazyUsersTable = () => (
  <Suspense fallback={<div />}>
    <UsersTable />
  </Suspense>
);

const LazyRolesTable = () => (
  <Suspense fallback={<div />}>
    <RolesTable />
  </Suspense>
);

const adminRoutes = {
  path: 'admin/*',
  element: <LazyAdminLayout />,
  children: [
    {
      path: 'users',
      element: <LazyUsersTable />,
    },
    {
      path: 'roles',
      element: <LazyRolesTable />,
    },
    {
      index: true,
      element: <LazyUsersTable />,
    },
  ],
};

export default adminRoutes;
