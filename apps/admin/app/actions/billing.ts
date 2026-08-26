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
  durationMonths?: number;
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

  const duration = input.durationMonths || 12;

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
        resultDescription: input.notes || "Admin recorded custom M-Pesa payment",
        mpesaReceiptNumber: input.reference,
        transactionDate: new Date(),
        saleData: {
          tierSlug: input.tierSlug,
          durationMonths: duration,
        },
      },
    });

    if (input.tierSlug && input.tierSlug !== "none") {
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + duration);

      await tx.subscription.upsert({
        where: { organizationId: input.organizationId },
        update: {
          dodoPriceId: input.tierSlug,
          dodoCurrentPeriodEnd: periodEnd,
          dodoSubscriptionId: `mpesa-sub-${input.reference}`,
        },
        create: {
          organizationId: input.organizationId,
          dodoPriceId: input.tierSlug,
          dodoCurrentPeriodEnd: periodEnd,
          dodoSubscriptionId: `mpesa-sub-${input.reference}`,
        },
      });
    }

    return payReq;
  });

  revalidatePath("/billing");
  revalidatePath(`/organizations/${input.organizationId}`);
  return payment;
}

export async function getSystemMpesaCredentials() {
  const setting = await db.globalSetting.findUnique({
    where: { key: "system:mpesa" },
  });

  if (setting?.value) {
    try {
      const parsed = JSON.parse(setting.value);
      if (parsed.mpesaConsumerKey && parsed.mpesaConsumerSecret && parsed.mpesaShortCode) {
        return parsed;
      }
    } catch {
      // ignore
    }
  }

  const envKey = process.env.SYSTEM_MPESA_CONSUMER_KEY || process.env.MPESA_CONSUMER_KEY;
  const envSecret = process.env.SYSTEM_MPESA_CONSUMER_SECRET || process.env.MPESA_CONSUMER_SECRET;
  const envShortCode = process.env.SYSTEM_MPESA_SHORTCODE || process.env.MPESA_SHORTCODE || process.env.MPESA_BUSINESS_SHORTCODE;
  const envPassKey = process.env.SYSTEM_MPESA_PASSKEY || process.env.MPESA_PASSKEY;
  const envType = (process.env.SYSTEM_MPESA_TYPE || process.env.MPESA_TYPE || "PAYBILL") as "PAYBILL" | "TILL";
  const envEnv = (process.env.MPESA_ENVIRONMENT || "SANDBOX") as "SANDBOX" | "PRODUCTION";

  if (envKey && envSecret && envShortCode) {
    return {
      mpesaConsumerKey: envKey,
      mpesaConsumerSecret: envSecret,
      mpesaShortCode: envShortCode,
      mpesaPassKey: envPassKey || "",
      mpesaType: envType,
      environment: envEnv,
    };
  }

  return null;
}

export async function initiateAdminMpesaPayment(input: {
  organizationId: string;
  phoneNumber: string;
  amount: number;
  tierSlug?: string;
  durationMonths?: number;
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
    throw new Error(`Organization "${input.organizationId}" has no members to associate payment with`);
  }

  const creds = await getSystemMpesaCredentials();
  const duration = input.durationMonths || 12;
  const reference = `SUB-${Date.now()}`;

  if (!creds) {
    // If no system M-Pesa credentials configured, fallback to recorded simulation mode
    const simulatedCheckoutId = `ws_CO_SIM_${Date.now()}`;
    const payReq = await db.mpesaPaymentRequest.create({
      data: {
        organizationId: input.organizationId,
        memberId: firstMember.id,
        checkoutRequestId: simulatedCheckoutId,
        merchantRequestId: `sim-merchant-${Date.now()}`,
        amount: input.amount,
        phoneNumber: input.phoneNumber,
        reference,
        status: "PENDING",
        resultCode: null,
        saleData: {
          tierSlug: input.tierSlug,
          durationMonths: duration,
          isSimulated: true,
        },
      },
    });

    return {
      success: true,
      checkoutRequestId: simulatedCheckoutId,
      paymentId: payReq.id,
      reference,
      isSimulated: true,
      message: "M-Pesa push initiated in test mode (no live Safaricom credentials configured).",
    };
  }

  const { MpesaClient } = await import("@repo/shared/mpesa");
  const client = new MpesaClient(creds);

  const callbackUrl = `${process.env.MPESA_CALLBACK_BASE_URL || "http://localhost:4000"}/api/v2/payments/mpesa/webhooks/stkpush/${input.organizationId}/admin-${reference}`;

  const stkRes = await client.initiateSTKPush({
    phoneNumber: input.phoneNumber,
    amount: input.amount,
    accountReference: reference,
    transactionDesc: `Subscription payment for ${org.name}`,
    callbackUrl,
  });

  const payReq = await db.mpesaPaymentRequest.create({
    data: {
      organizationId: input.organizationId,
      memberId: firstMember.id,
      checkoutRequestId: stkRes.CheckoutRequestID,
      merchantRequestId: stkRes.MerchantRequestID,
      amount: input.amount,
      phoneNumber: input.phoneNumber,
      reference,
      status: "PENDING",
      saleData: {
        tierSlug: input.tierSlug,
        durationMonths: duration,
      },
    },
  });

  return {
    success: true,
    checkoutRequestId: stkRes.CheckoutRequestID,
    paymentId: payReq.id,
    reference,
    isSimulated: false,
    message: "STK push sent to phone.",
  };
}

