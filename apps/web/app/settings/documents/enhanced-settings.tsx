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
} from "lucide-react";
import { updateDefaultDocumentTemplate } from "../../actions/organization";
import { toast } from "sonner";
import { cn } from "@repo/ui/lib/utils";
import { Sheet, SheetContent } from "@repo/ui/components/ui/sheet";
import { InvoiceConfigForm } from "./invoice-config-form";

interface EnhancedDocumentSettingsProps {
  organization: any;
  invoiceConfig?: any;
}

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
    fallback: "waybill-default",
  },
] as const;

export function EnhancedDocumentSettings({
  organization,
  invoiceConfig,
}: EnhancedDocumentSettingsProps) {
  const [selectedType, setSelectedType] = useState<DocumentType>("INVOICE");
  const [activePanel, setActivePanel] = useState<"templates" | "config">(
    "templates",
  );
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const getDefaultTemplateId = (type: DocumentType) => {
    const docType = DOC_TYPES.find(d => d.id === type)!;
    return organization.settings?.[docType.settingsKey] || docType.fallback;
  };

  const handleUpdateDefault = async (templateId: string) => {
    setIsUpdating(templateId);
    try {
      await updateDefaultDocumentTemplate(selectedType, templateId);
      toast.success("Default template updated");
      const docType = DOC_TYPES.find(d => d.id === selectedType)!;
      organization.settings = {
        ...organization.settings,
        [docType.settingsKey]: templateId,
      };
    } catch {
      toast.error("Failed to update template");
    } finally {
      setIsUpdating(null);
    }
  };

  const getMockDataForType = (type: DocumentType) => {
    const baseDetails = {
      name: invoiceConfig?.companyName || organization?.name,
      address: invoiceConfig?.companyAddress || organization?.address,
      phone: invoiceConfig?.companyPhone || organization?.phone,
      email: invoiceConfig?.companyEmail || organization?.email,
      logo: invoiceConfig?.logoUrl || organization?.logo,
    };

    let mockData: any;
    if (type === "INVOICE") mockData = getMockInvoiceData(baseDetails);
    else if (type === "RECEIPT") mockData = getMockReceiptData(baseDetails);
    else mockData = getMockWaybillData(baseDetails);

    if (mockData.branding) {
      mockData.branding.primaryColor =
        invoiceConfig?.primaryColor || mockData.branding.primaryColor;
      mockData.branding.showPoweredBy = invoiceConfig?.showPoweredBy ?? true;
      mockData.branding.watermarkText = invoiceConfig?.watermarkText;
    }
    mockData.footerText = invoiceConfig?.footerText;
    return mockData;
  };

  const templates = getTemplatesByType(selectedType);
  const activeTemplateId = getDefaultTemplateId(selectedType);

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

  const selectedDocType = DOC_TYPES.find(d => d.id === selectedType)!;

  return (
    <div className="flex h-full min-h-[600px] bg-white border border-zinc-200/70 rounded-2xl shadow-sm overflow-hidden">
      {/* Left sidebar — document type nav */}
      <aside className="w-60 shrink-0 border-r border-zinc-100 bg-zinc-50/50 flex flex-col">
        <div className="px-4 pt-5 pb-3">
          <p className="text-[10px] font-semibold tracking-[0.12em] text-zinc-400 uppercase">
            Document types
          </p>
        </div>

        <nav className="px-2 space-y-1">
          {DOC_TYPES.map(type => {
            const Icon = type.icon;
            const isActive =
              activePanel === "templates" && selectedType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => {
                  setSelectedType(type.id);
                  setActivePanel("templates");
                }}
                className={cn(
                  "group relative w-full flex items-center gap-3 pl-3.5 pr-3 py-2.5 rounded-lg text-left transition-all duration-150",
                  isActive
                    ? "bg-white shadow-sm ring-1 ring-zinc-200 text-zinc-900"
                    : "text-zinc-500 hover:bg-white/70 hover:text-zinc-700",
                )}>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-full bg-emerald-500" />
                )}
                <div
                  className={cn(
                    "w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors",
                    isActive
                      ? "bg-emerald-50 text-emerald-600"
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
                    {type.label}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                    {type.sublabel}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="px-4 pt-6 pb-3">
          <p className="text-[10px] font-semibold tracking-[0.12em] text-zinc-400 uppercase">
            Workspace
          </p>
        </div>

        <nav className="px-2">
          <button
            onClick={() => setActivePanel("config")}
            className={cn(
              "group relative w-full flex items-center gap-3 pl-3.5 pr-3 py-2.5 rounded-lg text-left transition-all duration-150",
              activePanel === "config"
                ? "bg-white shadow-sm ring-1 ring-zinc-200 text-zinc-900"
                : "text-zinc-500 hover:bg-white/70 hover:text-zinc-700",
            )}>
            {activePanel === "config" && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-full bg-emerald-500" />
            )}
            <div
              className={cn(
                "w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors",
                activePanel === "config"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-zinc-100 text-zinc-400 group-hover:text-zinc-500",
              )}>
              <Settings2 size={14} strokeWidth={2} />
            </div>
            <p
              className={cn(
                "text-sm font-medium leading-none",
                activePanel === "config" ? "text-zinc-900" : "text-zinc-600",
              )}>
              Configuration
            </p>
          </button>
        </nav>

        <div className="flex-1" />

        <div className="px-4 py-4 border-t border-zinc-100">
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Changes to defaults apply to all new documents immediately.
          </p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 shrink-0">
          <div>
            <h2 className="text-[15px] font-semibold text-zinc-900 tracking-tight">
              {activePanel === "config"
                ? `${selectedDocType.label} — Configuration`
                : `${selectedDocType.label} — Templates`}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {activePanel === "config"
                ? "Branding, layout, and formatting options"
                : `${templates.length} template${templates.length !== 1 ? "s" : ""} available · 1 active`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="text-[10px] font-mono font-medium bg-zinc-100 text-zinc-500 border-0 tracking-wide rounded-md px-2 py-1">
              {selectedType}
            </Badge>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-zinc-50/30">
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
                    Templates for this document type haven&apos;t been added yet.
                  </p>
                </div>
              )}

              {sortedVersions.map(version => (
                <div key={version}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                      Version {version}
                    </span>
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
                            className="w-fit mb-3 text-[10px] font-mono font-medium border-zinc-200 text-zinc-400 bg-transparent rounded-md">
                            v{template.version}
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

          {activePanel === "config" && (
            <div className="max-w-3xl">
              <InvoiceConfigForm initialConfig={invoiceConfig} />
            </div>
          )}
        </div>
      </div>

      {/* Preview sheet — half-screen */}
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
                  {selectedType} · v{previewTemplate?.version}
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

          {/* PDF area — takes all remaining space */}
          <div className="flex-1 overflow-hidden p-4">
            <div className="w-full h-full rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900">
              {previewTemplate && (
                <PDFViewer
                  width="100%"
                  height="100%"
                  className="border-none"
                  showToolbar={true}>
                  <previewTemplate.component
                    data={getMockDataForType(selectedType)}
                    qrCode="https://via.placeholder.com/150"
                  />
                </PDFViewer>
              )}
            </div>
          </div>

          {/* Preview footer actions */}
          {previewTemplate && (
            <div className="px-5 py-3.5 border-t border-zinc-800 shrink-0 flex items-center justify-between gap-3">
              {activeTemplateId === previewTemplate.id ? (
                <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-500" />
                  This is the current default for{&quot; &quot;}
                  {selectedDocType.label.toLowerCase()}.
                </p>
              ) : (
                <p className="text-xs text-zinc-500">
                  This is not the current default for{&quot; &quot;}
                  {selectedDocType.label.toLowerCase()}.
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
