'use client';

import { useState, useEffect } from 'react';
import { usePosStore } from '@/store/store';
import { businessConfigs, getDefaultSidebarItems, type BusinessType } from '@/lib/business-configs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ScanBarcode,
  Play,
  Square,
  RefreshCcw,
  Search,
  CreditCard,
  Smartphone,
  Monitor,
  DoorOpen,
  Plus,
  Trash,
  Image,
  Type,
  AlertTriangle,
  Palette,
  ShieldAlert,
  Check,
  LayoutGrid,
  Save,
  Building2,
  Bell,
  HardDrive,
  FileText,
  CloudUpload,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { invoke } from '@tauri-apps/api/core';
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart';
import { useScanner } from '@/hooks/use-scanner';
import { useCashDrawer } from '@/hooks/use-cash-drawer';
import PrinterSettings from '@/components/printer.config';
import { toast } from 'sonner';
import posthog from 'posthog-js';
import GeneralSettings from '@/components/settings/general-tab';
import LogsTab from '@/components/settings/logs-tab';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface HidDevice {
  vid: number;
  pid: number;
  name: string;
}
export default function SettingsPage() {
  const settings = usePosStore(state => state.settings);
  const updateBusinessSettings = usePosStore(state => state.updateBusinessSettings);
  const toggleSidebarItem = usePosStore(state => state.toggleSidebarItem);
  const changeBusinessType = usePosStore(state => state.changeBusinessType);
  const getBusinessConfig = usePosStore(state => state.getBusinessConfig);
  const updateThemeConfig = usePosStore(state => state.updateThemeConfig);
  const updateNotificationSettings = usePosStore(state => state.updateNotificationSettings);
  const updateCustomerDisplayConfig = usePosStore(state => state.updateCustomerDisplayConfig);
  const dangerouslyResetEverything = usePosStore(state => state.dangerouslyResetEverything);

  const [isWiping, setIsWiping] = useState(false);
  const [showConfirmWipe, setShowConfirmWipe] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const {
    vid,
    pid,
    setVid,
    setPid,
    startScanner,
    stopScanner,
    isScanning,
    isConnected,
    scanHistory,
    error: scannerError,
    clearHistory,
  } = useScanner();

  const {
    openPhysicalDrawer,
    getSerialPorts,
    availablePorts,
    isOpening: isOpeningDrawer,
    isLoadingPorts,
  } = useCashDrawer();

  const THEME_PRESETS = [
    { name: 'Default', primary: 'oklch(0.623 0.188 259.815)', accent: 'oklch(0.951 0.025 236.824)' }, // Default Purple
    { name: 'Ocean', primary: '#0ea5e9', accent: '#38bdf8' }, // Sky Blue
    { name: 'Forest', primary: '#22c55e', accent: '#86efac' }, // Green
    { name: 'Rose', primary: '#f43f5e', accent: '#fda4af' }, // Rose
    { name: 'Orange', primary: '#f97316', accent: '#fdba74' }, // Orange
    { name: 'Slate', primary: '#64748b', accent: '#cbd5e1' }, // Slate
  ];

  const applyPreset = (preset: (typeof THEME_PRESETS)[0]) => {
    updateThemeConfig({
      primaryColor: preset.primary,
      accentColor: preset.accent,
    });
    // Optional: Reset to light/dark if needed, but let's keep user preference
  };

  // 2. Local state for device discovery
  const [detectedDevices, setDetectedDevices] = useState<HidDevice[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 3. Helper to find devices via Rust
  const handleDetectDevices = async () => {
    setIsSearching(true);
    try {
      // Calls the Rust command: fn list_hid_devices
      const devices = await invoke<[number, number, string][]>('list_hid_devices');

      // Transform tuple to object for easier handling
      const mapped = devices.map(([vid, pid, name]) => ({ vid, pid, name }));
      setDetectedDevices(mapped);
    } catch (err) {
      console.error('Failed to list devices', err);
    } finally {
      setIsSearching(false);
    }
  };

  // 4. Helper to auto-fill inputs when a device is clicked
  const selectDevice = (device: HidDevice) => {
    // Convert decimal to Hex string (e.g. 59473 -> 0xE851)
    const vidHex = '0x' + device.vid.toString(16).toUpperCase();
    const pidHex = '0x' + device.pid.toString(16).toUpperCase();

    setVid(vidHex);
    setPid(pidHex);
    setDetectedDevices([]);
  };

  const [businessName, setBusinessName] = useState(settings?.businessName || '');
  const [businessType, setBusinessType] = useState<BusinessType>(settings?.businessType || 'restaurant');
  const [currency, setCurrency] = useState(settings?.currency || 'USD');
  const [taxRate, setTaxRate] = useState((settings?.taxRate ?? 0).toString());
  const [allowSaveUnpaidOrders, setAllowSaveUnpaidOrders] = useState(settings?.allowSaveUnpaidOrders ?? false);
  const [enableCustomerManagement, setEnableCustomerManagement] = useState(settings?.enableCustomerManagement ?? false);
  const [enableEmployeeManagement, setEnableEmployeeManagement] = useState(settings?.enableEmployeeManagement ?? false);
  const [enableLowStockAlerts, setEnableLowStockAlerts] = useState(settings?.enableLowStockAlerts ?? false);
  const [lowStockThreshold, setLowStockThreshold] = useState((settings?.lowStockThreshold ?? 10).toString());
  const [enableCashDrawer, setEnableCashDrawer] = useState(settings?.enableCashDrawer ?? false);
  const [requireEmployeePin, setRequireEmployeePin] = useState(settings?.requireEmployeePin ?? false);
  const [printerName] = useState(settings?.printerName || '');
  const [enableEmailReceipts] = useState(settings?.enableEmailReceipts ?? false);
  const [paybillNumber, setPaybillNumber] = useState(settings?.paybillNumber || '');
  const [tillNumber, setTillNumber] = useState(settings?.tillNumber || '');
  const [cashDrawerPort, setCashDrawerPort] = useState(settings?.cashDrawerPort || '');
  const [enableAutoStart, setEnableAutoStart] = useState(settings?.enableAutoStart ?? false);
  const [enableBarcodeScanner, setEnableBarcodeScanner] = useState(settings?.enableBarcodeScanner ?? true);

  // Multi-user / Shift Settings
  const [shareCartBetweenUsers, setShareCartBetweenUsers] = useState(settings?.shareCartBetweenUsers ?? true);
  const [shareShiftBetweenUsers, setShareShiftBetweenUsers] = useState(settings?.shareShiftBetweenUsers ?? true);
  const [enableAutoShiftPrompt, setEnableAutoShiftPrompt] = useState(settings?.enableAutoShiftPrompt ?? false);
  const [enforceShiftForCashPayments, setEnforceShiftForCashPayments] = useState(settings?.enforceShiftForCashPayments ?? false);

  // KDS Settings
  const [enableKdsSystem, setEnableKdsSystem] = useState(settings?.enableKdsSystem ?? false);

  // Hold Sale Settings
  const [enableHoldSale, setEnableHoldSale] = useState(settings?.enableHoldSale ?? true);
  const [maxHeldOrders, setMaxHeldOrders] = useState((settings?.maxHeldOrders ?? 20).toString());
  const [heldOrderExpiryHours, setHeldOrderExpiryHours] = useState((settings?.heldOrderExpiryHours ?? 24).toString());
  const [requireHoldReason, setRequireHoldReason] = useState(settings?.requireHoldReason ?? false);
  const currentConfig = getBusinessConfig();

  // Sync auto-start local state with OS setting on mount
  useEffect(() => {
    isEnabled()
      .then(enabled => {
        setEnableAutoStart(enabled);
      })
      .catch(err => console.error('Failed to check auto-start status', err));
  }, []);

  // Sync missing sidebar items from defaults (handles app updates for existing users)
  useEffect(() => {
    const defaultItems = getDefaultSidebarItems(businessType);
    const currentItems = settings.sidebarItems || [];
    const missingItems = defaultItems.filter(di => !currentItems.find(si => si.id === di.id));

    if (missingItems.length > 0) {
      updateBusinessSettings({
        sidebarItems: [...currentItems, ...missingItems],
      });
    }
  }, [businessType, settings.sidebarItems, updateBusinessSettings]);

  const handleSaveSettings = async () => {
    const newTaxRate = Number.parseFloat(taxRate) || 0;
    const newLowStockThreshold = Number.parseInt(lowStockThreshold, 10) || 10;
    const newMaxHeldOrders = Number.parseInt(maxHeldOrders, 10) || 20;
    const newHeldOrderExpiryHours = heldOrderExpiryHours ? Number.parseInt(heldOrderExpiryHours, 10) : undefined;

    updateBusinessSettings({
      businessName,
      currency,
      taxRate: newTaxRate,
      allowSaveUnpaidOrders,
      enableCustomerManagement,
      enableEmployeeManagement,
      enableLowStockAlerts,
      lowStockThreshold: newLowStockThreshold,
      enableCashDrawer,
      requireEmployeePin,
      printerName,
      enableEmailReceipts,
      paybillNumber,
      tillNumber,
      enableCustomerDisplay: settings.customerDisplayConfig?.enabled ?? true,
      cashDrawerPort,
      enableAutoStart,
      enableBarcodeScanner,
      enableKdsSystem,
      shareCartBetweenUsers,
      shareShiftBetweenUsers,
      enableAutoShiftPrompt,
      enforceShiftForCashPayments,
      enableHoldSale,
      maxHeldOrders: newMaxHeldOrders,
      heldOrderExpiryHours: newHeldOrderExpiryHours,
      requireHoldReason,
    });

    try {
      await invoke('set_customer_screen_enabled', { enabled: settings.customerDisplayConfig?.enabled ?? true });
    } catch (error) {
      console.error('Failed to toggle customer screen:', error);
      toast.error('Failed to toggle customer screen window');
    }

    // Update Auto-start OS setting
    try {
      if (enableAutoStart) {
        enable();
      } else {
        disable();
      }
    } catch (err) {
      console.error('Failed to update auto-start setting', err);
    }

    posthog.capture('settings_updated');
    toast.success('Settings saved successfully!');
  };

  const handleBusinessTypeChange = (newType: BusinessType) => {
    setBusinessType(newType);
    changeBusinessType(newType);
    const config = businessConfigs[newType];
    setTaxRate(config.taxSettings.defaultRate.toString());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex-1 overflow-y-auto p-6 lg:p-10 bg-muted/5 dark:bg-background"
    >
      <div className="mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Manage your business preferences and system configuration
            </p>
          </div>
          <Button
            onClick={handleSaveSettings}
            size="lg"
            className="shadow-md transition-all hover:scale-105 active:scale-95"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>

        <Tabs defaultValue="general" className="space-y-8">
          <div className="rounded-lg border bg-card/50 backdrop-blur-sm p-1 shadow-sm">
            <TabsList className="flex h-auto w-full flex-wrap gap-2 justify-start bg-transparent p-0">
              <TabsTrigger
                value="general"
                className="flex-1 min-w-[100px] h-10 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all"
              >
                <LayoutGrid className="h-4 w-4 mr-2" /> General
              </TabsTrigger>
              <TabsTrigger
                value="theme"
                className="flex-1 min-w-[100px] h-10 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all"
              >
                <Palette className="h-4 w-4 mr-2" /> Theme
              </TabsTrigger>
              {import.meta.env.MODE !== 'standalone' && (
                <TabsTrigger
                  value="enterprise"
                  className="flex-1 min-w-[100px] h-10 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all"
                >
                  <Building2 className="h-4 w-4 mr-2" /> Enterprise
                </TabsTrigger>
              )}
              <TabsTrigger
                value="notifications"
                className="flex-1 min-w-[100px] h-10 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all"
              >
                <Bell className="h-4 w-4 mr-2" /> Alerts
              </TabsTrigger>
              <TabsTrigger
                value="hardware"
                className="flex-1 min-w-[100px] h-10 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all"
              >
                <HardDrive className="h-4 w-4 mr-2" /> Hardware
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="flex-1 min-w-[100px] h-10 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all"
              >
                <CreditCard className="h-4 w-4 mr-2" /> Payments
              </TabsTrigger>
              <TabsTrigger
                value="customer-display"
                className="flex-1 min-w-[100px] h-10 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all"
              >
                <Monitor className="h-4 w-4 mr-2" /> Display
              </TabsTrigger>
              <TabsTrigger
                value="logs"
                className="flex-1 min-w-[100px] h-10 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all"
              >
                <FileText className="h-4 w-4 mr-2" /> Logs
              </TabsTrigger>
              <TabsTrigger
                value="danger"
                className="flex-1 min-w-[100px] h-10 text-destructive data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive data-[state=active]:shadow-none transition-all hover:text-destructive"
              >
                <ShieldAlert className="h-4 w-4 mr-2" /> Danger
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="general">
            <GeneralSettings
              businessName={businessName}
            setBusinessName={setBusinessName}
            businessType={businessType}
            handleBusinessTypeChange={handleBusinessTypeChange}
            businessConfigs={businessConfigs}
            currentConfig={currentConfig}
            currency={currency}
            setCurrency={setCurrency}
            taxRate={taxRate}
            setTaxRate={setTaxRate}
            allowSaveUnpaidOrders={allowSaveUnpaidOrders}
            setAllowSaveUnpaidOrders={setAllowSaveUnpaidOrders}
            enableAutoStart={enableAutoStart}
              setEnableAutoStart={setEnableAutoStart}
            />

            {import.meta.env.MODE === 'standalone' && (
              <Card className="mt-6 border-blue-100 bg-blue-50/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                    <CloudUpload className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Cloud Migration</h2>
                    <p className="text-sm text-muted-foreground">Push local data to your Dealio Cloud account</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-blue-200 text-blue-700 hover:bg-blue-100"
                  onClick={async () => {
                    try {
                      const res = await invoke<string>('push_local_to_cloud');
                      toast.success(res);
                    } catch (err: any) {
                      toast.error(err);
                    }
                  }}
                >
                  Sync to Cloud
                </Button>
              </Card>
            )}
          </TabsContent>

          <LogsTab />

          <TabsContent
            value="theme"
            className="space-y-6 focus-visible:outline-none data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:zoom-in-95"
          >
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-6 border-muted/60 shadow-sm relative overflow-hidden rounded-lg">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Palette className="w-24 h-24" />
                </div>
                <h2 className="text-xl font-semibold mb-1">Appearance</h2>
                <p className="text-sm text-muted-foreground mb-6">Customize how the application looks on this device</p>

                <div className="space-y-6">
                  <div className="grid gap-3">
                    <Label htmlFor="themeMode" className="text-base">
                      Theme Mode
                    </Label>
                    <div className="grid grid-cols-3 gap-3">
                      {['light', 'dark', 'system'].map(mode => (
                        <button
                          key={mode}
                          onClick={() => updateThemeConfig({ mode: mode as any })}
                          className={`
                            flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all
                            ${
                              (settings.themeConfig?.mode || 'light') === mode
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                            }
                          `}
                        >
                          {mode === 'light' && (
                            <div className="w-6 h-6 rounded-full border-2 border-current mb-2 bg-white" />
                          )}
                          {mode === 'dark' && (
                            <div className="w-6 h-6 rounded-full border-2 border-current mb-2 bg-slate-950" />
                          )}
                          {mode === 'system' && (
                            <div className="w-6 h-6 rounded-full border-2 border-current mb-2 bg-gradient-to-r from-white to-slate-950" />
                          )}
                          <span className="capitalize font-medium text-sm">{mode}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="zoomLevel" className="text-base">
                          Interface Scale
                        </Label>
                        <p className="text-sm text-muted-foreground">Adjust the size of text and elements</p>
                      </div>
                      <Badge variant="outline" className="text-sm px-3 py-1">
                        {settings.themeConfig?.zoomLevel ?? 100}%
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-lg border border-muted/50">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => {
                          const current = settings.themeConfig?.zoomLevel ?? 100;
                          if (current > 50) updateThemeConfig({ zoomLevel: current - 10 });
                        }}
                      >
                        <span className="text-lg font-bold">-</span>
                      </Button>
                      <div className="flex-1 px-2">
                        <input
                          type="range"
                          min="50"
                          max="150"
                          step="10"
                          value={settings.themeConfig?.zoomLevel ?? 100}
                          onChange={e => updateThemeConfig({ zoomLevel: parseInt(e.target.value) })}
                          className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground mt-2 font-mono">
                          <span>50%</span>
                          <span>100%</span>
                          <span>150%</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => {
                          const current = settings.themeConfig?.zoomLevel ?? 100;
                          if (current < 150) updateThemeConfig({ zoomLevel: current + 10 });
                        }}
                      >
                        <span className="text-lg font-bold">+</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateThemeConfig({ zoomLevel: 100 })}
                        className="text-xs shrink-0 ml-2"
                      >
                        Reset
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3 px-4 bg-muted/30 rounded-lg border border-muted/50">
                    <div className="flex-1">
                      <div className="font-medium">Compact Mode</div>
                      <p className="text-sm text-muted-foreground">Reduce spacing to show more content</p>
                    </div>
                    <Switch
                      checked={settings.themeConfig?.compactMode || false}
                      onCheckedChange={value => updateThemeConfig({ compactMode: value })}
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-muted/60 shadow-sm rounded-lg">
                <h2 className="text-xl font-semibold mb-1">Color Scheme</h2>
                <p className="text-sm text-muted-foreground mb-6">Define your brand colors</p>

                {/* Presets */}
                <div className="mb-8">
                  <Label className="block mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Quick Presets
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {THEME_PRESETS.map(preset => (
                      <button
                        key={preset.name}
                        onClick={() => applyPreset(preset)}
                        className="group relative flex items-center gap-3 p-2 rounded-lg border border-muted hover:border-primary/50 hover:bg-muted/50 transition-all text-left"
                      >
                        <div
                          className="w-8 h-8 rounded-full border border-border shadow-sm flex items-center justify-center shrink-0"
                          style={{ backgroundColor: preset.primary }}
                        >
                          {settings.themeConfig?.primaryColor === preset.primary && (
                            <Check className="w-4 h-4 text-white drop-shadow-md" />
                          )}
                        </div>
                        <span className="text-sm font-medium">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid gap-3">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex gap-3">
                      <div className="relative group cursor-pointer">
                        <div
                          className="w-10 h-10 rounded-lg border shadow-sm"
                          style={{ backgroundColor: settings.themeConfig?.primaryColor || '#6366f1' }}
                        />
                        <Input
                          id="primaryColor"
                          type="color"
                          value={
                            settings.themeConfig?.primaryColor?.startsWith('#')
                              ? settings.themeConfig.primaryColor
                              : '#6366f1'
                          }
                          onChange={e => updateThemeConfig({ primaryColor: e.target.value })}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                      </div>
                      <Input
                        value={settings.themeConfig?.primaryColor || 'Default'}
                        onChange={e => updateThemeConfig({ primaryColor: e.target.value })}
                        className="flex-1 font-mono text-sm"
                        placeholder="#000000 or oklch(...)"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Main brand color used for buttons and active states</p>
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="accentColor">Accent Color</Label>
                    <div className="flex gap-3">
                      <div className="relative group cursor-pointer">
                        <div
                          className="w-10 h-10 rounded-lg border shadow-sm"
                          style={{ backgroundColor: settings.themeConfig?.accentColor || '#f4f4f5' }}
                        />
                        <Input
                          id="accentColor"
                          type="color"
                          value={
                            settings.themeConfig?.accentColor?.startsWith('#')
                              ? settings.themeConfig.accentColor
                              : '#f4f4f5'
                          }
                          onChange={e => updateThemeConfig({ accentColor: e.target.value })}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                      </div>
                      <Input
                        value={settings.themeConfig?.accentColor || 'Default'}
                        onChange={e => updateThemeConfig({ accentColor: e.target.value })}
                        className="flex-1 font-mono text-sm"
                        placeholder="#000000 or oklch(...)"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Secondary color used for highlights and accents</p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="enterprise" className="space-y-6">
            {import.meta.env.MODE !== 'standalone' && (
              <Card className="p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Customer Management</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1">
                      <div className="font-medium">Enable Customer Management</div>
                      <p className="text-sm text-muted-foreground">
                        Track customer information, purchase history, and loyalty points
                      </p>
                    </div>
                    <Switch checked={enableCustomerManagement} onCheckedChange={setEnableCustomerManagement} />
                  </div>
                </div>
              </Card>
            )}

            {import.meta.env.MODE !== 'standalone' && (
              <Card className="p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Employee Management</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1">
                      <div className="font-medium">Enable Employee Management</div>
                      <p className="text-sm text-muted-foreground">
                        Manage employee accounts, roles, and access permissions
                      </p>
                    </div>
                    <Switch checked={enableEmployeeManagement} onCheckedChange={setEnableEmployeeManagement} />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1">
                      <div className="font-medium">Require Employee PIN</div>
                      <p className="text-sm text-muted-foreground">Employees must enter PIN to process transactions</p>
                    </div>
                    <Switch
                      checked={requireEmployeePin}
                      onCheckedChange={setRequireEmployeePin}
                      disabled={!enableEmployeeManagement}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1">
                      <div className="font-medium">Share Cart Between Users</div>
                      <p className="text-sm text-muted-foreground">If disabled, each user will have their own independent shopping cart</p>
                    </div>
                    <Switch
                      checked={shareCartBetweenUsers}
                      onCheckedChange={setShareCartBetweenUsers}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1">
                      <div className="font-medium">Share Shift Between Users</div>
                      <p className="text-sm text-muted-foreground">If disabled, each user must open and manage their own shift session</p>
                    </div>
                    <Switch
                      checked={shareShiftBetweenUsers}
                      onCheckedChange={setShareShiftBetweenUsers}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1">
                      <div className="font-medium">Auto-Prompt for Shift</div>
                      <p className="text-sm text-muted-foreground">Automatically prompt for a new shift opening after login if none is active</p>
                    </div>
                    <Switch
                      checked={enableAutoShiftPrompt}
                      onCheckedChange={setEnableAutoShiftPrompt}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1">
                      <div className="font-medium">Enforce Shift for Cash</div>
                      <p className="text-sm text-muted-foreground">Block cash payments if no active shift is found</p>
                    </div>
                    <Switch
                      checked={enforceShiftForCashPayments}
                      onCheckedChange={setEnforceShiftForCashPayments}
                    />
                  </div>
                </div>
              </Card>
            )}

            {import.meta.env.MODE !== 'standalone' && (
              <Card className="p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Inventory Management</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1">
                      <div className="font-medium">Enable Low Stock Alerts</div>
                      <p className="text-sm text-muted-foreground">Get notifications when products are running low</p>
                    </div>
                    <Switch checked={enableLowStockAlerts} onCheckedChange={setEnableLowStockAlerts} />
                  </div>

                  {enableLowStockAlerts && (
                    <div className="grid gap-2 pl-6">
                      <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                      <Input
                        id="lowStockThreshold"
                        type="number"
                        min="0"
                        value={lowStockThreshold}
                        onChange={e => setLowStockThreshold(e.target.value)}
                        placeholder="10"
                      />
                      <p className="text-xs text-muted-foreground">Alert when stock falls below this number</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {import.meta.env.MODE !== 'standalone' && (
              <Card className="p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Cash Management</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1">
                      <div className="font-medium">Enable Cash Drawer</div>
                      <p className="text-sm text-muted-foreground">Track cash drawer sessions and reconciliation</p>
                    </div>
                    <Switch checked={enableCashDrawer} onCheckedChange={setEnableCashDrawer} />
                  </div>
                </div>
              </Card>
            )}

            {import.meta.env.MODE !== 'standalone' && (
              <Card className="p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Kitchen Display System (KDS)</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1">
                      <div className="font-medium">Enable Kitchen Display System</div>
                      <p className="text-sm text-muted-foreground">Send orders to the KDS app automatically</p>
                    </div>
                    <Switch checked={enableKdsSystem} onCheckedChange={setEnableKdsSystem} />
                  </div>
                </div>
              </Card>
            )}

            {import.meta.env.MODE !== 'standalone' && (
              <Card className="p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Hold Sale</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1">
                      <div className="font-medium">Enable Hold Sale</div>
                      <p className="text-sm text-muted-foreground">Allow cashiers to temporarily hold transactions</p>
                    </div>
                    <Switch checked={enableHoldSale} onCheckedChange={setEnableHoldSale} />
                  </div>

                  {enableHoldSale && (
                    <>
                      <div className="grid grid-cols-2 gap-4 pl-6">
                        <div className="grid gap-2">
                          <Label htmlFor="maxHeldOrders">Max Held Orders</Label>
                          <Input
                            id="maxHeldOrders"
                            type="number"
                            min="1"
                            max="100"
                            value={maxHeldOrders}
                            onChange={e => setMaxHeldOrders(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">Limit concurrent held orders</p>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="heldOrderExpiryHours">Auto-Expire (Hours)</Label>
                          <Input
                            id="heldOrderExpiryHours"
                            type="number"
                            min="1"
                            value={heldOrderExpiryHours}
                            onChange={e => setHeldOrderExpiryHours(e.target.value)}
                            placeholder="Never"
                          />
                          <p className="text-xs text-muted-foreground">Time before orders auto-expire</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-2 pl-6">
                        <div className="flex-1">
                          <div className="font-medium">Require Hold Reason</div>
                          <p className="text-sm text-muted-foreground">
                            Force cashiers to enter a reason when holding an order
                          </p>
                        </div>
                        <Switch checked={requireHoldReason} onCheckedChange={setRequireHoldReason} />
                      </div>
                    </>
                  )}
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex-1">
                    <div className="font-medium">Enable Notifications</div>
                    <p className="text-sm text-muted-foreground">
                      Show system notifications for orders, alerts, and updates
                    </p>
                  </div>
                  <Switch
                    checked={settings.notificationSettings?.enabled ?? true}
                    onCheckedChange={value => updateNotificationSettings({ enabled: value })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between py-2">
                  <div className="flex-1">
                    <div className="font-medium">Enable Sound</div>
                    <p className="text-sm text-muted-foreground">Play sound when notifications appear</p>
                  </div>
                  <Switch
                    checked={settings.notificationSettings?.soundEnabled ?? true}
                    onCheckedChange={value => updateNotificationSettings({ soundEnabled: value })}
                    disabled={!settings.notificationSettings?.enabled}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Notification Types</h2>
              <p className="text-sm text-muted-foreground mb-4">Choose which types of notifications to receive</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex-1">
                    <div className="font-medium">Online Orders</div>
                    <p className="text-sm text-muted-foreground">Get notified when new online orders are placed</p>
                  </div>
                  <Switch
                    checked={settings.notificationSettings?.showOnlineOrders ?? true}
                    onCheckedChange={value => updateNotificationSettings({ showOnlineOrders: value })}
                    disabled={!settings.notificationSettings?.enabled}
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex-1">
                    <div className="font-medium">Low Stock Alerts</div>
                    <p className="text-sm text-muted-foreground">
                      Get notified when products are running low or out of stock
                    </p>
                  </div>
                  <Switch
                    checked={settings.notificationSettings?.showLowStock ?? true}
                    onCheckedChange={value => updateNotificationSettings({ showLowStock: value })}
                    disabled={!settings.notificationSettings?.enabled}
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex-1">
                    <div className="font-medium">System Alerts</div>
                    <p className="text-sm text-muted-foreground">
                      Get notified about system updates, warnings, and errors
                    </p>
                  </div>
                  <Switch
                    checked={settings.notificationSettings?.showSystemAlerts ?? true}
                    onCheckedChange={value => updateNotificationSettings({ showSystemAlerts: value })}
                    disabled={!settings.notificationSettings?.enabled}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Display Settings</h2>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="notificationPosition">Notification Position</Label>
                  <Select
                    value={settings.notificationSettings?.position || 'top-right'}
                    onValueChange={(value: any) => updateNotificationSettings({ position: value })}
                    disabled={!settings.notificationSettings?.enabled}
                  >
                    <SelectTrigger id="notificationPosition">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top-right">Top Right</SelectItem>
                      <SelectItem value="top-left">Top Left</SelectItem>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="autoCloseDelay">Auto Close Delay (milliseconds)</Label>
                  <Input
                    id="autoCloseDelay"
                    type="number"
                    min="1000"
                    step="1000"
                    value={settings.notificationSettings?.autoCloseDelay || 5000}
                    onChange={e => updateNotificationSettings({ autoCloseDelay: Number.parseInt(e.target.value) })}
                    disabled={!settings.notificationSettings?.enabled}
                  />
                  <p className="text-xs text-muted-foreground">
                    Time before notifications automatically disappear (min: 1000ms)
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">API Integration</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Configure your API endpoint to receive real-time notifications for online orders, inventory updates, and
                system events.
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Webhook Endpoint:</p>
                <code className="text-xs bg-background px-2 py-1 rounded">POST /api/notifications</code>
                <p className="text-xs text-muted-foreground mt-2">
                  Your API can send notifications with the following structure:
                </p>
                <pre className="text-xs bg-background p-2 rounded mt-2 overflow-auto">
                  {`{
                    "type": "order" | "stock" | "system",
                    "priority": "low" | "medium" | "high",
                    "title": "Notification Title",
                    "message": "Notification message",
                    "soundEnabled": true,
                    "autoClose": true,
                    "metadata": { /* custom data */ }
                  }`}
                </pre>
              </div>
            </Card>
          </TabsContent>

          <TabsContent
            value="hardware"
            className="space-y-6 focus-visible:outline-none data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:zoom-in-95"
          >
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Printer Section */}
              <div className="md:col-span-2 lg:col-span-3">
                <PrinterSettings />
              </div>

              {/* Scanner Section */}
              <div className="md:col-span-2 lg:col-span-3">
                <Card className="border-muted/60 shadow-sm overflow-hidden rounded-lg">
                  <div className="p-6 border-b bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg transition-colors ${enableBarcodeScanner ? 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' : 'bg-muted text-muted-foreground'}`}
                        >
                          <ScanBarcode className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold">Barcode Scanner</h2>
                          <p className="text-sm text-muted-foreground">Configure physical hardware scanner</p>
                        </div>
                      </div>
                      <Switch checked={enableBarcodeScanner} onCheckedChange={setEnableBarcodeScanner} />
                    </div>
                  </div>

                  {enableBarcodeScanner && (
                    <div className="p-6 space-y-6">
                      <div className="grid gap-6 lg:grid-cols-2">
                        <div className="space-y-4">
                          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border">
                            <div
                              className={`h-3 w-3 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`}
                            />
                            <div className="flex-1">
                              <div className="font-medium text-sm">
                                {isConnected ? 'Scanner Connected' : 'Scanner Disconnected'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {isConnected
                                  ? 'Device is ready to capture input'
                                  : 'Connect a device or check configuration'}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {!isScanning ? (
                                <Button
                                  size="sm"
                                  onClick={startScanner}
                                  disabled={!vid || !pid}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  <Play className="h-3 w-3 mr-2" /> Start
                                </Button>
                              ) : (
                                <Button size="sm" onClick={stopScanner} variant="destructive">
                                  <Square className="h-3 w-3 mr-2" /> Stop
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                Vendor ID
                              </Label>
                              <div className="relative">
                                <Input
                                  value={vid}
                                  onChange={e => setVid(e.target.value)}
                                  placeholder="0xE851"
                                  disabled={isScanning}
                                  className="font-mono bg-muted/30"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                Product ID
                              </Label>
                              <div className="relative">
                                <Input
                                  value={pid}
                                  onChange={e => setPid(e.target.value)}
                                  placeholder="0x2100"
                                  disabled={isScanning}
                                  className="font-mono bg-muted/30"
                                />
                              </div>
                            </div>
                          </div>

                          {scannerError && (
                            <div className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/10 p-3 rounded-md border border-rose-200 dark:border-rose-800 flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                              {scannerError}
                            </div>
                          )}

                          <div className="pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full justify-between"
                              onClick={handleDetectDevices}
                              disabled={isScanning || isSearching}
                            >
                              <span className="flex items-center gap-2">
                                {isSearching ? (
                                  <RefreshCcw className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Search className="h-3 w-3" />
                                )}
                                Auto-Detect Devices
                              </span>
                            </Button>

                            {detectedDevices.length > 0 && (
                              <div className="mt-2 border rounded-lg overflow-hidden divide-y bg-muted/10">
                                {detectedDevices.map((device, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => selectDevice(device)}
                                    className="w-full text-left p-3 text-xs hover:bg-primary/5 flex justify-between items-center group transition-colors"
                                  >
                                    <span className="truncate font-medium">{device.name || 'Unknown Device'}</span>
                                    <span className="text-muted-foreground group-hover:text-primary font-mono">
                                      {device.vid.toString(16).toUpperCase()}:{device.pid.toString(16).toUpperCase()}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Live Feed */}
                        <div className="bg-muted/30 rounded-lg border flex flex-col h-full min-h-[200px] overflow-hidden">
                          <div className="p-3 border-b bg-muted/20 flex justify-between items-center">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Live Input Feed
                            </span>
                            {scanHistory.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearHistory}
                                className="h-6 text-xs hover:text-destructive"
                              >
                                Clear
                              </Button>
                            )}
                          </div>
                          <div className="flex-1 p-0 overflow-y-auto max-h-[250px] relative">
                            {scanHistory.length === 0 ? (
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/40">
                                <ScanBarcode className="h-10 w-10 mb-2 stroke-1" />
                                <span className="text-sm">Scan a barcode to test</span>
                              </div>
                            ) : (
                              <div className="divide-y divide-muted/50">
                                {scanHistory.map((scan, i) => (
                                  <div
                                    key={i}
                                    className="flex justify-between p-3 text-sm animate-in fade-in slide-in-from-right-2"
                                  >
                                    <span className="font-mono font-medium text-primary">{scan.code}</span>
                                    <span className="text-xs text-muted-foreground">{scan.timestamp}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              {/* Cash Drawer Section */}
              <div className="md:col-span-2 lg:col-span-3">
                <Card className="p-6 border-muted/60 shadow-sm rounded-lg">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg transition-colors ${enableCashDrawer && cashDrawerPort ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}
                      >
                        <DoorOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold">Cash Drawer</h2>
                        <p className="text-sm text-muted-foreground">
                          {enableCashDrawer && cashDrawerPort
                            ? 'Connected via ' + cashDrawerPort
                            : 'Configure serial connection'}
                        </p>
                      </div>
                    </div>
                    <Switch checked={enableCashDrawer} onCheckedChange={setEnableCashDrawer} />
                  </div>

                  {enableCashDrawer && (
                    <div className="bg-muted/30 rounded-lg p-4 border grid gap-4 md:grid-cols-2 items-end">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Serial Port</Label>
                        <Select value={cashDrawerPort} onValueChange={setCashDrawerPort}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Port" />
                          </SelectTrigger>
                          <SelectContent>
                            {availablePorts.length === 0 ? (
                              <SelectItem value="none" disabled>
                                No ports detected
                              </SelectItem>
                            ) : (
                              availablePorts.map(port => (
                                <SelectItem key={port} value={port}>
                                  {port}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => getSerialPorts()}
                          disabled={isLoadingPorts}
                          className="flex-1"
                        >
                          {isLoadingPorts ? (
                            <RefreshCcw className="h-3 w-3 mr-2 animate-spin" />
                          ) : (
                            <Search className="h-3 w-3 mr-2" />
                          )}
                          Scan Ports
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => openPhysicalDrawer(cashDrawerPort)}
                          disabled={!cashDrawerPort || isOpeningDrawer}
                          className="flex-1"
                        >
                          {isOpeningDrawer ? (
                            <RefreshCcw className="h-3 w-3 mr-2 animate-spin" />
                          ) : (
                            <DoorOpen className="h-3 w-3 mr-2" />
                          )}
                          Test Open
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="payments"
            className="space-y-6 focus-visible:outline-none data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:zoom-in-95"
          >
            <Card className="p-6 border-muted/60 shadow-sm relative overflow-hidden rounded-lg">
              <div className="absolute top-0 right-0 p-6 opacity-5">
                <CreditCard className="w-32 h-32" />
              </div>
              <div className="flex items-center gap-4 mb-8 relative">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Mobile Money</h2>
                  <p className="text-sm text-muted-foreground">Configure M-Pesa interactions and numbers</p>
                </div>
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="flex items-center justify-between">
                      <span>Paybill Number</span>
                      <span className="text-[10px] bg-muted px-2 py-0.5 rounded uppercase font-medium">Business</span>
                    </Label>
                    <Input
                      value={paybillNumber}
                      onChange={e => setPaybillNumber(e.target.value)}
                      placeholder="e.g. 522522"
                      className="h-12 text-lg font-mono tracking-widest"
                    />
                    <p className="text-xs text-muted-foreground">
                      Used for standard business-to-business or customer-to-business payments
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label className="flex items-center justify-between">
                      <span>Till Number</span>
                      <span className="text-[10px] bg-muted px-2 py-0.5 rounded uppercase font-medium">Buy Goods</span>
                    </Label>
                    <Input
                      value={tillNumber}
                      onChange={e => setTillNumber(e.target.value)}
                      placeholder="e.g. 765432"
                      className="h-12 text-lg font-mono tracking-widest"
                    />
                    <p className="text-xs text-muted-foreground">Used for direct 'Buy Goods' merchant payments</p>
                  </div>
                </div>

                <div className="bg-slate-950 rounded-lg p-6 text-white relative overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800" />
                  <div className="absolute -right-10 -bottom-10 h-40 w-40 bg-emerald-500/10 rounded-full blur-3xl" />

                  <div className="relative z-10 h-full flex flex-col justify-between space-y-8">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-lg text-emerald-400">Payment Preview</h4>
                        <p className="text-slate-400 text-sm">Customer View</p>
                      </div>
                      <Smartphone className="h-6 w-6 text-slate-500" />
                    </div>

                    <div className="space-y-4">
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="text-xs text-slate-400 mb-1">Paybill Mode</div>
                        <div className={`font-mono text-lg ${paybillNumber ? 'text-white' : 'text-slate-600'}`}>
                          {paybillNumber || 'Not Configured'}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="text-xs text-slate-400 mb-1">Buy Goods Mode</div>
                        <div className={`font-mono text-lg ${tillNumber ? 'text-white' : 'text-slate-600'}`}>
                          {tillNumber || 'Not Configured'}
                        </div>
                      </div>
                    </div>

                    {!paybillNumber && !tillNumber && (
                      <div className="flex items-center gap-2 text-amber-400 text-xs bg-amber-500/10 p-2 rounded">
                        <AlertTriangle className="h-3 w-3" /> Config Required
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent
            value="customer-display"
            className="space-y-6 focus-visible:outline-none data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:zoom-in-95"
          >
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-6 border-muted/60 shadow-sm md:col-span-2 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold mb-1">Second Screen Configuration</h2>
                    <p className="text-sm text-muted-foreground">Manage the customer-facing display content</p>
                  </div>
                  <Switch
                    checked={settings.customerDisplayConfig?.enabled ?? true}
                    onCheckedChange={val => updateCustomerDisplayConfig({ enabled: val })}
                  />
                </div>
              </Card>

              {settings.customerDisplayConfig?.enabled !== false && (
                <>
                  <Card className="p-6 border-muted/60 shadow-sm space-y-6 rounded-lg">
                    <h3 className="font-medium flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wide">
                      <Monitor className="h-4 w-4" /> Global Settings
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Welcome Headline</Label>
                        <Input
                          value={settings.customerDisplayConfig?.welcomeMessage || ''}
                          onChange={e => updateCustomerDisplayConfig({ welcomeMessage: e.target.value })}
                          placeholder="e.g. Welcome to Dealio"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Sub-Headline</Label>
                        <Input
                          value={settings.customerDisplayConfig?.subMessage || ''}
                          onChange={e => updateCustomerDisplayConfig({ subMessage: e.target.value })}
                          placeholder="e.g. We're glad you're here"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                          <span className="text-sm font-medium">Show Clock</span>
                          <Switch
                            checked={settings.customerDisplayConfig?.showTime ?? true}
                            onCheckedChange={val => updateCustomerDisplayConfig({ showTime: val })}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                          <span className="text-sm font-medium">Show Logo</span>
                          <Switch
                            checked={settings.customerDisplayConfig?.showCompanyLogo ?? true}
                            onCheckedChange={val => updateCustomerDisplayConfig({ showCompanyLogo: val })}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 border-muted/60 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wide">
                        <Image className="h-4 w-4" /> Promo Slides
                      </h3>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs whitespace-nowrap">Duration (s)</Label>
                        <Input
                          type="number"
                          min="3"
                          className="w-16 h-8"
                          value={settings.customerDisplayConfig?.slideIntervalSeconds || 8}
                          onChange={e =>
                            updateCustomerDisplayConfig({ slideIntervalSeconds: Number.parseInt(e.target.value) || 8 })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                      {settings.customerDisplayConfig?.promoSlides?.map((slide, idx) => (
                        <div
                          key={slide.id || idx}
                          className="group p-3 border rounded-lg bg-card hover:border-primary/50 transition-colors relative"
                        >
                          <div className="flex gap-3 items-start">
                            <div
                              className={`h-12 w-12 rounded-md shrink-0 flex items-center justify-center text-white ${slide.background.startsWith('bg-') ? slide.background : 'bg-slate-500'}`}
                            >
                              {slide.type === 'qr' ? <ScanBarcode className="h-6 w-6" /> : <Type className="h-6 w-6" />}
                            </div>
                            <div className="grid gap-2 flex-1">
                              <Input
                                value={slide.title}
                                onChange={e => {
                                  const newSlides = [...(settings.customerDisplayConfig?.promoSlides || [])];
                                  newSlides[idx] = { ...newSlides[idx], title: e.target.value };
                                  updateCustomerDisplayConfig({ promoSlides: newSlides });
                                }}
                                className="h-8 font-semibold border-none bg-transparent px-0 focus-visible:ring-0 p-0"
                                placeholder="Slide Title"
                              />
                              <Input
                                value={slide.subtitle}
                                onChange={e => {
                                  const newSlides = [...(settings.customerDisplayConfig?.promoSlides || [])];
                                  newSlides[idx] = { ...newSlides[idx], subtitle: e.target.value };
                                  updateCustomerDisplayConfig({ promoSlides: newSlides });
                                }}
                                className="h-6 text-xs text-muted-foreground border-none bg-transparent px-0 focus-visible:ring-0"
                                placeholder="Slide Subtitle"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                const newSlides = settings.customerDisplayConfig!.promoSlides.filter(
                                  (_, i) => i !== idx
                                );
                                updateCustomerDisplayConfig({ promoSlides: newSlides });
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Extra control for QR */}
                          {slide.type === 'qr' && (
                            <div className="mt-3 pt-3 border-t">
                              <Input
                                value={slide.payload || ''}
                                placeholder="Enter QR Code URL/Data..."
                                className="h-8 text-xs font-mono"
                                onChange={e => {
                                  const newSlides = [...(settings.customerDisplayConfig?.promoSlides || [])];
                                  newSlides[idx] = { ...newSlides[idx], payload: e.target.value };
                                  updateCustomerDisplayConfig({ promoSlides: newSlides });
                                }}
                              />
                            </div>
                          )}

                          {/* Type Toggle - Mini */}
                          <div className="absolute top-2 right-10">
                            <Select
                              value={slide.type}
                              onValueChange={(val: any) => {
                                const newSlides = [...(settings.customerDisplayConfig?.promoSlides || [])];
                                newSlides[idx] = { ...newSlides[idx], type: val };
                                updateCustomerDisplayConfig({ promoSlides: newSlides });
                              }}
                            >
                              <SelectTrigger className="h-6 w-16 text-[10px] px-1 bg-muted/50 border-none">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="icon">Icon</SelectItem>
                                <SelectItem value="qr">QR</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}

                      <Button
                        variant="outline"
                        className="w-full border-dashed text-muted-foreground hover:text-primary hover:border-primary"
                        onClick={() => {
                          const newSlide: any = {
                            id: `slide_${Date.now()}`,
                            type: 'icon',
                            title: 'New Promotion',
                            subtitle: 'Great deals available today',
                            iconName: 'Store',
                            background: 'bg-gradient-to-br from-indigo-500 to-purple-600',
                            textColor: 'text-white',
                            enabled: true,
                          };
                          const currentSlides = settings.customerDisplayConfig?.promoSlides || [];
                          updateCustomerDisplayConfig({ promoSlides: [...currentSlides, newSlide] });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Slide
                      </Button>
                    </div>
                  </Card>
                </>
              )}
            </div>
            
            {import.meta.env.MODE !== 'standalone' && (
              <Card className="border-muted/60 shadow-sm p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <LayoutGrid className="h-5 w-5 text-slate-700 dark:text-slate-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Sidebar Navigation</h2>
                    <p className="text-sm text-muted-foreground">Customize which menu items are visible</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {settings.sidebarItems.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="font-medium">{item.label}</div>
                      <Switch checked={item.enabled} onCheckedChange={() => toggleSidebarItem(item.id)} />
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>


          <TabsContent
            value="danger"
            className="space-y-6 focus-visible:outline-none data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:zoom-in-95"
          >
            <div className="border border-destructive/20 bg-destructive/5 rounded-lg p-8 max-w-4xl mx-auto">
              <div className="flex flex-col items-center text-center space-y-4 mb-8">
                <div className="p-4 rounded-full bg-destructive/10 text-destructive">
                  <ShieldAlert className="h-10 w-10" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-destructive">Danger Zone</h2>
                  <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                    Actions here are destructive and cannot be undone. Please proceed with caution.
                  </p>
                </div>
              </div>

              <Card className="border-destructive/30 shadow-none overflow-hidden rounded-lg">
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Factory Reset & Data Wipe</h3>
                    <p className="text-sm text-muted-foreground max-w-lg">
                      Permanently remove all local data, including transaction history, customer records, and inventory.
                      This device will need to be re-initialized.
                    </p>
                  </div>
                  <Button variant="destructive" size="lg" onClick={() => setShowConfirmWipe(true)} className="shrink-0">
                    Delete Everything
                  </Button>
                </div>
                <div className="bg-destructive/10 px-6 py-3 text-xs font-mono text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3" />
                  IRREVERSIBLE ACTION
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <AlertDialog open={showConfirmWipe} onOpenChange={setShowConfirmWipe}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Factory Reset Confirmation
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-4 pt-4">
                <p>
                  This action is <strong>IRREVERSIBLE</strong>. It will permanently delete:
                </p>
                <div className="bg-destructive/5 p-4 rounded-lg border border-destructive/10">
                  <ul className="list-disc list-inside space-y-1 text-sm text-destructive font-medium">
                    <li>Local Product Database</li>
                    <li>Customer Records</li>
                    <li>Sales & Transaction History</li>
                    <li>Device Key & API Configuration</li>
                    <li>All App Settings</li>
                  </ul>
                </div>
                <div>
                  <Label className="mb-2 block">
                    Type <span className="font-bold font-mono text-destructive select-all">DELETE</span> to confirm:
                  </Label>
                  <Input
                    value={confirmText}
                    onChange={e => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="font-mono tracking-widest border-destructive/30 focus-visible:ring-destructive/30"
                    autoFocus
                  />
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmText('')}>Cancel</AlertDialogCancel>
              <Button
                variant="destructive"
                disabled={confirmText !== 'DELETE' || isWiping}
                onClick={async () => {
                  setIsWiping(true);
                  try {
                    toast.loading('Wiping data & resetting...');
                    await invoke('dangerously_clear_all_data');
                    dangerouslyResetEverything();
                    toast.success('System reset complete. Restarting...');
                    setTimeout(() => {
                      window.location.reload();
                    }, 1500);
                  } catch (err) {
                    console.error('Wipe failed:', err);
                    toast.error('Failed to complete system wipe');
                    setIsWiping(false);
                  }
                }}
              >
                {isWiping ? 'Resetting...' : 'Yes, Delete Everything'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="flex justify-end pt-6 border-t">
          <Button onClick={handleSaveSettings} size="lg" className="min-w-[200px] shadow-lg">
            <Save className="h-4 w-4 mr-2" />
            Save All Settings
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
