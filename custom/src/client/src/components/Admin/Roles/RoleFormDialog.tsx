import { useState, useEffect } from 'react';
import {
  OGDialog,
  OGDialogContent,
  OGDialogHeader,
  OGDialogTitle,
  OGDialogDescription,
  Button,
  Input,
  Label,
} from '@librechat/client';
import { useLocalize } from '~/hooks';
import {
  useCreateAdminRoleMutation,
  useRenameRoleMutation,
} from '~/data-provider';
import type { AdminRole } from 'librechat-data-provider';

export default function RoleFormDialog({
  open,
  onOpenChange,
  role,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: AdminRole;
}) {
  const localize = useLocalize();
  const isEdit = !!role;
  const isSystemRole = role ? ['ADMIN', 'USER'].includes(role.name) : false;

  const [roleName, setRoleName] = useState(role?.name ?? '');

  useEffect(() => {
    if (role) {
      setRoleName(role.name);
    } else {
      setRoleName('');
    }
  }, [role]);

  const createMutation = useCreateAdminRoleMutation();
  const renameMutation = useRenameRoleMutation();

  const handleSubmit = () => {
    if (isEdit && role) {
      if (!isSystemRole && roleName.trim().toUpperCase() !== role.name) {
        renameMutation.mutate(
          { roleName: role.name, newName: roleName.trim() },
          { onSuccess: () => onOpenChange(false) },
        );
      } else {
        onOpenChange(false);
      }
    } else {
      createMutation.mutate(
        { name: roleName.trim(), basePermissionsFrom: 'USER' },
        { onSuccess: () => onOpenChange(false) },
      );
    }
  };

  const isSaving = createMutation.isLoading || renameMutation.isLoading;

  return (
    <OGDialog open={open} onOpenChange={onOpenChange}>
      <OGDialogContent className="sm:max-w-md">
        <OGDialogHeader>
          <OGDialogTitle>
            {isEdit ? 'Edit Role' : 'Create Role'}
          </OGDialogTitle>
          <OGDialogDescription>
            {isEdit ? 'Rename the role' : 'Create a new role'}
          </OGDialogDescription>
        </OGDialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1">
            <Label>Role Name</Label>
            <Input
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              disabled={isSystemRole}
              placeholder="e.g. HC, FINANCE"
            />
            {isSystemRole && (
              <span className="text-xs text-text-secondary">System roles cannot be renamed</span>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {localize('com_ui_cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || !roleName.trim()}>
            {isEdit ? localize('com_ui_save') : localize('com_admin_create_role')}
          </Button>
        </div>
      </OGDialogContent>
    </OGDialog>
  );
}
