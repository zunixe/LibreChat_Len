import {
  OGDialog,
  OGDialogContent,
  OGDialogHeader,
  OGDialogTitle,
  OGDialogDescription,
  Button,
} from '@librechat/client';
import { useLocalize } from '~/hooks';
import type { AdminUser } from 'librechat-data-provider';

export default function DeleteUserDialog({
  open,
  onOpenChange,
  user,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser;
  onConfirm: () => void;
}) {
  const localize = useLocalize();

  return (
    <OGDialog open={open} onOpenChange={onOpenChange}>
      <OGDialogContent className="sm:max-w-md">
        <OGDialogHeader>
          <OGDialogTitle>{localize('com_admin_delete_user')}</OGDialogTitle>
          <OGDialogDescription>
            {localize('com_admin_delete_user_confirm', { name: user.name })}
          </OGDialogDescription>
        </OGDialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {localize('com_ui_cancel')}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {localize('com_ui_delete')}
          </Button>
        </div>
      </OGDialogContent>
    </OGDialog>
  );
}