export async function checkAdminMpesaPaymentStatus(checkoutRequestId: string) {
  await requireSuperAdmin();

  const payReq = await db.mpesaPaymentRequest.findFirst({
    where: { checkoutRequestId },
  });

  if (!payReq) {
    throw new Error("Payment request not found");
  }

  if (payReq.status === "SUCCESS") {
    return { status: "SUCCESS", payment: payReq };
  }

  if (payReq.status === "FAILED") {
    return { status: "FAILED", payment: payReq };
  }

  // Handle simulated STK push or live STK Push check
  const saleData = payReq.saleData as { tierSlug?: string; durationMonths?: number; isSimulated?: boolean } | null;

  if (saleData?.isSimulated) {
    // If simulated, auto-fulfill after check to allow testing seamlessly
    const updatedPayReq = await db.$transaction(async (tx) => {
      const updated = await tx.mpesaPaymentRequest.update({
        where: { id: payReq.id },
        data: {
          status: "SUCCESS",
          resultCode: 0,
          resultDescription: "Simulated M-Pesa payment completed successfully",
          mpesaReceiptNumber: `SIM-${Date.now()}`,
          transactionDate: new Date(),
        },
      });

      if (saleData.tierSlug && saleData.tierSlug !== "none") {
        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + (saleData.durationMonths || 12));

        await tx.subscription.upsert({
          where: { organizationId: payReq.organizationId },
          update: {
            dodoPriceId: saleData.tierSlug,
            dodoCurrentPeriodEnd: periodEnd,
            dodoSubscriptionId: `mpesa-sub-${payReq.reference}`,
          },
          create: {
            organizationId: payReq.organizationId,
            dodoPriceId: saleData.tierSlug,
            dodoCurrentPeriodEnd: periodEnd,
            dodoSubscriptionId: `mpesa-sub-${payReq.reference}`,
          },
        });
      }

      return updated;
    });

    revalidatePath("/billing");
    revalidatePath(`/organizations/${payReq.organizationId}`);
    return { status: "SUCCESS", payment: updatedPayReq };
  }

  const creds = await getSystemMpesaCredentials();
  if (creds) {
    try {
      const { MpesaClient } = await import("@repo/shared/mpesa");
      const client = new MpesaClient(creds);
      const queryRes = await client.querySTKStatus(checkoutRequestId);

      if (queryRes.ResultCode === "0") {
        const updatedPayReq = await db.$transaction(async (tx) => {
          const updated = await tx.mpesaPaymentRequest.update({
            where: { id: payReq.id },
            data: {
              status: "SUCCESS",
              resultCode: 0,
              resultDescription: queryRes.ResultDesc || "STK Push payment verified",
              transactionDate: new Date(),
            },
          });

          if (saleData?.tierSlug && saleData.tierSlug !== "none") {
            const periodEnd = new Date();
            periodEnd.setMonth(periodEnd.getMonth() + (saleData.durationMonths || 12));

            await tx.subscription.upsert({
              where: { organizationId: payReq.organizationId },
              update: {
                dodoPriceId: saleData.tierSlug,
                dodoCurrentPeriodEnd: periodEnd,
                dodoSubscriptionId: `mpesa-sub-${payReq.reference}`,
              },
              create: {
                organizationId: payReq.organizationId,
                dodoPriceId: saleData.tierSlug,
                dodoCurrentPeriodEnd: periodEnd,
                dodoSubscriptionId: `mpesa-sub-${payReq.reference}`,
              },
            });
          }

          return updated;
        });

        revalidatePath("/billing");
        revalidatePath(`/organizations/${payReq.organizationId}`);
        return { status: "SUCCESS", payment: updatedPayReq };
      } else if (queryRes.ResultCode && queryRes.ResultCode !== "0") {
        const updated = await db.mpesaPaymentRequest.update({
          where: { id: payReq.id },
          data: {
            status: "FAILED",
            resultCode: Number(queryRes.ResultCode) || 1,
            resultDescription: queryRes.ResultDesc || "STK Push failed or cancelled",
          },
        });
        return { status: "FAILED", payment: updated };
      }
    } catch {
      // If query error or pending, return current status
    }
  }

  return { status: "PENDING", payment: payReq };
}
