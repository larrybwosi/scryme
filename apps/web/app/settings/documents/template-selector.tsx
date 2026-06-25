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
    (t) => t.id === previewId,
  );
  const selectedTemplate = INVOICE_TEMPLATE_METADATA.find(
    (t) => t.id === selectedId,
  );

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.08),0_4px_16px_0_rgba(0,0,0,0.06)]"
      style={{
        borderRadius: "8px",
        border: "1px solid #D1D5DB",
        height: "calc(100vh - 200px)", // Adjusted for full viewport height minus header/padding
        minHeight: "600px",
      }}
    >
      {/* ── Left Panel — Template List ───────────────────────────── */}
      <div
        className="lg:col-span-4 flex flex-col h-full overflow-hidden"
        style={{ borderRight: "1px solid #D1D5DB", background: "#F8F9FA" }}
      >
        {/* Panel Header */}
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{
            background: "#FFFFFF",
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-8 h-8"
              style={{
                background: "#1E3A5F",
                borderRadius: "6px",
              }}
            >
              <Layers className="h-4 w-4 text-white" />
            </div>
            <div>
              <p
                className="text-sm font-semibold leading-tight"
                style={{ color: "#111827", letterSpacing: "-0.01em" }}
              >
                Invoice Templates
              </p>
              <p
                className="text-[11px] leading-tight mt-0.5"
                style={{ color: "#6B7280" }}
              >
                {INVOICE_TEMPLATE_METADATA.length} templates available
              </p>
            </div>
          </div>
          <span
            className="text-[10px] font-mono font-semibold uppercase tracking-widest px-2 py-1"
            style={{
              background: "#EEF2F7",
              color: "#1E3A5F",
              border: "1px solid #C7D4E3",
              borderRadius: "4px",
            }}
          >
            Settings
          </span>
        </div>

        {/* Section label */}
        <div
          className="px-5 py-2 flex items-center gap-2"
          style={{ borderBottom: "1px solid #E5E7EB", background: "#F8F9FA" }}
        >
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "#9CA3AF" }}
          >
            Available Templates
          </span>
        </div>

        {/* Template List */}
        <div className="flex-1 overflow-y-auto" style={{ padding: "8px" }}>
          {INVOICE_TEMPLATE_METADATA.map((template, index) => {
            const isSelected = selectedId === template.id;
            const isPreviewing = previewId === template.id;

            return (
              <button
                key={template.id}
                onClick={() => {
                  setSelectedId(template.id);
                  setPreviewId(template.id);
                }}
                className="w-full text-left transition-all duration-100 group relative"
                style={{
                  background: isSelected ? "#FFFFFF" : "transparent",
                  border: isSelected
                    ? "1px solid #C7D4E3"
                    : "1px solid transparent",
                  borderRadius: "6px",
                  marginBottom: "2px",
                  boxShadow: isSelected
                    ? "0 1px 4px 0 rgba(30,58,95,0.08)"
                    : "none",
                }}
              >
                {/* Left accent */}
                <div
                  className="absolute left-0 top-0 bottom-0 transition-all duration-150"
                  style={{
                    width: "3px",
                    borderRadius: "6px 0 0 6px",
                    background: isSelected ? "#1E3A5F" : "transparent",
                  }}
                />

                <div
                  style={{
                    paddingLeft: "16px",
                    paddingRight: "14px",
                    paddingTop: "12px",
                    paddingBottom: "12px",
                  }}
                >
                  {/* Row top */}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span
                      className="text-[13px] font-semibold leading-snug"
                      style={{
                        color: isSelected ? "#1E3A5F" : "#1F2937",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {template.name}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                      <span
                        className="text-[10px] font-mono font-medium px-1.5 py-0.5 uppercase tracking-wider"
                        style={{
                          background: isSelected ? "#EEF2F7" : "#F3F4F6",
                          color: isSelected ? "#1E3A5F" : "#6B7280",
                          border: `1px solid ${isSelected ? "#C7D4E3" : "#E5E7EB"}`,
                          borderRadius: "4px",
                        }}
                      >
                        {template.version}
                      </span>
                      {isSelected && (
                        <div
                          className="flex items-center justify-center w-[18px] h-[18px]"
                          style={{
                            background: "#1E3A5F",
                            borderRadius: "50%",
                          }}
                        >
                          <Check
                            className="h-2.5 w-2.5 text-white"
                            strokeWidth={3}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <p
                    className="text-[12px] leading-relaxed line-clamp-2"
                    style={{ color: "#6B7280" }}
                  >
                    {template.description}
                  </p>

                  {/* Row footer */}
                  <div
                    className="flex items-center justify-between mt-3 pt-2.5"
                    style={{ borderTop: "1px solid #F3F4F6" }}
                  >
                    <button
                      className="flex items-center gap-1.5 transition-colors"
                      style={{
                        color: isPreviewing ? "#1E3A5F" : "#9CA3AF",
                        fontSize: "11px",
                        fontWeight: isPreviewing ? 600 : 500,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewId(template.id);
                      }}
                    >
                      <Eye className="h-3 w-3" />
                      {isPreviewing ? "Previewing" : "Preview"}
                    </button>

                    {isSelected ? (
                      <span
                        className="text-[11px] font-semibold flex items-center gap-1"
                        style={{ color: "#1E3A5F" }}
                      >
                        Active
                      </span>
                    ) : (
                      <span
                        className="text-[11px] font-medium flex items-center gap-0.5 transition-colors"
                        style={{ color: "#9CA3AF" }}
                      >
                        Select <ChevronRight className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Save Footer */}
        <div
          className="p-4"
          style={{
            borderTop: "1px solid #E5E7EB",
            background: "#FFFFFF",
          }}
        >
          {hasChanges && (
            <div
              className="flex items-start gap-2 rounded mb-3 px-3 py-2.5"
              style={{
                background: "#FFFBEB",
                border: "1px solid #FDE68A",
                borderRadius: "6px",
              }}
            >
              <AlertCircle
                className="h-3.5 w-3.5 mt-0.5 shrink-0"
                style={{ color: "#D97706" }}
              />
              <div>
                <p
                  className="text-[11px] font-semibold"
                  style={{ color: "#92400E" }}
                >
                  Unsaved changes
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "#B45309" }}>
                  Switching to{" "}
                  <span className="font-semibold">
                    {selectedTemplate?.name}
                  </span>
                </p>
              </div>
            </div>
          )}
          <Button
            className="w-full h-9 text-[13px] font-semibold transition-all duration-150"
            style={{
              background: hasChanges ? "#1E3A5F" : "#F3F4F6",
              color: hasChanges ? "#FFFFFF" : "#9CA3AF",
              border: "none",
              borderRadius: "6px",
              cursor: hasChanges && !isPending ? "pointer" : "not-allowed",
              boxShadow: hasChanges
                ? "0 1px 3px 0 rgba(30,58,95,0.25)"
                : "none",
              letterSpacing: "-0.01em",
            }}
            onClick={handleSave}
            disabled={isPending || !hasChanges}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Default Template"
            )}
          </Button>
          <p
            className="text-center mt-2 text-[10px]"
            style={{ color: "#9CA3AF" }}
          >
            Applies to all future invoices in this organization
          </p>
        </div>
      </div>

      {/* ── Right Panel — PDF Preview ────────────────────────────── */}
      <div
        className="lg:col-span-8 flex flex-col h-full overflow-hidden"
        style={{ background: "#EAECEF" }}
      >
        {/* Preview Toolbar */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{
            background: "#FFFFFF",
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <div className="flex items-center gap-3">
            {/* Document icon block */}
            <div
              className="flex items-center justify-center w-7 h-7"
              style={{
                background: "#F3F4F6",
                border: "1px solid #E5E7EB",
                borderRadius: "5px",
              }}
            >
              <FileText className="h-3.5 w-3.5" style={{ color: "#6B7280" }} />
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-[11px] font-medium"
                style={{ color: "#9CA3AF" }}
              >
                Preview
              </span>
              <span className="text-[11px]" style={{ color: "#D1D5DB" }}>
                /
              </span>
              <span
                className="text-[13px] font-semibold"
                style={{ color: "#111827", letterSpacing: "-0.01em" }}
              >
                {previewTemplate?.name}
              </span>
              <span
                className="text-[10px] font-mono px-1.5 py-0.5 font-medium uppercase tracking-wider"
                style={{
                  background: "#F3F4F6",
                  color: "#6B7280",
                  border: "1px solid #E5E7EB",
                  borderRadius: "4px",
                }}
              >
                {previewTemplate?.version}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5"
              style={{
                background: "#FFF8E1",
                color: "#B45309",
                border: "1px solid #FDE68A",
                borderRadius: "4px",
              }}
            >
              Sample data
            </Badge>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 relative">
          <div className="absolute inset-0" style={{ padding: "20px" }}>
            <div
              className="w-full h-full overflow-hidden"
              style={{
                borderRadius: "6px",
                boxShadow:
                  "0 2px 8px 0 rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)",
              }}
            >
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
        </div>

        {/* Preview Footer */}
        <div
          className="flex items-center justify-between px-5 py-2.5"
          style={{
            background: "#FFFFFF",
            borderTop: "1px solid #E5E7EB",
          }}
        >
          <p className="text-[11px]" style={{ color: "#9CA3AF" }}>
            Previewing with sample data — live invoices will reflect your
            organization profile.
          </p>
          {selectedId === previewId ? (
            <span
              className="text-[11px] font-semibold flex items-center gap-1"
              style={{ color: "#1E3A5F" }}
            >
              <Check className="h-3 w-3" strokeWidth={2.5} />
              Active selection
            </span>
          ) : (
            <button
              className="text-[11px] font-semibold transition-colors"
              style={{ color: "#1E3A5F" }}
              onClick={() => {
                setSelectedId(previewId);
              }}
            >
              Select this template →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
