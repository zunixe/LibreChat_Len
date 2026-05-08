import { useState } from 'react';
import {
  useAdminRolesQuery,
  useDeleteAdminRoleMutation,
  useCreateAdminRoleMutation,
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
import RolePermissionsMatrix from './RolePermissionsMatrix';
import RoleModelAccess from './RoleModelAccess';

export default function RolesTable() {
  const localize = useLocalize();
  const { data: roles, isLoading } = useAdminRolesQuery();
  const [newRoleName, setNewRoleName] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const createMutation = useCreateAdminRoleMutation();
  const deleteMutation = useDeleteAdminRoleMutation();

  const selectedRoleData = roles?.find((r) => r.name === selectedRole);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">
          {localize('com_admin_roles_title')}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <Input
          type="text"
          placeholder={localize('com_admin_new_role_placeholder')}
          value={newRoleName}
          onChange={(e) => setNewRoleName(e.target.value)}
          className="max-w-xs"
        />
        <Button
          onClick={() => {
            if (newRoleName.trim()) {
              createMutation.mutate(
                { name: newRoleName.trim(), basePermissionsFrom: 'USER' },
                { onSuccess: () => setNewRoleName('') },
              );
            }
          }}
          disabled={createMutation.isLoading || !newRoleName.trim()}
        >
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
              <TableHead>Endpoints</TableHead>
              <TableHead>Models</TableHead>
              <TableHead>{localize('com_admin_actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.name}>
                <TableCell>{role.name}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(role.allowedEndpoints ?? []).map((ep) => (
                      <span key={ep} className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-800">{ep}</span>
                    ))}
                    {!role.allowedEndpoints?.length && <span className="text-xs text-gray-400">—</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(role.allowedModels ?? []).map((m) => (
                      <span key={m} className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-800">{m}</span>
                    ))}
                    {!role.allowedModels?.length && <span className="text-xs text-gray-400">—</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setSelectedRole(selectedRole === role.name ? null : role.name)
                      }
                    >
                      {selectedRole === role.name
                        ? localize('com_admin_hide')
                        : localize('com_ui_edit')}
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

      {selectedRoleData && (
        <div className="mt-4 rounded border border-gray-200 bg-white p-4 shadow-sm">
          <RolePermissionsMatrix
            roleName={selectedRoleData.name}
            initialPermissions={selectedRoleData.permissions}
          />
          <div className="mt-6">
            <RoleModelAccess
              roleName={selectedRoleData.name}
              initialAllowedEndpoints={selectedRoleData.allowedEndpoints ?? []}
              initialAllowedModels={selectedRoleData.allowedModels ?? []}
            />
          </div>
        </div>
      )}
    </div>
  );
}
