import { Test, TestingModule } from "@nestjs/testing";
import { CustomerController } from "../customer.controller";
import { GetCustomersUseCase } from "../../../application/use-cases/get-customers.use-case";
import { RegisterCustomerUseCase } from "../../../application/use-cases/register-customer.use-case";
import { UpdateCustomerUseCase } from "../../../application/use-cases/update-customer.use-case";
import { GetCustomerByIdUseCase } from "../../../application/use-cases/get-customer-by-id.use-case";
import { DeleteCustomerUseCase } from "../../../application/use-cases/delete-customer.use-case";
import { ManageAddressesUseCase } from "../../../application/use-cases/manage-addresses.use-case";
import { PrismaService } from "@/prisma/prisma.service";
import { RedisService } from "@/redis/redis.service";
import { UnauthorizedException } from "@nestjs/common";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as bcrypt from "bcryptjs";

vi.mock("bcryptjs", async () => {
  const original = await vi.importActual<typeof import("bcryptjs")>("bcryptjs");
  return {
    ...original,
    compare: vi.fn(),
  };
});

describe("CustomerController", () => {
  let controller: CustomerController;
  let prisma: PrismaService;
  let redis: RedisService;

  beforeEach(() => {
    prisma = {
      client: {
        customer: {
          findUnique: vi.fn(),
        },
        user: {
          findUnique: vi.fn(),
        },
      },
    } as any;

    redis = {
      setex: vi.fn().mockResolvedValue("OK"),
    } as any;

    controller = new CustomerController(
      {} as any, // getCustomersUseCase
      {} as any, // registerCustomerUseCase
      {} as any, // updateCustomerUseCase
      {} as any, // getCustomerByIdUseCase
      {} as any, // deleteCustomerUseCase
      {} as any, // manageAddressesUseCase
      prisma,
      redis,
    );

    vi.clearAllMocks();
  });

  describe("login - constant-time credential checking", () => {
    it("should successfully log in if both customer and user exist with correct password", async () => {
      const req = {
        organization: { id: "org-1", slug: "org-slug" },
        headers: { "user-agent": "test-agent" },
        ip: "127.0.0.1",
      };
      const dto = { email: "test@example.com", password: "password123" };

      vi.mocked(prisma.client.customer.findUnique).mockResolvedValue({
        id: "cust-1",
        email: "test@example.com",
        name: "Test Customer",
      } as any);

      vi.mocked(prisma.client.user.findUnique).mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        password: "hashed_password",
      } as any);

      vi.mocked(bcrypt.compare).mockResolvedValue(true as any);

      const result = await controller.login(req, dto);

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(bcrypt.compare).toHaveBeenCalledWith("password123", "hashed_password");
      expect(redis.setex).toHaveBeenCalled();
    });

    it("should fail and throw UnauthorizedException if customer is not found, but still run bcrypt.compare with dummy hash", async () => {
      const req = {
        organization: { id: "org-1", slug: "org-slug" },
        headers: {},
        ip: "127.0.0.1",
      };
      const dto = { email: "nonexistent@example.com", password: "password123" };

      vi.mocked(prisma.client.customer.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.client.user.findUnique).mockResolvedValue(null);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as any);

      await expect(controller.login(req, dto)).rejects.toThrow(UnauthorizedException);

      // Verify that bcrypt.compare was called with the dummy hash to mitigate timing attacks
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password123",
        "$2b$10$vI8tYnK6YKMH3O84S4eXQuKBLN3F3k4pXFmF0a.a2H88tM8vO6PzO"
      );
    });

    it("should fail and throw UnauthorizedException if user is not found, but still run bcrypt.compare with dummy hash", async () => {
      const req = {
        organization: { id: "org-1", slug: "org-slug" },
        headers: {},
        ip: "127.0.0.1",
      };
      const dto = { email: "test@example.com", password: "password123" };

      vi.mocked(prisma.client.customer.findUnique).mockResolvedValue({
        id: "cust-1",
        email: "test@example.com",
        name: "Test Customer",
      } as any);
      vi.mocked(prisma.client.user.findUnique).mockResolvedValue(null);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as any);

      await expect(controller.login(req, dto)).rejects.toThrow(UnauthorizedException);

      // Verify that bcrypt.compare was called with the dummy hash to mitigate timing attacks
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password123",
        "$2b$10$vI8tYnK6YKMH3O84S4eXQuKBLN3F3k4pXFmF0a.a2H88tM8vO6PzO"
      );
    });

    it("should fail and throw UnauthorizedException if password does not match", async () => {
      const req = {
        organization: { id: "org-1", slug: "org-slug" },
        headers: {},
        ip: "127.0.0.1",
      };
      const dto = { email: "test@example.com", password: "wrong_password" };

      vi.mocked(prisma.client.customer.findUnique).mockResolvedValue({
        id: "cust-1",
        email: "test@example.com",
        name: "Test Customer",
      } as any);

      vi.mocked(prisma.client.user.findUnique).mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        password: "hashed_password",
      } as any);

      vi.mocked(bcrypt.compare).mockResolvedValue(false as any);

      await expect(controller.login(req, dto)).rejects.toThrow(UnauthorizedException);

      expect(bcrypt.compare).toHaveBeenCalledWith("wrong_password", "hashed_password");
    });
  });
});
