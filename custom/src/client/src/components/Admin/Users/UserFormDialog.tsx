import { useState, useEffect, useMemo } from 'react';
import {
  OGDialog,
  OGDialogContent,
  OGDialogHeader,
  OGDialogTitle,
  OGDialogDescription,
  Button,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Checkbox,
} from '@librechat/client';
import { useLocalize } from '~/hooks';
import {
  useCreateAdminUserMutation,
  useUpdateAdminUserMutation,
  useAdminUsersQuery,
} from '~/data-provider';
import type { AdminUser } from 'librechat-data-provider';

const endpointModelMap: Record<string, string[]> = {
  'LEN-AI': ['financial', 'risk'],
  'LEN-AI General': ['LenO Bot'],
};

const endpointOptions = ['LEN-AI', 'LEN-AI General'];

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
  const [allowedEndpoints, setAllowedEndpoints] = useState<string[]>(
    user?.modelAccess?.allowedEndpoints ?? [],
  );
  const [allowedModels, setAllowedModels] = useState<string[]>(
    user?.modelAccess?.allowedModels ?? [],
  );

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      setAllowedEndpoints(user.modelAccess?.allowedEndpoints ?? []);
      setAllowedModels(user.modelAccess?.allowedModels ?? []);
    } else {
      setName('');
      setEmail('');
      setPassword('');
      setRole('USER');
      setAllowedEndpoints([]);
      setAllowedModels([]);
    }
  }, [user]);

  const { data: usersData } = useAdminUsersQuery({ limit: 100 });
  const createMutation = useCreateAdminUserMutation();
  const updateMutation = useUpdateAdminUserMutation();

  const roleOptions = useMemo(() => {
    const roles = usersData?.distinctRoles ?? [];
    return [...new Set([...roles, 'ADMIN', 'USER'])].sort();
  }, [usersData?.distinctRoles]);

  const modelOptions = useMemo(() => {
    if (allowedEndpoints.length === 0) {
      return [];
    }
    const models = new Set<string>();
    for (const ep of allowedEndpoints) {
      const epModels = endpointModelMap[ep];
      if (epModels) {
        for (const m of epModels) {
          models.add(m);
        }
      }
    }
    return Array.from(models);
  }, [allowedEndpoints]);

  const toggleEndpoint = (ep: string) => {
    setAllowedEndpoints((prev) => {
      const next = prev.includes(ep) ? prev.filter((e) => e !== ep) : [...prev, ep];
      const availableModels = new Set<string>();
      for (const e of next) {
        const epModels = endpointModelMap[e];
        if (epModels) {
          for (const m of epModels) {
            availableModels.add(m);
          }
        }
      }
      setAllowedModels((current) => current.filter((m) => availableModels.has(m)));
      return next;
    });
  };

  const toggleModel = (model: string) => {
    setAllowedModels((prev) =>
      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model],
    );
  };

  const handleSubmit = () => {
    if (isEdit && user) {
      updateMutation.mutate(
        {
          id: user.id,
          payload: {
            name,
            role,
            allowedEndpoints: allowedEndpoints.length > 0 ? allowedEndpoints : null,
            allowedModels: allowedModels.length > 0 ? allowedModels : null,
          },
        },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createMutation.mutate(
        {
          email,
          name,
          password,
          role,
          allowedEndpoints: allowedEndpoints.length > 0 ? allowedEndpoints : null,
          allowedModels: allowedModels.length > 0 ? allowedModels : null,
        },
        { onSuccess: () => onOpenChange(false) },
      );
    }
  };

  return (
    <OGDialog open={open} onOpenChange={onOpenChange}>
      <OGDialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
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
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[200] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                {roleOptions.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label>Allowed Endpoints</Label>
            <div className="border rounded-md p-2 max-h-40 overflow-y-auto bg-white dark:bg-gray-800">
              {endpointOptions.map((ep) => (
                <label
                  key={ep}
                  className="flex items-center gap-2 py-1 px-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                >
                  <Checkbox
                    checked={allowedEndpoints.includes(ep)}
                    onCheckedChange={() => toggleEndpoint(ep)}
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">{ep}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Label>Allowed Models</Label>
            <div className="border rounded-md p-2 max-h-40 overflow-y-auto bg-white dark:bg-gray-800">
              {modelOptions.length === 0 && (
                <span className="text-sm text-gray-500">Select an endpoint first</span>
              )}
              {modelOptions.map((model) => (
                <label
                  key={model}
                  className="flex items-center gap-2 py-1 px-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                >
                  <Checkbox
                    checked={allowedModels.includes(model)}
                    onCheckedChange={() => toggleModel(model)}
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">{model}</span>
                </label>
              ))}
            </div>
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
