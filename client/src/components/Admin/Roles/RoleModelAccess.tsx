import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button, Input } from '@librechat/client';
import { useLocalize } from '~/hooks';
import { useUpdateRoleModelAccessMutation, useGetEndpointsQuery } from '~/data-provider';

export default function RoleModelAccess({
  roleName,
  initialAllowedEndpoints,
  initialAllowedModels,
}: {
  roleName: string;
  initialAllowedEndpoints: string[];
  initialAllowedModels: string[];
}) {
  const localize = useLocalize();
  const [endpoints, setEndpoints] = useState<string[]>(initialAllowedEndpoints ?? []);
  const [models, setModels] = useState<string[]>(initialAllowedModels ?? []);
  const [newEndpoint, setNewEndpoint] = useState('');
  const [newModel, setNewModel] = useState('');
  const updateMutation = useUpdateRoleModelAccessMutation();
  const { data: endpointsConfig } = useGetEndpointsQuery();

  const availableEndpoints = endpointsConfig
    ? Object.keys(endpointsConfig).filter((k) => k !== 'custom')
    : [];

  useEffect(() => {
    setEndpoints(initialAllowedEndpoints ?? []);
    setModels(initialAllowedModels ?? []);
  }, [initialAllowedEndpoints, initialAllowedModels]);

  const addEndpoint = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !endpoints.includes(trimmed)) {
      setEndpoints((prev) => [...prev, trimmed]);
    }
  };

  const removeEndpoint = (value: string) => {
    setEndpoints((prev) => prev.filter((e) => e !== value));
  };

  const addModel = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !models.includes(trimmed)) {
      setModels((prev) => [...prev, trimmed]);
    }
  };

  const removeModel = (value: string) => {
    setModels((prev) => prev.filter((m) => m !== value));
  };

  const handleSave = () => {
    updateMutation.mutate({
      roleName,
      allowedEndpoints: endpoints,
      allowedModels: models,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">
          {localize('com_admin_model_access_for', { role: roleName })}
        </h2>
        <Button onClick={handleSave} disabled={updateMutation.isLoading}>
          {localize('com_ui_save')}
        </Button>
      </div>

      <div className="rounded border border-border p-3">
        <h3 className="mb-2 text-sm font-semibold uppercase text-text-secondary">
          Allowed Endpoints
        </h3>
        <div className="flex flex-wrap gap-2">
          {endpoints.map((ep) => (
            <span
              key={ep}
              className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
            >
              {ep}
              <button
                onClick={() => removeEndpoint(ep)}
                className="ml-1 rounded-full p-0.5 hover:bg-blue-200"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <Input
            type="text"
            placeholder="Add endpoint..."
            value={newEndpoint}
            onChange={(e) => setNewEndpoint(e.target.value)}
            className="max-w-xs"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newEndpoint.trim()) {
                addEndpoint(newEndpoint);
                setNewEndpoint('');
              }
            }}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (newEndpoint.trim()) {
                addEndpoint(newEndpoint);
                setNewEndpoint('');
              }
            }}
          >
            Add
          </Button>
          {availableEndpoints.length > 0 && (
            <div className="flex gap-1">
              {availableEndpoints
                .filter((ep) => !endpoints.includes(ep))
                .map((ep) => (
                  <Button
                    key={ep}
                    size="sm"
                    variant="ghost"
                    onClick={() => addEndpoint(ep)}
                    className="text-xs"
                  >
                    + {ep}
                  </Button>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded border border-border p-3">
        <h3 className="mb-2 text-sm font-semibold uppercase text-text-secondary">
          Allowed Models
        </h3>
        <div className="flex flex-wrap gap-2">
          {models.map((m) => (
            <span
              key={m}
              className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800"
            >
              {m}
              <button
                onClick={() => removeModel(m)}
                className="ml-1 rounded-full p-0.5 hover:bg-green-200"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <Input
            type="text"
            placeholder="Add model..."
            value={newModel}
            onChange={(e) => setNewModel(e.target.value)}
            className="max-w-xs"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newModel.trim()) {
                addModel(newModel);
                setNewModel('');
              }
            }}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (newModel.trim()) {
                addModel(newModel);
                setNewModel('');
              }
            }}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
