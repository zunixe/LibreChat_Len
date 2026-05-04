import { useState, useEffect } from 'react';
import { Button, Switch } from '@librechat/client';
import { useLocalize } from '~/hooks';
import { PermissionTypes, permissionsSchema } from 'librechat-data-provider';
import { useUpdateRolePermissionsMutation } from '~/data-provider';

export default function RolePermissionsMatrix({
  roleName,
  initialPermissions,
}: {
  roleName: string;
  initialPermissions: Record<string, Record<string, boolean>>;
}) {
  const localize = useLocalize();
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const updateMutation = useUpdateRolePermissionsMutation();

  useEffect(() => {
    setPermissions(initialPermissions ?? {});
  }, [initialPermissions]);

  const permissionTypes = Object.keys(permissionsSchema.shape) as PermissionTypes[];

  const handleToggle = (type: string, action: string, value: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [action]: value,
      },
    }));
  };

  const handleSave = () => {
    updateMutation.mutate({ roleName, permissions });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">
          {localize('com_admin_permissions_for', { role: roleName })}
        </h2>
        <Button onClick={handleSave} disabled={updateMutation.isLoading}>
          {localize('com_ui_save')}
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        {permissionTypes.map((type) => {
          const shape = permissionsSchema.shape[type]?.shape;
          if (!shape) {
            return null;
          }
          const actions = Object.keys(shape);
          const typePerms = permissions[type] ?? {};

          return (
            <div key={type} className="rounded border border-border p-3">
              <h3 className="mb-2 text-sm font-semibold uppercase text-text-secondary">{type}</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {actions.map((action) => (
                  <label
                    key={action}
                    className="flex items-center gap-2 text-sm text-text-primary"
                  >
                    <Switch
                      aria-label={`${type} ${action}`}
                      checked={!!typePerms[action]}
                      onCheckedChange={(checked) => handleToggle(type, action, checked)}
                    />
                    {action}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
