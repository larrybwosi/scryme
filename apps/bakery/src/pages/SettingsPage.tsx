import React, { useState, useEffect } from 'react';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@repo/ui/components/ui/card';
import { Switch } from '@repo/ui/components/ui/switch';
import { toast } from 'sonner';
import { tauriInvoke } from '@/lib/tauri-bridge';
import { useOrganization } from '@/lib/providers/organization-context';
import { useBakerySettingsManagement } from '@/hooks/bakery';
import { Loader2, Settings, Server, PackageCheck } from 'lucide-react';

export default function SettingsPage() {
  useOrganization();
  const { settings, updateSettingsAsync, isUpdating } = useBakerySettingsManagement();

  const [formData, setFormData] = useState({
    apiUrl: 'https://api.scryme.tech',
    apiKey: '',
  });

  const [enableStaging, setEnableStaging] = useState(false);

  useEffect(() => {
    tauriInvoke<any>('get_device_config')
      .then((config) => {
        if (config) {
          setFormData({
            apiUrl: config.base_url || 'https://api.scryme.tech',
            apiKey: config.device_key || '',
          });
        }
      })
      .catch((err) => console.error('Failed to load device config', err));
  }, []);

  useEffect(() => {
    if (settings) {
      setEnableStaging(!!settings.enableProductionStaging);
    }
  }, [settings]);

  const handleSaveApi = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await tauriInvoke('update_bakery_api_url', { apiUrl: formData.apiUrl });
      localStorage.setItem('bakery_api_url', formData.apiUrl);
      toast.success('API Settings saved successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save API settings');
    }
  };

  const handleTestConnection = async () => {
    try {
      const isOk = await tauriInvoke<boolean>('validate_api_endpoint', { apiUrl: formData.apiUrl });
      if (isOk) {
        toast.success('Connection successful');
      } else {
        toast.error('Could not connect to API endpoint');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Connection test failed');
    }
  };

  const handleToggleStaging = async (checked: boolean) => {
    setEnableStaging(checked);
    try {
      await updateSettingsAsync({ enableProductionStaging: checked });
      toast.success(
        checked
          ? 'Production staging enabled. Completed batches will now require dispatch to Front Office.'
          : 'Production staging disabled. Completed batches will directly update POS stock.'
      );
    } catch (err: any) {
      setEnableStaging(!checked);
      toast.error(err?.message || 'Failed to update staging setting');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Bakery Settings</h1>
      </div>

      {/* Production Staging Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PackageCheck className="h-5 w-5 text-primary" />
            Production Staging & Front Office Dispatch
          </CardTitle>
          <CardDescription>
            Configure how finished production goods are transferred from the kitchen to Front Office POS registers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
            <div className="space-y-0.5 max-w-lg">
              <label className="text-sm font-semibold text-foreground block">
                Enable Production Staging
              </label>
              <p className="text-xs text-muted-foreground">
                When enabled, completed batches are held in a Staged area in the kitchen. Staff log items sent to the Front Office counter, which then updates POS sellable stock.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
              <Switch
                checked={enableStaging}
                onCheckedChange={handleToggleStaging}
                disabled={isUpdating}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Server className="h-5 w-5 text-primary" />
            API Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveApi} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Server API URL</label>
              <Input
                type="url"
                value={formData.apiUrl}
                onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                placeholder="https://api.scryme.tech"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Device Key</label>
              <Input
                type="password"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder="Device API Key"
                readOnly
              />
            </div>
            <div className="flex space-x-2">
              <Button type="submit">Save API Settings</Button>
              <Button type="button" variant="outline" onClick={handleTestConnection}>
                Test Connection
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
