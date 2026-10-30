"use server";

import { db } from "@repo/db";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "./auth";

export type Tier = {
  slug: string;
  name: string;
  price: number;
  currency?: string;
  description?: string;
  limits?: Record<string, any>;
  features?: string[];
  trialDays?: number;
  annualDiscountPercent?: number;
  taxPercent?: number;
};

export type SystemPaymentConfigs = {
  enabledMethods: string[];
  mpesa?: {
    consumerKey: string;
    consumerSecret: string;
    shortCode: string;
    passKey?: string;
    type: "PAYBILL" | "TILL";
    environment: "SANDBOX" | "PRODUCTION";
  };
  stripe?: {
    publishableKey?: string;
    secretKey?: string;
    webhookSecret?: string;
  };
  dodo?: {
    apiKey?: string;
    environment?: "sandbox" | "live";
  };
  bankTransfer?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    swiftCode?: string;
    instructions?: string;
  };
};

export type DefaultQuotaAllocations = {
  maxUsers: number;
  maxProducts: number;
  maxLocations: number;
  maxStorageGB: number;
  maxOrdersPerMonth: number;
  maxApiRequestsPerDay: number;
  maxWebhookSubscriptions: number;
  maxWorkflowEngineDefinitions: number;
  maxCustomDomains: number;
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
    currency: input.currency || "USD",
    description: input.description || "",
    limits: input.limits || {},
    features: input.features || [],
    trialDays: input.trialDays != null ? Number(input.trialDays) : undefined,
    annualDiscountPercent:
      input.annualDiscountPercent != null
        ? Number(input.annualDiscountPercent)
        : undefined,
    taxPercent: input.taxPercent != null ? Number(input.taxPercent) : undefined,
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
      status: null,
      trialStartedAt: null,
      trialEndsAt: null,
      tierSlug: "free",
      dodoCustomerId: null,
      dodoSubscriptionId: null,
      dodoPriceId: null,
      dodoCurrentPeriodEnd: null,
      isCustomPrice: false,
      customMonthlyPrice: null,
      customYearlyPrice: null,
      billingInterval: "monthly",
      customCurrency: "USD",
      customDiscountPercent: null,
      customTaxPercent: null,
      customNotes: null,
    };
  }

  return {
    id: sub.id,
    organizationId: sub.organizationId,
    status: sub.status,
    trialStartedAt: sub.trialStartedAt,
    trialEndsAt: sub.trialEndsAt,
    tierSlug: sub.dodoPriceId || "free",
    dodoCustomerId: sub.dodoCustomerId,
    dodoSubscriptionId: sub.dodoSubscriptionId,
    dodoPriceId: sub.dodoPriceId,
    dodoCurrentPeriodEnd: sub.dodoCurrentPeriodEnd,
    isCustomPrice: sub.isCustomPrice ?? false,
    customMonthlyPrice: sub.customMonthlyPrice ?? null,
    customYearlyPrice: sub.customYearlyPrice ?? null,
    billingInterval: sub.billingInterval ?? "monthly",
    customCurrency: sub.customCurrency ?? "USD",
    customDiscountPercent: sub.customDiscountPercent ?? null,
    customTaxPercent: sub.customTaxPercent ?? null,
    customNotes: sub.customNotes ?? null,
  };
}

