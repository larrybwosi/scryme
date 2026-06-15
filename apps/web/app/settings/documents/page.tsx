import React, { Suspense } from "react";
import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { redirect } from "next/navigation";
import { TemplateSelector } from "./template-selector";
import { InvoiceConfigForm } from "./invoice-config-form";
import { Separator } from "@repo/ui/components/ui/separator";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@repo/ui/components/ui/tabs";
import { Palette, Settings2, FileText } from "lucide-react";

// Helper function to convert Decimal to number
const convertDecimalsToNumbers = (obj: any): any => {
  if (!obj) return obj;

  const converted = { ...obj };

  // Convert Decimal fields to numbers
  if (
    converted.defaultTaxRate &&
    typeof converted.defaultTaxRate === "object"
  ) {
    converted.defaultTaxRate = Number(converted.defaultTaxRate);
  }
  if (
    converted.highValueTaxThreshold &&
    typeof converted.highValueTaxThreshold === "object"
  ) {
    converted.highValueTaxThreshold = Number(converted.highValueTaxThreshold);
  }
  if (converted.mileageRate && typeof converted.mileageRate === "object") {
    converted.mileageRate = Number(converted.mileageRate);
  }
  if (
    converted.minMarginThreshold &&
    typeof converted.minMarginThreshold === "object"
  ) {
    converted.minMarginThreshold = Number(converted.minMarginThreshold);
  }
  if (
    converted.priceApprovalThreshold &&
    typeof converted.priceApprovalThreshold === "object"
  ) {
    converted.priceApprovalThreshold = Number(converted.priceApprovalThreshold);
  }

  return converted;
};

export default async function DocumentsSettingsPage() {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) {
    redirect("/login");
  }

  // Use select to get only the fields we need
  const [organization, invoiceConfig] = await Promise.all([
    db.organization.findUnique({
      where: { id: auth.organizationId },
      select: {
        id: true,
        name: true,
        settings: {
          select: {
            id: true,
            defaultInvoiceTemplate: true,
            defaultCurrency: true,
            defaultTimezone: true,
            defaultTaxRate: true,
            inventoryPolicy: true,
            lowStockThreshold: true,
            negativeStock: true,
            country: true,
            taxIntegrationEnabled: true,
            highValueTaxThreshold: true,
            enableCapacityTracking: true,
            enforceSpatialConstraints: true,
            enableProductDimensions: true,
            defaultDimensionUnit: true,
            defaultWeightUnit: true,
            defaultTaxId: true,
            multiAdminRoleApproval: true,
            auditLogRetentionDays: true,
            enforceMfa: true,
            enableAutoCheckout: true,
            autoCheckoutTime: true,
            enableBakerySystem: true,
            enabledPlugins: true,
            mileageRate: true,
            supplierInvoiceReminderSchedule: true,
            priceSyncMode: true,
            supplierSelectionStrategy: true,
            minMarginThreshold: true,
            priceApprovalThreshold: true,
            telegramBotEnabled: true,
            discordBotEnabled: true,
          },
        },
      },
    }),
    db.invoiceConfig.findUnique({
      where: { organizationId: auth.organizationId },
    }),
  ]);

  if (!organization) {
    redirect("/dashboard");
  }

  // Convert Decimal fields to numbers for client consumption
  const processedOrganization = {
    ...organization,
    settings: convertDecimalsToNumbers(organization.settings),
  };

  return (
    <Suspense>
      <div className="space-y-6 p-2">
        <div className="flex flex-col gap-1">
          <h3 className="text-2xl font-bold tracking-tight">
            Document Settings
          </h3>
          <p className="text-sm text-muted-foreground">
            Professionalize your business presence with custom document
            templates and numbering.
          </p>
        </div>
        <Separator className="bg-muted/60" />

        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="bg-muted/40 p-1 mb-6">
            <TabsTrigger
              value="templates"
              className="flex items-center gap-2 px-6">
              <Palette className="w-4 h-4" /> Templates
            </TabsTrigger>
            <TabsTrigger
              value="configuration"
              className="flex items-center gap-2 px-6">
              <Settings2 className="w-4 h-4" /> Configuration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4 outline-none">
            <div className="flex flex-col gap-1 mb-4">
              <h4 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                Invoice Templates
              </h4>
              <p className="text-xs text-muted-foreground">
                Select the default template for all generated invoices across
                the platform.
              </p>
            </div>

            <TemplateSelector
              initialTemplateId={
                processedOrganization.settings?.defaultInvoiceTemplate ||
                "default"
              }
              organization={processedOrganization}
              invoiceConfig={invoiceConfig}
            />
          </TabsContent>

          <TabsContent value="configuration" className="max-w-4xl outline-none">
            <InvoiceConfigForm initialConfig={invoiceConfig} />
          </TabsContent>
        </Tabs>
      </div>
    </Suspense>
  );
}
