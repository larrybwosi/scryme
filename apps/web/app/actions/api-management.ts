"use server";

import { getOrganizationContext } from "./auth";
import * as crypto from "crypto";
import {
  createV3ApiClient,
  getV3ApiClients,
  deleteV3ApiClient,
  updateV3ApiClient,
  regenerateV3ClientSecret,
  createWebhookSubscription,
  getWebhookSubscriptions,
  deleteWebhookSubscription,
  createV2ApiKey,
  getV2ApiKeys,
  deleteV2ApiKey,
  getDeviceSetupTokens,
  getDeviceRegistry,
} from "@repo/shared";
import { revalidatePath } from "next/cache";
import { db } from "@repo/db";

async function ensureOrgContext() {
  const context = await getOrganizationContext();
  if (!context || !context.organizationId) {
    throw new Error("Unauthorized");
  }
  return context;
}

// --- V3 API Clients ---

export async function createV3ApiClientAction(data: {
  name: string;
  scopes?: string[];
  corsOrigins?: string[];
}): Promise<any> {
  const context = await ensureOrgContext();
  const result = await createV3ApiClient({
    ...data,
    organizationId: context.organizationId,
  });
  revalidatePath("/integrations/apps-api");
  return result;
}

export async function getV3ApiClientsAction(): Promise<any> {
  const context = await ensureOrgContext();
  return getV3ApiClients(context.organizationId);
}

export async function deleteV3ApiClientAction(id: string): Promise<any> {
  const context = await ensureOrgContext();
  await deleteV3ApiClient(id, context.organizationId);
  revalidatePath("/integrations/apps-api");
}

export async function updateV3ApiClientAction(
  id: string,
  data: any,
): Promise<any> {
  const context = await ensureOrgContext();
  await updateV3ApiClient(id, context.organizationId, data);
  revalidatePath("/integrations/apps-api");
}

export async function regenerateV3ClientSecretAction(id: string): Promise<any> {
  const context = await ensureOrgContext();
  const secret = await regenerateV3ClientSecret(id, context.organizationId);
  revalidatePath("/integrations/apps-api");
  return secret;
}

// --- Webhooks ---

export async function createWebhookSubscriptionAction(data: {
  name?: string;
  url: string;
  events: string[];
  apiClientId?: string;
}): Promise<any> {
  const context = await ensureOrgContext();
  const result = await createWebhookSubscription({
    ...data,
    organizationId: context.organizationId,
  });
  revalidatePath("/integrations/apps-api");
  return result;
}

export async function getWebhookSubscriptionsAction(): Promise<any> {
  const context = await ensureOrgContext();
  return getWebhookSubscriptions(context.organizationId);
}

export async function deleteWebhookSubscriptionAction(
  id: string,
): Promise<any> {
  const context = await ensureOrgContext();
  await deleteWebhookSubscription(id, context.organizationId);
  revalidatePath("/integrations/apps-api");
}

// --- V2 API Keys ---

export async function createV2ApiKeyAction(data: {
  name: string;
  environment?: "LIVE" | "TEST";
  keyType?: "POS" | "CLIENT";
  permissions?: string[];
}): Promise<any> {
  const context = await ensureOrgContext();
  const result = await createV2ApiKey({
    ...data,
    organizationId: context.organizationId,
    createdById: context.user.id,
  });
  revalidatePath("/integrations/apps-api");
  return result;
}

export async function getV2ApiKeysAction(): Promise<any> {
  const context = await ensureOrgContext();
  return getV2ApiKeys(context.organizationId);
}

export async function deleteV2ApiKeyAction(id: string): Promise<any> {
  const context = await ensureOrgContext();
  await deleteV2ApiKey(id, context.organizationId);
  revalidatePath("/integrations/apps-api");
}

// --- V2 Device Tokens ---

export async function createDeviceSetupTokenAction(data: {
  deviceName: string;
  deviceType:
    | "POS_TERMINAL"
    | "MOBILE_POS"
    | "KIOSK"
    | "TABLET"
    | "BAKERY_TERMINAL";
  locationId: string;
}): Promise<any> {
  const context = await ensureOrgContext();
  const result = await createDeviceSetupToken({
    ...data,
    organizationId: context.organizationId,
    createdById: context.user.id,
  });
  revalidatePath("/integrations/apps-api");
  return result;
}

export async function getDeviceSetupTokensAction(): Promise<any> {
  const context = await ensureOrgContext();
  return getDeviceSetupTokens(context.organizationId);
}

export async function getDeviceRegistryAction(): Promise<any> {
  const context = await ensureOrgContext();
  return getDeviceRegistry(context.organizationId);
}

async function createDeviceSetupToken(data: {
  organizationId: string;
  createdById: string;
  deviceName: string;
  deviceType:
    | "POS_TERMINAL"
    | "MOBILE_POS"
    | "KIOSK"
    | "TABLET"
    | "BAKERY_TERMINAL";
  locationId: string;
}) {
  const jti = crypto.randomUUID();
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const setupToken = await db.deviceSetupToken.create({
    data: {
      organizationId: data.organizationId,
      createdById: data.createdById,
      deviceName: data.deviceName,
      deviceType: data.deviceType,
      locationId: data.locationId,
      jti,
      tokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });

  return { ...setupToken, rawToken };
}
