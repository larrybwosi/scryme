import { ScrymeClientSDK } from '@scryme/sdk/client';
import { ScrymeServerSDK } from '@scryme/sdk/server';

export const ORG_SLUG = process.env.NEXT_PUBLIC_SCRYME_ORG_SLUG || 'demo-store';
export const API_URL = process.env.NEXT_PUBLIC_SCRYME_API_URL || 'https://api.scryme.com';

export const scrymeClient = new ScrymeClientSDK({
  baseUrl: API_URL,
  orgSlug: ORG_SLUG,
});

export const getScrymeServerClient = (token?: string) => {
  return new ScrymeServerSDK({
    baseUrl: API_URL,
    orgSlug: ORG_SLUG,
    token,
  });
};
