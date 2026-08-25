"use server";

import { db } from "@repo/db";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "./auth";

export type Tier = {
  slug: string;
  name: string;
  price: number;
  description?: string;
  limits?: Record<string, any>;
  features?: string[];
};

export async function listTiers(): Promise<Tier[]> {
  const setting = await db.globalSetting.findUnique({
    where: { key: "system:tiers" },
  });
  if (!setting) return [];
  try {
    return JSON.parse(setting.value);
  } catch {
    return [];
  }
}

export async function defineTier(input: Tier) {
  await requireSuperAdmin();

  const currentTiers = await listTiers();
  const existingIndex = currentTiers.findIndex((t) => t.slug === input.slug);

  const tierData: Tier = {
    slug: input.slug,
    name: input.name,
    price: input.price,
    description: input.description || "",
    limits: input.limits || {},
    features: input.features || [],
  };

  if (existingIndex > -1) {
    currentTiers[existingIndex] = tierData;
  } else {
    currentTiers.push(tierData);
  }

  await db.globalSetting.upsert({
    where: { key: "system:tiers" },
    update: { value: JSON.stringify(currentTiers) },
    create: { key: "system:tiers", value: JSON.stringify(currentTiers) },
  });

  revalidatePath("/billing");
  return tierData;
}

export async function deleteTier(slug: string) {
  await requireSuperAdmin();

  const currentTiers = await listTiers();
  const filtered = currentTiers.filter((t) => t.slug !== slug);

  if (filtered.length === currentTiers.length) {
    throw new Error(`Tier with slug "${slug}" not found`);
  }

  await db.globalSetting.update({
    where: { key: "system:tiers" },
    data: { value: JSON.stringify(filtered) },
  });

  revalidatePath("/billing");
  return { success: true };
}

export async function listSubscriptions() {
  await requireSuperAdmin();

  return db.subscription.findMany({
    orderBy: { dodoCurrentPeriodEnd: "desc" },
    include: {
      organization: {
        select: { id: true, name: true, slug: true },
      },
    },
  });
}

export async function getOrganizationSubscription(orgId: string) {
  await requireSuperAdmin();

  const sub = await db.subscription.findUnique({
    where: { organizationId: orgId },
  });

  if (!sub) {
    return {
      organizationId: orgId,
      tierSlug: "free",
      dodoCustomerId: null,
      dodoSubscriptionId: null,
      dodoPriceId: null,
      dodoCurrentPeriodEnd: null,
    };
  }

  return {
    id: sub.id,
    organizationId: sub.organizationId,
    tierSlug: sub.dodoPriceId || "free",
    dodoCustomerId: sub.dodoCustomerId,
    dodoSubscriptionId: sub.dodoSubscriptionId,
    dodoPriceId: sub.dodoPriceId,
    dodoCurrentPeriodEnd: sub.dodoCurrentPeriodEnd,
  };
}

export async function updateOrganizationSubscription(
  orgId: string,
  input: {
    tierSlug: string;
    dodoCustomerId?: string;
    dodoSubscriptionId?: string;
    dodoCurrentPeriodEnd?: string;
  },
) {
  await requireSuperAdmin();

  const currentPeriodEnd = input.dodoCurrentPeriodEnd
    ? new Date(input.dodoCurrentPeriodEnd)
    : null;

  const sub = await db.subscription.upsert({
    where: { organizationId: orgId },
    update: {
      dodoPriceId: input.tierSlug,
      dodoCustomerId: input.dodoCustomerId || null,
      dodoSubscriptionId: input.dodoSubscriptionId || null,
      dodoCurrentPeriodEnd: currentPeriodEnd,
    },
    create: {
      organizationId: orgId,
      dodoPriceId: input.tierSlug,
      dodoCustomerId: input.dodoCustomerId || null,
      dodoSubscriptionId: input.dodoSubscriptionId || null,
      dodoCurrentPeriodEnd: currentPeriodEnd,
    },
  });

  revalidatePath("/billing");
  revalidatePath(`/organizations/${orgId}`);
  return sub;
}

export async function listSystemPayments() {
  await requireSuperAdmin();

  return db.mpesaPaymentRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      organization: {
        select: { id: true, name: true, slug: true },
      },
      member: {
        select: { user: { select: { name: true, email: true } } },
      },
    },
  });
}

export async function recordCustomPayment(input: {
  organizationId: string;
  amount: number;
  phoneNumber: string;
  reference: string;
  notes?: string;
  tierSlug?: string;
}) {
  await requireSuperAdmin();

  const org = await db.organization.findUnique({ where: { id: input.organizationId } });
  if (!org) {
    throw new Error(`Organization with ID ${input.organizationId} not found`);
  }

  const firstMember = await db.member.findFirst({
    where: { organizationId: input.organizationId },
  });
  if (!firstMember) {
    throw new Error(
      `Organization "${input.organizationId}" has no members to associate the payment with`,
    );
  }

  const payment = await db.$transaction(async (tx) => {
    const payReq = await tx.mpesaPaymentRequest.create({
      data: {
        organizationId: input.organizationId,
        memberId: firstMember.id,
        checkoutRequestId: `admin-${Date.now()}`,
        merchantRequestId: `admin-merchant-${Date.now()}`,
        amount: input.amount,
        phoneNumber: input.phoneNumber,
        reference: input.reference,
        status: "SUCCESS",
        resultCode: 0,
        resultDescription: input.notes || "Admin recorded custom plan payment",
        mpesaReceiptNumber: input.reference,
        transactionDate: new Date(),
      },
    });

    if (input.tierSlug) {
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

      await tx.subscription.upsert({
        where: { organizationId: input.organizationId },
        update: {
          dodoPriceId: input.tierSlug,
          dodoCurrentPeriodEnd: oneYearFromNow,
          dodoSubscriptionId: `custom-sub-${input.reference}`,
        },
        create: {
          organizationId: input.organizationId,
          dodoPriceId: input.tierSlug,
          dodoCurrentPeriodEnd: oneYearFromNow,
          dodoSubscriptionId: `custom-sub-${input.reference}`,
        },
      });
    }

    return payReq;
  });

  revalidatePath("/billing");
  revalidatePath(`/organizations/${input.organizationId}`);
  return payment;
}
