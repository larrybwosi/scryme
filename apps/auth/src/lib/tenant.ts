export interface TenantContext {
  isCustomer: boolean;
  orgSlug: string | null;
  needsOrgSelection: boolean;
  hostname: string;
}

/**
 * Resolves the tenant context from the window location or a given hostname.
 *
 * Supported patterns:
 * - <orgSlug>.customers.auth.scryme.tech -> { isCustomer: true, orgSlug: "<orgSlug>", needsOrgSelection: false }
 * - <orgSlug>.customers.localhost -> { isCustomer: true, orgSlug: "<orgSlug>", needsOrgSelection: false }
 * - <orgSlug>.customers.localhost:4444 -> { isCustomer: true, orgSlug: "<orgSlug>", needsOrgSelection: false }
 * - customers.auth.scryme.tech -> { isCustomer: true, orgSlug: null, needsOrgSelection: true }
 * - customers.localhost -> { isCustomer: true, orgSlug: null, needsOrgSelection: true }
 * - auth.scryme.tech / localhost -> { isCustomer: false, orgSlug: null, needsOrgSelection: false }
 */
export function resolveTenantContext(
  customHostname?: string,
  searchParams?: Record<string, string | undefined>
): TenantContext {
  let host = customHostname;
  if (!host && typeof window !== "undefined") {
    host = window.location.host;
  }
  if (!host) {
    host = "localhost:4444";
  }

  // Strip port if present
  const hostnameWithoutPort = host.split(":")[0].toLowerCase();

  // Explicit URL query overrides (e.g. ?org=scryme&customer=true)
  const queryOrg = searchParams?.org || searchParams?.orgSlug;
  const isQueryCustomer = searchParams?.customer === "true" || searchParams?.type === "customer";

  // Check customer subdomain patterns
  // Pattern 1: <orgSlug>.customers.<domain>
  const matchSubdomain = hostnameWithoutPort.match(/^([a-z0-9-_]+)\.customers\./);
  if (matchSubdomain && matchSubdomain[1]) {
    const slug = matchSubdomain[1];
    return {
      isCustomer: true,
      orgSlug: slug,
      needsOrgSelection: false,
      hostname: host,
    };
  }

  // Pattern 2: customers.<domain> without prefix
  if (
    hostnameWithoutPort === "customers.auth.scryme.tech" ||
    hostnameWithoutPort === "customers.localhost" ||
    hostnameWithoutPort.startsWith("customers.")
  ) {
    if (queryOrg) {
      return {
        isCustomer: true,
        orgSlug: queryOrg,
        needsOrgSelection: false,
        hostname: host,
      };
    }
    return {
      isCustomer: true,
      orgSlug: null,
      needsOrgSelection: true,
      hostname: host,
    };
  }

  // Pattern 3: query-driven customer mode (e.g. on localhost:4444?customer=true&org=scryme)
  if (isQueryCustomer) {
    return {
      isCustomer: true,
      orgSlug: queryOrg || null,
      needsOrgSelection: !queryOrg,
      hostname: host,
    };
  }

  // Internal user mode
  return {
    isCustomer: false,
    orgSlug: null,
    needsOrgSelection: false,
    hostname: host,
  };
}

/**
 * Builds the URL to redirect to a specific organization customer portal.
 */
export function buildCustomerTenantUrl(orgSlug: string, currentUrl?: URL): string {
  const url = currentUrl || (typeof window !== "undefined" ? new URL(window.location.href) : new URL("http://localhost:4444"));
  const host = url.host;
  const port = url.port ? `:${url.port}` : "";
  const hostnameWithoutPort = url.hostname.toLowerCase();

  if (hostnameWithoutPort.includes("scryme.tech")) {
    url.host = `${orgSlug}.customers.auth.scryme.tech${port}`;
  } else if (hostnameWithoutPort.includes("localhost")) {
    url.host = `${orgSlug}.customers.localhost${port}`;
  } else {
    // Generic fallback: prepend orgSlug.customers
    url.host = `${orgSlug}.customers.${hostnameWithoutPort}${port}`;
  }

  return url.toString();
}
