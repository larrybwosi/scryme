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
  Check,
  Loader2,
  Eye,
  FileText,
  ChevronRight,
  ArrowLeft,
  Receipt,
  Truck,
  Settings2,
} from "lucide-react";
import { updateDefaultDocumentTemplate } from "../../actions/organization";
import { toast } from "sonner";
import { cn } from "@repo/ui/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";
import { InvoiceConfigForm } from "./invoice-config-form";

interface EnhancedDocumentSettingsProps {
  organization: any;
  invoiceConfig?: any;
}

export function EnhancedDocumentSettings({
  organization,
  invoiceConfig,
}: EnhancedDocumentSettingsProps) {
  const [view, setView] = useState<"categories" | "templates" | "config">(
    "categories",
  );
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const documentTypes = [
    {
      id: "INVOICE" as DocumentType,
      name: "Invoices",
      icon: FileText,
      description: "Sales invoices and billing documents",
      color: "bg-blue-50 text-blue-600",
      defaultTemplateId:
        organization.settings?.defaultInvoiceTemplate || "invoice-v2",
    },
    {
      id: "RECEIPT" as DocumentType,
      name: "Receipts",
      icon: Receipt,
      description: "Payment receipts and transaction confirmations",
      color: "bg-emerald-50 text-emerald-600",
      defaultTemplateId:
        organization.settings?.defaultReceiptTemplate || "receipt-v2",
    },
    {
      id: "WAYBILL" as DocumentType,
      name: "Waybills",
      icon: Truck,
      description: "Delivery notes and shipping documentation",
      color: "bg-orange-50 text-orange-600",
      defaultTemplateId:
        organization.settings?.defaultWaybillTemplate || "waybill-default",
    },
  ];

  const handleSelectType = (type: DocumentType) => {
    setSelectedType(type);
    setView("templates");
  };

  const handleUpdateDefault = async (templateId: string) => {
    if (!selectedType) return;
    setIsUpdating(true);
    try {
      await updateDefaultDocumentTemplate(selectedType, templateId);
      toast.success(`${selectedType} default template updated`);
      // Update local state to reflect change immediately
      organization.settings = {
        ...organization.settings,
        [`default${selectedType.charAt(0) + selectedType.slice(1).toLowerCase()}Template`]:
          templateId,
      };
    } catch (error) {
      toast.error("Failed to update template");
    } finally {
      setIsUpdating(false);
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

    let mockData;
    if (type === "INVOICE") mockData = getMockInvoiceData(baseDetails);
    else if (type === "RECEIPT") mockData = getMockReceiptData(baseDetails);
    else mockData = getMockWaybillData(baseDetails);

    // Apply branding overrides
    if (mockData.branding) {
      mockData.branding.primaryColor =
        invoiceConfig?.primaryColor || mockData.branding.primaryColor;
      mockData.branding.showPoweredBy = invoiceConfig?.showPoweredBy ?? true;
      mockData.branding.watermarkText = invoiceConfig?.watermarkText;
    }
    mockData.footerText = invoiceConfig?.footerText;

    return mockData;
  };

  const renderCategories = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {documentTypes.map((type) => (
        <button
          key={type.id}
          onClick={() => handleSelectType(type.id)}
          className="flex flex-col text-left p-6 bg-white border border-gray-200 rounded-xl hover:border-emerald-500 hover:shadow-md transition-all group"
        >
          <div
            className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors",
              type.color,
            )}
          >
            <type.icon size={24} />
          </div>
          <h4 className="text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
            {type.name}
          </h4>
          <p className="text-sm text-gray-500 mt-1 mb-4">{type.description}</p>
          <div className="mt-auto flex items-center text-xs font-medium text-emerald-600">
            Manage Templates <ChevronRight size={14} className="ml-1" />
          </div>
        </button>
      ))}
    </div>
  );

  const renderTemplates = () => {
    if (!selectedType) return null;
    const templates = getTemplatesByType(selectedType);
    const activeTemplateId = documentTypes.find(
      (t) => t.id === selectedType,
    )?.defaultTemplateId;

    // Group templates by major version
    const groupedTemplates = templates.reduce(
      (acc, template) => {
        const majorVersion = template.version.split(".")[0];
        if (!acc[majorVersion]) acc[majorVersion] = [];
        acc[majorVersion].push(template);
        return acc;
      },
      {} as Record<string, typeof templates>,
    );

    const sortedVersions = Object.keys(groupedTemplates).sort((a, b) =>
      b.localeCompare(a, undefined, { numeric: true }),
    );

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setView("categories")}
            className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft size={16} className="mr-1" /> Back to Types
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setView("config")}
            className="flex items-center gap-2"
          >
            <Settings2 size={16} /> Configure {selectedType}
          </Button>
        </div>

        {sortedVersions.map((version) => (
          <div key={version} className="space-y-4">
            <div className="flex items-center gap-4">
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                Version {version}
              </h4>
              <div className="h-px bg-gray-100 flex-1" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedTemplates[version].map((template) => {
                const isActive = activeTemplateId === template.id;
                return (
                  <div
                    key={template.id}
                    className={cn(
                      "flex flex-col p-5 bg-white border rounded-xl transition-all relative overflow-hidden",
                      isActive
                        ? "border-emerald-500 shadow-sm ring-1 ring-emerald-500"
                        : "border-gray-200 hover:border-gray-300",
                    )}
                  >
                    {isActive && (
                      <div className="absolute top-0 right-0 bg-emerald-500 text-white px-3 py-1 text-[10px] font-bold rounded-bl-lg uppercase tracking-wider">
                        Default
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-3">
                      <h5 className="font-bold text-gray-900">
                        {template.name}
                      </h5>
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-mono"
                      >
                        {template.version}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-500 mb-6 flex-1">
                      {template.description}
                    </p>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 text-xs h-9"
                        onClick={() => setPreviewTemplate(template)}
                      >
                        <Eye size={14} className="mr-1.5" /> Preview
                      </Button>
                      {!isActive && (
                        <Button
                          className="flex-1 text-xs h-9 bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => handleUpdateDefault(template.id)}
                          disabled={isUpdating}
                        >
                          {isUpdating ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            "Set Default"
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
    );
  };

  const renderConfig = () => (
    <div className="space-y-6">
      <button
        onClick={() => setView("templates")}
        className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft size={16} className="mr-1" /> Back to Templates
      </button>

      <div className="max-w-4xl bg-white border border-gray-200 rounded-xl p-6">
        <InvoiceConfigForm initialConfig={invoiceConfig} />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      {view === "categories" && renderCategories()}
      {view === "templates" && renderTemplates()}
      {view === "config" && renderConfig()}

      {/* Preview Overlay */}
      <Dialog
        open={!!previewTemplate}
        onOpenChange={() => setPreviewTemplate(null)}
      >
        <DialogContent className="max-w-[95vw] w-full h-[95vh] flex flex-col p-0 overflow-hidden bg-zinc-100/50 border-zinc-200">
          <DialogHeader className="p-4 bg-white border-b shrink-0 shadow-sm z-10">
            <div className="flex items-center justify-between pr-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <FileText size={20} />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-zinc-900">
                    {previewTemplate?.name}
                  </DialogTitle>
                  <p className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">
                    Professional Document Manifest • {previewTemplate?.version}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className="bg-zinc-50 text-zinc-600 border-zinc-200 font-mono text-[10px] tracking-wider uppercase"
                >
                  Simulation Mode
                </Badge>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 p-6 md:p-8 lg:p-12 overflow-hidden bg-zinc-100/30">
            <div className="w-full h-full bg-white rounded-xl shadow-2xl shadow-zinc-200/50 overflow-hidden border border-zinc-200 transition-all">
              {previewTemplate && (
                <PDFViewer
                  width="100%"
                  height="100%"
                  className="border-none"
                  showToolbar={true}
                >
                  <previewTemplate.component
                    data={getMockDataForType(selectedType!)}
                    qrCode="https://via.placeholder.com/150"
                  />
                </PDFViewer>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
