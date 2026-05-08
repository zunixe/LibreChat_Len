import { useState } from 'react';
import {
  useAdminRolesQuery,
  useDeleteAdminRoleMutation,
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
} from '@librechat/client';
import RoleFormDialog from './RoleFormDialog';
import type { AdminRole } from 'librechat-data-provider';

export default function RolesTable() {
  const localize = useLocalize();
  const { data: roles, isLoading } = useAdminRolesQuery();
  const [createOpen, setCreateOpen] = useState(false);
  const [editRole, setEditRole] = useState<AdminRole | null>(null);

  const deleteMutation = useDeleteAdminRoleMutation();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">
          {localize('com_admin_roles_title')}
        </h1>
        <Button onClick={() => setCreateOpen(true)}>
          {localize('com_admin_create_role')}
        </Button>
      </div>

      {isLoading && (
        <div className="text-sm text-gray-500">{localize('com_ui_loading')}</div>
      )}

      {roles && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{localize('com_admin_role_name')}</TableHead>
              <TableHead>{localize('com_admin_actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.name}>
                <TableCell>{role.name}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      style={{ color: '#111827 !important' }}
                      onClick={() => setEditRole(role)}
                    >
                      {localize('com_ui_edit')}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteMutation.mutate(role.name)}
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

      <RoleFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      {editRole && (
        <RoleFormDialog
          open={!!editRole}
          onOpenChange={(open) => !open && setEditRole(null)}
          role={editRole}
        />
      )}
    </div>
  );
}
