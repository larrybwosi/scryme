'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@repo/ui/components/ui/card';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select';
import { Separator } from '@repo/ui/components/ui/separator';
import { Switch } from '@repo/ui/components/ui/switch';
import {
  Settings,
  Hash,
  Store,
  Bell,
  Shield,
  Loader2,
  Save,
  Undo2,
  Calendar,
  Layers,
  Cloud,
  Key,
  Zap,
  CheckCircle2,
  Palette,
  Fingerprint,
  Globe,
  Scale,
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@repo/ui/components/ui/dialog';
import { useBakerySettingsManagement } from '@/hooks/bakery';
import { useUnits } from '@/lib/units/hooks';
import { toast } from 'sonner';
import sdk from '@/lib/sdk';
import { getSDK } from '@repo/sdk';
import { invoke } from '@tauri-apps/api/core';
import { isTauri, isOfflineMode } from '@/lib/sdk';
import { sanitizeApiUrl } from '@/utils/url';
import { resetBakeryDevice } from '@/utils/reset';

type SettingsTab = 'operational' | 'sync' | 'security' | 'notifications' | 'branding' | 'units';

export default function SettingsPage() {
  const {
    settings,
    branding,
    setBranding,
    bakers,
    isLoading,
    updateSettingsAsync,
    isUpdating,
  } = useBakerySettingsManagement();

  const [activeTab, setActiveTab] = useState<SettingsTab>('operational');
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTested, setKeyTested] = useState(false);
  const [isValidatingApi, setIsValidatingApi] = useState(false);
  const [apiTested, setApiTested] = useState(false);

  const [localAdminForm, setLocalAdminForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isUpdatingLocalAdmin, setIsUpdatingLocalAdmin] = useState(false);

  // Local state for form management
  const [formData, setFormData] = useState<any>({
    batchPrefix: settings?.batchPrefix || 'BAT',
    batchSeparator: settings?.batchSeparator || '-',
    batchDateFormat: settings?.batchDateFormat || 'YYYYMMDD',
    batchSequence: settings?.batchSequence || '4',
    autoApproveBatches: settings?.autoApproveBatches || false,
    lowStockAlerts: !!settings?.lowStockAlerts,
    timezone: settings?.timezone || 'UTC',
    apiKey: (settings as any)?.apiKey || '',
    apiEndpointUrl: (settings as any)?.apiEndpointUrl || '',
    defaultBakerId: settings?.defaultBakerId || '',
    autoCreateDailyBatches: settings?.autoCreateDailyBatches || false,
    expiryWarningDays: settings?.expiryWarningDays || 3,
    authMode: settings?.authMode || 'SSO',
    scrymeReportEnabled: settings?.scrymeReportEnabled || false,
    scrymeReportDay: settings?.scrymeReportDay ?? 1,
    scrymeReportTime: settings?.scrymeReportTime || '08:00',
    scrymeReportSections: settings?.scrymeReportSections || { batches: true, waste: true, yields: true, top_recipes: true },
    scrymeReportChannel: settings?.scrymeReportChannel || 'production-reports',
  });

  const [brandingData, setBrandingData] = useState(branding);

  // Update local state when settings load
  React.useEffect(() => {
    if (settings) {
      setFormData({
        batchPrefix: settings.batchPrefix || 'BAT',
        batchSeparator: settings.batchSeparator || '-',
        batchDateFormat: settings.batchDateFormat || 'YYYYMMDD',
        batchSequence: settings.batchSequence || '4',
        autoApproveBatches: settings.autoApproveBatches || false,
        lowStockAlerts: !!settings.lowStockAlerts,
        timezone: settings.timezone || 'UTC',
        apiKey: (settings as any)?.apiKey || '',
        apiEndpointUrl: (settings as any)?.apiEndpointUrl || '',
        defaultBakerId: settings.defaultBakerId || '',
        autoCreateDailyBatches: settings.autoCreateDailyBatches || false,
        expiryWarningDays: settings.expiryWarningDays || 3,
        authMode: settings.authMode || 'SSO',
        scrymeReportEnabled: settings.scrymeReportEnabled || false,
        scrymeReportDay: settings.scrymeReportDay ?? 1,
        scrymeReportTime: settings.scrymeReportTime || '08:00',
        scrymeReportSections: settings.scrymeReportSections || { batches: true, waste: true, yields: true, top_recipes: true },
        scrymeReportChannel: settings.scrymeReportChannel || 'production-reports',
      });
    }
  }, [settings]);

  const handleTestKey = async () => {
    if (!formData.apiKey) {
      toast.error('Please enter an Access Key');
      return;
    }
    setIsTestingKey(true);
    try {
      const tempSdk = getSDK({
        apiKey: formData.apiKey,
        baseURL: isTauri() ? (sanitizeApiUrl(formData.apiEndpointUrl) || "") : "/api/v2"
      });
      await tempSdk.client.get('/bakery');
      setKeyTested(true);
      toast.success('Access Key validated');
    } catch (error) {
      toast.error('Invalid Access Key');
      setKeyTested(false);
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleTestApi = async () => {
    if (!formData.apiEndpointUrl) {
      toast.error('Please enter an API Endpoint URL');
      return;
    }
    setIsValidatingApi(true);
    try {
      const sanitizedUrl = sanitizeApiUrl(formData.apiEndpointUrl);
      const response = await fetch(`${sanitizedUrl}/health/ping`);
      if (response.ok) {
        const data = await response.json();
        if (data.message === 'pong') {
          setApiTested(true);
          toast.success('API Endpoint is valid and reachable');
        } else {
          throw new Error('Invalid response');
        }
      } else {
        setApiTested(false);
        toast.error('API Endpoint returned an error');
      }
    } catch (error) {
      setApiTested(false);
      toast.error('Could not connect to API Endpoint');
    } finally {
      setIsValidatingApi(false);
    }
  };

  React.useEffect(() => {
    if (branding) {
      setBrandingData(branding);
    }
  }, [branding]);

  const [isTestingReport, setIsTestingReport] = useState(false);

  const handleTestReport = async () => {
    setIsTestingReport(true);
    try {
      await sdk.client.post('/bakery/settings/test-report');
      toast.success('Test report triggered. Check Scryme Chat.');
    } catch (error) {
      toast.error('Failed to trigger test report');
    } finally {
      setIsTestingReport(false);
    }
  };

  const handleSave = async () => {
    try {
      const sanitizedApiUrl = formData.apiEndpointUrl ? sanitizeApiUrl(formData.apiEndpointUrl) : formData.apiEndpointUrl;

      // Ensure we pass the full settings object to include ID and organizationId
      await updateSettingsAsync({ ...settings, ...formData, apiEndpointUrl: sanitizedApiUrl });

      if (isTauri() && sanitizedApiUrl) {
        sdk.client.setBaseURL(sanitizedApiUrl);
        localStorage.setItem('bakery_api_url', sanitizedApiUrl);
      }

      setBranding(brandingData);
      toast.success('Settings updated successfully');

      // Full reload to re-initialize SDK with potentially new API URL or key
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  const handleUpdateLocalAdmin = async () => {
    if (localAdminForm.password && localAdminForm.password !== localAdminForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsUpdatingLocalAdmin(true);
    try {
      await invoke('update_local_admin', {
        email: localAdminForm.email || null,
        password: localAdminForm.password || null,
      });
      toast.success('Local admin credentials updated');
      setLocalAdminForm({ email: '', password: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to update credentials');
    } finally {
      setIsUpdatingLocalAdmin(false);
    }
  };

  const generatePreview = () => {
    const dateStr =
      formData.batchDateFormat === 'YYYYMMDD' ? '20260225' : formData.batchDateFormat === 'YYMM' ? '2602' : '';
    const seqStr = '1'.padStart(parseInt(formData.batchSequence), '0');
    const parts = [formData.batchPrefix, dateStr, seqStr].filter(Boolean);
    return parts.join(formData.batchSeparator);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 tracking-tight">
          System Configuration
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Manage your bakery's operational parameters and system preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Navigation Sidebar */}
        <div className="space-y-1">
          <Button
            variant="ghost"
            onClick={() => setActiveTab('operational')}
            className={`w-full justify-start gap-2 ${
              activeTab === 'operational'
                ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50'
                : 'text-slate-500'
            }`}
          >
            <Settings className="h-4 w-4" /> Operational
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab('sync')}
            className={`w-full justify-start gap-2 ${
              activeTab === 'sync'
                ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50'
                : 'text-slate-500'
            }`}
          >
            <Cloud className="h-4 w-4" /> Cloud Sync
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab('security')}
            className={`w-full justify-start gap-2 ${
              activeTab === 'security'
                ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50'
                : 'text-slate-500'
            }`}
          >
            <Shield className="h-4 w-4" /> Security
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab('notifications')}
            className={`w-full justify-start gap-2 ${
              activeTab === 'notifications'
                ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50'
                : 'text-slate-500'
            }`}
          >
            <Bell className="h-4 w-4" /> Notifications
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab('branding')}
            className={`w-full justify-start gap-2 ${
              activeTab === 'branding'
                ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50'
                : 'text-slate-500'
            }`}
          >
            <Palette className="h-4 w-4" /> Branding
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab('units')}
            className={`w-full justify-start gap-2 ${
              activeTab === 'units'
                ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50'
                : 'text-slate-500'
            }`}
          >
            <Scale className="h-4 w-4" /> Units & Measures
          </Button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-2 space-y-6">
          {activeTab === 'sync' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-amber-500">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Cloud className="h-5 w-5 text-amber-500" />
                      Server & Synchronization
                    </CardTitle>
                    <CardDescription>Configure your connection to the Scryme cloud for backups and AI features.</CardDescription>
                  </div>
                  {isOfflineMode() && (
                    <div className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                      Local Mode Active
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isTauri() && (
                  <div className="space-y-2">
                    <Label htmlFor="api-url" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" /> API Endpoint URL
                    </Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id="api-url"
                          type="url"
                          value={formData.apiEndpointUrl}
                          onChange={e => {
                            setFormData({ ...formData, apiEndpointUrl: e.target.value });
                            setApiTested(false);
                          }}
                          placeholder="https://api.scryme.tech/api/v2"
                          className="pr-10"
                        />
                        {apiTested && (
                          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTestApi}
                        disabled={isValidatingApi || !formData.apiEndpointUrl}
                        className="shrink-0"
                      >
                        {isValidatingApi ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3 mr-2" />}
                        Test
                      </Button>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      The base URL for all Scryme API requests. Default is Scryme Cloud.
                    </p>
                    <Separator className="my-2" />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="api-key" className="flex items-center gap-2">
                    <Key className="h-4 w-4" /> Access Key
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="api-key"
                        type="password"
                        value={formData.apiKey}
                        onChange={e => {
                          setFormData({ ...formData, apiKey: e.target.value });
                          setKeyTested(false);
                        }}
                        placeholder="scryme_..."
                        className="pr-10"
                      />
                      {keyTested && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTestKey}
                      disabled={isTestingKey || !formData.apiKey}
                      className="shrink-0"
                    >
                      {isTestingKey ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3 mr-2" />}
                      Test
                    </Button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Data will be automatically synced to the server once a valid key is provided.
                  </p>
                </div>

                {isTauri() && (
                  <>
                    <Separator className="my-4" />
                    <div className="pt-2">
                      <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-red-900 dark:text-red-400 uppercase tracking-wider">Danger Zone</h4>
                            <p className="text-xs text-red-700 dark:text-red-500/80 leading-relaxed">
                              Resetting the device will clear all provisioned API keys, local sessions, and server configurations. This action cannot be undone.
                            </p>
                            <div className="pt-3">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  if (confirm("Are you sure you want to reset this device? All local configuration will be lost.")) {
                                    resetBakeryDevice();
                                  }
                                }}
                                className="h-8 gap-2"
                              >
                                <RefreshCw className="h-3 w-3" />
                                Reset & Re-provision Device
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'operational' && (
            <>
              {/* Batch Identification Section */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Hash className="h-5 w-5 text-amber-500" />
                    Batch Identification
                  </CardTitle>
                  <CardDescription>Define the convention for automatically generated batch numbers.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="prefix">Prefix</Label>
                      <Input
                        id="prefix"
                        value={formData.batchPrefix}
                        onChange={e => setFormData({ ...formData, batchPrefix: e.target.value.toUpperCase() })}
                        placeholder="BAT"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="separator">Separator</Label>
                      <Input
                        id="separator"
                        value={formData.batchSeparator}
                        onChange={e => setFormData({ ...formData, batchSeparator: e.target.value })}
                        maxLength={1}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date Format</Label>
                      <Select
                        value={formData.batchDateFormat}
                        onValueChange={val => setFormData({ ...formData, batchDateFormat: val })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="YYYYMMDD">YYYYMMDD</SelectItem>
                          <SelectItem value="YYMM">YYMM</SelectItem>
                          <SelectItem value="NONE">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Sequence Length</Label>
                      <Select
                        value={formData.batchSequence}
                        onValueChange={val => setFormData({ ...formData, batchSequence: val })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 Digits</SelectItem>
                          <SelectItem value="4">4 Digits</SelectItem>
                          <SelectItem value="5">5 Digits</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                      Generated Preview
                    </span>
                    <span className="font-mono text-xl font-medium text-amber-600 tracking-tight">
                      {generatePreview()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Operational Rules */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Layers className="h-5 w-5 text-blue-500" />
                    Production Logic
                  </CardTitle>
                  <CardDescription>Configure automation and validation rules for manufacturing.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Auto-Approve Batches</Label>
                      <p className="text-sm text-slate-500">Skip the 'Planned' state and move directly to execution.</p>
                    </div>
                    <Switch
                      checked={formData.autoApproveBatches}
                      onCheckedChange={checked => setFormData({ ...formData, autoApproveBatches: checked })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Daily Auto-Batching</Label>
                      <p className="text-sm text-slate-500">Automatically generate batches from active templates daily.</p>
                    </div>
                    <Switch
                      checked={formData.autoCreateDailyBatches}
                      onCheckedChange={checked => setFormData({ ...formData, autoCreateDailyBatches: checked })}
                    />
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Store className="h-4 w-4" /> Default Baker
                      </Label>
                      <Select
                        value={formData.defaultBakerId}
                        onValueChange={val => setFormData({ ...formData, defaultBakerId: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select default baker" />
                        </SelectTrigger>
                        <SelectContent>
                          {bakers?.map(baker => (
                            <SelectItem key={baker.id} value={baker.id}>
                              {baker.name || baker.member?.user?.name || 'Unnamed Baker'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Timezone
                      </Label>
                      <Select value={formData.timezone} onValueChange={val => setFormData({ ...formData, timezone: val })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="Africa/Nairobi">Nairobi (EAT)</SelectItem>
                          <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
                          <SelectItem value="America/New_York">New York (ET)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Fingerprint className="h-5 w-5 text-indigo-500" />
                    Access Control
                  </CardTitle>
                  <CardDescription>Manage how bakers authenticate with the bakery terminals.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Authentication Mode</Label>
                    <Select
                      value={formData.authMode}
                      onValueChange={val => setFormData({ ...formData, authMode: val as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SSO">Dashboard Single Sign-On</SelectItem>
                        <SelectItem value="CARD_PIN">Staff Card & PIN</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500 mt-2">
                      {formData.authMode === 'SSO'
                        ? 'Bakers will be logged in automatically using their existing dashboard session.'
                        : 'Bakers must tap their NFC card and enter their PIN to access the terminal.'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {localStorage.getItem('bakery_local_mode') === 'true' && (
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-amber-500">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Shield className="h-5 w-5 text-amber-500" />
                      Local Admin Credentials
                    </CardTitle>
                    <CardDescription>Update the email and password for the local administrative account.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-email">Admin Email</Label>
                      <Input
                        id="admin-email"
                        type="email"
                        placeholder="admin@bakery.local"
                        value={localAdminForm.email}
                        onChange={(e) => setLocalAdminForm({ ...localAdminForm, email: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="admin-password">New Password</Label>
                        <Input
                          id="admin-password"
                          type="password"
                          placeholder="••••••••"
                          value={localAdminForm.password}
                          onChange={(e) => setLocalAdminForm({ ...localAdminForm, password: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="••••••••"
                          value={localAdminForm.confirmPassword}
                          onChange={(e) => setLocalAdminForm({ ...localAdminForm, confirmPassword: e.target.value })}
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-slate-50 dark:bg-slate-900/50 flex justify-end p-4">
                    <Button
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700"
                      onClick={handleUpdateLocalAdmin}
                      disabled={isUpdatingLocalAdmin || (!localAdminForm.email && !localAdminForm.password)}
                    >
                      {isUpdatingLocalAdmin ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Update Admin Credentials
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Bell className="h-5 w-5 text-rose-500" />
                  Alerting & Notifications
                </CardTitle>
                <CardDescription>Configure system alerts for stock and quality control.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Low Stock Alerts</Label>
                    <p className="text-sm text-slate-500">Notify operators when ingredient levels fall below reorder points.</p>
                  </div>
                  <Switch
                    checked={formData.lowStockAlerts}
                    onCheckedChange={checked => setFormData({ ...formData, lowStockAlerts: checked })}
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="expiryWarning">Expiry Warning Window (Days)</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="expiryWarning"
                      type="number"
                      className="w-24"
                      value={formData.expiryWarningDays}
                      onChange={e =>
                        setFormData({ ...formData, expiryWarningDays: parseInt(e.target.value) || 0 })
                      }
                    />
                    <span className="text-sm text-slate-500">Days before expiration to show 'Near Expiry' warnings.</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-indigo-500" />
                  Scryme Chat Production Reports
                </CardTitle>
                <CardDescription>Configure weekly production reports sent to Scryme Chat.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Enable Weekly Reports</Label>
                    <p className="text-sm text-slate-500">Send a summary of production activity every week.</p>
                  </div>
                  <Switch
                    checked={formData.scrymeReportEnabled}
                    onCheckedChange={checked => setFormData({ ...formData, scrymeReportEnabled: checked })}
                  />
                </div>

                {formData.scrymeReportEnabled && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Delivery Day</Label>
                        <Select
                          value={formData.scrymeReportDay.toString()}
                          onValueChange={val => setFormData({ ...formData, scrymeReportDay: parseInt(val) })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Sunday</SelectItem>
                            <SelectItem value="1">Monday</SelectItem>
                            <SelectItem value="2">Tuesday</SelectItem>
                            <SelectItem value="3">Wednesday</SelectItem>
                            <SelectItem value="4">Thursday</SelectItem>
                            <SelectItem value="5">Friday</SelectItem>
                            <SelectItem value="6">Saturday</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Delivery Time (HH:MM)</Label>
                        <Input
                          type="time"
                          value={formData.scrymeReportTime}
                          onChange={e => setFormData({ ...formData, scrymeReportTime: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Target Channel Slug</Label>
                      <Input
                        value={formData.scrymeReportChannel || ''}
                        onChange={e => setFormData({ ...formData, scrymeReportChannel: e.target.value })}
                        placeholder="production-reports"
                      />
                      <p className="text-[10px] text-slate-500">The channel in Scryme Chat where the report will be posted.</p>
                    </div>

                    <div className="space-y-3">
                      <Label>Report Sections</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            id="section-batches"
                            checked={formData.scrymeReportSections?.batches}
                            onCheckedChange={checked => setFormData({
                              ...formData,
                              scrymeReportSections: { ...formData.scrymeReportSections, batches: checked }
                            })}
                          />
                          <Label htmlFor="section-batches" className="text-sm">Batch Summary</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            id="section-waste"
                            checked={formData.scrymeReportSections?.waste}
                            onCheckedChange={checked => setFormData({
                              ...formData,
                              scrymeReportSections: { ...formData.scrymeReportSections, waste: checked }
                            })}
                          />
                          <Label htmlFor="section-waste" className="text-sm">Waste Analysis</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            id="section-yields"
                            checked={formData.scrymeReportSections?.yields}
                            onCheckedChange={checked => setFormData({
                              ...formData,
                              scrymeReportSections: { ...formData.scrymeReportSections, yields: checked }
                            })}
                          />
                          <Label htmlFor="section-yields" className="text-sm">Production Yields</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            id="section-top_recipes"
                            checked={formData.scrymeReportSections?.top_recipes}
                            onCheckedChange={checked => setFormData({
                              ...formData,
                              scrymeReportSections: { ...formData.scrymeReportSections, top_recipes: checked }
                            })}
                          />
                          <Label htmlFor="section-top_recipes" className="text-sm">Top Recipes</Label>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Test Configuration</p>
                        <p className="text-xs text-slate-500">Send a sample report to Scryme Chat immediately.</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTestReport}
                        disabled={isTestingReport}
                      >
                        {isTestingReport ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                        Send Test Report
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            </div>
          )}

          {activeTab === 'units' && <UnitsSettingsSection />}

          {activeTab === 'branding' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Palette className="h-5 w-5 text-emerald-500" />
                  Visual Customisation
                </CardTitle>
                <CardDescription>Personalise the terminal experience with your bakery's branding.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bakeryName">Bakery Name</Label>
                    <Input
                      id="bakeryName"
                      value={brandingData.name}
                      onChange={e => setBrandingData({ ...brandingData, name: e.target.value })}
                      placeholder="e.g. Scryme Bakery"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logoUrl">Logo URL</Label>
                    <Input
                      id="logoUrl"
                      value={brandingData.logoUrl}
                      onChange={e => setBrandingData({ ...brandingData, logoUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        className="w-12 h-10 p-1"
                        value={brandingData.colors.primary}
                        onChange={e =>
                          setBrandingData({
                            ...brandingData,
                            colors: { ...brandingData.colors, primary: e.target.value },
                          })
                        }
                      />
                      <Input
                        value={brandingData.colors.primary}
                        onChange={e =>
                          setBrandingData({
                            ...brandingData,
                            colors: { ...brandingData.colors, primary: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        className="w-12 h-10 p-1"
                        value={brandingData.colors.secondary}
                        onChange={e =>
                          setBrandingData({
                            ...brandingData,
                            colors: { ...brandingData.colors, secondary: e.target.value },
                          })
                        }
                      />
                      <Input
                        value={brandingData.colors.secondary}
                        onChange={e =>
                          setBrandingData({
                            ...brandingData,
                            colors: { ...brandingData.colors, secondary: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Accent Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        className="w-12 h-10 p-1"
                        value={brandingData.colors.accent}
                        onChange={e =>
                          setBrandingData({
                            ...brandingData,
                            colors: { ...brandingData.colors, accent: e.target.value },
                          })
                        }
                      />
                      <Input
                        value={brandingData.colors.accent}
                        onChange={e =>
                          setBrandingData({
                            ...brandingData,
                            colors: { ...brandingData.colors, accent: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footer Actions */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 flex justify-end gap-3 p-4">
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <Undo2 className="h-4 w-4 mr-2" /> Reset
            </Button>
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={handleSave} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save All Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UnitsSettingsSection() {
  const {
    orgUnits,
    systemUnits,
    createMutation,
    updateMutation,
    deleteMutation,
    loading
  } = useUnits();

  const [isAdding, setIsAdding] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [unitForm, setUnitForm] = useState({
    name: '',
    symbol: '',
    type: 'MASS',
    baseSystemUnitId: '',
    conversionFactor: 1,
    description: '',
  });

  const handleSaveUnit = async () => {
    try {
      if (editingUnit) {
        await updateMutation({ unitId: editingUnit.id, data: unitForm as any });
      } else {
        await createMutation(unitForm as any);
      }
      setIsAdding(false);
      setEditingUnit(null);
      setUnitForm({
        name: '',
        symbol: '',
        type: 'MASS',
        baseSystemUnitId: '',
        conversionFactor: 1,
        description: '',
      });
    } catch (error) {
      // toast handled in hook
    }
  };

  const startEdit = (unit: any) => {
    setEditingUnit(unit);
    setUnitForm({
      name: unit.name,
      symbol: unit.symbol,
      type: unit.type,
      baseSystemUnitId: unit.baseSystemUnitId || '',
      conversionFactor: unit.conversionFactor || 1,
      description: unit.description || '',
    });
    setIsAdding(true);
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Scale className="h-5 w-5 text-indigo-500" />
              Custom Units
            </CardTitle>
            <CardDescription>Manage organization-specific units and their conversions.</CardDescription>
          </div>
          <Button size="sm" onClick={() => { setIsAdding(true); setEditingUnit(null); }} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" /> Add Unit
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orgUnits.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg text-slate-500">
                No custom units defined yet.
              </div>
            ) : (
              <div className="grid gap-4">
                {orgUnits.map((unit) => (
                  <div key={unit.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{unit.name}</span>
                        <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-xs font-mono">{unit.symbol}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Type: {unit.type} • 1 {unit.symbol} = {unit.conversionFactor} {systemUnits.find(s => s.id === unit.baseSystemUnitId)?.symbol || 'base units'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(unit)}>
                        <Edit className="h-4 w-4 text-slate-400" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation(unit.id)}>
                        <Trash2 className="h-4 w-4 text-rose-400" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingUnit ? 'Edit Unit' : 'New Custom Unit'}</DialogTitle>
            <DialogDescription>
              Define a new unit of measurement for your bakery.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unit Name</Label>
                <Input value={unitForm.name} onChange={e => setUnitForm({...unitForm, name: e.target.value})} placeholder="e.g. Flour Bag" />
              </div>
              <div className="space-y-2">
                <Label>Symbol</Label>
                <Input value={unitForm.symbol} onChange={e => setUnitForm({...unitForm, symbol: e.target.value})} placeholder="e.g. f-bag" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={unitForm.type} onValueChange={v => setUnitForm({...unitForm, type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MASS">Mass / Weight</SelectItem>
                    <SelectItem value="VOLUME">Volume</SelectItem>
                    <SelectItem value="COUNT">Count / Pieces</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Base System Unit</Label>
                <Select value={unitForm.baseSystemUnitId} onValueChange={v => setUnitForm({...unitForm, baseSystemUnitId: v})}>
                  <SelectTrigger><SelectValue placeholder="Select base unit" /></SelectTrigger>
                  <SelectContent>
                    {systemUnits.filter(u => u.type === unitForm.type).map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name} ({u.symbol})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Conversion Factor (1 {unitForm.symbol || 'Unit'} = X Base Units)</Label>
              <Input type="number" value={unitForm.conversionFactor} onChange={e => setUnitForm({...unitForm, conversionFactor: parseFloat(e.target.value) || 0})} />
            </div>
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Input value={unitForm.description} onChange={e => setUnitForm({...unitForm, description: e.target.value})} placeholder="e.g. Standard 25kg bag of wheat flour" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
            <Button onClick={handleSaveUnit} className="bg-indigo-600 hover:bg-indigo-700">Save Unit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}