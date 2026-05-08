import { useState } from 'react';
import {
  useAdminRolesQuery,
  useDeleteAdminRoleMutation,
  useCreateAdminRoleMutation,
  useRenameRoleMutation,
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
import RoleModelAccess from './RoleModelAccess';

export default function RolesTable() {
  const localize = useLocalize();
  const { data: roles, isLoading } = useAdminRolesQuery();
  const [newRoleName, setNewRoleName] = useState('');
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const createMutation = useCreateAdminRoleMutation();
  const deleteMutation = useDeleteAdminRoleMutation();
  const renameMutation = useRenameRoleMutation();

  const selectedRoleData = roles?.find((r) => r.name === selectedRole);

  const startEditName = (name: string) => {
    setEditingRole(name);
    setEditName(name);
  };

  const saveName = () => {
    if (editingRole && editName.trim() && editName.trim().toUpperCase() !== editingRole) {
      renameMutation.mutate(
        { roleName: editingRole, newName: editName.trim() },
        { onSuccess: () => setEditingRole(null) },
      );
    } else {
      setEditingRole(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex border-b border-border">
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            !selectedRole
              ? 'border-b-2 border-blue-500 text-text-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
          onClick={() => setSelectedRole(null)}
        >
          Role Management
        </button>
        {selectedRole && (
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              selectedRole
                ? 'border-b-2 border-blue-500 text-text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Model Access for {selectedRole}
          </button>
        )}
      </div>

      {!selectedRole ? (
        <>
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
                  <TableHead>{localize('com_admin_actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.name}>
                    <TableCell>
                      {editingRole === role.name ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="max-w-xs"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                saveName();
                              }
                            }}
                          />
                          <Button size="sm" onClick={saveName}>
                            {localize('com_ui_save')}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingRole(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        role.name
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {editingRole !== role.name && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditName(role.name)}
                          >
                            Rename
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRole(role.name)}
                        >
                          Model Access
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
        </>
      ) : (
        selectedRoleData && (
          <RoleModelAccess
            roleName={selectedRoleData.name}
            initialEndpointAccess={selectedRoleData.endpointAccess ?? []}
          />
        )
      )}
    </div>
  );
}
