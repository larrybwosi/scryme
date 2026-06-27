import { CustomerService } from "../customer.service";
import { db as prisma } from "@repo/db";

jest.mock("@repo/db", () => ({
  db: {
    customer: {
      findFirst: jest.fn(),
    },
    invoice: {
      aggregate: jest.fn(),
    },
  },
}));

describe("CustomerService Shared", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

      (prisma.customer.findFirst as jest.Mock).mockResolvedValue(
        mockCustomer as any,
      );
      (prisma.invoice.aggregate as jest.Mock).mockResolvedValueOnce({
        _sum: { grandTotal: 1000 },
      } as any); // total
      (prisma.invoice.aggregate as jest.Mock).mockResolvedValueOnce({
        _sum: { grandTotal: 400 },
      } as any); // paid

      const result = await CustomerService.getCustomerById("org_1", "cust_123");

      expect(result.success).toBe(true);
      expect(result.data.balance).toBe(600);
      expect(result.data.stats).toContainEqual({
        label: "Current Balance",
        value: 600,
        color: "orange",
      });

      // Verify aggregate calls
      expect(prisma.invoice.aggregate).toHaveBeenCalledTimes(2);
      expect(prisma.invoice.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { customerId: "cust_123", organizationId: "org_1" },
        }),
      );

      // Verify findFirst limits
      expect(prisma.customer.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            invoices: expect.objectContaining({ take: 10 }),
            crmRecord: expect.objectContaining({
              include: expect.objectContaining({
                notes: expect.objectContaining({ take: 10 }),
                activities: expect.objectContaining({ take: 10 }),
              }),
            }),
          }),
        }),
      );
    });

    it("should handle null aggregates", async () => {
      (prisma.customer.findFirst as jest.Mock).mockResolvedValue({
        id: "1",
        name: "N",
      } as any);
      (prisma.invoice.aggregate as jest.Mock).mockResolvedValue({
        _sum: { grandTotal: null },
      } as any);

      const result = await CustomerService.getCustomerById("org_1", "1");
      expect(result.data.balance).toBe(0);
    });
  });
});
