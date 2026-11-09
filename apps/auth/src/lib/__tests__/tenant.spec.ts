import { describe, it, expect } from "vitest";
import { resolveTenantContext, buildCustomerTenantUrl } from "../tenant";

describe("resolveTenantContext", () => {
  it("should resolve internal mode on standard auth hostname", () => {
    const res = resolveTenantContext("auth.scryme.tech");
    expect(res.isCustomer).toBe(false);
    expect(res.orgSlug).toBeNull();
    expect(res.needsOrgSelection).toBe(false);
  });

  it("should resolve internal mode on standard localhost port", () => {
    const res = resolveTenantContext("localhost:4444");
    expect(res.isCustomer).toBe(false);
    expect(res.orgSlug).toBeNull();
    expect(res.needsOrgSelection).toBe(false);
  });

  it("should resolve customer mode with org slug in production subdomain", () => {
    const res = resolveTenantContext("scryme.customers.auth.scryme.tech");
    expect(res.isCustomer).toBe(true);
    expect(res.orgSlug).toBe("scryme");
    expect(res.needsOrgSelection).toBe(false);
  });

  it("should resolve customer mode with org slug in local development subdomain", () => {
    const res = resolveTenantContext("acme.customers.localhost:4444");
    expect(res.isCustomer).toBe(true);
    expect(res.orgSlug).toBe("acme");
    expect(res.needsOrgSelection).toBe(false);
  });

  it("should require org selection when visiting bare customer subdomain", () => {
    const res = resolveTenantContext("customers.auth.scryme.tech");
    expect(res.isCustomer).toBe(true);
    expect(res.orgSlug).toBeNull();
    expect(res.needsOrgSelection).toBe(true);
  });

  it("should support query parameter override for org selection", () => {
    const res = resolveTenantContext("customers.localhost:4444", { org: "scryme" });
    expect(res.isCustomer).toBe(true);
    expect(res.orgSlug).toBe("scryme");
    expect(res.needsOrgSelection).toBe(false);
  });

  it("should support customer query parameter on default host", () => {
    const res = resolveTenantContext("localhost:4444", { customer: "true", org: "techcorp" });
    expect(res.isCustomer).toBe(true);
    expect(res.orgSlug).toBe("techcorp");
    expect(res.needsOrgSelection).toBe(false);
  });
});

describe("buildCustomerTenantUrl", () => {
  it("should build customer tenant URL for production", () => {
    const url = new URL("https://auth.scryme.tech/sign-in");
    const target = buildCustomerTenantUrl("scryme", url);
    expect(target).toBe("https://scryme.customers.auth.scryme.tech/sign-in");
  });

  it("should build customer tenant URL for local development", () => {
    const url = new URL("http://localhost:4444/sign-in");
    const target = buildCustomerTenantUrl("scryme", url);
    expect(target).toBe("http://scryme.customers.localhost:4444/sign-in");
  });
});
