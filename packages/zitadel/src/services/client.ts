// import { createManagementClient, createUserServiceClient } from '@zitadel/node';

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
      'Missing required Zitadel env vars: ZITADEL_DOMAIN, ZITADEL_CLIENT_ID, ZITADEL_KEY_ID, ZITADEL_KEY'
    );
  }

  return { domain, clientId, keyId, key };
}

export async function getZitadelManagementClient() {
  const config = getZitadelEnvConfig();
  return;

  // return createManagementClient(config.domain, {
  //   authConfig: {
  //     clientId: config.clientId,
  //     keyId: config.keyId,
  //     key: config.key,
  //   },
  // });
}

export async function getZitadelUserClient() {
  const config = getZitadelEnvConfig();
  return;

  // return createUserServiceClient(config.domain, {
  //   authConfig: {
  //     clientId: config.clientId,
  //     keyId: config.keyId,
  //     key: config.key,
  //   },
  // });
}
