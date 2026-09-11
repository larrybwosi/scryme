import { describe, it, expect, vi } from "vitest";
import { runWithTenant, runWithSystemBypass, getTenantContext } from "./tenant-context";
import { isTenantModel } from "./tenant-models";
import { createTenantExtendedClient } from "./client";

describe("Tenant Data Isolation - Database Level", () => {
  it("should return the correct active tenant context within runWithTenant", async () => {
    await runWithTenant({ organizationId: "org-tenant-123" }, async () => {
      const context = getTenantContext();
      expect(context).toBeDefined();
      expect(context?.organizationId).toBe("org-tenant-123");
    });

    expect(getTenantContext()).toBeUndefined();
  });

  it("should return system bypass mode within runWithSystemBypass", async () => {
    await runWithSystemBypass(async () => {
      const context = getTenantContext();
      expect(context).toBeDefined();
      expect(context?.bypassIsolation).toBe(true);
    });
  });

  it("should correctly identify tenant models vs non-tenant models", () => {
    expect(isTenantModel("Product")).toBe(true);
    expect(isTenantModel("Customer")).toBe(true);
    expect(isTenantModel("Transaction")).toBe(true);
    expect(isTenantModel("Invoice")).toBe(true);
    expect(isTenantModel("NonExistentModel")).toBe(false);
  });

  it("should intercept queries and inject active organizationId filter when tenant context is active", async () => {
    const mockQuery = vi.fn().mockResolvedValue([]);
    const dummyBaseClient: any = {
      $extends: (extensionFn: any) => {
        return extensionFn;
      },
    };

    const extensionObj = createTenantExtendedClient(dummyBaseClient);
    const allOpsFn = extensionObj.query.$allModels.$allOperations;

    await runWithTenant({ organizationId: "org-aaa" }, async () => {
      const args: any = { where: { id: "product-1" } };
      await allOpsFn({
        model: "Product",
        operation: "findMany",
        args,
        query: mockQuery,
      });

      expect(args.where.organizationId).toBe("org-aaa");
      expect(mockQuery).toHaveBeenCalledWith(args);
    });
  });

  it("should prevent cross-tenant IDOR by overriding mismatched organizationId in queries", async () => {
    const mockQuery = vi.fn().mockResolvedValue([]);
    const dummyBaseClient: any = {
      $extends: (extensionFn: any) => {
        return extensionFn;
      },
    };

    const extensionObj = createTenantExtendedClient(dummyBaseClient);
    const allOpsFn = extensionObj.query.$allModels.$allOperations;

    await runWithTenant({ organizationId: "org-aaa" }, async () => {
      const args: any = { where: { organizationId: "org-bbb" } };
      await allOpsFn({
        model: "Product",
        operation: "findMany",
        args,
        query: mockQuery,
      });

      // Mismatched org-bbb should be forced to activeOrg org-aaa
      expect(args.where.organizationId).toBe("org-aaa");
    });
  });

  it("should verify ownership before executing single record update or delete", async () => {
    const mockQuery = vi.fn().mockResolvedValue({ id: "prod-1", organizationId: "org-aaa" });
    const mockFindFirst = vi.fn().mockResolvedValue({ id: "prod-1", organizationId: "org-aaa" });
    const dummyBaseClient: any = {
      product: {
        findFirst: mockFindFirst,
      },
      $extends: (extensionFn: any) => {
        return extensionFn;
      },
    };

    const extensionObj = createTenantExtendedClient(dummyBaseClient);
    const allOpsFn = extensionObj.query.$allModels.$allOperations;

    await runWithTenant({ organizationId: "org-aaa" }, async () => {
      const args: any = { where: { id: "prod-1" }, data: { name: "Updated" } };
      await allOpsFn({
        model: "Product",
        operation: "update",
        args,
        query: mockQuery,
      });

      expect(mockFindFirst).toHaveBeenCalledWith({
        where: { id: "prod-1", organizationId: "org-aaa" },
      });
      expect(mockQuery).toHaveBeenCalledWith(args);
    });
  });

  it("should throw error when updating or deleting a record belonging to another organization", async () => {
    const mockQuery = vi.fn();
    const mockFindFirst = vi.fn().mockResolvedValue(null); // Not found in active tenant org-aaa
    const dummyBaseClient: any = {
      product: {
        findFirst: mockFindFirst,
      },
      $extends: (extensionFn: any) => {
        return extensionFn;
      },
    };

    const extensionObj = createTenantExtendedClient(dummyBaseClient);
    const allOpsFn = extensionObj.query.$allModels.$allOperations;

    await runWithTenant({ organizationId: "org-aaa" }, async () => {
      const args: any = { where: { id: "prod-belonging-to-org-bbb" }, data: { name: "Hack" } };
      await expect(
        allOpsFn({
          model: "Product",
          operation: "update",
          args,
          query: mockQuery,
        })
      ).rejects.toThrow("Record in Product not found for active organization");

      expect(mockQuery).not.toHaveBeenCalled();
    });
  });
});
