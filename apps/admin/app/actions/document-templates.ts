"use server";

import { db } from "@repo/db";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "./auth";
import { DOCUMENT_REGISTRY, DocumentType } from "@repo/documents";

const DOCUMENT_CATEGORIES: {
  id: DocumentType;
  label: string;
  description: string;
}[] = [
  {
    id: "INVOICE",
    label: "Invoices",
    description: "Sales & billing document templates",
  },
  {
    id: "RECEIPT",
    label: "Receipts",
    description: "Payment confirmation receipt templates",
  },
  {
    id: "WAYBILL",
    label: "Waybills",
    description: "Shipping & freight transport document templates",
  },
  {
    id: "DELIVERY_NOTE",
    label: "Delivery Notes",
    description: "Proof of delivery & customer handoff templates",
  },
];

export async function listSystemDocumentSettings() {
  await requireSuperAdmin();

  const settings = await db.systemDocumentSetting.findMany();

  const categorySettings: Record<string, boolean> = {};
  const templateSettings: Record<string, boolean> = {};

  for (const s of settings) {
    if (!s.templateId) {
      categorySettings[s.documentType] = s.isEnabled;
    } else {
      templateSettings[`${s.documentType}:${s.templateId}`] = s.isEnabled;
    }
  }

  const categories = DOCUMENT_CATEGORIES.map((cat) => {
    const isCategoryEnabled = categorySettings[cat.id] ?? true;
    const catTemplates = DOCUMENT_REGISTRY.filter((t) => t.type === cat.id).map(
      (tmpl) => {
        const isTemplateEnabled =
          templateSettings[`${cat.id}:${tmpl.id}`] ?? true;
        const { component: _, ...cleanTmpl } = tmpl;
        return {
          ...cleanTmpl,
          isEnabled: isTemplateEnabled,
          isEffectivelyEnabled: isCategoryEnabled && isTemplateEnabled,
        };
      }
    );

    return {
      ...cat,
      isEnabled: isCategoryEnabled,
      templates: catTemplates,
      enabledCount: catTemplates.filter((t) => t.isEnabled).length,
      totalCount: catTemplates.length,
    };
  });

  return {
    categorySettings,
    templateSettings,
    categories,
  };
}

export async function toggleDocumentCategorySetting(
  documentType: string,
  isEnabled: boolean
) {
  await requireSuperAdmin();

  const setting = await db.systemDocumentSetting.upsert({
    where: {
      documentType_templateId: {
        documentType,
        templateId: "",
      },
    },
    update: { isEnabled },
    create: {
      documentType,
      templateId: "",
      isEnabled,
    },
  });

  revalidatePath("/systems");
  revalidatePath("/settings");
  return setting;
}

export async function toggleDocumentTemplateSetting(
  documentType: string,
  templateId: string,
  isEnabled: boolean
) {
  await requireSuperAdmin();

  const setting = await db.systemDocumentSetting.upsert({
    where: {
      documentType_templateId: {
        documentType,
        templateId,
      },
    },
    update: { isEnabled },
    create: {
      documentType,
      templateId,
      isEnabled,
    },
  });

  revalidatePath("/systems");
  revalidatePath("/settings");
  return setting;
}
