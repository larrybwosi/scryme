"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  FileText,
  Receipt,
  Truck,
  PackageSearch,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  FileCheck2,
} from "lucide-react";
import { Switch } from "@repo/ui/components/ui/switch";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Separator } from "@repo/ui/components/ui/separator";
import {
  toggleDocumentCategorySetting,
  toggleDocumentTemplateSetting,
} from "@/app/actions/document-templates";

interface DocumentTemplatesPanelProps {
  initialData: {
    categorySettings: Record<string, boolean>;
    templateSettings: Record<string, boolean>;
    categories: Array<{
      id: string;
      label: string;
      description: string;
      isEnabled: boolean;
      enabledCount: number;
      totalCount: number;
      templates: Array<{
        id: string;
        name: string;
        description: string;
        version: string;
        type: string;
        isEnabled: boolean;
        isEffectivelyEnabled: boolean;
      }>;
    }>;
  };
}

const CATEGORY_ICONS: Record<string, any> = {
  INVOICE: FileText,
  RECEIPT: Receipt,
  WAYBILL: Truck,
  DELIVERY_NOTE: PackageSearch,
};

export function DocumentTemplatesPanel({
  initialData,
}: DocumentTemplatesPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const totalTemplates = data.categories.reduce(
    (acc, cat) => acc + cat.templates.length,
    0
  );
  const activeCategoriesCount = data.categories.filter((c) => c.isEnabled).length;
  const approvedTemplatesCount = data.categories.reduce(
    (acc, cat) =>
      acc + cat.templates.filter((t) => t.isEffectivelyEnabled).length,
    0
  );

  const handleCategoryToggle = async (
    documentType: string,
    currentStatus: boolean
  ) => {
    const nextStatus = !currentStatus;
    setPendingKey(`cat:${documentType}`);

    // Optimistic update
    setData((prev) => ({
      ...prev,
      categorySettings: {
        ...prev.categorySettings,
        [documentType]: nextStatus,
      },
      categories: prev.categories.map((cat) => {
        if (cat.id !== documentType) return cat;
        return {
          ...cat,
          isEnabled: nextStatus,
          templates: cat.templates.map((tmpl) => ({
            ...tmpl,
            isEffectivelyEnabled: nextStatus && tmpl.isEnabled,
          })),
        };
      }),
    }));

    startTransition(async () => {
      try {
        await toggleDocumentCategorySetting(documentType, nextStatus);
        toast.success(
          `${documentType} category ${nextStatus ? "enabled" : "disabled"} system wide`
        );
        router.refresh();
      } catch (error) {
        toast.error("Failed to update category status");
        setData(initialData);
      } finally {
        setPendingKey(null);
      }
    });
  };

  const handleTemplateToggle = async (
    documentType: string,
    templateId: string,
    currentStatus: boolean
  ) => {
    const nextStatus = !currentStatus;
    setPendingKey(`tmpl:${documentType}:${templateId}`);

    // Optimistic update
    setData((prev) => ({
      ...prev,
      templateSettings: {
        ...prev.templateSettings,
        [`${documentType}:${templateId}`]: nextStatus,
      },
      categories: prev.categories.map((cat) => {
        if (cat.id !== documentType) return cat;
        const nextTemplates = cat.templates.map((tmpl) => {
          if (tmpl.id !== templateId) return tmpl;
          return {
            ...tmpl,
            isEnabled: nextStatus,
            isEffectivelyEnabled: cat.isEnabled && nextStatus,
          };
        });
        return {
          ...cat,
          templates: nextTemplates,
          enabledCount: nextTemplates.filter((t) => t.isEnabled).length,
        };
      }),
    }));

    startTransition(async () => {
      try {
        await toggleDocumentTemplateSetting(
          documentType,
          templateId,
          nextStatus
        );
        toast.success(
          `Template "${templateId}" ${nextStatus ? "approved" : "disabled"}`
        );
        router.refresh();
      } catch (error) {
        toast.error("Failed to update template status");
        setData(initialData);
      } finally {
        setPendingKey(null);
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card text-card-foreground">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Categories
            </CardTitle>
            <ShieldCheck className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeCategoriesCount} / {data.categories.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Document types enabled system wide
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approved Templates
            </CardTitle>
            <FileCheck2 className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {approvedTemplatesCount} / {totalTemplates}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Templates available to organizations
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Default System Policy
            </CardTitle>
            <AlertTriangle className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">Disabled</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unapproved templates default to hidden
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Sections */}
      <div className="space-y-6">
        {data.categories.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.id] || FileText;
          const isCategoryLoading = pendingKey === `cat:${cat.id}`;

          return (
            <Card key={cat.id} className="overflow-hidden border border-border">
              <CardHeader className="bg-muted/40 border-b border-border py-4 px-6 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-9 rounded-lg bg-background border border-border text-foreground">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-semibold text-foreground">
                        {cat.label}
                      </CardTitle>

                      <Badge
                        variant={cat.isEnabled ? "default" : "secondary"}
                        className="text-[11px] font-medium"
                      >
                        {cat.isEnabled ? "Category Enabled" : "Category Disabled"}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs mt-0.5 text-muted-foreground">
                      {cat.description} &bull; {cat.enabledCount} of{" "}
                      {cat.totalCount} individual templates approved
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground">
                    {cat.isEnabled ? "System Wide On" : "System Wide Off"}
                  </span>
                  {isCategoryLoading ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Switch
                      checked={cat.isEnabled}
                      onCheckedChange={() =>
                        handleCategoryToggle(cat.id, cat.isEnabled)
                      }
                    />
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {!cat.isEnabled && (
                  <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="size-4 shrink-0" />
                    <span>
                      Because the <strong>{cat.label}</strong> category is disabled
                      system wide, all templates below are currently hidden from
                      organization document settings regardless of individual approval status.
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cat.templates.map((template) => {
                    const isTmplLoading =
                      pendingKey === `tmpl:${cat.id}:${template.id}`;

                    return (
                      <div
                        key={template.id}
                        className={`flex flex-col justify-between p-4 rounded-xl border transition-all ${
                          template.isEffectivelyEnabled
                            ? "bg-card border-emerald-500/30 shadow-xs"
                            : template.isEnabled
                              ? "bg-card/60 border-border opacity-75"
                              : "bg-muted/30 border-border/60 opacity-60"
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="text-sm font-semibold text-foreground leading-snug">
                              {template.name}
                            </h4>
                            <Badge
                              variant="outline"
                              className="text-[10px] font-mono shrink-0"
                            >
                              {template.version}
                            </Badge>
                          </div>

                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                            {template.description}
                          </p>
                        </div>

                        <div>
                          <Separator className="my-2" />
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-1.5">
                              {template.isEffectivelyEnabled ? (
                                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 className="size-3.5" />
                                  Active &amp; Approved
                                </span>
                              ) : template.isEnabled ? (
                                <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                                  <AlertTriangle className="size-3.5" />
                                  Approved (Category Off)
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                                  <XCircle className="size-3.5" />
                                  Disabled
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {isTmplLoading ? (
                                <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                              ) : (
                                <Switch
                                  checked={template.isEnabled}
                                  onCheckedChange={() =>
                                    handleTemplateToggle(
                                      cat.id,
                                      template.id,
                                      template.isEnabled
                                    )
                                  }
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
