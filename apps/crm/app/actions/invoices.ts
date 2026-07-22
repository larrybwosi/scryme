"use server";

import { db } from "@repo/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateDocumentToken } from "@repo/shared/api/v2";
import { getServerAuth } from "@repo/auth/server";
import { redirect } from "next/navigation";

const invoiceSchema = z.object({
  customerId: z.string().optional().nullable(),
  businessAccountId: z.string().optional().nullable(),
  customerName: z.string().optional().nullable(),
  postingDate: z.coerce.date(),
  dueDate: z.coerce.date().optional(),
  items: z.array(
    z.object({
      itemCode: z.string(),
      itemName: z.string(),
      quantity: z.number(),
      rate: z.number(),
      amount: z.number(),
    }),
  ),
  status: z.string().default("DRAFT"),
});

export type CreateInvoiceInput = z.infer<typeof invoiceSchema>;

export async function createInvoiceAction(
  data: CreateInvoiceInput,
): Promise<any> {
  try {
    const auth = await getServerAuth();
    if (!auth?.organizationId) redirect("/login");
    const organizationId = auth.organizationId;
    const validatedData = invoiceSchema.parse(data);

    const netTotal = validatedData.items.reduce(
      (sum, item) => sum + item.amount,
      0,
    );

    const invoice = await db.invoice.create({
      data: {
        customerId: validatedData.customerId || null,
        businessAccountId: validatedData.businessAccountId || null,
        customerName: validatedData.customerName || null,
        organizationId: organizationId,
        postingDate: validatedData.postingDate,
        dueDate: validatedData.dueDate,
        status: validatedData.status,
        netTotal: netTotal,
        grandTotal: netTotal,
        balanceDue: netTotal,
        items: {
          create: validatedData.items,
        },
      },
    });

    if (validatedData.customerId) {
      revalidatePath(`/customers/${validatedData.customerId}`);
    }
    if (validatedData.businessAccountId) {
      revalidatePath(`/companies/${validatedData.businessAccountId}`);
    }
    return { success: true, data: invoice };
  } catch (error: any) {
    console.error("Error creating invoice:", error);
    return {
      success: false,
      error: error.message || "Failed to create invoice",
    };
  }
}

export async function getInvoiceDownloadUrl(
  invoiceId: string,
  organizationId: string,
): Promise<string> {
  try {
    const token = generateDocumentToken("invoice", invoiceId, organizationId);
    let apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.scryme.tech";

    try {
      const parsed = new URL(apiUrl);
      if (
        parsed.hostname.endsWith("scryme.tech") ||
        process.env.NODE_ENV === "production"
      ) {
        parsed.port = "";
      }
      apiUrl = parsed.toString().replace(/\/$/, "");
    } catch (e) {
      console.error("Failed to parse API URL in getInvoiceDownloadUrl:", e);
    }

    return `${apiUrl}/public-invoices/${invoiceId}/download?token=${token}`;
  } catch (error) {
    console.error("Error generating invoice download token:", error);
    throw new Error("Failed to generate secure download link");
  }
}
