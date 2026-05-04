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
  useCreateAdminUserMutation,
  useUpdateAdminUserMutation,
} from '~/data-provider';
import type { AdminUser } from 'librechat-data-provider';

export default function UserFormDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: AdminUser;
}) {
  const localize = useLocalize();
  const isEdit = !!user;
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(user?.role ?? 'USER');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
    } else {
      setName('');
      setEmail('');
      setPassword('');
      setRole('USER');
    }
  }, [user]);

  const createMutation = useCreateAdminUserMutation();
  const updateMutation = useUpdateAdminUserMutation();

  const handleSubmit = () => {
    if (isEdit && user) {
      updateMutation.mutate(
        { id: user.id, payload: { name, role } },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createMutation.mutate(
        { email, name, password, role },
        { onSuccess: () => onOpenChange(false) },
      );
    }
  };

  return (
    <OGDialog open={open} onOpenChange={onOpenChange}>
      <OGDialogContent className="sm:max-w-md">
        <OGDialogHeader>
          <OGDialogTitle>
            {isEdit ? localize('com_admin_edit_user') : localize('com_admin_create_user')}
          </OGDialogTitle>
          <OGDialogDescription>
            {isEdit
              ? localize('com_admin_edit_user_desc')
              : localize('com_admin_create_user_desc')}
          </OGDialogDescription>
        </OGDialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1">
            <Label>{localize('com_admin_name')}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          {!isEdit && (
            <div className="flex flex-col gap-1">
              <Label>{localize('com_admin_email')}</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            </div>
          )}
          {!isEdit && (
            <div className="flex flex-col gap-1">
              <Label>{localize('com_admin_password')}</Label>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
              />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <Label>{localize('com_admin_role')}</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {localize('com_ui_cancel')}
          </Button>
          <Button onClick={handleSubmit}>
            {isEdit ? localize('com_ui_save') : localize('com_admin_create_user')}
          </Button>
        </div>
      </OGDialogContent>
    </OGDialog>
  );
}
