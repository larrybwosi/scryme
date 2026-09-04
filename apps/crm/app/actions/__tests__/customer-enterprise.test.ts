import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @repo/db
vi.mock("@repo/db", () => ({
  db: {
    customer: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    campaignWorkflow: {
      findMany: vi.fn(),
    },
    scrymeConfiguration: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock @repo/auth/server
vi.mock("@repo/auth/server", () => ({
  getServerAuth: vi.fn().mockResolvedValue({ organizationId: "org_test_123" }),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { db } from "@repo/db";
import {
  calculateCustomerHealthScore,
  updateCustomerTier,
  bulkUpdateCustomerTier,
  exportCustomersCSV,
  importCustomersCSV,
} from "../customer-enterprise";

describe("Customer Enterprise Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("calculateCustomerHealthScore", () => {
    it("should compute high score and LOW risk for frequent active high-spending customer", async () => {
      (db.customer.findFirst as any).mockResolvedValue({
        id: "cust_1",
        organizationId: "org_test_123",
        transactions: [
          { id: "tx_1", grandTotal: 5000, createdAt: new Date() },
          { id: "tx_2", grandTotal: 6000, createdAt: new Date() },
        ],
        crmRecord: {
          activities: [{ createdAt: new Date() }],
        },
      });

      const result = await calculateCustomerHealthScore("cust_1");

      expect(result.score).toBeGreaterThanOrEqual(75);
      expect(result.riskLevel).toBe("LOW");
      expect(result.metrics.orderCount).toBe(2);
      expect(result.metrics.totalSpent).toBe(11000);
    });

    it("should compute CRITICAL risk for inactive churned customer", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 150);

      (db.customer.findFirst as any).mockResolvedValue({
        id: "cust_2",
        organizationId: "org_test_123",
        transactions: [{ id: "tx_old", grandTotal: 100, createdAt: pastDate }],
        crmRecord: { activities: [] },
      });

      const result = await calculateCustomerHealthScore("cust_2");

      expect(result.riskLevel).toBe("CRITICAL");
      expect(result.metrics.daysSinceLastOrder).toBeGreaterThanOrEqual(140);
    });
  });

  describe("updateCustomerTier & bulkUpdateCustomerTier", () => {
    it("should update single customer tier tag", async () => {
      (db.customer.findFirst as any).mockResolvedValue({
        id: "cust_1",
        tags: ["REGULAR", "STANDARD"],
      });
      (db.customer.update as any).mockResolvedValue({
        id: "cust_1",
        tags: ["REGULAR", "VIP"],
      });

      const res = await updateCustomerTier("cust_1", "VIP");

      expect(res.success).toBe(true);
      expect(db.customer.update).toHaveBeenCalledWith({
        where: { id: "cust_1" },
        data: { tags: ["REGULAR", "VIP"] },
      });
    });

    it("should bulk update customer tiers for multiple customers", async () => {
      (db.customer.findMany as any).mockResolvedValue([
        { id: "cust_1", tags: ["STANDARD"] },
        { id: "cust_2", tags: ["GOLD"] },
      ]);
      (db.customer.update as any).mockResolvedValue({ success: true });

      const res = await bulkUpdateCustomerTier(["cust_1", "cust_2"], "PLATINUM");

      expect(res.success).toBe(true);
      expect(res.updatedCount).toBe(2);
      expect(db.customer.update).toHaveBeenCalledTimes(2);
    });
  });

  describe("exportCustomersCSV & importCustomersCSV", () => {
    it("should export customer records into structured CSV string", async () => {
      (db.customer.findMany as any).mockResolvedValue([
        {
          id: "cust_1",
          customId: "CUST-1001",
          name: "John Doe",
          email: "john@example.com",
          phone: "+254700000000",
          company: "Acme Corp",
          customerType: "B2C",
          tags: ["VIP"],
          isActive: true,
          loyaltyPoints: 100,
          createdAt: new Date("2025-01-01T00:00:00Z"),
        },
      ]);

      const csv = await exportCustomersCSV();

      expect(csv).toContain("ID,CustomID,Name,Email,Phone,Company,Type,Tags,IsActive,LoyaltyPoints,CreatedAt");
      expect(csv).toContain("cust_1,CUST-1001,\"John Doe\",john@example.com");
    });

    it("should import customer records from valid CSV string", async () => {
      (db.customer.create as any).mockResolvedValue({ id: "cust_new" });

      const csvData = `Name,Email,Phone,Company
Jane Smith,jane@example.com,+254711111111,Tech Solutions`;

      const res = await importCustomersCSV(csvData);

      expect(res.success).toBe(true);
      expect(res.importedCount).toBe(1);
      expect(db.customer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "Jane Smith",
            email: "jane@example.com",
            phone: "+254711111111",
            company: "Tech Solutions",
            creationType: "IMPORTED",
          }),
        })
      );
    });
  });
});
