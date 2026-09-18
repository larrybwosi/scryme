import { V3ApiContext } from "@repo/shared/api/v2";

export interface V3AuthHeadersOptions {
  memberToken?: string;
  apiKey?: string;
  orgSlug?: string;
  locationId?: string;
}

/**
 * Builds HTTP headers required for Scryme V3 API authentication.
 */
export function buildV3AuthHeaders(options: V3AuthHeadersOptions): Record<string, string> {
  const headers: Record<string, string> = {};

  if (options.memberToken) {
    headers["x-member-token"] = options.memberToken;
    headers["Authorization"] = `Bearer ${options.memberToken}`;
  }

  if (options.apiKey) {
    headers["x-api-key"] = options.apiKey;
  }

  if (options.orgSlug) {
    headers["x-org-slug"] = options.orgSlug;
  }

  if (options.locationId) {
    headers["x-location-id"] = options.locationId;
  }

  return headers;
}

/**
 * Validates if the given V3 Context satisfies required scopes/permissions.
 */
export function hasV3Scope(context: V3ApiContext | undefined | null, requiredScope: string): boolean {
  if (!context || !context.scopes) return false;
  if (context.scopes.includes("*") || context.scopes.includes(requiredScope)) return true;

  const parts = requiredScope.split(":");
  for (let i = parts.length; i > 1; i--) {
    const wildcard = [...parts.slice(0, i - 1), "*"].join(":");
    if (context.scopes.includes(wildcard)) return true;
  }

  return false;
}
