import React, { useState, useEffect } from 'react';
import { Button } from '@repo/ui/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@repo/ui/components/ui/card';
import { Switch } from '@repo/ui/components/ui/switch';
import { toast } from 'sonner';
import { useOrganization } from '@/lib/providers/organization-context';
import { useBakerySettingsManagement } from '@/hooks/bakery';
import { resetBakeryDevice } from '@/utils/reset';
import { Loader2, Settings, PackageCheck, RotateCcw, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  useOrganization();
  const { settings, updateSettingsAsync, isUpdating } = useBakerySettingsManagement();

  const [enableStaging, setEnableStaging] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (settings) {
      setEnableStaging(!!settings.enableProductionStaging);
    }
  }, [settings]);

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

  const handleResetDevice = async () => {
    if (
      window.confirm(
        'Are you sure you want to reset this device? This will clear all local session credentials, stored configuration, and returning the app to initial setup.'
      )
    ) {
      setIsResetting(true);
      try {
        await resetBakeryDevice();
      } catch (error: any) {
        toast.error(error?.message || 'Failed to reset device');
        setIsResetting(false);
      }
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

      {/* Device Management */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <RotateCcw className="h-5 w-5" />
            Device Management
          </CardTitle>
          <CardDescription>
            Manage device registration and local state. Resetting the device disconnects it from your bakery location.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-foreground">Reset Device Provisioning</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Clears the local credentials, API tokens, and device provisioning keys stored on this device. You will need to re-pair the device via your organization setup code.
                </p>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <Button
                variant="destructive"
                onClick={handleResetDevice}
                disabled={isResetting}
                className="gap-2"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Resetting Device...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    Reset Device
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
