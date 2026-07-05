"use server";

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { revalidatePath } from "next/cache";

export async function updateInvoiceConfig(data: {
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  companyName?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyWebsite?: string;
  showLogo?: boolean;
  showTaxBreakdown?: boolean;
  showTerms?: boolean;
  showNotes?: boolean;
  showLineNumbers?: boolean;
  defaultTerms?: string;
  defaultNotes?: string;
  footerText?: string;
  invoiceNumberPrefix?: string;
  invoiceNumberSuffix?: string;
  invoiceNumberStart?: number;
  invoiceNumberPadding?: number;
  showPoweredBy?: boolean;
  watermarkText?: string;
  enableAuditTrail?: boolean;
  customFields?: any;
}) {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) throw new Error("Unauthorized");

  const config = await db.invoiceConfig.upsert({
    where: { organizationId: auth.organizationId },
    update: data,
    create: {
      ...data,
      organizationId: auth.organizationId,
    },
  });

  revalidatePath("/settings/documents");
  return config;
}
