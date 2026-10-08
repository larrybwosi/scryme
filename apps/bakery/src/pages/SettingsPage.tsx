import React, { useState, useEffect } from "react";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select";
import { Switch } from "@repo/ui/components/ui/switch";
import { toast } from "sonner";
import { useOrganization } from "@/lib/providers/organization-context";
import { useUpdater } from "@/lib/providers/UpdateProvider";
import { useBakerySettingsManagement } from "@/hooks/bakery";
import { resetBakeryDevice } from "@/utils/reset";
import { 
  AlertTriangle, 
  Hash, 
  Loader2, 
  PackageCheck, 
  RefreshCw, 
  RotateCcw, 
  Save, 
  Settings, 
  Sparkles 
} from "lucide-react";

export default function SettingsPage() {
  useOrganization();
  const { settings, updateSettingsAsync, isUpdating } = useBakerySettingsManagement();
  const { checkForUpdates, status, availableVersion, isUpdateAvailable, openModal } = useUpdater();

  const [enableStaging, setEnableStaging] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Batch Numbering State
  const [batchPrefix, setBatchPrefix] = useState("BAT");
  const [batchGenerationType, setBatchGenerationType] = useState("SEQUENCE");
  const [batchSeparator, setBatchSeparator] = useState("-");
  const [batchDateFormat, setBatchDateFormat] = useState("YYYYMMDD");
  const [batchSequence, setBatchSequence] = useState("4");
  const [isSavingBatchSettings, setIsSavingBatchSettings] = useState(false);

  useEffect(() => {
    if (settings) {
      setEnableStaging(!!settings.enableProductionStaging);
      if (settings.batchPrefix !== undefined) setBatchPrefix(settings.batchPrefix || "BAT");
      if (settings.batchSeparator !== undefined) setBatchSeparator(settings.batchSeparator ?? "-");
      if (settings.batchDateFormat !== undefined) setBatchDateFormat(settings.batchDateFormat || "YYYYMMDD");
      if (settings.batchSequence !== undefined) setBatchSequence(String(settings.batchSequence || "4"));
      if (settings.batchGenerationType !== undefined) setBatchGenerationType(settings.batchGenerationType || "SEQUENCE");
    }
  }, [settings]);

  const handleToggleStaging = async (checked: boolean) => {
    setEnableStaging(checked);
    try {
      await updateSettingsAsync({ enableProductionStaging: checked });
      toast.success(
        checked
          ? "Production staging enabled. Completed batches will now require dispatch to Front Office."
          : "Production staging disabled. Completed batches will directly update POS stock."
      );
    } catch (err: any) {
      setEnableStaging(!checked);
      toast.error(err?.message || "Failed to update staging setting");
    }
  };

  const getBatchPreview = () => {
    const now = new Date();
    let dateStr = "";
    if (batchDateFormat === "YYYYMMDD") {
      dateStr = now.toISOString().split("T")[0].replace(/-/g, "");
    } else if (batchDateFormat === "YYMM") {
      dateStr = now.getFullYear().toString().slice(-2) + (now.getMonth() + 1).toString().padStart(2, "0");
    }

    const seqLen = parseInt(batchSequence || "4") || 4;
    const codePart = batchGenerationType === "RANDOM" ? "X".repeat(seqLen) : "1".padStart(seqLen, "0");

    const parts = [batchPrefix, dateStr, codePart].filter(Boolean);
    return parts.join(batchSeparator);
  };

  const handleSaveBatchSettings = async () => {
    setIsSavingBatchSettings(true);
    try {
      await updateSettingsAsync({
        batchPrefix,
        batchSeparator,
        batchDateFormat,
        batchSequence,
        batchGenerationType,
      });
      toast.success("Batch numbering configuration updated successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save batch numbering configuration");
    } finally {
      setIsSavingBatchSettings(false);
    }
  };

  const handleCheckUpdates = async () => {
    try {
      await checkForUpdates();
      if (!isUpdateAvailable) {
        toast.info('You are running the latest version of Scryme Bakery.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to check for updates');
    }
  };

  const handleResetDevice = async () => {
    if (
      window.confirm(
        "Are you sure you want to reset this device? This will clear all local session credentials, stored configuration, and returning the app to initial setup."
      )
    ) {
      setIsResetting(true);
      try {
        await resetBakeryDevice();
      } catch (error: any) {
        toast.error(error?.message || "Failed to reset device");
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

      {/* Batch Numbering Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Hash className="h-5 w-5 text-primary" />
            Batch Auto-Numbering Customization
          </CardTitle>
          <CardDescription>
            Customize the format structure for automatically generated production batch numbers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 border border-primary/20 bg-primary/5 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Sample Generated Batch Number
              </span>
              <span className="text-lg font-bold font-mono text-primary mt-1 block">
                {getBatchPreview()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="batchPrefix" className="text-xs font-semibold text-muted-foreground uppercase">
                Batch Prefix
              </Label>
              <Input
                id="batchPrefix"
                value={batchPrefix}
                onChange={(e) => setBatchPrefix(e.target.value)}
                placeholder="e.g. BAT"
                disabled={isSavingBatchSettings || isUpdating}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="batchSeparator" className="text-xs font-semibold text-muted-foreground uppercase">
                Separator
              </Label>
              <Select
                value={batchSeparator}
                onValueChange={setBatchSeparator}
                disabled={isSavingBatchSettings || isUpdating}
              >
                <SelectTrigger id="batchSeparator">
                  <SelectValue placeholder="Select separator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-">Hyphen (-)</SelectItem>
                  <SelectItem value="/">Slash (/)</SelectItem>
                  <SelectItem value="_">Underscore (_)</SelectItem>
                  <SelectItem value="">None (Empty)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="batchDateFormat" className="text-xs font-semibold text-muted-foreground uppercase">
                Date Format
              </Label>
              <Select
                value={batchDateFormat}
                onValueChange={setBatchDateFormat}
                disabled={isSavingBatchSettings || isUpdating}
              >
                <SelectTrigger id="batchDateFormat">
                  <SelectValue placeholder="Select date format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YYYYMMDD">YYYYMMDD (e.g., 20250520)</SelectItem>
                  <SelectItem value="YYMM">YYMM (e.g., 2505)</SelectItem>
                  <SelectItem value="NONE">None (No date in batch number)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="batchGenerationType" className="text-xs font-semibold text-muted-foreground uppercase">
                Generation Mode
              </Label>
              <Select
                value={batchGenerationType}
                onValueChange={setBatchGenerationType}
                disabled={isSavingBatchSettings || isUpdating}
              >
                <SelectTrigger id="batchGenerationType">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEQUENCE">Sequence (Incremental)</SelectItem>
                  <SelectItem value="RANDOM">Random (Alphanumeric)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="batchSequence" className="text-xs font-semibold text-muted-foreground uppercase">
                Code Digits Length
              </Label>
              <Select
                value={batchSequence}
                onValueChange={setBatchSequence}
                disabled={isSavingBatchSettings || isUpdating}
              >
                <SelectTrigger id="batchSequence">
                  <SelectValue placeholder="Select sequence length" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Digits / Chars</SelectItem>
                  <SelectItem value="4">4 Digits / Chars</SelectItem>
                  <SelectItem value="5">5 Digits / Chars</SelectItem>
                  <SelectItem value="6">6 Digits / Chars</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSaveBatchSettings}
              disabled={isSavingBatchSettings || isUpdating}
              className="gap-2"
            >
              {isSavingBatchSettings ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Configuration...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Batch Numbering
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

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

      {/* Application Updates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <RefreshCw className="h-5 w-5 text-primary" />
            Software Updates
          </CardTitle>
          <CardDescription>
            Check for and install application updates for Scryme Bakery Desktop.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
            <div className="space-y-0.5">
              <label className="text-sm font-semibold text-foreground block">
                Check for Updates
              </label>
              <p className="text-xs text-muted-foreground">
                {isUpdateAvailable && availableVersion
                  ? `Version ${availableVersion} is available for installation.`
                  : 'Ensure your app is running the latest features and security updates.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isUpdateAvailable ? (
                <Button variant="default" onClick={openModal} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  View Update
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleCheckUpdates}
                  disabled={status === 'CHECKING'}
                  className="gap-2"
                >
                  {status === 'CHECKING' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Check Updates
                    </>
                  )}
                </Button>
              )}
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