export async function updateOrganizationSubscription(
  orgId: string,
  input: {
    tierSlug: string;
    dodoCustomerId?: string;
    dodoSubscriptionId?: string;
    dodoCurrentPeriodEnd?: string;
    isCustomPrice?: boolean;
    customMonthlyPrice?: number | null;
    customYearlyPrice?: number | null;
    billingInterval?: "monthly" | "yearly";
    customCurrency?: string;
    customDiscountPercent?: number | null;
    customTaxPercent?: number | null;
    customNotes?: string | null;
    status?: string | null;
    trialStartedAt?: string | null;
    trialEndsAt?: string | null;
  },
) {
  await requireSuperAdmin();

  const currentPeriodEnd = input.dodoCurrentPeriodEnd
    ? new Date(input.dodoCurrentPeriodEnd)
    : null;

  const updateData: any = {
    dodoPriceId: input.tierSlug,
    dodoCustomerId: input.dodoCustomerId || null,
    dodoSubscriptionId: input.dodoSubscriptionId || null,
    dodoCurrentPeriodEnd: currentPeriodEnd,
  };

  if (input.status !== undefined) {
    updateData.status = input.status;
  }
  if (input.trialStartedAt !== undefined) {
    updateData.trialStartedAt = input.trialStartedAt ? new Date(input.trialStartedAt) : null;
  }
  if (input.trialEndsAt !== undefined) {
    updateData.trialEndsAt = input.trialEndsAt ? new Date(input.trialEndsAt) : null;
  }

  if (input.isCustomPrice !== undefined) {
    updateData.isCustomPrice = input.isCustomPrice;
  }
  if (input.customMonthlyPrice !== undefined) {
    updateData.customMonthlyPrice = input.customMonthlyPrice;
  }
  if (input.customYearlyPrice !== undefined) {
    updateData.customYearlyPrice = input.customYearlyPrice;
  }
  if (input.billingInterval !== undefined) {
    updateData.billingInterval = input.billingInterval;
  }
  if (input.customCurrency !== undefined) {
    updateData.customCurrency = input.customCurrency;
  }
  if (input.customDiscountPercent !== undefined) {
    updateData.customDiscountPercent = input.customDiscountPercent;
  }
  if (input.customTaxPercent !== undefined) {
    updateData.customTaxPercent = input.customTaxPercent;
  }
  if (input.customNotes !== undefined) {
    updateData.customNotes = input.customNotes;
  }

  const sub = await db.subscription.upsert({
    where: { organizationId: orgId },
    update: updateData,
    create: {
      organizationId: orgId,
      ...updateData,
    },
  });

  revalidatePath("/billing");
  revalidatePath(`/organizations/${orgId}`);
  return sub;
}

