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
  Download,
  Printer,
  TrendingUp,
  Package,
  UtensilsCrossed,
  DollarSign,
  MessageSquare,
  Search,
  Trash2,
  BarChart3,
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
  generateCategoryReportAction,
  askReportAiAction,
  deleteReportAction,
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
  const [settings, setSettings] = useState(initialSettings);
  const [reportsList, setReportsList] = useState(initialReports || []);
  const [newRecipient, setNewRecipient] = useState("");
  const [isSaving, startSaving] = useTransition();
  const [isTriggering, startTriggering] = useTransition();
  const [previewData, setPreviewData] = useState<any>(null);

  // Multi-Category Report Generation State
  const [selectedCategory, setSelectedCategory] = useState<
    "EXECUTIVE" | "SALES" | "STOCK" | "PRODUCTION" | "FINANCE"
  >("EXECUTIVE");
  const [periodPreset, setPeriodPreset] = useState<"7" | "30" | "90" | "custom">("7");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [filterLocationId, setFilterLocationId] = useState("all");
  const [filterDepartmentId, setFilterDepartmentId] = useState("all");
  const [isGeneratingCategory, startGeneratingCategory] = useTransition();

  // AI Interactive Advisory State
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiChatHistory, setAiChatHistory] = useState<
    { role: "user" | "ai"; text: string }[]
  >([]);
  const [isAskingAi, startAskingAi] = useTransition();

  // Saved Reports Search & Filter State
  const [historySearch, setHistorySearch] = useState("");
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState("all");

  const handleAddRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipient || !newRecipient.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (settings.recipients.includes(newRecipient)) {
      toast.error("Email is already in the recipient list");
      return;
    }
    setSettings((prev: any) => ({
      ...prev,
      recipients: [...prev.recipients, newRecipient.trim()],
    }));
    setNewRecipient("");
  };

  const handleRemoveRecipient = (emailToRemove: string) => {
    setSettings((prev: any) => ({
      ...prev,
      recipients: prev.recipients.filter((email: string) => email !== emailToRemove),
    }));
  };

  const handleSaveSettings = () => {
    startSaving(async () => {
      try {
        const res = await updateReportSettingsAction({
          emailEnabled: settings.emailEnabled,
          scrymeEnabled: settings.scrymeEnabled,
          recipients: settings.recipients,
          scrymeChannel: settings.scrymeChannel,
          scheduleEnabled: settings.scheduleEnabled,
          frequency: settings.frequency,
          dayOfWeek: Number(settings.dayOfWeek),
          timeOfDay: settings.timeOfDay,
          timezone: settings.timezone,
          includeSales: settings.includeSales,
          includeInventory: settings.includeInventory,
          includeProduction: settings.includeProduction,
          includeTax: settings.includeTax,
          includeAiInsights: settings.includeAiInsights,
          formats: settings.formats,
          defaultLocationId: settings.defaultLocationId === "all" ? null : settings.defaultLocationId,
          defaultDepartmentId: settings.defaultDepartmentId === "all" ? null : settings.defaultDepartmentId,
          minRevenueThreshold: settings.minRevenueThreshold ? Number(settings.minRevenueThreshold) : null,
          summaryPeriodDays: Number(settings.summaryPeriodDays || 7),
          workflowEnabled: settings.workflowEnabled,
          workflowKey: settings.workflowKey === "none" ? null : settings.workflowKey,
          webhookUrl: settings.webhookUrl || null,
        });

        if (res.success) {
          toast.success("Executive reporting preferences updated successfully");
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to update reporting preferences");
      }
    });
  };

  const handleGenerateCategoryReport = () => {
    startGeneratingCategory(async () => {
      try {
        let days = 7;
        let startDate: string | undefined;
        let endDate: string | undefined;

        if (periodPreset === "custom") {
          if (!customStartDate || !customEndDate) {
            toast.error("Please select both start and end dates for custom range");
            return;
          }
          startDate = new Date(customStartDate).toISOString();
          endDate = new Date(customEndDate).toISOString();
        } else {
          days = parseInt(periodPreset, 10);
        }

        const res = await generateCategoryReportAction({
          category: selectedCategory,
          days,
          startDate,
          endDate,
          locationId: filterLocationId === "all" ? undefined : filterLocationId,
          departmentId: filterDepartmentId === "all" ? undefined : filterDepartmentId,
        });

        if (res.success && res.report) {
          toast.success(`${selectedCategory} Report generated and saved successfully!`);
          setReportsList((prev: any[]) => [res.report, ...prev]);
          setPreviewData(res.report);
          setAiChatHistory([]);
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to generate category report");
      }
    });
  };

  const handleAskAi = () => {
    if (!aiQuestion.trim() || !previewData?.id) return;
    const questionText = aiQuestion.trim();
    setAiChatHistory((prev) => [...prev, { role: "user", text: questionText }]);
    setAiQuestion("");

    startAskingAi(async () => {
      try {
        const res = await askReportAiAction(previewData.id, questionText);
        if (res.success && res.answer) {
          setAiChatHistory((prev) => [...prev, { role: "ai", text: res.answer }]);
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to get AI advisory answer");
        setAiChatHistory((prev) => [
          ...prev,
          { role: "ai", text: "⚠️ Unable to query AI advisory service. Please try again." },
        ]);
      }
    });
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await deleteReportAction(reportId);
      setReportsList((prev: any[]) => prev.filter((r) => r.id !== reportId));
      if (previewData?.id === reportId) {
        setPreviewData(null);
      }
      toast.success("Report deleted from history");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete report");
    }
  };

  const handleExportCSV = (rep: any) => {
    if (!rep?.data) return;
    const data = rep.data;
    const lines: string[] = [];

    lines.push(`Report Type,${rep.type}`);
    lines.push(`Start Date,${new Date(rep.startDate).toISOString()}`);
    lines.push(`End Date,${new Date(rep.endDate).toISOString()}`);
    lines.push(`Generated At,${new Date(rep.generatedAt).toISOString()}`);
    lines.push("");

    if (data.sales) {
      lines.push("--- SALES SUMMARY ---");
      lines.push(`Total Revenue,${data.sales.totalRevenue || 0}`);
      lines.push(`Transactions,${data.sales.transactionCount || 0}`);
      lines.push(`Average Order Value,${(data.sales.averageOrderValue || 0).toFixed(2)}`);
      lines.push("");
      if (data.sales.topProducts?.length) {
        lines.push("Product Name,Quantity Sold,Revenue");
        data.sales.topProducts.forEach((p: any) => {
          lines.push(`"${p.name}",${p.quantity},${p.revenue}`);
        });
        lines.push("");
      }
    }

    if (data.inventory) {
      lines.push("--- INVENTORY SUMMARY ---");
      lines.push(`Total Stock In,${data.inventory.totalIn || 0}`);
      lines.push(`Total Stock Out,${data.inventory.totalOut || 0}`);
      lines.push(`Net Change,${data.inventory.netChange || 0}`);
      lines.push("");
      if (data.inventory.topMovedItems?.length) {
        lines.push("Item Name,In Qty,Out Qty");
        data.inventory.topMovedItems.forEach((i: any) => {
          lines.push(`"${i.name}",${i.inQty || 0},${i.outQty || 0}`);
        });
        lines.push("");
      }
    }

    if (data.production) {
      lines.push("--- PRODUCTION SUMMARY ---");
      lines.push(`Batches Completed,${data.production.totalBatches || 0}`);
      lines.push(`Total Scrap/Waste,${data.production.totalWaste || 0}`);
      lines.push(`Total Yield,${data.production.totalYield || 0}`);
      lines.push("");
      if (data.production.topRecipes?.length) {
        lines.push("Recipe Name,Quantity Produced,Waste");
        data.production.topRecipes.forEach((r: any) => {
          lines.push(`"${r.name}",${r.quantity},${r.waste}`);
        });
        lines.push("");
      }
    }

    if (data.finance) {
      lines.push("--- FINANCE & EXPENSES SUMMARY ---");
      lines.push(`Total Expenses,${data.finance.totalExpenses || 0}`);
      lines.push(`Expense Entries,${data.finance.expenseCount || 0}`);
      lines.push("");
      if (data.finance.categoryBreakdown?.length) {
        lines.push("Category,Total Amount");
        data.finance.categoryBreakdown.forEach((c: any) => {
          lines.push(`"${c.category}",${c.amount}`);
        });
        lines.push("");
      }
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${rep.type.toLowerCase()}-${new Date(rep.generatedAt).toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV report exported successfully");
  };

  const handlePrintPDF = () => {
    window.print();
  };

  // Filtered reports list
  const filteredReports = reportsList.filter((r) => {
    const matchesSearch =
      historySearch === "" ||
      r.type.toLowerCase().includes(historySearch.toLowerCase()) ||
      (r.summary && r.summary.toLowerCase().includes(historySearch.toLowerCase()));

    const matchesCategory =
      historyCategoryFilter === "all" ||
      (historyCategoryFilter === "SALES" && (r.type === "SALES_REPORT" || r.type === "SALES_WEEKLY")) ||
      (historyCategoryFilter === "STOCK" && r.type === "INVENTORY_REPORT") ||
      (historyCategoryFilter === "PRODUCTION" && r.type === "BAKERY_REPORT") ||
      (historyCategoryFilter === "FINANCE" && r.type === "EXPENSE_REPORT");

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b print:hidden">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            Executive Reporting & Business Intelligence
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Generate on-demand category reports, inspect AI operational insights, and configure automated dispatches.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="h-8 text-xs gap-1.5"
          >
            {isSaving ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Settings
          </Button>
        </div>
      </div>

      <Tabs defaultValue="generator" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl h-auto flex flex-wrap gap-1 print:hidden">
          <TabsTrigger value="generator" className="text-xs py-1.5 px-3 data-[state=active]:bg-background">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
            Generate Reports & AI
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs py-1.5 px-3 data-[state=active]:bg-background">
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
            Saved Reports ({reportsList.length})
          </TabsTrigger>
          <TabsTrigger value="delivery" className="text-xs py-1.5 px-3 data-[state=active]:bg-background">
            <Mail className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
            Delivery Channels
          </TabsTrigger>
          <TabsTrigger value="schedule" className="text-xs py-1.5 px-3 data-[state=active]:bg-background">
            <Clock className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
            Schedule & Automations
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: On-Demand Category Report Generator & AI Advisory */}
        <TabsContent value="generator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
            {/* Generator Form */}
            <div className="lg:col-span-1 p-5 rounded-xl border bg-card space-y-5">
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Filter className="w-4 h-4 text-indigo-500" />
                  Report Generator
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select a category and filter interval to generate an AI-backed business report.
                </p>
              </div>

              {/* Category Picker */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Report Category</Label>
                <div className="grid grid-cols-1 gap-1.5">
                  {[
                    { id: "EXECUTIVE", label: "Executive Summary", desc: "Cross-domain holistic overview", icon: Sparkles },
                    { id: "SALES", label: "Sales & Orders", desc: "Revenue, orders, top products", icon: TrendingUp },
                    { id: "STOCK", label: "Stock & Inventory", desc: "Inflows, outflows, velocity", icon: Package },
                    { id: "PRODUCTION", label: "Production & Batches", desc: "Batches, recipes, waste", icon: UtensilsCrossed },
                    { id: "FINANCE", label: "Finance & Expenses", desc: "Operating spend, tax liabilities", icon: DollarSign },
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id as any)}
                        className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-colors ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-foreground"
                            : "border-border hover:bg-muted/30 text-muted-foreground"
                        }`}
                      >
                        <Icon className={`w-4 h-4 mt-0.5 ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground"}`} />
                        <div>
                          <div className={`text-xs font-semibold ${isSelected ? "text-foreground" : "text-foreground/80"}`}>
                            {cat.label}
                          </div>
                          <div className="text-[11px] text-muted-foreground">{cat.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Period Preset */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Reporting Period</Label>
                <Select
                  value={periodPreset}
                  onValueChange={(val: any) => setPeriodPreset(val)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select period..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Past 7 Days</SelectItem>
                    <SelectItem value="30">Past 30 Days (Month)</SelectItem>
                    <SelectItem value="90">Past 90 Days (Quarter)</SelectItem>
                    <SelectItem value="custom">Custom Date Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {periodPreset === "custom" && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Start Date</Label>
                    <Input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">End Date</Label>
                    <Input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Optional Location Scoping */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Location Filter (Optional)</Label>
                <Select value={filterLocationId} onValueChange={setFilterLocationId}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Optional Department Scoping */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Department Filter (Optional)</Label>
                <Select value={filterDepartmentId} onValueChange={setFilterDepartmentId}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="button"
                onClick={handleGenerateCategoryReport}
                disabled={isGeneratingCategory}
                className="w-full h-9 text-xs font-semibold gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isGeneratingCategory ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    Generating Report with AI...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    Generate & Save Report
                  </>
                )}
              </Button>
            </div>

            {/* Live Interactive Viewer & AI Advisory Panel */}
            <div className="lg:col-span-2 space-y-6">
              {!previewData ? (
                <div className="p-12 rounded-xl border border-dashed text-center bg-card flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">No Report Selected for Preview</h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                      Select your reporting parameters on the left and click &ldquo;Generate & Save Report&rdquo;, or pick a past report from the Saved Reports tab.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Report Card */}
                  <div className="p-5 rounded-xl border bg-card shadow-sm space-y-5">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs font-semibold text-indigo-600 border-indigo-200">
                            {previewData.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(previewData.startDate).toLocaleDateString()} – {new Date(previewData.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-base font-bold mt-1">
                          {previewData.data?.category || "EXECUTIVE"} Business Report
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportCSV(previewData)}
                          className="h-8 text-xs gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5 text-indigo-500" />
                          CSV
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handlePrintPDF}
                          className="h-8 text-xs gap-1.5"
                        >
                          <Printer className="w-3.5 h-3.5 text-indigo-500" />
                          PDF / Print
                        </Button>
                      </div>
                    </div>

                    {/* AI Executive Summary Box */}
                    {previewData.summary && (
                      <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/5 border border-indigo-500/20 space-y-2">
                        <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-semibold text-xs">
                          <Sparkles className="w-4 h-4 text-indigo-500" />
                          AI Executive Insights & Recommendations
                        </div>
                        <div className="text-xs leading-relaxed text-foreground/90 whitespace-pre-line">
                          {previewData.summary}
                        </div>
                      </div>
                    )}

                    {/* Metrics Overview Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {previewData.data?.sales && (
                        <>
                          <div className="p-3 rounded-lg border bg-muted/20 text-center">
                            <span className="text-[11px] text-muted-foreground block">Total Revenue</span>
                            <span className="text-base font-bold text-foreground">
                              ${Number(previewData.data.sales.totalRevenue || 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="p-3 rounded-lg border bg-muted/20 text-center">
                            <span className="text-[11px] text-muted-foreground block">Completed Orders</span>
                            <span className="text-base font-bold text-foreground">
                              {previewData.data.sales.transactionCount || 0}
                            </span>
                          </div>
                        </>
                      )}

                      {previewData.data?.inventory && (
                        <>
                          <div className="p-3 rounded-lg border bg-muted/20 text-center">
                            <span className="text-[11px] text-muted-foreground block">Stock Inflow</span>
                            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                              +{Number(previewData.data.inventory.totalIn || 0).toFixed(1)}
                            </span>
                          </div>
                          <div className="p-3 rounded-lg border bg-muted/20 text-center">
                            <span className="text-[11px] text-muted-foreground block">Stock Outflow</span>
                            <span className="text-base font-bold text-amber-600 dark:text-amber-400">
                              -{Number(previewData.data.inventory.totalOut || 0).toFixed(1)}
                            </span>
                          </div>
                        </>
                      )}

                      {previewData.data?.production && (
                        <>
                          <div className="p-3 rounded-lg border bg-muted/20 text-center">
                            <span className="text-[11px] text-muted-foreground block">Completed Batches</span>
                            <span className="text-base font-bold text-foreground">
                              {previewData.data.production.totalBatches || 0}
                            </span>
                          </div>
                          <div className="p-3 rounded-lg border bg-muted/20 text-center">
                            <span className="text-[11px] text-muted-foreground block">Scrap / Waste</span>
                            <span className="text-base font-bold text-rose-500">
                              {Number(previewData.data.production.totalWaste || 0).toFixed(2)} units
                            </span>
                          </div>
                        </>
                      )}

                      {previewData.data?.finance && (
                        <div className="p-3 rounded-lg border bg-muted/20 text-center">
                          <span className="text-[11px] text-muted-foreground block">Total Expenses</span>
                          <span className="text-base font-bold text-foreground">
                            ${Number(previewData.data.finance.totalExpenses || 0).toFixed(2)}
                          </span>
                        </div>
                      )}

                      {previewData.data?.tax && (
                        <div className="p-3 rounded-lg border bg-muted/20 text-center">
                          <span className="text-[11px] text-muted-foreground block">Net VAT Payable</span>
                          <span className="text-base font-bold text-foreground">
                            ${Number(previewData.data.tax.netVatPayable || 0).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Breakdown Tables */}
                    {previewData.data?.sales?.topProducts?.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                          Top Performing Products
                        </h4>
                        <div className="rounded-lg border overflow-hidden">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-muted/40 border-b text-muted-foreground">
                              <tr>
                                <th className="p-2 font-medium">Product</th>
                                <th className="p-2 font-medium text-right">Units Sold</th>
                                <th className="p-2 font-medium text-right">Revenue</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {previewData.data.sales.topProducts.slice(0, 5).map((p: any, idx: number) => (
                                <tr key={idx} className="hover:bg-muted/20">
                                  <td className="p-2 font-medium">{p.name}</td>
                                  <td className="p-2 text-right">{p.quantity}</td>
                                  <td className="p-2 text-right font-semibold">${Number(p.revenue).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {previewData.data?.inventory?.topMovedItems?.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                          High Velocity Stock Items
                        </h4>
                        <div className="rounded-lg border overflow-hidden">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-muted/40 border-b text-muted-foreground">
                              <tr>
                                <th className="p-2 font-medium">Item Name</th>
                                <th className="p-2 font-medium text-right">Received In</th>
                                <th className="p-2 font-medium text-right">Dispatched Out</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {previewData.data.inventory.topMovedItems.slice(0, 5).map((item: any, idx: number) => (
                                <tr key={idx} className="hover:bg-muted/20">
                                  <td className="p-2 font-medium">{item.name}</td>
                                  <td className="p-2 text-right text-emerald-600">+{item.inQty}</td>
                                  <td className="p-2 text-right text-amber-600">-{item.outQty}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Interactive Ask AI Advisory Drawer / Box */}
                  <div className="p-5 rounded-xl border bg-card space-y-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-indigo-500" />
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                        Ask AI About This Report
                      </h4>
                    </div>

                    {/* Chat History */}
                    {aiChatHistory.length > 0 && (
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {aiChatHistory.map((msg, i) => (
                          <div
                            key={i}
                            className={`p-3 rounded-lg text-xs leading-relaxed ${
                              msg.role === "user"
                                ? "bg-muted ml-8 text-foreground"
                                : "bg-indigo-500/10 border border-indigo-500/20 mr-8 text-foreground"
                            }`}
                          >
                            <span className="font-semibold block mb-1 text-[11px] text-muted-foreground">
                              {msg.role === "user" ? "You" : "Scryme AI Advisory"}
                            </span>
                            <div className="whitespace-pre-line">{msg.text}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={aiQuestion}
                        onChange={(e) => setAiQuestion(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleAskAi();
                          }
                        }}
                        placeholder="e.g. Which product drove the most profit? How can we reduce production waste?"
                        className="h-9 text-xs"
                      />
                      <Button
                        type="button"
                        onClick={handleAskAi}
                        disabled={isAskingAi || !aiQuestion.trim()}
                        className="h-9 px-4 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
                      >
                        {isAskingAi ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Saved Reports & Dispatch History */}
        <TabsContent value="history" className="space-y-4">
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Saved Reports & Dispatch History</h3>
                <p className="text-xs text-muted-foreground">
                  Browse, inspect, and export all generated business and compliance reports.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search reports..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="h-8 text-xs pl-8 w-44"
                  />
                </div>

                <Select value={historyCategoryFilter} onValueChange={setHistoryCategoryFilter}>
                  <SelectTrigger className="h-8 text-xs w-36">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="SALES">Sales</SelectItem>
                    <SelectItem value="STOCK">Stock / Inventory</SelectItem>
                    <SelectItem value="PRODUCTION">Production</SelectItem>
                    <SelectItem value="FINANCE">Finance</SelectItem>
                  </SelectContent>
                </Select>

                <Badge variant="outline" className="text-xs">
                  {filteredReports.length} Saved
                </Badge>
              </div>
            </div>

            {filteredReports.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                <Calendar className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                <p>No saved reports found matching your filter criteria.</p>
                <p className="text-[11px]">Generate a report in the &ldquo;Generate Reports & AI&rdquo; tab to save your first snapshot.</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredReports.map((rep: any) => (
                  <div
                    key={rep.id}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs hover:bg-muted/30"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{rep.type}</span>
                        <Badge variant="secondary" className="text-[10px] py-0 px-2">
                          {rep.data?.category || "REPORT"}
                        </Badge>
                        <span className="text-muted-foreground">
                          {new Date(rep.startDate).toLocaleDateString()} - {new Date(rep.endDate).toLocaleDateString()}
                        </span>
                        <span className="text-[11px] text-muted-foreground/70">
                          (Generated {new Date(rep.generatedAt).toLocaleString()})
                        </span>
                      </div>
                      {rep.summary && (
                        <p className="text-muted-foreground line-clamp-1 italic max-w-2xl">
                          &ldquo;{rep.summary}&rdquo;
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPreviewData(rep);
                          setAiChatHistory([]);
                          const genTab = document.querySelector('[value="generator"]') as HTMLElement;
                          genTab?.click();
                        }}
                        className="h-7 text-[11px] gap-1"
                      >
                        <Eye className="w-3 h-3 text-indigo-500" /> View & AI
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportCSV(rep)}
                        className="h-7 text-[11px] gap-1"
                      >
                        <Download className="w-3 h-3 text-emerald-500" /> CSV
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteReport(rep.id)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 3: Delivery Channels */}
        <TabsContent value="delivery" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email Dispatch Card */}
            <div className="p-5 rounded-xl border bg-card space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-500" />
                  <div>
                    <h3 className="text-sm font-semibold">Email Delivery</h3>
                    <p className="text-xs text-muted-foreground">Send formatted HTML digest to executive team</p>
                  </div>
                </div>
                <Switch
                  checked={settings.emailEnabled}
                  onCheckedChange={(checked) => setSettings((p: any) => ({ ...p, emailEnabled: checked }))}
                />
              </div>

              {settings.emailEnabled && (
                <div className="space-y-3 pt-1">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                    Recipient Email Addresses
                  </Label>
                  <form onSubmit={handleAddRecipient} className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="executive@company.com"
                      value={newRecipient}
                      onChange={(e) => setNewRecipient(e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Button type="submit" size="sm" variant="outline" className="h-8 text-xs gap-1">
                      <Plus className="w-3 h-3" /> Add
                    </Button>
                  </form>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {settings.recipients?.map((email: string) => (
                      <Badge key={email} variant="secondary" className="text-xs py-1 px-2.5 gap-1.5">
                        {email}
                        <button
                          type="button"
                          onClick={() => handleRemoveRecipient(email)}
                          className="hover:text-rose-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ScrymeChat Delivery Card */}
            <div className="p-5 rounded-xl border bg-card space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-indigo-500" />
                  <div>
                    <h3 className="text-sm font-semibold">ScrymeChat Broadcast</h3>
                    <p className="text-xs text-muted-foreground">Deliver summary directly into an internal channel</p>
                  </div>
                </div>
                <Switch
                  checked={settings.scrymeEnabled}
                  onCheckedChange={(checked) => setSettings((p: any) => ({ ...p, scrymeEnabled: checked }))}
                />
              </div>

              {settings.scrymeEnabled && (
                <div className="space-y-3 pt-1">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                    Target Channel Slug
                  </Label>
                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-muted-foreground font-mono">#</span>
                    <Input
                      type="text"
                      placeholder="reports"
                      value={settings.scrymeChannel}
                      onChange={(e) => setSettings((p: any) => ({ ...p, scrymeChannel: e.target.value }))}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Markdown performance summaries and alerts will automatically post to this channel.
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab 4: Schedule & Automations */}
        <TabsContent value="schedule" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Automated Dispatch Schedule */}
            <div className="p-5 rounded-xl border bg-card space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <div>
                    <h3 className="text-sm font-semibold">Automated Dispatch Schedule</h3>
                    <p className="text-xs text-muted-foreground">Configure cron intervals for routine reports</p>
                  </div>
                </div>
                <Switch
                  checked={settings.scheduleEnabled}
                  onCheckedChange={(checked) => setSettings((p: any) => ({ ...p, scheduleEnabled: checked }))}
                />
              </div>

              {settings.scheduleEnabled && (
                <div className="space-y-4 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Frequency</Label>
                      <Select
                        value={settings.frequency}
                        onValueChange={(val) => setSettings((p: any) => ({ ...p, frequency: val }))}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
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
                            <SelectValue />
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

            {/* Workflow & Webhook Automation */}
            <div className="p-5 rounded-xl border bg-card space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <WorkflowIcon className="w-4 h-4 text-indigo-500" />
                  <div>
                    <h3 className="text-sm font-semibold">Workflow Engine Integration</h3>
                    <p className="text-xs text-muted-foreground">Trigger operational automations upon generation</p>
                  </div>
                </div>
                <Switch
                  checked={settings.workflowEnabled}
                  onCheckedChange={(checked) => setSettings((p: any) => ({ ...p, workflowEnabled: checked }))}
                />
              </div>

              {settings.workflowEnabled && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Automation Workflow</Label>
                    <Select
                      value={settings.workflowKey || "none"}
                      onValueChange={(val) => setSettings((p: any) => ({ ...p, workflowKey: val }))}
                    >
                      <SelectTrigger className="h-8 text-xs">
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

                  <div className="space-y-1.5">
                    <Label className="text-xs">Custom Webhook Target (Optional)</Label>
                    <Input
                      type="url"
                      placeholder="https://hooks.slack.com/services/..."
                      value={settings.webhookUrl || ""}
                      onChange={(e) => setSettings((p: any) => ({ ...p, webhookUrl: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
