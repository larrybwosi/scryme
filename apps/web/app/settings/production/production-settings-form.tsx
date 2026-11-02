"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select";
import { Switch } from "@repo/ui/components/ui/switch";
import { Loader2, Save, Hash, PackageCheck } from "lucide-react";
import { updateProductionSettingsAction } from "@/app/actions/production-settings";
import { toast } from "sonner";

interface Props {
  initialSettings: any;
}

export function ProductionSettingsForm({ initialSettings }: Props) {
  const [batchPrefix, setBatchPrefix] = useState(initialSettings?.batchPrefix || "BAT");
  const [batchSeparator, setBatchSeparator] = useState(initialSettings?.batchSeparator ?? "-");
  const [batchDateFormat, setBatchDateFormat] = useState(initialSettings?.batchDateFormat || "YYYYMMDD");
  const [batchGenerationType, setBatchGenerationType] = useState(initialSettings?.batchGenerationType || "SEQUENCE");
  const [batchSequence, setBatchSequence] = useState(initialSettings?.batchSequence || "4");
  const [enableStaging, setEnableStaging] = useState(initialSettings?.enableProductionStaging ?? false);
  const [autoApproveBatches, setAutoApproveBatches] = useState(initialSettings?.autoApproveBatches ?? false);
  const [lowStockAlerts, setLowStockAlerts] = useState(initialSettings?.lowStockAlerts ?? true);
  const [isSaving, setIsSaving] = useState(false);

  const previewBatchNumber = () => {
    const now = new Date();
    let dateStr = "";
    if (batchDateFormat === "YYYYMMDD") {
      dateStr = now.toISOString().split("T")[0].replace(/-/g, "");
    } else if (batchDateFormat === "YYMM") {
      dateStr = now.getFullYear().toString().slice(-2) + (now.getMonth() + 1).toString().padStart(2, "0");
    }

    const len = parseInt(batchSequence || "4", 10);
    const code = batchGenerationType === "RANDOM" ? "A7B9" : "1".padStart(len, "0");

    const parts = [batchPrefix, dateStr, code].filter(Boolean);
    return parts.join(batchSeparator);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await updateProductionSettingsAction({
        batchPrefix,
        batchSeparator,
        batchDateFormat,
        batchGenerationType,
        batchSequence,
        enableProductionStaging: enableStaging,
        autoApproveBatches,
        lowStockAlerts,
      });

      if (res.success) {
        toast.success("Production settings saved successfully");
      } else {
        toast.error(res.error || "Failed to save production settings");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Batch Numbering Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Hash className="h-5 w-5 text-primary" />
            Batch Numbering & Identification Rules
          </CardTitle>
          <CardDescription>
            Configure standard automated batch numbering for all manufacturing and kitchen runs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-semibold text-primary">Live Code Preview</span>
              <p className="text-xl font-mono font-bold text-foreground mt-0.5">
                {previewBatchNumber()}
              </p>
            </div>
            <div className="text-right text-xs text-muted-foreground hidden sm:block">
              Auto-generated for new production batches
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="batchPrefix" className="text-xs font-semibold text-muted-foreground uppercase">
                Batch Prefix
              </Label>
              <Input
                id="batchPrefix"
                value={batchPrefix}
                onChange={(e) => setBatchPrefix(e.target.value)}
                placeholder="e.g. BAT"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="batchSeparator" className="text-xs font-semibold text-muted-foreground uppercase">
                Separator
              </Label>
              <Select value={batchSeparator} onValueChange={setBatchSeparator} disabled={isSaving}>
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
              <Select value={batchDateFormat} onValueChange={setBatchDateFormat} disabled={isSaving}>
                <SelectTrigger id="batchDateFormat">
                  <SelectValue placeholder="Select date format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YYYYMMDD">YYYYMMDD (e.g., 20261103)</SelectItem>
                  <SelectItem value="YYMM">YYMM (e.g., 2611)</SelectItem>
                  <SelectItem value="NONE">None (No date in batch number)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="batchGenerationType" className="text-xs font-semibold text-muted-foreground uppercase">
                Generation Mode
              </Label>
              <Select value={batchGenerationType} onValueChange={setBatchGenerationType} disabled={isSaving}>
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
              <Select value={batchSequence} onValueChange={setBatchSequence} disabled={isSaving}>
                <SelectTrigger id="batchSequence">
                  <SelectValue placeholder="Select length" />
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
        </CardContent>
      </Card>

      {/* Operational & Staging Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PackageCheck className="h-5 w-5 text-primary" />
            Operational & Staging Rules
          </CardTitle>
          <CardDescription>
            Configure dispatch workflows, batch approval gates, and raw material monitoring.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
            <div className="space-y-0.5 max-w-lg">
              <label className="text-sm font-semibold text-foreground block">
                Enable Production Staging & Dispatch
              </label>
              <p className="text-xs text-muted-foreground">
                When enabled, completed production batches enter a staged holding zone before dispatch to sales or retail inventory.
              </p>
            </div>
            <Switch
              checked={enableStaging}
              onCheckedChange={setEnableStaging}
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
            <div className="space-y-0.5 max-w-lg">
              <label className="text-sm font-semibold text-foreground block">
                Auto-Approve Batches
              </label>
              <p className="text-xs text-muted-foreground">
                Automatically approve completed runs without requiring a separate quality assurance sign-off.
              </p>
            </div>
            <Switch
              checked={autoApproveBatches}
              onCheckedChange={setAutoApproveBatches}
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
            <div className="space-y-0.5 max-w-lg">
              <label className="text-sm font-semibold text-foreground block">
                Low Stock Alerts
              </label>
              <p className="text-xs text-muted-foreground">
                Warn operators during batch scaling if required raw ingredients fall below safe reorder thresholds.
              </p>
            </div>
            <Switch
              checked={lowStockAlerts}
              onCheckedChange={setLowStockAlerts}
              disabled={isSaving}
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Production Configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
