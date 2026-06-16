import React, { Suspense } from "react";
import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { redirect } from "next/navigation";
import { EnhancedDocumentSettings } from "./enhanced-settings";
import { Separator } from "@repo/ui/components/ui/separator";

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
  const [organization, invoiceConfig, receiptConfig, waybillConfig] = await Promise.all([
    db.organization.findUnique({
      where: { id: auth.organizationId },
      select: {
        id: true,
        name: true,
        logo: true,
        address: true,
        phone: true,
        email: true,
        settings: {
          select: {
            id: true,
            defaultInvoiceTemplate: true,
            defaultReceiptTemplate: true,
            defaultWaybillTemplate: true,
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
    db.receiptConfig.findUnique({
      where: { organizationId: auth.organizationId },
    }),
    db.waybillConfig.findUnique({
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
            Document Management
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage your organization&apos;s customer-facing documents,
            templates, and professional branding.
          </p>
        </div>
        <Separator className="bg-muted/60" />

        <div className="mt-8">
          <EnhancedDocumentSettings
            organization={processedOrganization}
            invoiceConfig={invoiceConfig}
            receiptConfig={receiptConfig}
            waybillConfig={waybillConfig}
          />
        </div>
      </div>
    </Suspense>
  );
}
