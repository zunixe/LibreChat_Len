import { useState, useCallback } from 'react';
import {
  useAdminUsersQuery,
  useDeleteAdminUserMutation,
} from '~/data-provider';
import { useLocalize } from '~/hooks';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Input,
} from '@librechat/client';
import UserFormDialog from './UserFormDialog';
import DeleteUserDialog from './DeleteUserDialog';
import ResetPasswordDialog from './ResetPasswordDialog';
import type { AdminUser } from 'librechat-data-provider';

export default function UsersTable() {
  const localize = useLocalize();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);
  const [resetUser, setResetUser] = useState<AdminUser | null>(null);

  const { data, isLoading } = useAdminUsersQuery({
    limit: 50,
    search: search || undefined,
  });

  const deleteMutation = useDeleteAdminUserMutation();

  const handleDelete = useCallback(
    (id: string) => {
      deleteMutation.mutate(id, {
        onSuccess: () => setDeleteUser(null),
      });
    },
    [deleteMutation],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">
          {localize('com_admin_users_title')}
        </h1>
        <Button onClick={() => setCreateOpen(true)}>
          {localize('com_admin_create_user')}
        </Button>
      </div>

      <Input
        type="text"
        placeholder={localize('com_admin_search_users')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {isLoading && (
        <div className="text-sm text-gray-500">{localize('com_ui_loading')}</div>
      )}

      {data && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{localize('com_admin_name')}</TableHead>
              <TableHead>{localize('com_admin_email')}</TableHead>
              <TableHead>{localize('com_admin_role')}</TableHead>
              <TableHead>{localize('com_admin_provider')}</TableHead>
              <TableHead>{localize('com_admin_verified')}</TableHead>
              <TableHead>Endpoints</TableHead>
              <TableHead>Models</TableHead>
              <TableHead>{localize('com_admin_actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.provider}</TableCell>
                <TableCell>{user.emailVerified ? localize('com_ui_yes') : localize('com_ui_no')}</TableCell>
                <TableCell>{user.modelAccess?.allowedEndpoints?.join(', ') ?? '—'}</TableCell>
                <TableCell>{user.modelAccess?.allowedModels?.join(', ') ?? '—'}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      style={{ color: '#111827 !important' }}
                      onClick={() => setEditUser(user)}
                    >
                      {localize('com_ui_edit')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      style={{ color: '#111827 !important' }}
                      onClick={() => setResetUser(user)}
                    >
                      {localize('com_admin_reset_password')}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteUser(user)}
                    >
                      {localize('com_ui_delete')}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <UserFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      {editUser && (
        <UserFormDialog
          open={!!editUser}
          onOpenChange={(open) => !open && setEditUser(null)}
          user={editUser}
        />
      )}

      {deleteUser && (
        <DeleteUserDialog
          open={!!deleteUser}
          onOpenChange={(open) => !open && setDeleteUser(null)}
          user={deleteUser}
          onConfirm={() => handleDelete(deleteUser.id)}
        />
      )}

      {resetUser && (
        <ResetPasswordDialog
          open={!!resetUser}
          onOpenChange={(open) => !open && setResetUser(null)}
          user={resetUser}
        />
      )}
    </div>
  );
}
