import React, { useState, useEffect } from 'react';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@repo/ui/components/ui/card';
import { toast } from 'sonner';
import { tauriInvoke } from '@/lib/tauri-bridge';
import { useOrganization } from '@/lib/providers/organization-context';
import { bakery } from '@/lib/sdk';

export default function SettingsPage() {
  useOrganization();
  const [formData, setFormData] = useState({
    apiUrl: 'https://api.scryme.tech',
    apiKey: '',
  });

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await tauriInvoke('update_bakery_api_url', { apiUrl: formData.apiUrl });
      localStorage.setItem('bakery_api_url', formData.apiUrl);
      toast.success('Settings saved successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save settings');
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
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
              <Button type="submit">Save Settings</Button>
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
