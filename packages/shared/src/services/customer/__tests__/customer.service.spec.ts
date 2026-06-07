import { CustomerService } from "../customer.service";
import { db as prisma } from "@repo/db";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@repo/db", () => ({
  db: {
    customer: {
      findFirst: vi.fn(),
    },
    invoice: {
      aggregate: vi.fn(),
    },
  },
}));

describe("CustomerService Shared", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCustomerById", () => {
    it("should aggregate totals and limit related records", async () => {
      const mockCustomer = {
        id: "cust_123",
        name: "Test Customer",
        email: "test@example.com",
        phone: "123456",
        invoices: [],
        crmRecord: {
          notes: [],
          activities: [],
        },
        transactions: [],
      };

      vi.mocked(prisma.customer.findFirst).mockResolvedValue(mockCustomer as any);
      vi.mocked(prisma.invoice.aggregate).mockResolvedValueOnce({ _sum: { grandTotal: 1000 } } as any); // total
      vi.mocked(prisma.invoice.aggregate).mockResolvedValueOnce({ _sum: { grandTotal: 400 } } as any);  // paid

      const result = await CustomerService.getCustomerById("org_1", "cust_123");

      expect(result.success).toBe(true);
      expect(result.data.balance).toBe(600);
      expect(result.data.stats).toContainEqual({ label: 'Current Balance', value: 600, color: 'orange' });

      // Verify aggregate calls
      expect(prisma.invoice.aggregate).toHaveBeenCalledTimes(2);
      expect(prisma.invoice.aggregate).toHaveBeenCalledWith(expect.objectContaining({
        where: { customerId: "cust_123", organizationId: "org_1" }
      }));

      // Verify findFirst limits
      expect(prisma.customer.findFirst).toHaveBeenCalledWith(expect.objectContaining({
        include: expect.objectContaining({
            invoices: expect.objectContaining({ take: 10 }),
            crmRecord: expect.objectContaining({
                include: expect.objectContaining({
                    notes: expect.objectContaining({ take: 10 }),
                    activities: expect.objectContaining({ take: 10 }),
                })
            })
        })
      }));
    });

    it("should handle null aggregates", async () => {
        vi.mocked(prisma.customer.findFirst).mockResolvedValue({ id: '1', name: 'N' } as any);
        vi.mocked(prisma.invoice.aggregate).mockResolvedValue({ _sum: { grandTotal: null } } as any);

        const result = await CustomerService.getCustomerById("org_1", "1");
        expect(result.data.balance).toBe(0);
    });
  });
});
