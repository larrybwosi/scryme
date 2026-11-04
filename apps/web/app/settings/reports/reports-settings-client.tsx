"use client";

import React, { useState, useTransition } from "react";
import {
  FileText,
  Mail,
  Send,
  Sparkles,
  Save,
  Clock,
  Layers,
  Plus,
  X,
  Workflow as WorkflowIcon,
  Filter,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Play,
  RotateCw,
  ExternalLink,
  Sliders,
  Eye,
  FileSpreadsheet,
  Globe,
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Switch } from "@repo/ui/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Badge } from "@repo/ui/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs";
import { toast } from "sonner";
import {
  updateReportSettingsAction,
  triggerTestReportAction,
} from "@/app/actions/reports";

interface ReportsSettingsClientProps {
  initialSettings: any;
  locations: { id: string; name: string; locationType?: string }[];
  departments: { id: string; name: string }[];
  workflows: { id: string; key: string; name: string; description: string | null }[];
  initialReports: any[];
}

export function ReportsSettingsClient({
  initialSettings,
  locations,
  departments,
  workflows,
  initialReports,
}: ReportsSettingsClientProps) {
  const [settings, setSettings] = useState({
    ...initialSettings,
    formats: initialSettings.formats || ["HTML", "MARKDOWN"],
    summaryPeriodDays: initialSettings.summaryPeriodDays || 7,
    workflowEnabled: Boolean(initialSettings.workflowEnabled),
    workflowKey: initialSettings.workflowKey || "",
    webhookUrl: initialSettings.webhookUrl || "",
    defaultLocationId: initialSettings.defaultLocationId || "ALL",
    defaultDepartmentId: initialSettings.defaultDepartmentId || "ALL",
    minRevenueThreshold: initialSettings.minRevenueThreshold ?? "",
  });

  const [reportsList, setReportsList] = useState(initialReports);
  const [newEmail, setNewEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isTriggering, startTriggerTransition] = useTransition();
  const [previewData, setPreviewData] = useState<any>(null);

  const addRecipient = () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (settings.recipients.includes(newEmail)) {
      toast.error("Email already in recipients list");
      return;
    }
    setSettings((p: any) => ({ ...p, recipients: [...p.recipients, newEmail] }));
    setNewEmail("");
  };

  const removeRecipient = (email: string) => {
    setSettings((p: any) => ({
      ...p,
      recipients: p.recipients.filter((e: string) => e !== email),
    }));
  };

  const toggleFormat = (format: string) => {
    setSettings((p: any) => {
      const current = p.formats || [];
      if (current.includes(format)) {
        if (current.length === 1) {
          toast.error("At least one report output format must remain selected");
          return p;
        }
        return { ...p, formats: current.filter((f: string) => f !== format) };
      }
      return { ...p, formats: [...current, format] };
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        const payload = {
          emailEnabled: settings.emailEnabled,
          scrymeEnabled: settings.scrymeEnabled,
          recipients: settings.recipients,
          scrymeChannel: settings.scrymeChannel,
          scheduleEnabled: settings.scheduleEnabled,
          frequency: settings.frequency,
          dayOfWeek: settings.dayOfWeek,
          timeOfDay: settings.timeOfDay,
          timezone: settings.timezone,
          includeSales: settings.includeSales,
          includeInventory: settings.includeInventory,
          includeProduction: settings.includeProduction,
          includeTax: settings.includeTax,
          includeAiInsights: settings.includeAiInsights,
          formats: settings.formats,
          defaultLocationId: settings.defaultLocationId === "ALL" ? null : settings.defaultLocationId,
          defaultDepartmentId: settings.defaultDepartmentId === "ALL" ? null : settings.defaultDepartmentId,
          minRevenueThreshold: settings.minRevenueThreshold === "" ? null : Number(settings.minRevenueThreshold),
          summaryPeriodDays: Number(settings.summaryPeriodDays) || 7,
          workflowEnabled: settings.workflowEnabled,
          workflowKey: settings.workflowKey || null,
          webhookUrl: settings.webhookUrl || null,
        };

        const res = await updateReportSettingsAction(payload);
        if (res.success) {
          toast.success("Reporting preferences saved successfully");
        }
      } catch (err: any) {
        toast.error("Failed to update reporting preferences: " + err.message);
      }
    });
  };

  const handleTriggerTest = (withPreviewOnly = false) => {
    startTriggerTransition(async () => {
      try {
        const res = await triggerTestReportAction({
          days: settings.summaryPeriodDays,
          locationId: settings.defaultLocationId === "ALL" ? undefined : settings.defaultLocationId,
          departmentId: settings.defaultDepartmentId === "ALL" ? undefined : settings.defaultDepartmentId,
          formats: settings.formats,
          sendEmail: !withPreviewOnly && settings.emailEnabled,
          sendScryme: !withPreviewOnly && settings.scrymeEnabled,
        });

        if (res?.data) {
          setPreviewData(res.data);
          if (!withPreviewOnly) {
            setReportsList((prev) => [res.data, ...prev]);
            toast.success("Executive report generated and dispatched successfully!");
          } else {
            toast.success("Preview generated successfully");
          }
        } else {
          toast.success(res?.message || "Report dispatch triggered");
        }
      } catch (err: any) {
        toast.error("Failed to generate report: " + err.message);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-card">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Organization Reporting Preferences</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure automated report schedules, recipient routing channels, scoping filters, and workflow automation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleTriggerTest(true)}
            disabled={isTriggering}
            className="h-9 gap-1.5 text-xs"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-500" />
            Generate Preview
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleTriggerTest(false)}
            disabled={isTriggering}
            className="h-9 gap-1.5 text-xs"
          >
            {isTriggering ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5 text-blue-500" />
            )}
            Run & Dispatch Now
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isPending}
            className="h-9 gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm"
          >
            {isPending ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save Preferences
          </Button>
        </div>
      </div>

      <Tabs defaultValue="preferences" className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full md:w-[600px] bg-muted/60 p-1">
          <TabsTrigger value="preferences" className="text-xs font-medium gap-1.5">
            <Sliders className="w-3.5 h-3.5" /> General & Scopes
          </TabsTrigger>
          <TabsTrigger value="schedule" className="text-xs font-medium gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Schedule & Channels
          </TabsTrigger>
          <TabsTrigger value="workflows" className="text-xs font-medium gap-1.5">
            <WorkflowIcon className="w-3.5 h-3.5" /> Automation & Workflows
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs font-medium gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Dispatch History
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Preferences & Scopes */}
        <TabsContent value="preferences" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Report Content Modules */}
            <div className="p-5 rounded-xl border bg-card space-y-4">
              <div className="flex items-center gap-2 font-medium text-sm border-b pb-3">
                <Layers className="w-4 h-4 text-indigo-500" /> Content Modules & AI Insights
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-lg border flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Sales & Revenue</p>
                    <p className="text-xs text-muted-foreground">Revenue figures, transaction volumes, and top items sold</p>
                  </div>
                  <Switch
                    checked={settings.includeSales}
                    onCheckedChange={(checked) => setSettings((p: any) => ({ ...p, includeSales: checked }))}
                  />
                </div>

                <div className="p-3 rounded-lg border flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Inventory & Stock Movement</p>
                    <p className="text-xs text-muted-foreground">Incoming stock, outgoing dispatches, and turnover velocity</p>
                  </div>
                  <Switch
                    checked={settings.includeInventory}
                    onCheckedChange={(checked) => setSettings((p: any) => ({ ...p, includeInventory: checked }))}
                  />
                </div>

                <div className="p-3 rounded-lg border flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Production & Yield</p>
                    <p className="text-xs text-muted-foreground">Completed batch runs and recorded waste tracking</p>
                  </div>
                  <Switch
                    checked={settings.includeProduction}
                    onCheckedChange={(checked) => setSettings((p: any) => ({ ...p, includeProduction: checked }))}
                  />
                </div>

                <div className="p-3 rounded-lg border flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Tax & Compliance</p>
                    <p className="text-xs text-muted-foreground">Output VAT, deductible input tax, and estimated liability</p>
                  </div>
                  <Switch
                    checked={settings.includeTax}
                    onCheckedChange={(checked) => setSettings((p: any) => ({ ...p, includeTax: checked }))}
                  />
                </div>

                <div className="p-3 rounded-lg border bg-indigo-500/5 border-indigo-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-indigo-500 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-indigo-950 dark:text-indigo-200">AI Executive Insights</p>
                      <p className="text-xs text-muted-foreground">LLM analysis of operational trends and predictive suggestions</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.includeAiInsights}
                    onCheckedChange={(checked) => setSettings((p: any) => ({ ...p, includeAiInsights: checked }))}
                  />
                </div>
              </div>
            </div>

            {/* Customization & Scoping Filters */}
            <div className="p-5 rounded-xl border bg-card space-y-4">
              <div className="flex items-center gap-2 font-medium text-sm border-b pb-3">
                <Filter className="w-4 h-4 text-indigo-500" /> Scopes & Output Formats
              </div>

              <div className="space-y-4">
                {/* Formats Selection */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                    Preferred Output Formats
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: "HTML", label: "Interactive HTML", icon: Globe },
                      { key: "MARKDOWN", label: "Clean Markdown", icon: FileText },
                      { key: "PDF", label: "PDF Attachment", icon: FileText },
                      { key: "CSV", label: "CSV Data Export", icon: FileSpreadsheet },
                    ].map((fmt) => {
                      const Icon = fmt.icon;
                      const isSelected = settings.formats.includes(fmt.key);
                      return (
                        <button
                          key={fmt.key}
                          type="button"
                          onClick={() => toggleFormat(fmt.key)}
                          className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-medium transition-all ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-500/10 text-indigo-900 dark:text-indigo-200"
                              : "border-border hover:bg-muted/50 text-muted-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5" />
                            <span>{fmt.label}</span>
                          </div>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Default Period */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Summary Time Horizon</Label>
                    <Select
                      value={String(settings.summaryPeriodDays)}
                      onValueChange={(val) => setSettings((p: any) => ({ ...p, summaryPeriodDays: parseInt(val, 10) }))}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Past 24 Hours</SelectItem>
                        <SelectItem value="7">Past 7 Days (Weekly)</SelectItem>
                        <SelectItem value="14">Past 14 Days (Bi-weekly)</SelectItem>
                        <SelectItem value="30">Past 30 Days (Monthly)</SelectItem>
                        <SelectItem value="90">Past Quarter (90 Days)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Min Revenue Alert Threshold</Label>
                    <Input
                      type="number"
                      placeholder="Optional (e.g. 5000)"
                      value={settings.minRevenueThreshold}
                      onChange={(e) => setSettings((p: any) => ({ ...p, minRevenueThreshold: e.target.value }))}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                {/* Location & Department scoping */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Default Location Scope</Label>
                    <Select
                      value={settings.defaultLocationId}
                      onValueChange={(val) => setSettings((p: any) => ({ ...p, defaultLocationId: val }))}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="All Locations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Locations (Global)</SelectItem>
                        {locations.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name}{loc.locationType ? ` (${loc.locationType})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Default Department Scope</Label>
                    <Select
                      value={settings.defaultDepartmentId}
                      onValueChange={(val) => setSettings((p: any) => ({ ...p, defaultDepartmentId: val }))}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="All Departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Departments</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Schedule & Delivery Channels */}
        <TabsContent value="schedule" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Delivery Channels */}
            <div className="p-5 rounded-xl border bg-card space-y-4">
              <div className="flex items-center gap-2 font-medium text-sm border-b pb-3">
                <Mail className="w-4 h-4 text-indigo-500" /> Notification Channels
              </div>

              {/* Email channel */}
              <div className="flex items-center justify-between py-1">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Email Dispatch</Label>
                  <p className="text-xs text-muted-foreground">Deliver formatted digest directly to designated email inboxes.</p>
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
                      placeholder="executive@company.com"
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
                      <p className="text-xs text-amber-500 italic">No recipients added. Reports send to organization owners by default.</p>
                    )}
                  </div>
                </div>
              )}

              {/* ScrymeChat Channel */}
              <div className="border-t pt-4 flex items-center justify-between py-1">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">ScrymeChat Integration</Label>
                  <p className="text-xs text-muted-foreground">Broadcast executive summaries directly into team chat channels.</p>
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

            {/* Schedule & Recurrence */}
            <div className="p-5 rounded-xl border bg-card space-y-4">
              <div className="flex items-center gap-2 font-medium text-sm border-b pb-3">
                <Clock className="w-4 h-4 text-indigo-500" /> Automated Recurrence
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Enable Recurring Automation</Label>
                  <p className="text-xs text-muted-foreground">Dispatch reports autonomously on your preferred schedule.</p>
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
                      <Label className="text-xs">Cadence</Label>
                      <Select
                        value={settings.frequency}
                        onValueChange={(val) => setSettings((p: any) => ({ ...p, frequency: val }))}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Cadence" />
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
          </div>
        </TabsContent>

        {/* Tab 3: Automation & Workflows */}
        <TabsContent value="workflows" className="space-y-6">
          <div className="p-5 rounded-xl border bg-card space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <WorkflowIcon className="w-4 h-4 text-indigo-500" />
                <div>
                  <h3 className="text-sm font-semibold">Workflow Engine Integration</h3>
                  <p className="text-xs text-muted-foreground">
                    Connect reporting events to automated operational workflows or outgoing webhooks.
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.workflowEnabled}
                onCheckedChange={(checked) => setSettings((p: any) => ({ ...p, workflowEnabled: checked }))}
              />
            </div>

            {settings.workflowEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                    Trigger Automation Workflow
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Select a workflow template to execute whenever an executive report completes.
                  </p>
                  <Select
                    value={settings.workflowKey}
                    onValueChange={(val) => setSettings((p: any) => ({ ...p, workflowKey: val }))}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Choose Workflow..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Standard Dispatch Only)</SelectItem>
                      {workflows.map((wf) => (
                        <SelectItem key={wf.id} value={wf.key}>
                          {wf.name} ({wf.key})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                    Custom Webhook Destination
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Post the full JSON report payload to your external endpoint (Slack, Zapier, custom API).
                  </p>
                  <Input
                    type="url"
                    placeholder="https://hooks.slack.com/services/..."
                    value={settings.webhookUrl}
                    onChange={(e) => setSettings((p: any) => ({ ...p, webhookUrl: e.target.value }))}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 4: Dispatch History */}
        <TabsContent value="history" className="space-y-4">
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Generated Reports & Dispatch History</h3>
                <p className="text-xs text-muted-foreground">Audit log of recent system and manual report generations</p>
              </div>
              <Badge variant="outline" className="text-xs">
                {reportsList.length} Records
              </Badge>
            </div>

            {reportsList.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                <Calendar className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                <p>No historical reports recorded yet.</p>
                <p className="text-[11px]">Click &quot;Run & Dispatch Now&quot; above to trigger your first report.</p>
              </div>
            ) : (
              <div className="divide-y">
                {reportsList.map((rep: any) => (
                  <div key={rep.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs hover:bg-muted/30">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{rep.type}</span>
                        <Badge variant="secondary" className="text-[10px] py-0 px-2">
                          {rep.data?.days || 7} Days
                        </Badge>
                        <span className="text-muted-foreground">
                          {new Date(rep.generatedAt).toLocaleString()}
                        </span>
                      </div>
                      {rep.summary && (
                        <p className="text-muted-foreground line-clamp-1 italic max-w-2xl">
                          &ldquo;{rep.summary}&rdquo;
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewData(rep)}
                        className="h-7 text-[11px] gap-1"
                      >
                        <Eye className="w-3 h-3 text-indigo-500" /> View Summary
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Live Preview Modal / Card */}
      {previewData && (
        <div className="p-5 rounded-xl border border-indigo-500/30 bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-semibold">Executive Report Preview</h3>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPreviewData(null)}
              className="h-7 w-7 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {previewData.data?.summary?.aiInsights || previewData.summary ? (
            <div className="p-3.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-950 dark:text-indigo-200">
              <p className="font-semibold mb-1">AI Executive Summary:</p>
              <p className="leading-relaxed">
                {previewData.data?.summary?.aiInsights || previewData.summary}
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border bg-muted/20 text-center">
              <span className="text-[11px] text-muted-foreground block">Revenue</span>
              <span className="text-base font-bold text-foreground">
                ${previewData.data?.summary?.sales?.totalRevenue?.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="p-3 rounded-lg border bg-muted/20 text-center">
              <span className="text-[11px] text-muted-foreground block">Orders</span>
              <span className="text-base font-bold text-foreground">
                {previewData.data?.summary?.sales?.transactionCount || 0}
              </span>
            </div>
            <div className="p-3 rounded-lg border bg-muted/20 text-center">
              <span className="text-[11px] text-muted-foreground block">Stock Received</span>
              <span className="text-base font-bold text-foreground">
                {previewData.data?.summary?.inventory?.totalIn || 0} units
              </span>
            </div>
            <div className="p-3 rounded-lg border bg-muted/20 text-center">
              <span className="text-[11px] text-muted-foreground block">VAT Payable</span>
              <span className="text-base font-bold text-foreground">
                ${previewData.data?.summary?.tax?.netVatPayable?.toFixed(2) || "0.00"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
