import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { Button, Input, Switch } from '@librechat/client';
import { useLocalize } from '~/hooks';
import type { EndpointAccess } from 'librechat-data-provider';
import { useUpdateRoleModelAccessMutation, useGetEndpointsQuery } from '~/data-provider';

export default function RoleModelAccess({
  roleName,
  initialEndpointAccess,
}: {
  roleName: string;
  initialEndpointAccess: EndpointAccess[];
}) {
  const localize = useLocalize();
  const [endpointAccess, setEndpointAccess] = useState<EndpointAccess[]>(initialEndpointAccess ?? []);
  const [newEndpointName, setNewEndpointName] = useState('');
  const [newModelInputs, setNewModelInputs] = useState<Record<string, string>>({});
  const updateMutation = useUpdateRoleModelAccessMutation();
  const { data: endpointsConfig } = useGetEndpointsQuery();

  const availableEndpoints = endpointsConfig
    ? Object.keys(endpointsConfig).filter((k) => k !== 'custom')
    : [];

  useEffect(() => {
    setEndpointAccess(initialEndpointAccess ?? []);
  }, [initialEndpointAccess]);

  const addEndpoint = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !endpointAccess.find((e) => e.endpoint === trimmed)) {
      setEndpointAccess((prev) => [...prev, { endpoint: trimmed, models: [], showMCP: false }]);
    }
  };

  const removeEndpoint = (name: string) => {
    setEndpointAccess((prev) => prev.filter((e) => e.endpoint !== name));
  };

  const addModel = (endpointName: string, model: string) => {
    const trimmed = model.trim();
    if (!trimmed) {
      return;
    }
    setEndpointAccess((prev) =>
      prev.map((e) =>
        e.endpoint === endpointName && !e.models.includes(trimmed)
          ? { ...e, models: [...e.models, trimmed] }
          : e,
      ),
    );
  };

  const removeModel = (endpointName: string, model: string) => {
    setEndpointAccess((prev) =>
      prev.map((e) =>
        e.endpoint === endpointName
          ? { ...e, models: e.models.filter((m) => m !== model) }
          : e,
      ),
    );
  };

  const toggleShowMCP = (endpointName: string) => {
    setEndpointAccess((prev) =>
      prev.map((e) =>
        e.endpoint === endpointName ? { ...e, showMCP: !e.showMCP } : e,
      ),
    );
  };

  const handleSave = () => {
    updateMutation.mutate({ roleName, endpointAccess });
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

      {endpointAccess.map((ep) => (
        <div key={ep.endpoint} className="rounded border border-border p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">{ep.endpoint}</h3>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                <Switch
                  aria-label={`Show MCP for ${ep.endpoint}`}
                  checked={ep.showMCP}
                  onCheckedChange={() => toggleShowMCP(ep.endpoint)}
                />
                Show MCP
              </label>
              <button
                onClick={() => removeEndpoint(ep.endpoint)}
                className="rounded p-1 text-red-500 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-3">
            <p className="mb-1 text-xs font-medium uppercase text-text-secondary">Models</p>
            <div className="flex flex-wrap gap-2">
              {ep.models.map((m) => (
                <span
                  key={m}
                  className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800"
                >
                  {m}
                  <button
                    onClick={() => removeModel(ep.endpoint, m)}
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
                value={newModelInputs[ep.endpoint] ?? ''}
                onChange={(e) =>
                  setNewModelInputs((prev) => ({ ...prev, [ep.endpoint]: e.target.value }))
                }
                className="max-w-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = newModelInputs[ep.endpoint] ?? '';
                    addModel(ep.endpoint, val);
                    setNewModelInputs((prev) => ({ ...prev, [ep.endpoint]: '' }));
                  }
                }}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const val = newModelInputs[ep.endpoint] ?? '';
                  addModel(ep.endpoint, val);
                  setNewModelInputs((prev) => ({ ...prev, [ep.endpoint]: '' }));
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      ))}

      <div className="rounded border border-dashed border-border p-3">
        <p className="mb-2 text-xs font-medium uppercase text-text-secondary">Add Endpoint</p>
        <div className="flex flex-wrap gap-2">
          {availableEndpoints
            .filter((ep) => !endpointAccess.find((e) => e.endpoint === ep))
            .map((ep) => (
              <Button
                key={ep}
                size="sm"
                variant="outline"
                onClick={() => addEndpoint(ep)}
                className="text-xs"
              >
                <Plus className="mr-1 h-3 w-3" />
                {ep}
              </Button>
            ))}
          <Input
            type="text"
            placeholder="Custom endpoint name..."
            value={newEndpointName}
            onChange={(e) => setNewEndpointName(e.target.value)}
            className="max-w-xs"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newEndpointName.trim()) {
                addEndpoint(newEndpointName);
                setNewEndpointName('');
              }
            }}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (newEndpointName.trim()) {
                addEndpoint(newEndpointName);
                setNewEndpointName('');
              }
            }}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
