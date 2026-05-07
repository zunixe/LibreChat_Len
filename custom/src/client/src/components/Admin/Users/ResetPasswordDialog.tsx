import { useState } from 'react';
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
import { useResetAdminUserPasswordMutation } from '~/data-provider';
import type { AdminUser } from 'librechat-data-provider';

export default function ResetPasswordDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser;
}) {
  const localize = useLocalize();
  const [password, setPassword] = useState('');
  const resetMutation = useResetAdminUserPasswordMutation();

  const handleSubmit = () => {
    resetMutation.mutate(
      { id: user.id, payload: { password } },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <OGDialog open={open} onOpenChange={onOpenChange}>
      <OGDialogContent className="sm:max-w-md">
        <OGDialogHeader>
          <OGDialogTitle>{localize('com_admin_reset_password')}</OGDialogTitle>
          <OGDialogDescription>
            {localize('com_admin_reset_password_desc', { name: user.name })}
          </OGDialogDescription>
        </OGDialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1">
            <Label>{localize('com_admin_new_password')}</Label>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {localize('com_ui_cancel')}
          </Button>
          <Button onClick={handleSubmit}>
            {localize('com_admin_reset_password')}
          </Button>
        </div>
      </OGDialogContent>
    </OGDialog>
  );
}
