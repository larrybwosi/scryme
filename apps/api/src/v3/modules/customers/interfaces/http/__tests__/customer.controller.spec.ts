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
          findFirst: vi.fn(),
        },
        user: {
          findUnique: vi.fn(),
        },
      },
    } as any;

    redis = {
      setex: vi.fn().mockResolvedValue("OK"),
      get: vi.fn(),
      keys: vi.fn(),
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
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password123",
        "hashed_password",
      );
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

      await expect(controller.login(req, dto)).rejects.toThrow(
        UnauthorizedException,
      );

      // Verify that bcrypt.compare was called with the dummy hash to mitigate timing attacks
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password123",
        "$2b$10$vI8tYnK6YKMH3O84S4eXQuKBLN3F3k4pXFmF0a.a2H88tM8vO6PzO",
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

      await expect(controller.login(req, dto)).rejects.toThrow(
        UnauthorizedException,
      );

      // Verify that bcrypt.compare was called with the dummy hash to mitigate timing attacks
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password123",
        "$2b$10$vI8tYnK6YKMH3O84S4eXQuKBLN3F3k4pXFmF0a.a2H88tM8vO6PzO",
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

      await expect(controller.login(req, dto)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "wrong_password",
        "hashed_password",
      );
    });
  });

  describe("CUSTOMER_AUTH_STRATEGY restriction", () => {
    it("should allow everything normally under HYBRID strategy", async () => {
      vi.stubEnv("CUSTOMER_AUTH_STRATEGY", "HYBRID");
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
      vi.unstubAllEnvs();
    });

    it("should block local login under ZITADEL strategy", async () => {
      vi.stubEnv("CUSTOMER_AUTH_STRATEGY", "ZITADEL");
      const req = {
        organization: { id: "org-1" },
        headers: {},
      };
      const dto = { email: "test@example.com", password: "password123" };

      await expect(controller.login(req, dto)).rejects.toThrow(
        "Local login is disabled under the ZITADEL auth strategy"
      );
      vi.unstubAllEnvs();
    });

    it("should block registration with password under ZITADEL strategy", async () => {
      vi.stubEnv("CUSTOMER_AUTH_STRATEGY", "ZITADEL");
      const req = {
        organization: { id: "org-1" },
        headers: {},
      };
      const dto = { email: "test@example.com", password: "password123", name: "Test" };

      await expect(controller.register(req, dto)).rejects.toThrow(
        "Local registration (with password) is disabled under the ZITADEL auth strategy"
      );
      vi.unstubAllEnvs();
    });

    it("should block provisionZitadel under LOCAL strategy", async () => {
      vi.stubEnv("CUSTOMER_AUTH_STRATEGY", "LOCAL");
      const req = {
        organization: { id: "org-1" },
        headers: {},
      };
      const dto = { redirectUris: [], postLogoutRedirectUris: [] };

      await expect(controller.provisionZitadel(req, dto)).rejects.toThrow(
        "Zitadel provisioning is disabled under the LOCAL auth strategy"
      );
      vi.unstubAllEnvs();
    });
  });

  describe("getCurrentSession", () => {
    it("should return the customer profile and matched session details without the raw token", async () => {
      const req = {
        organization: { id: "org-1" },
        v3Context: {
          customerId: "cust-1",
          sessionId: "sess-1",
        },
      };

      const mockCustomer = {
        id: "cust-1",
        name: "Test Customer",
        email: "test@example.com",
        phone: null,
        company: null,
        customerType: null,
        dateOfBirth: null,
        loyaltyPoints: 100,
        taxId: null,
        isActive: true,
      };

      vi.mocked(prisma.client.customer.findFirst).mockResolvedValue(
        mockCustomer as any,
      );

      const mockSessionStr = JSON.stringify({
        id: "sess-1",
        customerId: "cust-1",
        email: "test@example.com",
        name: "Test Customer",
        token: "sensitive_jwt_token_to_be_omitted",
        userAgent: "test-agent",
        ipAddress: "127.0.0.1",
      });

      vi.mocked(redis.get).mockResolvedValue(mockSessionStr);

      const result = await controller.getCurrentSession(req);

      expect(result.customer).toEqual(mockCustomer);
      expect(result.session).toEqual({
        id: "sess-1",
        customerId: "cust-1",
        email: "test@example.com",
        name: "Test Customer",
        userAgent: "test-agent",
        ipAddress: "127.0.0.1",
      });
      // Raw auth token must be omitted for safety
      expect((result.session as any).token).toBeUndefined();
    });

    it("should throw UnauthorizedException if customerId is missing", async () => {
      const req = {
        organization: { id: "org-1" },
        v3Context: {},
      };

      await expect(controller.getCurrentSession(req)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException if customer is not found in database", async () => {
      const req = {
        organization: { id: "org-1" },
        v3Context: {
          customerId: "cust-1",
        },
      };

      vi.mocked(prisma.client.customer.findFirst).mockResolvedValue(null);

      await expect(controller.getCurrentSession(req)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("getSessions", () => {
    it("should return the list of active customer sessions with raw JWT tokens omitted", async () => {
      const req = {
        organization: { id: "org-1" },
        v3Context: {
          customerId: "cust-1",
        },
      };

      vi.mocked(redis.keys).mockResolvedValue([
        "customer_session:cust-1:sess-1",
        "customer_session:cust-1:sess-2",
      ]);

      const mockSession1 = JSON.stringify({
        id: "sess-1",
        customerId: "cust-1",
        email: "test@example.com",
        name: "Test Customer",
        token: "token-1",
        userAgent: "test-agent-1",
        ipAddress: "127.0.0.1",
      });

      const mockSession2 = JSON.stringify({
        id: "sess-2",
        customerId: "cust-1",
        email: "test@example.com",
        name: "Test Customer",
        token: "token-2",
        userAgent: "test-agent-2",
        ipAddress: "127.0.0.2",
      });

      vi.mocked(redis.get)
        .mockResolvedValueOnce(mockSession1)
        .mockResolvedValueOnce(mockSession2);

      const result = await controller.getSessions(req);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: "sess-1",
        customerId: "cust-1",
        email: "test@example.com",
        name: "Test Customer",
        userAgent: "test-agent-1",
        ipAddress: "127.0.0.1",
      });
      expect(result[0].token).toBeUndefined();

      expect(result[1]).toEqual({
        id: "sess-2",
        customerId: "cust-1",
        email: "test@example.com",
        name: "Test Customer",
        userAgent: "test-agent-2",
        ipAddress: "127.0.0.2",
      });
      expect(result[1].token).toBeUndefined();
    });

    it("should throw UnauthorizedException if customerId is missing", async () => {
      const req = {
        organization: { id: "org-1" },
        v3Context: {},
      };

      await expect(controller.getSessions(req)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
