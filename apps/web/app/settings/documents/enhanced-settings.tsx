"use client";

import React, { useState } from "react";
import {
  DOCUMENT_REGISTRY,
  getTemplatesByType,
  DocumentType,
  getMockInvoiceData,
  getMockReceiptData,
  getMockWaybillData,
} from "@repo/documents";
import { PDFViewer } from "@react-pdf/renderer";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import { Separator } from "@repo/ui/components/ui/separator";
import {
  Loader2,
  Eye,
  FileText,
  Receipt,
  Truck,
  Settings2,
  X,
  CheckCircle2,
  ChevronRight,
  LayoutGrid,
  PackageSearch,
  ClipboardList,
  ListOrdered,
  Download,
  Building2,
  GitBranch,
  FileOutput,
} from "lucide-react";
import { updateDefaultDocumentTemplate } from "../../actions/organization";
import { toast } from "sonner";
import { cn } from "@repo/ui/lib/utils";
import { Sheet, SheetContent } from "@repo/ui/components/ui/sheet";
import { InvoiceConfigForm } from "./invoice-config-form";
import { DocumentConfigForm } from "./document-config-form";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EnhancedDocumentSettingsProps {
  organization: any;
  invoiceConfig?: any;
  receiptConfig?: any;
  waybillConfig?: any;
}

type SidebarPanel =
  | "templates"
  | "config"
  | "stock-requests"
  | "compiled-stock"
  | "delivery-notes"
  | "waybills-v3";

// ─── Constants ────────────────────────────────────────────────────────────────

const DOC_TYPES = [
  {
    id: "INVOICE" as DocumentType,
    label: "Invoices",
    sublabel: "Sales & billing",
    icon: FileText,
    settingsKey: "defaultInvoiceTemplate",
    fallback: "invoice-v2",
  },
  {
    id: "RECEIPT" as DocumentType,
    label: "Receipts",
    sublabel: "Payment confirmations",
    icon: Receipt,
    settingsKey: "defaultReceiptTemplate",
    fallback: "receipt-v2",
  },
  {
    id: "WAYBILL" as DocumentType,
    label: "Waybills",
    sublabel: "Shipping & delivery",
    icon: Truck,
    settingsKey: "defaultWaybillTemplate",
    fallback: "waybill-v3",
  },
  {
    id: "DELIVERY_NOTE" as DocumentType,
    label: "Delivery Notes",
    sublabel: "Customer handoffs",
    icon: PackageSearch,
    settingsKey: "defaultDeliveryNoteTemplate",
    fallback: "delivery-note-v3",
  },
] as const;

const STOCKING_DOCS = [
  {
    id: "stock-requests" as SidebarPanel,
    label: "Stock Request List",
    sublabel: "Per-request breakdown",
    icon: ListOrdered,
    description:
      "Generates a full list of all stock requests, showing request number, location, priority, status, and estimated cost. Available at branch or organization level.",
    endpoints: {
      branch: "/api/stocking/documents/requests?level=branch",
      org: "/api/stocking/documents/requests?level=organization",
    },
  },
  {
    id: "compiled-stock" as SidebarPanel,
    label: "Compiled Stock Requests",
    sublabel: "Aggregated by product",
    icon: ClipboardList,
    description:
      "Aggregates all pending stock requests by product/variant, showing total requested, allocated, and remaining quantities with fulfillment progress bars.",
    endpoints: {
      branch: "/api/stocking/documents/aggregated-requests?level=branch",
      org: "/api/stocking/documents/aggregated-requests?level=organization",
    },
  },
] as const;

// ─── Version badge colors ─────────────────────────────────────────────────────

