'use client';

import {
  Building2,
  Wallet,
  Percent,
  Settings2,
  CheckCircle2,
  Store,
  CreditCard,
  Power,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCheck,
  Loader2,
  ShieldCheck,
  MapPin,
  Wifi,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import { Label } from '@repo/ui/components/ui/label';
import { Input } from '@repo/ui/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select';
import { Switch } from '@repo/ui/components/ui/switch';
import { Separator } from '@repo/ui/components/ui/separator';
import { TabsContent } from '@repo/ui/components/ui/tabs';
import { Button } from '@repo/ui/components/ui/button';
import { BusinessType, BusinessConfig } from '@/lib/business-configs';
import { LocationSwitchDialog } from './location-switch-dialog';
import { useState } from 'react';
import { useAuthStore } from '@/store/pos-auth-store';
import { useUpdater } from '@/lib/providers/UpdateProvider';
import axios from 'axios';
import { toast } from 'sonner';

// ─── Update Status UI Helpers ────────────────────────────────────────────────

type UpdateStatus = 'IDLE' | 'CHECKING' | 'PENDING' | 'DOWNLOADING' | 'DONE' | 'ERROR';

const UPDATE_STATUS_CONFIG: Record<UpdateStatus, { label: string; badgeClass: string; icon: React.ReactNode }> = {
  IDLE: {
    label: 'Up to date',
    badgeClass:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
    icon: <CheckCheck className="h-3.5 w-3.5" />,
  },
  CHECKING: {
    label: 'Checking…',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
  },
  PENDING: {
    label: 'Update available',
    badgeClass:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
    icon: <Download className="h-3.5 w-3.5" />,
  },
  DOWNLOADING: {
    label: 'Downloading…',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
  },
  DONE: {
    label: 'Installed — restarting',
    badgeClass:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
    icon: <CheckCheck className="h-3.5 w-3.5" />,
  },
  ERROR: {
    label: 'Check failed',
    badgeClass: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
};

// ─── Connection Test Card ────────────────────────────────────────────────────

function ConnectionTestCard() {
  const [isTesting, setIsTesting] = useState(false);
  const [lastTested, setLastTested] = useState<string | null>(null);
  const [status, setStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
  const apiUrl = useAuthStore(state => state.apiUrl);

  const testConnection = async () => {
    setIsTesting(true);
    setStatus('IDLE');
    try {
      const response = await axios.get(`${apiUrl}/api/v2/health/ping`, { timeout: 5000 });
      if (response.data?.message === 'pong') {
        setStatus('SUCCESS');
        toast.success('Connection to Scryme API successful');
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (err: any) {
      setStatus('ERROR');
      toast.error(`Connection failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsTesting(false);
      setLastTested(new Date().toLocaleTimeString());
    }
  };

  return (
    <Card className="border-muted/60 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Wifi className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">API Connectivity</CardTitle>
            <CardDescription>Verify your connection to the Scryme API.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <Separator className="mb-0" />
      <CardContent className="pt-5 space-y-5">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Server Endpoint</p>
            <p className="text-sm font-mono mt-1 truncate max-w-[250px]">{apiUrl}</p>
          </div>
          <Button variant="outline" size="sm" onClick={testConnection} disabled={isTesting} className="gap-2 text-xs">
            {isTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            {isTesting ? 'Testing…' : 'Test Connection'}
          </Button>
        </div>

        {status !== 'IDLE' && (
          <div
            className={`flex items-center gap-2.5 text-xs p-3 rounded-lg border ${
              status === 'SUCCESS'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800'
            }`}
          >
            {status === 'SUCCESS' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
            )}
            <div className="flex-1">
              <span className="font-medium">{status === 'SUCCESS' ? 'Connected' : 'Connection Failed'}</span>
              <p className="text-[10px] opacity-80">Last tested at {lastTested}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Software Updates Card ────────────────────────────────────────────────────

function SoftwareUpdatesCard() {
  const {
    status,
    isUpdateAvailable,
    isCritical,
    releaseNotes,
    releaseDate,
    downloadProgress,
    error,
    checkForUpdates,
    startInstall,
    openModal,
  } = useUpdater();

  const statusCfg = UPDATE_STATUS_CONFIG[status];
  const isChecking = status === 'CHECKING';
  const isDownloading = status === 'DOWNLOADING';
  const isBusy = isChecking || isDownloading;

  const formattedDate = releaseDate
    ? new Date(releaseDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <Card className="border-muted/60 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">Software Updates</CardTitle>
            <CardDescription>Keep your application secure and up to date.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <Separator className="mb-0" />
      <CardContent className="pt-5 space-y-5">
        {/* Status Row */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Current Status</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className={`inline-flex items-center gap-1.5 border rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.badgeClass}`}
              >
                {statusCfg.icon}
                {statusCfg.label}
              </span>
              {isCritical && (
                <span className="inline-flex items-center gap-1 border rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800">
                  <AlertTriangle className="h-3 w-3" />
                  Critical
                </span>
              )}
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={checkForUpdates} disabled={isBusy} className="gap-2 text-xs">
            {isChecking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {isChecking ? 'Checking…' : 'Check Now'}
          </Button>
        </div>

        {/* Download progress */}
        {isDownloading && (
          <div className="space-y-2 rounded-lg bg-muted/40 border border-muted p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">Downloading update…</span>
              <span className="tabular-nums font-mono text-muted-foreground">{downloadProgress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-indigo-600 transition-all duration-300 ease-out"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              The application will restart automatically when finished.
            </p>
          </div>
        )}

        {/* Error state */}
        {status === 'ERROR' && error && (
          <div className="flex items-start gap-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60 p-3">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-px" />
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-red-700 dark:text-red-400">Update check failed</p>
              <p className="text-[11px] text-red-600/80 dark:text-red-500">{error}</p>
            </div>
          </div>
        )}

        {/* Pending update details */}
        {isUpdateAvailable && status === 'PENDING' && (
          <div className="rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-amber-200 dark:border-amber-800/60">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-300">New release available</p>
                {formattedDate && (
                  <p className="text-[11px] text-amber-700/70 dark:text-amber-500/80">Released {formattedDate}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                  onClick={openModal}
                >
                  View details
                </Button>
                <Button
                  size="sm"
                  className="text-xs h-7 bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={startInstall}
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Install
                </Button>
              </div>
            </div>
            {releaseNotes && (
              <div className="px-4 py-3 max-h-28 overflow-y-auto">
                <p className="text-[11px] font-medium text-amber-800 dark:text-amber-400 uppercase tracking-wide mb-1.5">
                  Release notes
                </p>
                <p className="text-xs text-amber-700/80 dark:text-amber-300/70 whitespace-pre-line leading-relaxed">
                  {releaseNotes.slice(0, 500)}
                  {releaseNotes.length > 500 ? '…' : ''}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Up-to-date state */}
        {status === 'IDLE' && !isUpdateAvailable && (
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            You&apos;re running the latest version of the application.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GeneralSettings({
  businessName,
  setBusinessName,
  businessType,
  handleBusinessTypeChange,
  businessConfigs,
  currentConfig,
  currency,
  setCurrency,
  taxRate,
  setTaxRate,
  allowSaveUnpaidOrders,
  setAllowSaveUnpaidOrders,
  enableAutoStart,
  setEnableAutoStart,
  autoPrintEnabled,
  setAutoPrintEnabled,
}: {
  businessName: string;
  setBusinessName: (name: string) => void;
  businessType: BusinessType;
  handleBusinessTypeChange: (type: BusinessType) => void;
  businessConfigs: Record<BusinessType, BusinessConfig>;
  currentConfig: BusinessConfig;
  currency: string;
  setCurrency: (currency: string) => void;
  taxRate: string;
  setTaxRate: (rate: string) => void;
  allowSaveUnpaidOrders: boolean;
  setAllowSaveUnpaidOrders: (allow: boolean) => void;
  enableAutoStart: boolean;
  setEnableAutoStart: (enable: boolean) => void;
  autoPrintEnabled: boolean;
  setAutoPrintEnabled: (enable: boolean) => void;
}) {
  const { currentLocation, allowNegativeStock, setAllowNegativeStock } = useAuthStore();
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);

  return (
    <TabsContent value="general" className="space-y-6">
      <LocationSwitchDialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen} />
      <div className="md:col-span-7 lg:col-span-8 space-y-6">
        {/* Business Identity */}
        <Card className="border-muted/60 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Business Identity</CardTitle>
                <CardDescription>Manage your primary business details and classification.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <Separator className="mb-6" />
          <CardContent className="grid gap-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2.5">
                <Label
                  htmlFor="businessName"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                >
                  Business Name
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="pl-9 bg-muted/30 focus:bg-background transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor="businessType"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                >
                  Business Model
                </Label>
                <Select value={businessType} onValueChange={handleBusinessTypeChange}>
                  <SelectTrigger id="businessType" className="bg-muted/30 focus:bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(businessConfigs).map(config => (
                      <SelectItem key={config.type} value={config.type}>
                        <span className="font-medium">{config.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground mt-1">{currentConfig.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Store Location */}
        {import.meta.env.MODE !== 'standalone' && (
          <Card className="border-muted/60 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <MapPin className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Store Location</CardTitle>
                  <CardDescription>Manage which physical store this terminal is assigned to.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <Separator className="mb-6" />
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Current Location
                  </Label>
                  <Button
                    variant="outline"
                    className="w-full justify-between font-normal bg-muted/30 hover:bg-muted/50"
                    onClick={() => setIsLocationDialogOpen(true)}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      {currentLocation?.name || 'No Location Set'}
                    </span>
                    <span className="text-xs text-primary font-medium">Change</span>
                  </Button>
                </div>

                <div className="space-y-2.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Location Type
                  </Label>
                  <div className="flex items-center h-10 px-3 rounded-md bg-muted/30 border border-input">
                    <span className="text-sm text-foreground capitalize">
                      {currentLocation?.locationType?.toLowerCase().replace('_', ' ') || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Financial Settings */}
        {import.meta.env.MODE !== 'standalone' && (
          <Card className="border-muted/60 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Wallet className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Financial Settings</CardTitle>
                  <CardDescription>Configure currency and tax regulations.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <Separator className="mb-6" />
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2.5">
                  <Label
                    htmlFor="currency"
                    className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                  >
                    Operating Currency
                  </Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger id="currency" className="bg-muted/30 focus:bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">
                        <span className="font-mono text-muted-foreground mr-2">USD</span> US Dollar
                      </SelectItem>
                      <SelectItem value="EUR">
                        <span className="font-mono text-muted-foreground mr-2">EUR</span> Euro
                      </SelectItem>
                      <SelectItem value="GBP">
                        <span className="font-mono text-muted-foreground mr-2">GBP</span> British Pound
                      </SelectItem>
                      <SelectItem value="JPY">
                        <span className="font-mono text-muted-foreground mr-2">JPY</span> Japanese Yen
                      </SelectItem>
                      <SelectItem value="IDR">
                        <span className="font-mono text-muted-foreground mr-2">IDR</span> Indonesian Rupiah
                      </SelectItem>
                      <SelectItem value="KSH">
                        <span className="font-mono text-muted-foreground mr-2">KSH</span> Kenyan Shilling
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between">
                    <Label
                      htmlFor="taxRate"
                      className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                    >
                      {currentConfig.taxSettings.taxLabel}
                    </Label>
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">Inclusive</span>
                  </div>
                  <div className="relative">
                    <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="taxRate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={taxRate}
                      onChange={e => setTaxRate(e.target.value)}
                      className="pl-9 bg-muted/30 focus:bg-background"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Preferences */}
        <Card className="border-muted/60 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-500/10 rounded-lg">
                <Settings2 className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">System Preferences</CardTitle>
                <CardDescription>Application behavior and workflow controls.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <Separator className="mb-0" />
          <CardContent className="divide-y divide-muted">
            {import.meta.env.MODE !== 'standalone' && (
              <div className="flex items-center justify-between py-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Defer Payment</Label>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-[300px]">
                    Allow staff to save orders to the system without collecting immediate payment.
                  </p>
                </div>
                <Switch checked={allowSaveUnpaidOrders} onCheckedChange={setAllowSaveUnpaidOrders} />
              </div>
            )}

            <div className="flex items-center justify-between py-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Power className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Auto-Start</Label>
                </div>
                <p className="text-xs text-muted-foreground max-w-[300px]">
                  Launch application automatically on system boot.
                </p>
              </div>
              <Switch checked={enableAutoStart} onCheckedChange={setEnableAutoStart} />
            </div>

            <div className="flex items-center justify-between py-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Autoprint Receipts</Label>
                </div>
                <p className="text-xs text-muted-foreground max-w-[300px]">
                  Automatically send receipt to printer after a successful sale.
                </p>
              </div>
              <Switch checked={autoPrintEnabled} onCheckedChange={setAutoPrintEnabled} />
            </div>

            {import.meta.env.MODE !== 'standalone' && (
              <div className="flex items-center justify-between py-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Allow Negative Stock</Label>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-[300px]">
                    Allow selling products even when local stock count reaches zero.
                  </p>
                </div>
                <Switch checked={allowNegativeStock} onCheckedChange={setAllowNegativeStock} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Connectivity Test */}
        <ConnectionTestCard />

        {/* Software Updates */}
        {import.meta.env.MODE !== 'standalone' && <SoftwareUpdatesCard />}
      </div>
    </TabsContent>
  );
}
