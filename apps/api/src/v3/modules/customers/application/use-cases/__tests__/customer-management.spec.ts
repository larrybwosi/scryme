import { describe, it, expect, beforeEach, vi } from "vitest";
import { GetCustomerByIdUseCase } from "../get-customer-by-id.use-case";
import { DeleteCustomerUseCase } from "../delete-customer.use-case";
import { ManageAddressesUseCase } from "../manage-addresses.use-case";
import { PrismaService } from "@/prisma/prisma.service";
import { NotFoundException } from "@nestjs/common";

describe("Customer Management Use Cases", () => {
  let prisma: PrismaService;

  beforeEach(() => {
    prisma = {
      client: {
        customer: {
          findFirst: vi.fn(),
          delete: vi.fn(),
          update: vi.fn(),
        },
        address: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
        },
      },
    } as any;
  });

  describe("GetCustomerByIdUseCase", () => {
    it("should return customer if found", async () => {
      const useCase = new GetCustomerByIdUseCase(prisma);
      const mockCustomer = {
        id: "cust-1",
        name: "Alice",
        email: "alice@example.com",
        phone: "123",
        organizationId: "org-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(prisma.client.customer.findFirst).mockResolvedValue(mockCustomer as any);

      const result = await useCase.execute("org-1", "cust-1");
      expect(result.id).toBe("cust-1");
      expect(result.name).toBe("Alice");
    });

    it("should throw NotFoundException if not found", async () => {
      const useCase = new GetCustomerByIdUseCase(prisma);
      vi.mocked(prisma.client.customer.findFirst).mockResolvedValue(null);

      await expect(useCase.execute("org-1", "cust-1")).rejects.toThrow(NotFoundException);
    });
  });

  describe("DeleteCustomerUseCase", () => {
    it("should delete customer successfully if exists", async () => {
      const useCase = new DeleteCustomerUseCase(prisma);
      vi.mocked(prisma.client.customer.findFirst).mockResolvedValue({ id: "cust-1" } as any);
      vi.mocked(prisma.client.customer.delete).mockResolvedValue({} as any);

      const result = await useCase.execute("org-1", "cust-1");
      expect(result.success).toBe(true);
      expect(result.message).toContain("deleted");
      expect(prisma.client.customer.delete).toHaveBeenCalledWith({ where: { id: "cust-1" } });
    });

    it("should fall back to deactivation if delete fails", async () => {
      const useCase = new DeleteCustomerUseCase(prisma);
      vi.mocked(prisma.client.customer.findFirst).mockResolvedValue({ id: "cust-1" } as any);
      vi.mocked(prisma.client.customer.delete).mockRejectedValue(new Error("Foreign key constraint"));
      vi.mocked(prisma.client.customer.update).mockResolvedValue({} as any);

      const result = await useCase.execute("org-1", "cust-1");
      expect(result.success).toBe(true);
      expect(result.message).toContain("deactivated");
      expect(prisma.client.customer.update).toHaveBeenCalledWith({
        where: { id: "cust-1" },
        data: { isActive: false },
      });
    });
  });

  describe("ManageAddressesUseCase", () => {
    it("should return addresses for a customer", async () => {
      const useCase = new ManageAddressesUseCase(prisma);
      vi.mocked(prisma.client.customer.findFirst).mockResolvedValue({ id: "cust-1" } as any);
      vi.mocked(prisma.client.address.findMany).mockResolvedValue([{ id: "addr-1", street1: "123 St" }] as any);

      const result = await useCase.getAddresses("org-1", "cust-1");
      expect(result).toHaveLength(1);
      expect(result[0].street1).toBe("123 St");
    });

    it("should add a new address", async () => {
      const useCase = new ManageAddressesUseCase(prisma);
      vi.mocked(prisma.client.customer.findFirst).mockResolvedValue({ id: "cust-1" } as any);
      vi.mocked(prisma.client.address.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.client.address.create).mockResolvedValue({ id: "addr-2", street1: "New St" } as any);

      const result = await useCase.addAddress("org-1", "cust-1", {
        street1: "New St",
        city: "Nairobi",
        country: "Kenya",
      });

      expect(result.id).toBe("addr-2");
      expect(prisma.client.address.create).toHaveBeenCalled();
    });
  });
});
