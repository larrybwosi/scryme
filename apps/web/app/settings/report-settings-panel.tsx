"use client";

import { useState, useTransition, useEffect } from "react";
import {
  FileText,
  Mail,
  Send,
  Sparkles,
  Clock,
  Check,
  Plus,
  X,
  Loader2,
  Layers,
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Switch } from "@repo/ui/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select";
import { Badge } from "@repo/ui/components/ui/badge";
import { toast } from "sonner";
import { getReportSettingsAction, updateReportSettingsAction, triggerTestReportAction } from "@/app/actions/reports";

export function ReportSettingsPanel() {
  const [isPending, startTransition] = useTransition();
  const [isTestPending, startTestTransition] = useTransition();
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState<any>({
    emailEnabled: true,
    scrymeEnabled: true,
    recipients: [],
    scrymeChannel: "reports",
    scheduleEnabled: true,
    frequency: "WEEKLY",
    dayOfWeek: 1,
    timeOfDay: "08:00",
    timezone: "UTC",
    includeSales: true,
    includeInventory: true,
    includeProduction: true,
    includeTax: true,
    includeAiInsights: true,
  });

  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    async function fetchSettings() {
      try {
        const data = await getReportSettingsAction();
        if (data) {
          setSettings(data);
        }
      } catch (err: any) {
        toast.error("Failed to load report settings");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = () => {
    startTransition(async () => {
      try {
        const res = await updateReportSettingsAction(settings);
        if (res.success) {
          toast.success("Report settings updated successfully");
        }
      } catch (err: any) {
        toast.error("Failed to update report settings");
      }
    });
  };

  const handleTriggerTest = () => {
    startTestTransition(async () => {
      try {
        const res = await triggerTestReportAction({ days: 7 });
        if (res.success) {
          toast.success("Test report generated & dispatched to enabled channels!");
        } else {
          toast.error("Failed to dispatch test report");
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to trigger report test");
      }
    });
  };

  const addRecipient = () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (settings.recipients.includes(newEmail.trim())) {
      toast.error("Email address is already in recipients list");
      return;
    }
    setSettings((prev: any) => ({
      ...prev,
      recipients: [...prev.recipients, newEmail.trim()],
    }));
    setNewEmail("");
  };

  const removeRecipient = (email: string) => {
    setSettings((prev: any) => ({
      ...prev,
      recipients: prev.recipients.filter((e: string) => e !== email),
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading report settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-card/50">
        <div>
          <h3 className="font-semibold text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" /> Executive Automated Reports & Delivery
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure automated report schedules, recipient emails, ScrymeChat notifications, and AI executive summaries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTriggerTest}
            disabled={isTestPending}
            className="text-xs gap-1.5"
          >
            {isTestPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 text-indigo-500" />}
            Send Test Report Now
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isPending}
            className="text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Save Report Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl border bg-card space-y-4">
          <div className="flex items-center gap-2 font-medium text-sm border-b pb-3">
            <Mail className="w-4 h-4 text-indigo-500" /> Delivery Channels
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Email Dispatch</Label>
              <p className="text-xs text-muted-foreground">Send formatted HTML performance summaries via email.</p>
            </div>
            <Switch
              checked={settings.emailEnabled}
              onCheckedChange={(checked) => setSettings((p: any) => ({ ...p, emailEnabled: checked }))}
            />
          </div>

          {settings.emailEnabled && (
            <div className="space-y-3 pt-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Email Recipients
              </Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="admin@company.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="h-8 text-xs"
                />
                <Button type="button" size="sm" onClick={addRecipient} className="h-8 text-xs px-2.5">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-2">
                {settings.recipients.map((email: string) => (
                  <Badge key={email} variant="secondary" className="text-xs py-1 px-2.5 flex items-center gap-1.5">
                    {email}
                    <button type="button" onClick={() => removeRecipient(email)} className="hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                {settings.recipients.length === 0 && (
                  <p className="text-xs text-amber-500 italic">No recipients added. Report will send to org owners by default.</p>
                )}
              </div>
            </div>
          )}

          <div className="border-t pt-4 flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">ScrymeChat Integration</Label>
              <p className="text-xs text-muted-foreground">Post rich interactive markdown reports directly to workspace channels.</p>
            </div>
            <Switch
              checked={settings.scrymeEnabled}
              onCheckedChange={(checked) => setSettings((p: any) => ({ ...p, scrymeEnabled: checked }))}
            />
          </div>

          {settings.scrymeEnabled && (
            <div className="space-y-2 pt-1">
              <Label className="text-xs font-semibold text-muted-foreground">Target Channel Slug</Label>
              <Input
                type="text"
                value={settings.scrymeChannel}
                onChange={(e) => setSettings((p: any) => ({ ...p, scrymeChannel: e.target.value }))}
                placeholder="reports"
                className="h-8 text-xs"
              />
            </div>
          )}
        </div>

        <div className="p-5 rounded-xl border bg-card space-y-4">
          <div className="flex items-center gap-2 font-medium text-sm border-b pb-3">
            <Clock className="w-4 h-4 text-indigo-500" /> Schedule & Frequency
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Enable Automated Schedule</Label>
              <p className="text-xs text-muted-foreground">Automatically trigger and dispatch reports on a recurring interval.</p>
            </div>
            <Switch
              checked={settings.scheduleEnabled}
              onCheckedChange={(checked) => setSettings((p: any) => ({ ...p, scheduleEnabled: checked }))}
            />
          </div>

          {settings.scheduleEnabled && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Frequency</Label>
                  <Select
                    value={settings.frequency}
                    onValueChange={(val) => setSettings((p: any) => ({ ...p, frequency: val }))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select Frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Daily</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {settings.frequency === "WEEKLY" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Day of Week</Label>
                    <Select
                      value={String(settings.dayOfWeek)}
                      onValueChange={(val) => setSettings((p: any) => ({ ...p, dayOfWeek: parseInt(val, 10) }))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Day" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Monday</SelectItem>
                        <SelectItem value="2">Tuesday</SelectItem>
                        <SelectItem value="3">Wednesday</SelectItem>
                        <SelectItem value="4">Thursday</SelectItem>
                        <SelectItem value="5">Friday</SelectItem>
                        <SelectItem value="6">Saturday</SelectItem>
                        <SelectItem value="0">Sunday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Dispatch Time (24h)</Label>
                  <Input
                    type="text"
                    value={settings.timeOfDay}
                    onChange={(e) => setSettings((p: any) => ({ ...p, timeOfDay: e.target.value }))}
                    placeholder="08:00"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Timezone</Label>
                  <Input
                    type="text"
                    value={settings.timezone}
                    onChange={(e) => setSettings((p: any) => ({ ...p, timezone: e.target.value }))}
                    placeholder="UTC or Africa/Nairobi"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-5 rounded-xl border bg-card space-y-4 md:col-span-2">
          <div className="flex items-center gap-2 font-medium text-sm border-b pb-3">
            <Layers className="w-4 h-4 text-indigo-500" /> Report Content Modules & AI Analysis
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg border flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Sales & Revenue</p>
                <p className="text-xs text-muted-foreground">Revenue, orders & top sellers</p>
              </div>
              <Switch
                checked={settings.includeSales}
                onCheckedChange={(checked) => setSettings((p: any) => ({ ...p, includeSales: checked }))}
              />
            </div>

            <div className="p-3 rounded-lg border flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Inventory & Stock</p>
                <p className="text-xs text-muted-foreground">Stock movements & turnover</p>
              </div>
              <Switch
                checked={settings.includeInventory}
                onCheckedChange={(checked) => setSettings((p: any) => ({ ...p, includeInventory: checked }))}
              />
            </div>

            <div className="p-3 rounded-lg border flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Production Batches</p>
                <p className="text-xs text-muted-foreground">Batch yields & waste tracking</p>
              </div>
              <Switch
                checked={settings.includeProduction}
                onCheckedChange={(checked) => setSettings((p: any) => ({ ...p, includeProduction: checked }))}
              />
            </div>

            <div className="p-3 rounded-lg border flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Tax & Compliance</p>
                <p className="text-xs text-muted-foreground">VAT output & input tax summary</p>
              </div>
              <Switch
                checked={settings.includeTax}
                onCheckedChange={(checked) => setSettings((p: any) => ({ ...p, includeTax: checked }))}
              />
            </div>

            <div className="p-3 rounded-lg border bg-indigo-500/5 border-indigo-500/20 sm:col-span-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <div>
                  <p className="text-sm font-semibold text-indigo-950 dark:text-indigo-200">AI Executive Insights</p>
                  <p className="text-xs text-muted-foreground">Appends intelligent LLM recommendations, top seller highlights, and financial risk warnings.</p>
                </div>
              </div>
              <Switch
                checked={settings.includeAiInsights}
                onCheckedChange={(checked) => setSettings((p: any) => ({ ...p, includeAiInsights: checked }))}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