export async function getOrganizationEffectivePrice(
  orgId: string,
  durationMonths: number = 1,
  tierSlug?: string,
) {
  await requireSuperAdmin();

  const sub = await db.subscription.findUnique({
    where: { organizationId: orgId },
  });

  const tiers = await listTiers();
  const selectedTierSlug = tierSlug || sub?.dodoPriceId || "free";
  const tier = tiers.find((t) => t.slug === selectedTierSlug);

  if (sub?.isCustomPrice) {
    let basePrice = 0;
    if (
      durationMonths >= 12 &&
      sub.customYearlyPrice != null &&
      sub.customYearlyPrice > 0
    ) {
      basePrice = sub.customYearlyPrice * (durationMonths / 12);
    } else if (sub.customMonthlyPrice != null && sub.customMonthlyPrice > 0) {
      basePrice = sub.customMonthlyPrice * durationMonths;
    } else if (tier) {
      basePrice = tier.price * durationMonths;
    }

    let finalPrice = basePrice;
    if (sub.customDiscountPercent && sub.customDiscountPercent > 0) {
      finalPrice = finalPrice * (1 - sub.customDiscountPercent / 100);
    }
    if (sub.customTaxPercent && sub.customTaxPercent > 0) {
      finalPrice = finalPrice * (1 + sub.customTaxPercent / 100);
    }

    return {
      isCustomPrice: true,
      price: Math.round(finalPrice * 100) / 100,
      currency: sub.customCurrency || tier?.currency || "USD",
      billingInterval: sub.billingInterval || "monthly",
      monthlyRate: sub.customMonthlyPrice ?? null,
      yearlyRate: sub.customYearlyPrice ?? null,
      discountPercent: sub.customDiscountPercent ?? null,
      taxPercent: sub.customTaxPercent ?? null,
      tierSlug: selectedTierSlug,
      tierName: tier?.name || "Custom Plan",
    };
  }

  let basePrice = (tier?.price || 0) * durationMonths;
  if (durationMonths >= 12 && tier?.annualDiscountPercent) {
    basePrice = basePrice * (1 - tier.annualDiscountPercent / 100);
  }
  if (tier?.taxPercent) {
    basePrice = basePrice * (1 + tier.taxPercent / 100);
  }

  return {
    isCustomPrice: false,
    price: Math.round(basePrice * 100) / 100,
    currency: tier?.currency || "USD",
    billingInterval: "monthly",
    monthlyRate: tier?.price ?? 0,
    yearlyRate: tier?.price ? tier.price * 12 : 0,
    discountPercent: tier?.annualDiscountPercent ?? null,
    taxPercent: tier?.taxPercent ?? null,
    tierSlug: selectedTierSlug,
    tierName: tier?.name || "Free",
  };
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

  const org = await db.organization.findUnique({
    where: { id: input.organizationId },
  });
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
        resultDescription:
          input.notes || "Admin recorded custom M-Pesa payment",
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

export async function getSystemPaymentConfigs(): Promise<SystemPaymentConfigs> {
  const setting = await db.globalSetting.findUnique({
    where: { key: "system:payment_configs" },
  });

  const defaults: SystemPaymentConfigs = {
    enabledMethods: ["mpesa", "card", "bank_transfer"],
    mpesa: {
      consumerKey:
        process.env.SYSTEM_MPESA_CONSUMER_KEY ||
        process.env.MPESA_CONSUMER_KEY ||
        "",
      consumerSecret:
        process.env.SYSTEM_MPESA_CONSUMER_SECRET ||
        process.env.MPESA_CONSUMER_SECRET ||
        "",
      shortCode:
        process.env.SYSTEM_MPESA_SHORTCODE ||
        process.env.MPESA_SHORTCODE ||
        process.env.MPESA_BUSINESS_SHORTCODE ||
        "",
      passKey:
        process.env.SYSTEM_MPESA_PASSKEY || process.env.MPESA_PASSKEY || "",
      type: (process.env.SYSTEM_MPESA_TYPE ||
        process.env.MPESA_TYPE ||
        "PAYBILL") as "PAYBILL" | "TILL",
      environment: (process.env.MPESA_ENVIRONMENT || "SANDBOX") as
        | "SANDBOX"
        | "PRODUCTION",
    },
    stripe: {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
      secretKey: process.env.STRIPE_SECRET_KEY || "",
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    },
    dodo: {
      apiKey: process.env.DODO_PAYMENTS_API_KEY || "",
      environment: (process.env.DODO_PAYMENTS_MODE || "sandbox") as
        | "sandbox"
        | "live",
    },
    bankTransfer: {
      bankName: "Standard Chartered Bank",
      accountName: "Scryme Technologies Ltd",
      accountNumber: "0100000000000",
      swiftCode: "SCBLKENX",
      instructions:
        "Include organization slug or invoice reference in payment remarks.",
    },
  };

  if (!setting?.value) return defaults;

  try {
    const parsed = JSON.parse(setting.value);
    return {
      ...defaults,
      ...parsed,
      mpesa: { ...defaults.mpesa, ...(parsed.mpesa || {}) },
      stripe: { ...defaults.stripe, ...(parsed.stripe || {}) },
      dodo: { ...defaults.dodo, ...(parsed.dodo || {}) },
      bankTransfer: {
        ...defaults.bankTransfer,
        ...(parsed.bankTransfer || {}),
      },
    };
  } catch {
    return defaults;
  }
}

export async function saveSystemPaymentConfigs(configs: SystemPaymentConfigs) {
  await requireSuperAdmin();

  await db.globalSetting.upsert({
    where: { key: "system:payment_configs" },
    update: { value: JSON.stringify(configs) },
    create: { key: "system:payment_configs", value: JSON.stringify(configs) },
  });

  if (configs.mpesa) {
    const mpesaLegacy = {
      mpesaConsumerKey: configs.mpesa.consumerKey,
      mpesaConsumerSecret: configs.mpesa.consumerSecret,
      mpesaShortCode: configs.mpesa.shortCode,
      mpesaPassKey: configs.mpesa.passKey,
      mpesaType: configs.mpesa.type,
      environment: configs.mpesa.environment,
    };
    await db.globalSetting.upsert({
      where: { key: "system:mpesa" },
      update: { value: JSON.stringify(mpesaLegacy) },
      create: { key: "system:mpesa", value: JSON.stringify(mpesaLegacy) },
    });
  }

  revalidatePath("/billing");
  revalidatePath("/settings");
  return configs;
}

export async function getDefaultQuotaAllocations(): Promise<DefaultQuotaAllocations> {
  const setting = await db.globalSetting.findUnique({
    where: { key: "system:default_quotas" },
  });

  const defaults: DefaultQuotaAllocations = {
    maxUsers: 5,
    maxProducts: 500,
    maxLocations: 2,
    maxStorageGB: 10,
    maxOrdersPerMonth: 1000,
    maxApiRequestsPerDay: 10000,
    maxWebhookSubscriptions: 5,
    maxWorkflowEngineDefinitions: 10,
    maxCustomDomains: 1,
  };

  if (!setting?.value) return defaults;

  try {
    const parsed = JSON.parse(setting.value);
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

export async function saveDefaultQuotaAllocations(
  allocations: DefaultQuotaAllocations,
) {
  await requireSuperAdmin();

  await db.globalSetting.upsert({
    where: { key: "system:default_quotas" },
    update: { value: JSON.stringify(allocations) },
    create: {
      key: "system:default_quotas",
      value: JSON.stringify(allocations),
    },
  });

  revalidatePath("/billing");
  revalidatePath("/settings");
  return allocations;
}

export async function getSystemMpesaCredentials() {
  const setting = await db.globalSetting.findUnique({
    where: { key: "system:mpesa" },
  });

  if (setting?.value) {
    try {
      const parsed = JSON.parse(setting.value);
      if (
        parsed.mpesaConsumerKey &&
        parsed.mpesaConsumerSecret &&
        parsed.mpesaShortCode
      ) {
        return parsed;
      }
    } catch {
      // ignore
    }
  }

  const envKey =
    process.env.SYSTEM_MPESA_CONSUMER_KEY || process.env.MPESA_CONSUMER_KEY;
  const envSecret =
    process.env.SYSTEM_MPESA_CONSUMER_SECRET ||
    process.env.MPESA_CONSUMER_SECRET;
  const envShortCode =
    process.env.SYSTEM_MPESA_SHORTCODE ||
    process.env.MPESA_SHORTCODE ||
    process.env.MPESA_BUSINESS_SHORTCODE;
  const envPassKey =
    process.env.SYSTEM_MPESA_PASSKEY || process.env.MPESA_PASSKEY;
  const envType = (process.env.SYSTEM_MPESA_TYPE ||
    process.env.MPESA_TYPE ||
    "PAYBILL") as "PAYBILL" | "TILL";
  const envEnv = (process.env.MPESA_ENVIRONMENT || "SANDBOX") as
    | "SANDBOX"
    | "PRODUCTION";

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

  const org = await db.organization.findUnique({
    where: { id: input.organizationId },
  });
  if (!org) {
    throw new Error(`Organization with ID ${input.organizationId} not found`);
  }

  const firstMember = await db.member.findFirst({
    where: { organizationId: input.organizationId },
  });
  if (!firstMember) {
    throw new Error(
      `Organization "${input.organizationId}" has no members to associate payment with`,
    );
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
      message:
        "M-Pesa push initiated in test mode (no live Safaricom credentials configured).",
    };
  }

  const { MpesaClient } = await import("@repo/shared/mpesa");
  const client = new MpesaClient(creds);

  const isDev = process.env.NODE_ENV === "development";
  const defaultCallbackBase = isDev
    ? "http://localhost:4000"
    : "https://api.scryme.tech";
  const callbackBase =
    process.env.MPESA_CALLBACK_BASE_URL || defaultCallbackBase;
  const callbackUrl = `${callbackBase}/api/v3/${org.slug}/payments/webhooks/mpesa/stkpush/admin-${reference}`;

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
  const saleData = payReq.saleData as {
    tierSlug?: string;
    durationMonths?: number;
    isSimulated?: boolean;
  } | null;

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
        periodEnd.setMonth(
          periodEnd.getMonth() + (saleData.durationMonths || 12),
        );

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
              resultDescription:
                queryRes.ResultDesc || "STK Push payment verified",
              transactionDate: new Date(),
            },
          });

          if (saleData?.tierSlug && saleData.tierSlug !== "none") {
            const periodEnd = new Date();
            periodEnd.setMonth(
              periodEnd.getMonth() + (saleData.durationMonths || 12),
            );

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
            resultDescription:
              queryRes.ResultDesc || "STK Push failed or cancelled",
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

export type PricingConfigData = {
  title?: string;
  heroBadge?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  currencies: Array<{
    code: string;
    symbol: string;
    name: string;
    badge: string;
    growth: {
      monthly: { amount: string; period: string };
      annual: { amount: string; period: string; billedNote?: string };
    };
    scale: {
      monthly: { amount: string; period: string };
      annual: { amount: string; period: string; billedNote?: string };
    };
    enterprise: {
      monthly: { amount: string; period: string };
      annual: { amount: string; period: string; billedNote?: string };
    };
  }>;
  faqs: Array<{ q: string; a: string }>;
};

export async function getPricingConfig(): Promise<PricingConfigData> {
  const setting = await db.globalSetting.findUnique({
    where: { key: "system:pricing_config" },
  });

  const defaults: PricingConfigData = {
    title: "Global Site Pricing Configuration",
    heroBadge: "14-Day Free Trial • Instant Deployment • Zero Risk",
    heroTitle: "Predictable Pricing Engineered for Limitless Enterprise Scale",
    heroSubtitle:
      "No per-user penalties or hidden seat taxes. Unify your operational software stack under one transparent, telemetry-based billing model.",
    currencies: [
      {
        code: "USD",
        symbol: "$",
        name: "USD ($)",
        badge: "Global USD",
        growth: {
          monthly: { amount: "$599", period: "/ month" },
          annual: {
            amount: "$499",
            period: "/ month",
            billedNote: "Billed annually ($5,988/yr)",
          },
        },
        scale: {
          monthly: { amount: "$1,799", period: "/ month" },
          annual: {
            amount: "$1,499",
            period: "/ month",
            billedNote: "Billed annually ($17,988/yr)",
          },
        },
        enterprise: {
          monthly: { amount: "Custom", period: "" },
          annual: { amount: "Custom", period: "" },
        },
      },
      {
        code: "KSH",
        symbol: "KSh ",
        name: "KSh (M-Pesa)",
        badge: "M-Pesa Direct",
        growth: {
          monthly: { amount: "KSh 78,000", period: "/ month" },
          annual: {
            amount: "KSh 65,000",
            period: "/ month",
            billedNote: "Billed annually (KSh 780,000/yr)",
          },
        },
        scale: {
          monthly: { amount: "KSh 234,000", period: "/ month" },
          annual: {
            amount: "KSh 195,000",
            period: "/ month",
            billedNote: "Billed annually (KSh 2,340,000/yr)",
          },
        },
        enterprise: {
          monthly: { amount: "Custom", period: "" },
          annual: { amount: "Custom", period: "" },
        },
      },
      {
        code: "EUR",
        symbol: "€",
        name: "EUR (€)",
        badge: "Eurozone SEPA",
        growth: {
          monthly: { amount: "€550", period: "/ month" },
          annual: {
            amount: "€460",
            period: "/ month",
            billedNote: "Billed annually (€5,520/yr)",
          },
        },
        scale: {
          monthly: { amount: "€1,650", period: "/ month" },
          annual: {
            amount: "€1,380",
            period: "/ month",
            billedNote: "Billed annually (€16,560/yr)",
          },
        },
        enterprise: {
          monthly: { amount: "Custom", period: "" },
          annual: { amount: "Custom", period: "" },
        },
      },
    ],
    faqs: [
      {
        q: "How does the 14-day free trial work?",
        a: "When you sign up for Growth or Scale tiers, you receive full platform access for 14 days without charge. You can upgrade, switch billing cycles, or cancel anytime before the trial period ends.",
      },
      {
        q: "What payment options do you support?",
        a: "We support M-Pesa (STK push & direct paybill), all major credit/debit cards (Visa, Mastercard, Amex), Apple Pay, Google Pay, and bank wire transfers (ACH/SEPA/SWIFT) for annual commitments.",
      },
      {
        q: "Are there per-seat or per-user licensing fees?",
        a: "No. Scryme believes charging per-seat penalizes business growth and discourages cross-department collaboration. All plans include unlimited user seats.",
      },
      {
        q: "Can I change my billing cycle or currency later?",
        a: "Yes. You can switch between Monthly and Annual billing or adjust your default workspace currency at any time directly in Organization Settings.",
      },
      {
        q: "What happens if our order volume exceeds the plan threshold?",
        a: "You are never cut off. Overages are billed transparently at fractional cents per transaction without service degradation.",
      },
      {
        q: "How long does migration from NetSuite or SAP take?",
        a: "Our automated zero-loss ingestion connectors typically complete data migration and validation within 48 to 72 hours.",
      },
    ],
  };

  if (!setting?.value) return defaults;

  try {
    const parsed = JSON.parse(setting.value);
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

export async function syncPricingToSanity(config: PricingConfigData) {
  const projectId =
    process.env.SANITY_PROJECT_ID ||
    process.env.SANITY_STUDIO_PROJECT_ID ||
    process.env.VITE_SANITY_PROJECT_ID;
  const dataset =
    process.env.SANITY_DATASET ||
    process.env.SANITY_STUDIO_DATASET ||
    process.env.VITE_SANITY_DATASET ||
    "production";
  const apiToken =
    process.env.SANITY_WRITE_TOKEN ||
    process.env.SANITY_API_TOKEN ||
    process.env.SANITY_TOKEN;

  if (!projectId || projectId === "placeholder_project_id" || !apiToken) {
    return {
      synced: false,
      message:
        "Sanity write credentials (SANITY_PROJECT_ID & SANITY_WRITE_TOKEN) not set. Local DB pricing updated.",
    };
  }

  const { createClient } = await import("@sanity/client");
  const client = createClient({
    projectId,
    dataset,
    apiVersion: "2024-01-01",
    token: apiToken,
    useCdn: false,
  });

  const doc = {
    _id: "site-pricing-config",
    _type: "pricingConfig",
    title: config.title || "Global Site Pricing Configuration",
    heroBadge: config.heroBadge,
    heroTitle: config.heroTitle,
    heroSubtitle: config.heroSubtitle,
    currencies: config.currencies,
    faqs: config.faqs,
  };

  await client.createOrReplace(doc);

  return {
    synced: true,
    message: "Pricing configuration successfully published to Sanity CMS!",
  };
}

export async function savePricingConfig(config: PricingConfigData) {
  await requireSuperAdmin();

  await db.globalSetting.upsert({
    where: { key: "system:pricing_config" },
    update: { value: JSON.stringify(config) },
    create: { key: "system:pricing_config", value: JSON.stringify(config) },
  });

  let syncResult = { synced: false, message: "" };
  try {
    syncResult = await syncPricingToSanity(config);
  } catch (err) {
    console.warn("Sanity sync warning:", err);
    syncResult = {
      synced: false,
      message: `Saved to DB, but Sanity sync failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  revalidatePath("/billing");
  return { success: true, ...syncResult };
}
