import { describe, it, expect, beforeEach, vi } from "vitest";
import { AndroidCustomerUseCase } from "../android-customer.use-case";
import { NotFoundException } from "@nestjs/common";

describe("AndroidCustomerUseCase", () => {
  let useCase: AndroidCustomerUseCase;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      client: {
        customer: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
          findFirstOrThrow: vi.fn(),
          updateMany: vi.fn(),
        },
        transaction: {
          findMany: vi.fn(),
        },
      },
    };

    useCase = new AndroidCustomerUseCase(mockPrisma as any);
  });

  const mockContext = { organizationId: "org-1" };

  it("should get customers list with search and mapping", async () => {
    mockPrisma.client.customer.findMany.mockResolvedValue([
      {
        id: "cust-1",
        name: "Jane Doe",
        email: "jane@example.com",
        phone: "+254700000000",
        company: "Acme Corp",
        customerType: "INDIVIDUAL",
        loyaltyPoints: 120,
        isActive: true,
        createdAt: new Date("2026-11-01T10:00:00Z"),
        updatedAt: new Date("2026-11-01T10:00:00Z"),
      },
    ]);

    const result = await useCase.getCustomers(mockContext, "Jane", 10, 0);
    expect(result.customers).toHaveLength(1);
    expect(result.customers[0]).toEqual({
      id: "cust-1",
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "+254700000000",
      company: "Acme Corp",
      customerType: "INDIVIDUAL",
      loyaltyPoints: 120,
      isActive: true,
      createdAt: "2026-11-01T10:00:00.000Z",
      updatedAt: "2026-11-01T10:00:00.000Z",
    });
  });

  it("should throw NotFoundException if customer does not exist on getCustomerDetails", async () => {
    mockPrisma.client.customer.findFirst.mockResolvedValue(null);

    await expect(useCase.getCustomerDetails(mockContext, "invalid-cust")).rejects.toThrow(
      NotFoundException
    );
  });

  it("should return customer details when found", async () => {
    mockPrisma.client.customer.findFirst.mockResolvedValue({
      id: "cust-1",
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "+254700000000",
      company: "Acme Corp",
      customerType: "INDIVIDUAL",
      loyaltyPoints: 150,
      isActive: true,
      createdAt: new Date("2026-11-01T10:00:00Z"),
      updatedAt: new Date("2026-11-01T10:00:00Z"),
    });

    const result = await useCase.getCustomerDetails(mockContext, "cust-1");
    expect(result.id).toBe("cust-1");
    expect(result.name).toBe("Jane Doe");
    expect(result.loyaltyPoints).toBe(150);
  });

  it("should return customer transactions", async () => {
    mockPrisma.client.customer.findFirst.mockResolvedValue({ id: "cust-1", organizationId: "org-1" });
    mockPrisma.client.transaction.findMany.mockResolvedValue([
      {
        id: "tx-12345678",
        finalTotal: "75.00",
        currencyCode: "KES",
        cancelledAt: null,
        completedAt: new Date("2026-11-02T10:00:00Z"),
        createdAt: new Date("2026-11-02T10:00:00Z"),
        member: { user: { name: "Cashier Bob" } },
      },
    ]);

    const result = await useCase.getCustomerTransactions(mockContext, "cust-1", 10);
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].id).toBe("tx-12345678");
    expect(result.transactions[0].transactionNumber).toBe("12345678");
    expect(result.transactions[0].totalAmount).toBe(75.00);
    expect(result.transactions[0].status).toBe("COMPLETED");
  });

  it("should update customer details", async () => {
    mockPrisma.client.customer.findFirst.mockResolvedValue({ id: "cust-1", organizationId: "org-1" });
    mockPrisma.client.customer.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.client.customer.findFirstOrThrow.mockResolvedValue({
      id: "cust-1",
      name: "Jane Smith",
      email: "janesmith@example.com",
      phone: "+254711111111",
      company: "Tech Solutions",
      customerType: "INDIVIDUAL",
      loyaltyPoints: 150,
      isActive: true,
      createdAt: new Date("2026-11-01T10:00:00Z"),
      updatedAt: new Date("2026-11-05T10:00:00Z"),
    });

    const result = await useCase.updateCustomer(mockContext, "cust-1", {
      name: "Jane Smith",
      email: "janesmith@example.com",
      phone: "+254711111111",
      company: "Tech Solutions",
    });

    expect(result.name).toBe("Jane Smith");
    expect(result.email).toBe("janesmith@example.com");
    expect(result.company).toBe("Tech Solutions");
  });
});
