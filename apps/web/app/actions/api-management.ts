'use server';

import { getOrganizationContext } from './auth';
import * as shared from '@repo/shared';
import { revalidatePath } from 'next/cache';

async function ensureOrgContext() {
  const context = await getOrganizationContext();
  if (!context || !context.organizationId) {
    throw new Error('Unauthorized');
  }
  return context;
}

// --- V3 API Clients ---

export async function createV3ApiClientAction(data: {
  name: string;
  scopes?: string[];
  corsOrigins?: string[];
}) {
  const context = await ensureOrgContext();
  const result = await shared.createV3ApiClient({
    ...data,
    organizationId: context.organizationId,
  });
  revalidatePath('/integrations/apps-api');
  return result;
}

export async function getV3ApiClientsAction() {
  const context = await ensureOrgContext();
  return shared.getV3ApiClients(context.organizationId);
}

export async function deleteV3ApiClientAction(id: string) {
  const context = await ensureOrgContext();
  await shared.deleteV3ApiClient(id, context.organizationId);
  revalidatePath('/integrations/apps-api');
}

export async function updateV3ApiClientAction(id: string, data: any) {
  const context = await ensureOrgContext();
  await shared.updateV3ApiClient(id, context.organizationId, data);
  revalidatePath('/integrations/apps-api');
}

export async function regenerateV3ClientSecretAction(id: string) {
  const context = await ensureOrgContext();
  const secret = await shared.regenerateV3ClientSecret(id, context.organizationId);
  revalidatePath('/integrations/apps-api');
  return secret;
}

// --- Webhooks ---

export async function createWebhookSubscriptionAction(data: {
  name?: string;
  url: string;
  events: string[];
  apiClientId?: string;
}) {
  const context = await ensureOrgContext();
  const result = await shared.createWebhookSubscription({
    ...data,
    organizationId: context.organizationId,
  });
  revalidatePath('/integrations/apps-api');
  return result;
}

export async function getWebhookSubscriptionsAction() {
  const context = await ensureOrgContext();
  return shared.getWebhookSubscriptions(context.organizationId);
}

export async function deleteWebhookSubscriptionAction(id: string) {
  const context = await ensureOrgContext();
  await shared.deleteWebhookSubscription(id, context.organizationId);
  revalidatePath('/integrations/apps-api');
}

// --- V2 API Keys ---

export async function createV2ApiKeyAction(data: {
  name: string;
  environment?: 'LIVE' | 'TEST';
  keyType?: 'POS' | 'CLIENT';
  permissions?: string[];
}) {
  const context = await ensureOrgContext();
  const result = await shared.createV2ApiKey({
    ...data,
    organizationId: context.organizationId,
    createdById: context.user.id,
  });
  revalidatePath('/integrations/apps-api');
  return result;
}

export async function getV2ApiKeysAction() {
  const context = await ensureOrgContext();
  return shared.getV2ApiKeys(context.organizationId);
}

export async function deleteV2ApiKeyAction(id: string) {
  const context = await ensureOrgContext();
  await shared.deleteV2ApiKey(id, context.organizationId);
  revalidatePath('/integrations/apps-api');
}

// --- V2 Device Tokens ---

export async function createDeviceSetupTokenAction(data: {
  deviceName: string;
  deviceType: 'POS_TERMINAL' | 'MOBILE_POS' | 'KIOSK' | 'TABLET' | 'BAKERY_TERMINAL';
  locationId: string;
}) {
  const context = await ensureOrgContext();
  const result = await shared.createDeviceSetupToken({
    ...data,
    organizationId: context.organizationId,
    createdById: context.user.id,
  });
  revalidatePath('/integrations/apps-api');
  return result;
}

export async function getDeviceSetupTokensAction() {
  const context = await ensureOrgContext();
  return shared.getDeviceSetupTokens(context.organizationId);
}

export async function getDeviceRegistryAction() {
    const context = await ensureOrgContext();
    return shared.getDeviceRegistry(context.organizationId);
}
