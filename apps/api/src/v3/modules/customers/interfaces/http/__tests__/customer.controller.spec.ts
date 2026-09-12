import { describe, it, expect, beforeEach, vi } from "vitest";
import { CustomerController } from "../customer.controller";
import { UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";

describe("CustomerController", () => {
  let controller: CustomerController;
  let mockPrisma: any;
  let mockRedis: any;

  beforeEach(() => {
    mockPrisma = {
      client: {
        customer: {
          findUnique: vi.fn(),
          findFirst: vi.fn(),
        },
        user: {
          findUnique: vi.fn(),
        },
      },
    };

    mockRedis = {
      setex: vi.fn().mockResolvedValue("OK"),
      get: vi.fn(),
      keys: vi.fn().mockResolvedValue([]),
      del: vi.fn().mockResolvedValue(1),
    };

    controller = new CustomerController(
      {} as any, // getCustomersUseCase
      {} as any, // registerCustomerUseCase
      {} as any, // updateCustomerUseCase
      {} as any, // getCustomerByIdUseCase
      {} as any, // deleteCustomerUseCase
      {} as any, // manageAddressesUseCase
      mockPrisma,
      mockRedis,
    );
  });

  describe("login", () => {
    it("should authenticate customer successfully when credentials match", async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);
      const mockCustomer = {
        id: "cust-1",
        email: "john@example.com",
        name: "John Doe",
      };
      const mockUser = {
        id: "user-999",
        email: "john@example.com",
        password: hashedPassword,
      };

      mockPrisma.client.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrisma.client.user.findUnique.mockResolvedValue(mockUser);

      const req = {
        organization: { id: "org-123", slug: "test-org" },
        headers: {},
      };

      const result = await controller.login(req, {
        email: "john@example.com",
        password: "password123",
      });

      expect(mockPrisma.client.customer.findUnique).toHaveBeenCalledWith({
        where: {
          organizationId_email: {
            organizationId: "org-123",
            email: "john@example.com",
          },
        },
      });

      expect(mockPrisma.client.user.findUnique).toHaveBeenCalledWith({
        where: { email: "john@example.com" },
      });

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockCustomer);
      expect(mockRedis.setex).toHaveBeenCalled();
    });

    it("should throw UnauthorizedException on invalid password", async () => {
      const hashedPassword = await bcrypt.hash("correct-password", 10);
      const mockCustomer = {
        id: "cust-1",
        email: "john@example.com",
        name: "John Doe",
        userId: "user-999",
      };
      const mockUser = {
        id: "user-999",
        email: "john@example.com",
        password: hashedPassword,
      };

      mockPrisma.client.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrisma.client.user.findUnique.mockResolvedValue(mockUser);

      const req = {
        organization: { id: "org-123", slug: "test-org" },
        headers: {},
      };

      await expect(
        controller.login(req, {
          email: "john@example.com",
          password: "wrong-password",
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
