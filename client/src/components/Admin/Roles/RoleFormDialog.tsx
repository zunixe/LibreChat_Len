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
  Checkbox,
  Switch,
} from '@librechat/client';
import { useLocalize } from '~/hooks';
import {
  useCreateAdminRoleMutation,
  useUpdateRoleModelAccessMutation,
  useRenameRoleMutation,
} from '~/data-provider';
import type { AdminRole, EndpointAccess } from 'librechat-data-provider';

const endpointModelMap: Record<string, string[]> = {
  'LEN-AI': ['financial', 'risk'],
  'LEN-AI General': ['LenO Bot'],
};

const endpointOptions = ['LEN-AI', 'LEN-AI General'];

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
  const [selectedEndpoints, setSelectedEndpoints] = useState<string[]>([]);
  const [showMCPMap, setShowMCPMap] = useState<Record<string, boolean>>({});
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  useEffect(() => {
    if (role) {
      setRoleName(role.name);
      const ea = role.endpointAccess ?? [];
      const eps = ea.map((e) => e.endpoint);
      const mcpMap: Record<string, boolean> = {};
      const models: string[] = [];
      for (const entry of ea) {
        mcpMap[entry.endpoint] = entry.showMCP;
        for (const m of entry.models) {
          if (!models.includes(m)) {
            models.push(m);
          }
        }
      }
      setSelectedEndpoints(eps);
      setShowMCPMap(mcpMap);
      setSelectedModels(models);
    } else {
      setRoleName('');
      setSelectedEndpoints([]);
      setShowMCPMap({});
      setSelectedModels([]);
    }
  }, [role]);

  const createMutation = useCreateAdminRoleMutation();
  const modelAccessMutation = useUpdateRoleModelAccessMutation();
  const renameMutation = useRenameRoleMutation();

  const modelOptions = useMemo(() => {
    if (selectedEndpoints.length === 0) {
      return [];
    }
    const models = new Set<string>();
    for (const ep of selectedEndpoints) {
      const epModels = endpointModelMap[ep];
      if (epModels) {
        for (const m of epModels) {
          models.add(m);
        }
      }
    }
    return Array.from(models);
  }, [selectedEndpoints]);

  const toggleEndpoint = (ep: string) => {
    setSelectedEndpoints((prev) => {
      const next = prev.includes(ep) ? prev.filter((e) => e !== ep) : [...prev, ep];
      if (!next.includes(ep)) {
        setShowMCPMap((m) => {
          const copy = { ...m };
          delete copy[ep];
          return copy;
        });
      } else {
        setShowMCPMap((m) => ({ ...m, [ep]: m[ep] ?? false }));
      }
      const availableModels = new Set<string>();
      for (const e of next) {
        const epModels = endpointModelMap[e];
        if (epModels) {
          for (const m of epModels) {
            availableModels.add(m);
          }
        }
      }
      setSelectedModels((current) => current.filter((m) => availableModels.has(m)));
      return next;
    });
  };

  const toggleShowMCP = (ep: string) => {
    setShowMCPMap((prev) => ({ ...prev, [ep]: !prev[ep] }));
  };

  const toggleModel = (model: string) => {
    setSelectedModels((prev) =>
      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model],
    );
  };

  const buildEndpointAccess = (): EndpointAccess[] => {
    return selectedEndpoints.map((ep) => ({
      endpoint: ep,
      models: selectedModels.filter((m) => {
        const epModels = endpointModelMap[ep];
        return epModels ? epModels.includes(m) : false;
      }),
      showMCP: showMCPMap[ep] ?? false,
    }));
  };

  const handleSubmit = () => {
    if (isEdit && role) {
      const endpointAccess = buildEndpointAccess();
      const promises: Promise<unknown>[] = [];

      if (!isSystemRole && roleName.trim().toUpperCase() !== role.name) {
        promises.push(
          renameMutation.mutateAsync({ roleName: role.name, newName: roleName.trim() }),
        );
      }

      modelAccessMutation.mutate(
        { roleName: role.name, endpointAccess },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        },
      );
    } else {
      createMutation.mutate(
        { name: roleName.trim(), basePermissionsFrom: 'USER' },
        {
          onSuccess: (newRole) => {
            const endpointAccess = buildEndpointAccess();
            if (endpointAccess.length > 0) {
              modelAccessMutation.mutate(
                { roleName: newRole.name, endpointAccess },
                { onSuccess: () => onOpenChange(false) },
              );
            } else {
              onOpenChange(false);
            }
          },
        },
      );
    }
  };

  const isSaving =
    createMutation.isLoading || modelAccessMutation.isLoading || renameMutation.isLoading;

  return (
    <OGDialog open={open} onOpenChange={onOpenChange}>
      <OGDialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <OGDialogHeader>
          <OGDialogTitle>
            {isEdit ? 'Edit Role' : 'Create Role'}
          </OGDialogTitle>
          <OGDialogDescription>
            {isEdit ? 'Edit role name and model access' : 'Create a new role with model access'}
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

          <div className="flex flex-col gap-1">
            <Label>Allowed Endpoints</Label>
            <div className="border rounded-md p-2 bg-white dark:bg-gray-800">
              {endpointOptions.map((ep) => (
                <div key={ep} className="flex items-center justify-between py-1 px-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={selectedEndpoints.includes(ep)}
                      onCheckedChange={() => toggleEndpoint(ep)}
                    />
                    <span className="text-sm text-gray-900 dark:text-gray-100">{ep}</span>
                  </label>
                  {selectedEndpoints.includes(ep) && (
                    <label className="flex items-center gap-2 text-xs text-text-secondary">
                      <Switch
                        aria-label={`Show MCP for ${ep}`}
                        checked={showMCPMap[ep] ?? false}
                        onCheckedChange={() => toggleShowMCP(ep)}
                      />
                      MCP
                    </label>
                  )}
                </div>
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
                    checked={selectedModels.includes(model)}
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
          <Button onClick={handleSubmit} disabled={isSaving || !roleName.trim()}>
            {isEdit ? localize('com_ui_save') : localize('com_admin_create_role')}
          </Button>
        </div>
      </OGDialogContent>
    </OGDialog>
  );
}