function versionBadgeClass(version: string) {
  const major = version.split(".")[0];
  if (major === "v3") return "bg-violet-50 text-violet-600 border-violet-200";
  if (major === "v2") return "bg-blue-50 text-blue-600 border-blue-200";
  return "bg-zinc-100 text-zinc-500 border-zinc-200";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EnhancedDocumentSettings({
  organization,
  invoiceConfig,
  receiptConfig,
  waybillConfig,
}: EnhancedDocumentSettingsProps) {
  const [selectedType, setSelectedType] = useState<DocumentType>("INVOICE");
  const [activePanel, setActivePanel] = useState<SidebarPanel>("templates");
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [downloadingLevel, setDownloadingLevel] = useState<
    "branch" | "org" | null
  >(null);

  // ── Helpers ─────────────────────────────────────────────────────────────

  const getDefaultTemplateId = (type: DocumentType) => {
    const docType = DOC_TYPES.find(d => d.id === type);
    if (!docType) return "";
    return organization.settings?.[docType.settingsKey] || docType.fallback;
  };

  const handleUpdateDefault = async (templateId: string) => {
    setIsUpdating(templateId);
    try {
      await updateDefaultDocumentTemplate(selectedType, templateId);
      toast.success("Default template updated");
      const docType = DOC_TYPES.find(d => d.id === selectedType);
      if (docType) {
        organization.settings = {
          ...organization.settings,
          [docType.settingsKey]: templateId,
        };
      }
    } catch {
      toast.error("Failed to update template");
    } finally {
      setIsUpdating(null);
    }
  };

  const getMockDataForType = (type: DocumentType, templateId?: string) => {
    // eslint-disable-next-line
    const { isV3Template } = require("@repo/documents/server");
    const isV3 = isV3Template(templateId);

    if (isV3 && (type === "INVOICE" || type === "RECEIPT")) {
      // eslint-disable-next-line
      const { getMockV3Data } = require("@repo/documents/server");
      return getMockV3Data(type === "INVOICE" ? "invoice" : "receipt", {
        ...organization,
        invoiceConfig,
        receiptConfig,
      });
    }

    let config: any;
    if (type === "INVOICE") config = invoiceConfig;
    else if (type === "RECEIPT") config = receiptConfig;
    else config = waybillConfig;

    const baseDetails = {
      name: config?.companyName || organization?.name,
      address: config?.companyAddress || organization?.address,
      phone: config?.companyPhone || organization?.phone,
      email: config?.companyEmail || organization?.email,
      logo:
        (config?.showLogo ?? true)
          ? config?.logoUrl || organization?.logo
          : null,
    };

    let mockData: any;
    if (type === "INVOICE") mockData = getMockInvoiceData(baseDetails);
    else if (type === "RECEIPT") mockData = getMockReceiptData(baseDetails);
    else mockData = getMockWaybillData(baseDetails);

    if (mockData.branding) {
      mockData.branding.primaryColor =
        config?.primaryColor ||
        organization?.primaryColor ||
        mockData.branding.primaryColor;
      mockData.branding.showPoweredBy = config?.showPoweredBy ?? true;
      mockData.branding.watermarkText = config?.watermarkText;
      mockData.branding.showLogo = config?.showLogo ?? true;
      mockData.branding.companyName = baseDetails.name;
      mockData.branding.companyAddress = baseDetails.address;
      mockData.branding.companyPhone = baseDetails.phone;
      mockData.branding.companyEmail = baseDetails.email;
      mockData.branding.logoUrl = baseDetails.logo;
    }

    const currency = organization?.settings?.defaultCurrency || "USD";
    const symbolMap: Record<string, string> = {
      USD: "$",
      KES: "KSh",
      EUR: "€",
      GBP: "£",
    };
    mockData.currency = currency;
    mockData.currencySymbol = symbolMap[currency] || currency;
    mockData.currencySettings = {
      code: currency,
      symbol: mockData.currencySymbol,
      locale:
        organization?.settings?.defaultTimezone === "Africa/Nairobi"
          ? "en-KE"
          : "en-US",
      precision: 2,
    };
    mockData.footerText = config?.footerText;
    return mockData;
  };

  const handleDownloadStocking = (
    endpoint: string,
    level: "branch" | "org",
  ) => {
    setDownloadingLevel(level);
    window.open(endpoint, "_blank");
    setTimeout(() => setDownloadingLevel(null), 1500);
  };

  // ── Derived state ────────────────────────────────────────────────────────

  const isTemplatePanel =
    activePanel === "templates" || activePanel === "config";
  const isStockingPanel = [
    "stock-requests",
    "compiled-stock",
    "delivery-notes",
    "waybills-v3",
  ].includes(activePanel);

  const templates = isTemplatePanel ? getTemplatesByType(selectedType) : [];
  const activeTemplateId = isTemplatePanel
    ? getDefaultTemplateId(selectedType)
    : "";

  const groupedTemplates = templates.reduce(
    (acc, template) => {
      const major = template.version.split(".")[0];
      if (!acc[major]) acc[major] = [];
      acc[major].push(template);
      return acc;
    },
    {} as Record<string, typeof templates>,
  );

  const sortedVersions = Object.keys(groupedTemplates).sort((a, b) =>
    b.localeCompare(a, undefined, { numeric: true }),
  );

  const selectedDocType = DOC_TYPES.find(d => d.id === selectedType);
  const activeStockingDoc = STOCKING_DOCS.find(d => d.id === activePanel);

  // ── Sidebar item component ───────────────────────────────────────────────

  const SidebarItem = ({
    isActive,
    onClick,
    icon: Icon,
    label,
    sublabel,
    accentColor = "emerald",
  }: {
    isActive: boolean;
    onClick: () => void;
    icon: React.ElementType;
    label: string;
    sublabel?: string;
    accentColor?: "emerald" | "violet" | "blue" | "amber";
  }) => {
    const accent = {
      emerald: "bg-emerald-500",
      violet: "bg-violet-500",
      blue: "bg-blue-500",
      amber: "bg-amber-500",
    }[accentColor];

    const iconBg = {
      emerald: isActive ? "bg-emerald-50 text-emerald-600" : "",
      violet: isActive ? "bg-violet-50 text-violet-600" : "",
      blue: isActive ? "bg-blue-50 text-blue-600" : "",
      amber: isActive ? "bg-amber-50 text-amber-600" : "",
    }[accentColor];

    return (
      <button
        onClick={onClick}
        className={cn(
          "group relative w-full flex items-center gap-3 pl-3.5 pr-3 py-2.5 rounded-lg text-left transition-all duration-150",
          isActive
            ? "bg-white shadow-sm ring-1 ring-zinc-200 text-zinc-900"
            : "text-zinc-500 hover:bg-white/70 hover:text-zinc-700",
        )}>
        {isActive && (
          <span
            className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.75 rounded-full",
              accent,
            )}
          />
        )}
        <div
          className={cn(
            "w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors",
            isActive
              ? iconBg
              : "bg-zinc-100 text-zinc-400 group-hover:text-zinc-500",
          )}>
          <Icon size={14} strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p
            className={cn(
              "text-sm font-medium leading-none",
              isActive ? "text-zinc-900" : "text-zinc-600",
            )}>
            {label}
          </p>
          {sublabel && (
            <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
              {sublabel}
            </p>
          )}
        </div>
      </button>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full min-h-175 bg-white border border-zinc-200/70 rounded-2xl shadow-sm overflow-hidden">
      {/* ── Left Sidebar ────────────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 border-r border-zinc-100 bg-zinc-50/50 flex flex-col overflow-y-auto">
        {/* Customer-facing documents */}
        <div className="px-4 pt-5 pb-3">
          <p className="text-[10px] font-semibold tracking-[0.12em] text-zinc-400 uppercase">
            Customer Documents
          </p>
        </div>

        <nav className="px-2 space-y-0.5">
          {DOC_TYPES.map(type => {
            const isActive =
              (activePanel === "templates" || activePanel === "config") &&
              selectedType === type.id;
            return (
              <SidebarItem
                key={type.id}
                isActive={isActive}
                onClick={() => {
                  setSelectedType(type.id);
                  setActivePanel("templates");
                }}
                icon={type.icon}
                label={type.label}
                sublabel={type.sublabel}
                accentColor="emerald"
              />
            );
          })}
        </nav>

        <div className="px-4 pt-5 pb-3">
          <p className="text-[10px] font-semibold tracking-[0.12em] text-zinc-400 uppercase">
            Stocking &amp; Operations
          </p>
        </div>

        <nav className="px-2 space-y-0.5">
          {STOCKING_DOCS.map(doc => (
            <SidebarItem
              key={doc.id}
              isActive={activePanel === doc.id}
              onClick={() => setActivePanel(doc.id)}
              icon={doc.icon}
              label={doc.label}
              sublabel={doc.sublabel}
              accentColor="violet"
            />
          ))}
        </nav>

        <div className="px-4 pt-5 pb-3">
          <p className="text-[10px] font-semibold tracking-[0.12em] text-zinc-400 uppercase">
            Workspace
          </p>
        </div>

        <nav className="px-2 space-y-0.5">
          <SidebarItem
            isActive={activePanel === "config"}
            onClick={() => setActivePanel("config")}
            icon={Settings2}
            label="Configuration"
            sublabel="Branding &amp; formatting"
            accentColor="blue"
          />
        </nav>

        <div className="flex-1" />

        <div className="px-4 py-4 border-t border-zinc-100 mt-4">
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            V3 templates are the next generation of enterprise documents with
            professional design and richer data.
          </p>
        </div>
      </aside>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 shrink-0">
          <div>
            <h2 className="text-[15px] font-semibold text-zinc-900 tracking-tight">
              {isStockingPanel && activeStockingDoc
                ? activeStockingDoc.label
                : activePanel === "config"
                  ? `${selectedDocType?.label ?? ""} — Configuration`
                  : `${selectedDocType?.label ?? ""} — Templates`}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isStockingPanel && activeStockingDoc
                ? "Operational reporting · V3 enterprise templates"
                : activePanel === "config"
                  ? "Branding, layout, and formatting options"
                  : `${templates.length} template${templates.length !== 1 ? "s" : ""} available`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isStockingPanel ? (
              <Badge className="text-[10px] font-mono bg-violet-50 text-violet-600 border border-violet-200 hover:bg-violet-50 rounded-md px-2 py-1">
                STOCKING
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="text-[10px] font-mono font-medium bg-zinc-100 text-zinc-500 border-0 tracking-wide rounded-md px-2 py-1">
                {selectedType}
              </Badge>
            )}
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-zinc-50/30">
          {/* ── Template Gallery ── */}
          {activePanel === "templates" && (
            <div className="space-y-8">
              {templates.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center py-20">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-3">
                    <LayoutGrid size={16} />
                  </div>
                  <p className="text-sm font-medium text-zinc-700">
                    No templates available
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Templates for this document type haven&apos;t been added
                    yet.
                  </p>
                </div>
              )}

              {sortedVersions.map(version => (
                <div key={version}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                      Version {version}
                    </span>
                    {version === "v3" && (
                      <Badge className="text-[9px] font-bold bg-violet-50 text-violet-600 border border-violet-200 hover:bg-violet-50 rounded px-1.5 py-0.5">
                        Latest
                      </Badge>
                    )}
                    <div className="h-px bg-zinc-200/70 flex-1" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                    {groupedTemplates[version].map(template => {
                      const isDefault = activeTemplateId === template.id;
                      const isThisUpdating = isUpdating === template.id;

                      return (
                        <div
                          key={template.id}
                          className={cn(
                            "relative flex flex-col p-4 rounded-xl border transition-all duration-150",
                            isDefault
                              ? "bg-emerald-50/40 border-emerald-200 ring-1 ring-emerald-100"
                              : "bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-md hover:-translate-y-0.5",
                          )}>
                          {/* Top row */}
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-sm font-semibold text-zinc-900 leading-tight pr-1">
                              {template.name}
                            </p>
                            {isDefault && (
                              <CheckCircle2
                                size={16}
                                className="text-emerald-500 shrink-0 mt-0.5"
                              />
                            )}
                          </div>

                          <Badge
                            variant="outline"
                            className={cn(
                              "w-fit mb-3 text-[10px] font-mono font-medium rounded-md border",
                              versionBadgeClass(template.version),
                            )}>
                            {template.version}
                          </Badge>

                          <p className="text-xs text-zinc-500 leading-relaxed flex-1 mb-4">
                            {template.description}
                          </p>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs flex-1 border-zinc-200 text-zinc-600 hover:bg-zinc-50 rounded-lg"
                              onClick={() => setPreviewTemplate(template)}>
                              <Eye size={12} className="mr-1.5" />
                              Preview
                            </Button>

                            {isDefault ? (
                              <div className="h-8 px-3 flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Active
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                className="h-8 text-xs flex-1 bg-zinc-900 hover:bg-zinc-800 text-white border-0 rounded-lg"
                                onClick={() => handleUpdateDefault(template.id)}
                                disabled={!!isUpdating}>
                                {isThisUpdating ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  "Set default"
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Configuration ── */}
          {activePanel === "config" && (
            <div className="max-w-3xl">
              {/* Doc type tabs within config */}
              <div className="flex items-center gap-2 mb-6 flex-wrap">
                {DOC_TYPES.map(dt => (
                  <button
                    key={dt.id}
                    onClick={() => setSelectedType(dt.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      selectedType === dt.id
                        ? "bg-zinc-900 text-white border-zinc-900"
                        : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300",
                    )}>
                    <dt.icon size={12} />
                    {dt.label}
                  </button>
                ))}
              </div>

              {selectedType === "INVOICE" && (
                <InvoiceConfigForm initialConfig={invoiceConfig} />
              )}
              {selectedType === "RECEIPT" && (
                <DocumentConfigForm
                  type="RECEIPT"
                  initialConfig={receiptConfig}
                />
              )}
              {(selectedType === "WAYBILL" ||
                selectedType === "DELIVERY_NOTE") && (
                <DocumentConfigForm
                  type="WAYBILL"
                  initialConfig={waybillConfig}
                />
              )}
            </div>
          )}

          {/* ── Stocking Operational Docs ── */}
          {isStockingPanel && activeStockingDoc && (
            <div className="max-w-3xl space-y-6">
              {/* Description card */}
              <div className="bg-white border border-zinc-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600 shrink-0">
                    <activeStockingDoc.icon size={16} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 mb-1">
                      {activeStockingDoc.label}
                    </h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      {activeStockingDoc.description}
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="bg-zinc-100" />

              {/* Template info */}
              <div>
                <p className="text-xs font-semibold text-zinc-700 mb-3 uppercase tracking-wide">
                  Template Details
                </p>
                <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileOutput size={14} className="text-violet-500" />
                      <span className="text-sm font-medium text-zinc-800">
                        V3 Enterprise Template
                      </span>
                    </div>
                    <Badge className="text-[9px] font-bold bg-violet-50 text-violet-600 border border-violet-200 hover:bg-violet-50 rounded px-1.5">
                      v3.0.0
                    </Badge>
                  </div>
                  <div className="px-4 py-3 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide mb-1">
                        Format
                      </p>
                      <p className="text-xs text-zinc-700">A4 Landscape PDF</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide mb-1">
                        Features
                      </p>
                      <p className="text-xs text-zinc-700">
                        KPI strip · Color badges · Priority rows
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide mb-1">
                        Data Source
                      </p>
                      <p className="text-xs text-zinc-700">Live database</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide mb-1">
                        Report Scope
                      </p>
                      <p className="text-xs text-zinc-700">
                        Branch or Organization-wide
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Generate section */}
              <div>
                <p className="text-xs font-semibold text-zinc-700 mb-3 uppercase tracking-wide">
                  Generate Report
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Branch level */}
                  <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center text-blue-600">
                        <GitBranch size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">
                          Branch Report
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          Filtered to a specific location
                        </p>
                      </div>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Generates the report scoped to a single branch or
                      inventory location. Useful for branch managers reviewing
                      their own requests.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-8 text-xs border-blue-200 text-blue-700 hover:bg-blue-50 gap-1.5"
                      onClick={() =>
                        handleDownloadStocking(
                          activeStockingDoc.endpoints.branch,
                          "branch",
                        )
                      }
                      disabled={downloadingLevel !== null}>
                      {downloadingLevel === "branch" ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Download size={12} />
                      )}
                      Download Branch PDF
                    </Button>
                  </div>

                  {/* Organization level */}
                  <div className="bg-white border border-violet-200 ring-1 ring-violet-100 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-violet-50 flex items-center justify-center text-violet-600">
                        <Building2 size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">
                          Organization Report
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          All branches combined
                        </p>
                      </div>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Generates the full organization-wide report across all
                      branches and inventory locations. For senior management
                      and procurement teams.
                    </p>
                    <Button
                      size="sm"
                      className="w-full h-8 text-xs bg-violet-600 hover:bg-violet-500 text-white gap-1.5"
                      onClick={() =>
                        handleDownloadStocking(
                          activeStockingDoc.endpoints.org,
                          "org",
                        )
                      }
                      disabled={downloadingLevel !== null}>
                      {downloadingLevel === "org" ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Download size={12} />
                      )}
                      Download Org PDF
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Preview Sheet ────────────────────────────────────────────────── */}
      <Sheet
        open={!!previewTemplate}
        onOpenChange={open => !open && setPreviewTemplate(null)}>
        <SheetContent
          side="right"
          className="w-full sm:w-[50vw] sm:max-w-none p-0 flex flex-col gap-0 border-zinc-800 bg-zinc-950 text-zinc-100">
          {/* Preview header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                <FileText size={15} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-100 leading-none truncate">
                  {previewTemplate?.name}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5 font-mono">
                  {selectedType} · {previewTemplate?.version}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Badge className="text-[10px] font-mono bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-800 rounded-md">
                Preview mode
              </Badge>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* PDF viewer */}
          <div className="flex-1 overflow-hidden p-4">
            <div className="w-full h-full rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900">
              {previewTemplate && (
                <PDFViewer
                  width="100%"
                  height="100%"
                  className="border-none"
                  showToolbar={true}>
                  <previewTemplate.component
                    data={getMockDataForType(selectedType, previewTemplate.id)}
                    qrCode="https://via.placeholder.com/150"
                  />
                </PDFViewer>
              )}
            </div>
          </div>

          {/* Preview footer */}
          {previewTemplate && (
            <div className="px-5 py-3.5 border-t border-zinc-800 shrink-0 flex items-center justify-between gap-3">
              {activeTemplateId === previewTemplate.id ? (
                <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-500" />
                  This is the current default for{" "}
                  {selectedDocType?.label.toLowerCase()}.
                </p>
              ) : (
                <p className="text-xs text-zinc-500">
                  Not the current default for{" "}
                  {selectedDocType?.label.toLowerCase()}.
                </p>
              )}

              {activeTemplateId !== previewTemplate.id && (
                <Button
                  size="sm"
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white border-0 gap-1.5 rounded-lg"
                  onClick={() => {
                    handleUpdateDefault(previewTemplate.id);
                    setPreviewTemplate(null);
                  }}
                  disabled={!!isUpdating}>
                  {isUpdating ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <>
                      Set as default <ChevronRight size={12} />
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
