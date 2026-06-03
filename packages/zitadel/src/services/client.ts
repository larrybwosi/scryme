import {
  createManagementClient,
  createUserClient,
} from "@zitadel/node/dist/api/clients.js";
import {
  createServiceAccountInterceptor,
} from "@zitadel/node/dist/api/interceptors.js";
import { ServiceAccount } from "@zitadel/node/dist/credentials/service-account.js";

export interface ZitadelEnvConfig {
  domain: string;
  clientId: string;
  keyId: string;
  key: string;
}

export function getZitadelEnvConfig(): ZitadelEnvConfig {
  const domain = process.env.ZITADEL_DOMAIN;
  const clientId = process.env.ZITADEL_CLIENT_ID;
  const keyId = process.env.ZITADEL_KEY_ID;
  const key = process.env.ZITADEL_KEY;

  if (!domain || !clientId || !keyId || !key) {
    throw new Error(
      "Missing required Zitadel env vars: ZITADEL_DOMAIN, ZITADEL_CLIENT_ID, ZITADEL_KEY_ID, ZITADEL_KEY"
    );
  }

  return { domain, clientId, keyId, key };
}

export async function getZitadelManagementClient() {
  const config = getZitadelEnvConfig();
  const sa = ServiceAccount.fromJson({
    userId: config.clientId,
    keyId: config.keyId,
    key: config.key,
  });

  return createManagementClient(
    config.domain,
    createServiceAccountInterceptor(config.domain, sa, { apiAccess: true })
  );
}

export async function getZitadelUserClient() {
  const config = getZitadelEnvConfig();
  const sa = ServiceAccount.fromJson({
    userId: config.clientId,
    keyId: config.keyId,
    key: config.key,
  });

  return createUserClient(
    config.domain,
    createServiceAccountInterceptor(config.domain, sa, { apiAccess: true })
  );
}
