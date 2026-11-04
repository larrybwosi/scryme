"use server";

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export interface CompanyFinancialOverview {
  creditLimit: number;
  creditHold: boolean;
  paymentTermsDays: number;
  totalReceivables: number;
  availableCredit: number;
  creditUtilizationRate: number; // percentage 0 - 100
  aging: {
    current: number; // 0-30 days
    overdue30: number; // 31-60 days
    overdue60: number; // 61-90 days
    overdue90Plus: number; // 91+ days
  };
}

export async function getCompanyFinancialOverview(
  companyId: string
): Promise<CompanyFinancialOverview> {
  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");
  const organizationId = auth.organizationId;

  const company = await db.businessAccount.findFirst({
    where: { id: companyId, organizationId },
    include: {
      invoices: {
        where: {
          status: { in: ["ISSUED", "PARTIALLY_PAID", "DRAFT"] },
        },
        select: {
          id: true,
          grandTotal: true,
          amountPaid: true,
          dueDate: true,
          createdAt: true,
          status: true,
        },
      },
    },
  });

  if (!company) throw new Error("Company not found");

  const creditLimit = company.creditLimit || 0;
  const paymentTermsDays = company.paymentTermsDays || 30;
  const creditHold = company.creditHold || false;

  const now = new Date();
  let totalReceivables = 0;
  const aging = {
    current: 0,
    overdue30: 0,
    overdue60: 0,
    overdue90Plus: 0,
  };

  for (const inv of (company as any).invoices || []) {
    const outstanding = Math.max(0, (Number(inv.grandTotal) || 0) - (Number(inv.amountPaid) || 0));
    totalReceivables += outstanding;

    const invoiceDate = inv.dueDate ? new Date(inv.dueDate) : new Date(inv.createdAt);
    const diffDays = Math.floor((now.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 30) {
      aging.current += outstanding;
    } else if (diffDays <= 60) {
      aging.overdue30 += outstanding;
    } else if (diffDays <= 90) {
      aging.overdue60 += outstanding;
    } else {
      aging.overdue90Plus += outstanding;
    }
  }

  const availableCredit = creditLimit > 0 ? Math.max(0, creditLimit - totalReceivables) : 0;
  const creditUtilizationRate =
    creditLimit > 0 ? Math.min(100, Math.round((totalReceivables / creditLimit) * 100)) : 0;

  return {
    creditLimit,
    creditHold,
    paymentTermsDays,
    totalReceivables,
    availableCredit,
    creditUtilizationRate,
    aging,
  };
}

export async function updateCompanyCreditTerms(
  companyId: string,
  params: {
    creditLimit?: number;
    creditHold?: boolean;
    paymentTermsDays?: number;
  }
) {
  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");
  const organizationId = auth.organizationId;

  const company = await db.businessAccount.findFirst({
    where: { id: companyId, organizationId },
  });

  if (!company) return { success: false, error: "Company not found" };

  const updated = await db.businessAccount.update({
    where: { id: companyId },
    data: {
      creditLimit: params.creditLimit !== undefined ? params.creditLimit : undefined,
      creditHold: params.creditHold !== undefined ? params.creditHold : undefined,
      paymentTermsDays:
        params.paymentTermsDays !== undefined ? params.paymentTermsDays : undefined,
    },
  });

  if (company.crmRecordId) {
    await db.crmActivity.create({
      data: {
        recordId: company.crmRecordId,
        organizationId,
        type: "CREDIT_TERMS_UPDATED",
        description: `Updated credit terms: Credit Limit=${params.creditLimit ?? company.creditLimit}, Hold=${params.creditHold ?? company.creditHold}, Terms=${params.paymentTermsDays ?? company.paymentTermsDays} days.`,
        memberId: auth.memberId || null,
      },
    });
  }

  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/companies");
  return { success: true, data: updated };
}

export async function updateCompanyHierarchy(
  companyId: string,
  parentAccountId: string | null
) {
  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");
  const organizationId = auth.organizationId;

  if (parentAccountId === companyId) {
    return { success: false, error: "An account cannot be its own parent company" };
  }

  const company = await db.businessAccount.findFirst({
    where: { id: companyId, organizationId },
  });

  if (!company) return { success: false, error: "Company not found" };

  if (parentAccountId) {
    const parent = await db.businessAccount.findFirst({
      where: { id: parentAccountId, organizationId },
    });
    if (!parent) return { success: false, error: "Parent company not found" };
  }

  const updated = await db.businessAccount.update({
    where: { id: companyId },
    data: { parentAccountId },
  });

  if (company.crmRecordId) {
    await db.crmActivity.create({
      data: {
        recordId: company.crmRecordId,
        organizationId,
        type: "HIERARCHY_UPDATED",
        description: parentAccountId
          ? `Linked to parent account ID ${parentAccountId}`
          : "Unlinked from parent account hierarchy",
        memberId: auth.memberId || null,
      },
    });
  }

  revalidatePath(`/companies/${companyId}`);
  return { success: true, data: updated };
}

export async function getCompanyHierarchy(companyId: string) {
  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");
  const organizationId = auth.organizationId;

  const company = await db.businessAccount.findFirst({
    where: { id: companyId, organizationId },
    include: {
      parentAccount: {
        select: { id: true, name: true, taxId: true, isEnterprise: true },
      },
      subsidiaries: {
        select: {
          id: true,
          name: true,
          taxId: true,
          isEnterprise: true,
          industry: true,
          lifecycleStage: true,
        },
      },
    },
  });

  if (!company) throw new Error("Company not found");
  return company;
}

export async function updateCompanyContract(
  companyId: string,
  data: {
    contractStartDate?: Date | null;
    contractEndDate?: Date | null;
    contractStatus?: string;
    slaTier?: string;
    discountPercentage?: number;
  }
) {
  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");
  const organizationId = auth.organizationId;

  const company = await db.businessAccount.findFirst({
    where: { id: companyId, organizationId },
  });

  if (!company) return { success: false, error: "Company not found" };

  const updated = await db.businessAccount.update({
    where: { id: companyId },
    data: {
      contractStartDate: data.contractStartDate !== undefined ? data.contractStartDate : undefined,
      contractEndDate: data.contractEndDate !== undefined ? data.contractEndDate : undefined,
      contractStatus: data.contractStatus !== undefined ? data.contractStatus : undefined,
      slaTier: data.slaTier !== undefined ? data.slaTier : undefined,
      discountPercentage:
        data.discountPercentage !== undefined ? data.discountPercentage : undefined,
    },
  });

  if (company.crmRecordId) {
    await db.crmActivity.create({
      data: {
        recordId: company.crmRecordId,
        organizationId,
        type: "CONTRACT_UPDATED",
        description: `Contract updated: Status=${data.contractStatus || company.contractStatus}, SLA=${data.slaTier || company.slaTier}.`,
        memberId: auth.memberId || null,
      },
    });
  }

  revalidatePath(`/companies/${companyId}`);
  return { success: true, data: updated };
}

export async function assignCompanyAccountManager(
  companyId: string,
  accountManagerId: string | null
) {
  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");
  const organizationId = auth.organizationId;

  const company = await db.businessAccount.findFirst({
    where: { id: companyId, organizationId },
  });

  if (!company) return { success: false, error: "Company not found" };

  if (accountManagerId) {
    const member = await db.member.findFirst({
      where: { id: accountManagerId, organizationId },
      include: { user: true },
    });
    if (!member) return { success: false, error: "Member not found" };
  }

  const updated = await db.businessAccount.update({
    where: { id: companyId },
    data: { accountManagerId },
    include: { accountManager: { include: { user: true } } },
  });

  if (company.crmRecordId) {
    await db.crmActivity.create({
      data: {
        recordId: company.crmRecordId,
        organizationId,
        type: "ACCOUNT_MANAGER_ASSIGNED",
        description: accountManagerId
          ? `Assigned Account Manager: ${updated.accountManager?.user?.name || updated.accountManager?.user?.email}`
          : "Unassigned Account Manager",
        memberId: auth.memberId || null,
      },
    });
  }

  revalidatePath(`/companies/${companyId}`);
  return { success: true, data: updated };
}

export async function updateCompanyLifecycleStage(
  companyId: string,
  stage: "LEAD" | "PROSPECT" | "ACTIVE" | "ENTERPRISE" | "AT_RISK" | "CHURNED"
) {
  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");
  const organizationId = auth.organizationId;

  const company = await db.businessAccount.findFirst({
    where: { id: companyId, organizationId },
  });

  if (!company) return { success: false, error: "Company not found" };

  const prevStage = company.lifecycleStage;
  const updated = await db.businessAccount.update({
    where: { id: companyId },
    data: { lifecycleStage: stage },
  });

  if (company.crmRecordId) {
    await db.crmActivity.create({
      data: {
        recordId: company.crmRecordId,
        organizationId,
        type: "LIFECYCLE_STAGE_CHANGED",
        description: `Lifecycle stage transitioned from ${prevStage} to ${stage}`,
        memberId: auth.memberId || null,
      },
    });
  }

  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/companies");
  return { success: true, data: updated };
}

export async function createB2BConnectionAction(
  businessAccountId: string,
  params?: { allowedCategories?: string[]; priceListId?: string }
) {
  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");
  const organizationId = auth.organizationId;

  const company = await db.businessAccount.findFirst({
    where: { id: businessAccountId, organizationId },
  });

  if (!company) return { success: false, error: "Company not found" };

  const connection = await db.b2BConnection.create({
    data: {
      supplierOrgId: organizationId,
      businessAccountId,
      allowedCategories: params?.allowedCategories || [],
      priceListId: params?.priceListId || null,
      isActive: true,
    },
  });

  if (company.crmRecordId) {
    await db.crmActivity.create({
      data: {
        recordId: company.crmRecordId,
        organizationId,
        type: "B2B_CONNECTION_CREATED",
        description: `Generated new B2B Connection key for external sync`,
        memberId: auth.memberId || null,
      },
    });
  }

  revalidatePath(`/companies/${businessAccountId}`);
  return { success: true, data: connection };
}

export async function revokeB2BConnectionAction(
  connectionId: string,
  businessAccountId: string
) {
  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");
  const organizationId = auth.organizationId;

  const connection = await db.b2BConnection.findFirst({
    where: { id: connectionId, supplierOrgId: organizationId, businessAccountId },
  });

  if (!connection) return { success: false, error: "Connection not found" };

  await db.b2BConnection.delete({
    where: { id: connectionId },
  });

  revalidatePath(`/companies/${businessAccountId}`);
  return { success: true };
}
