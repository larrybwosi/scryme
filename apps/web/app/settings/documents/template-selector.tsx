"use client";

import React, { useState, useTransition } from "react";
import {
  INVOICE_TEMPLATE_METADATA,
  getInvoiceTemplate,
  getMockInvoiceData,
} from "@repo/documents";
import { PDFViewer } from "@react-pdf/renderer";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Check,
  Loader2,
  Eye,
  FileText,
  Layers,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { updateInvoiceTemplate } from "../../actions/organization";
import { toast } from "sonner";
import { cn } from "@repo/ui/lib/utils";

interface TemplateSelectorProps {
  initialTemplateId: string;
  organization: any;
  invoiceConfig?: any;
}

export function TemplateSelector({
  initialTemplateId,
  organization,
  invoiceConfig,
}: TemplateSelectorProps) {
  const [selectedId, setSelectedId] = useState(initialTemplateId);
  const [previewId, setPreviewId] = useState(initialTemplateId);
  const [isPending, startTransition] = useTransition();

  const hasChanges = selectedId !== initialTemplateId;

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateInvoiceTemplate(selectedId);
        toast.success("Default invoice template updated");
      } catch (error) {
        toast.error("Failed to update template");
      }
    });
  };

  const SelectedTemplateComponent = getInvoiceTemplate(previewId);

  // Apply invoice config overrides to mock data
  const mockData = getMockInvoiceData({
    name: invoiceConfig?.companyName || organization?.name,
    address: invoiceConfig?.companyAddress || organization?.address,
    phone: invoiceConfig?.companyPhone || organization?.phone,
    email: invoiceConfig?.companyEmail || organization?.email,
    logo: invoiceConfig?.logoUrl || organization?.logo,
  });

  // Inject additional config into mockData for preview
  if (mockData.branding) {
    mockData.branding.primaryColor =
      invoiceConfig?.primaryColor || mockData.branding.primaryColor;
    mockData.branding.showPoweredBy = invoiceConfig?.showPoweredBy ?? true;
    mockData.branding.watermarkText = invoiceConfig?.watermarkText;
  }
  mockData.footerText = invoiceConfig?.footerText;
  mockData.notes = mockData.notes || invoiceConfig?.defaultNotes;
  mockData.termsAndConditions =
    mockData.termsAndConditions || invoiceConfig?.defaultTerms;

  // Handle invoice numbering preview
  const startNumber = invoiceConfig?.invoiceNumberStart || 1;
  const padding = invoiceConfig?.invoiceNumberPadding || 0;
  const prefix = invoiceConfig?.invoiceNumberPrefix || "";
  const suffix = invoiceConfig?.invoiceNumberSuffix || "";
  const formattedNumber = `${prefix}${String(startNumber).padStart(padding, "0")}${suffix}`;
  mockData.invoiceNumber = formattedNumber;

  const previewTemplate = INVOICE_TEMPLATE_METADATA.find(
    (t) => t.id === previewId
  );
  const selectedTemplate = INVOICE_TEMPLATE_METADATA.find(
    (t) => t.id === selectedId
  );

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden bg-card text-card-foreground border border-border rounded-lg shadow-xs"
      style={{
        height: "calc(100vh - 200px)",
        minHeight: "600px",
      }}
    >
      {/* ── Left Panel — Template List ───────────────────────────── */}
      <div className="lg:col-span-4 flex flex-col h-full overflow-hidden border-r border-border bg-muted/20">
        {/* Panel Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-8 rounded-md bg-primary text-primary-foreground">
              <Layers className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight text-foreground tracking-tight">
                Invoice Templates
              </p>
              <p className="text-[11px] leading-tight mt-0.5 text-muted-foreground">
                {INVOICE_TEMPLATE_METADATA.length} templates available
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-widest px-2 py-1">
            Settings
          </Badge>
        </div>

        {/* Section label */}
        <div className="px-5 py-2 flex items-center gap-2 border-b border-border bg-muted/40">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Available Templates
          </span>
        </div>

        {/* Template List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {INVOICE_TEMPLATE_METADATA.map((template) => {
            const isSelected = selectedId === template.id;
            const isPreviewing = previewId === template.id;

            return (
              <button
                key={template.id}
                onClick={() => {
                  setSelectedId(template.id);
                  setPreviewId(template.id);
                }}
                className={cn(
                  "w-full text-left transition-all duration-100 group relative p-3 rounded-lg border",
                  isSelected
                    ? "bg-card border-primary/40 shadow-xs"
                    : "bg-transparent border-transparent hover:bg-muted/50"
                )}
              >
                {/* Left accent */}
                <div
                  className={cn(
                    "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg transition-all duration-150",
                    isSelected ? "bg-primary" : "bg-transparent"
                  )}
                />

                <div className="pl-1">
                  {/* Row top */}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className={cn(
                      "text-[13px] font-semibold leading-snug tracking-tight",
                      isSelected ? "text-primary" : "text-foreground"
                    )}>
                      {template.name}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                      <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0.5">
                        {template.version}
                      </Badge>
                      {isSelected && (
                        <div className="flex items-center justify-center size-4 rounded-full bg-primary text-primary-foreground">
                          <Check className="size-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-[12px] leading-relaxed line-clamp-2 text-muted-foreground">
                    {template.description}
                  </p>

                  {/* Row footer */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/60">
                    <button
                      className={cn(
                        "flex items-center gap-1.5 text-[11px] transition-colors",
                        isPreviewing ? "font-semibold text-primary" : "font-medium text-muted-foreground"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewId(template.id);
                      }}
                    >
                      <Eye className="size-3" />
                      {isPreviewing ? "Previewing" : "Preview"}
                    </button>

                    {isSelected ? (
                      <span className="text-[11px] font-semibold flex items-center gap-1 text-primary">
                        Active
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium flex items-center gap-0.5 text-muted-foreground">
                        Select <ChevronRight className="size-3" />
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Save Footer */}
        <div className="p-4 border-t border-border bg-card">
          {hasChanges && (
            <div className="flex items-start gap-2 rounded-lg mb-3 p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
              <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] font-semibold">Unsaved changes</p>
                <p className="text-[10px] mt-0.5">
                  Switching to <span className="font-semibold">{selectedTemplate?.name}</span>
                </p>
              </div>
            </div>
          )}
          <Button
            className="w-full h-9 text-[13px] font-semibold"
            disabled={isPending || !hasChanges}
            onClick={handleSave}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Default Template"
            )}
          </Button>
          <p className="text-center mt-2 text-[10px] text-muted-foreground">
            Applies to all future invoices in this organization
          </p>
        </div>
      </div>

      {/* ── Right Panel — PDF Preview ────────────────────────────── */}
      <div className="lg:col-span-8 flex flex-col h-full overflow-hidden bg-muted/30">
        {/* Preview Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-7 rounded-md bg-muted border border-border text-muted-foreground">
              <FileText className="size-3.5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-muted-foreground">
                Preview
              </span>
              <span className="text-[11px] text-muted-foreground/60">/</span>
              <span className="text-[13px] font-semibold text-foreground tracking-tight">
                {previewTemplate?.name}
              </span>
              <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0.5">
                {previewTemplate?.version}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5"
            >
              Sample data
            </Badge>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 relative p-5">
          <div className="w-full h-full overflow-hidden rounded-lg border border-border bg-background shadow-xs">
            <PDFViewer
              width="100%"
              height="100%"
              className="border-none block"
              showToolbar={true}
            >
              <SelectedTemplateComponent
                data={mockData}
                qrCode="https://via.placeholder.com/150"
              />
            </PDFViewer>
          </div>
        </div>

        {/* Preview Footer */}
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-border bg-card">
          <p className="text-[11px] text-muted-foreground">
            Previewing with sample data — live invoices will reflect your organization profile.
          </p>
          {selectedId === previewId ? (
            <span className="text-[11px] font-semibold flex items-center gap-1 text-primary">
              <Check className="size-3 stroke-[2.5]" />
              Active selection
            </span>
          ) : (
            <button
              className="text-[11px] font-semibold text-primary hover:underline"
              onClick={() => setSelectedId(previewId)}
            >
              Select this template &rarr;
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
