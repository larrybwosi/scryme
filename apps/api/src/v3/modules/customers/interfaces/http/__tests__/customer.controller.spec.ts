import { describe, it, expect, beforeEach, vi } from "vitest";
import { CustomerController } from "../customer.controller";
import { UnauthorizedException, BadRequestException } from "@nestjs/common";

describe("CustomerController", () => {
  let controller: CustomerController;
  let mockPrisma: any;
  let mockRedis: any;
  let mockCustomerAuthService: any;

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
        externalMapping: {
          findFirst: vi.fn(),
          upsert: vi.fn().mockResolvedValue({ id: "map-1" }),
        },
      },
    };

    mockRedis = {
      setex: vi.fn().mockResolvedValue("OK"),
      get: vi.fn(),
      keys: vi.fn().mockResolvedValue([]),
      del: vi.fn().mockResolvedValue(1),
    };

    mockCustomerAuthService = {
      auth: {
        api: {
          signInEmail: vi.fn(),
          getSession: vi.fn(),
          listSessions: vi.fn(),
          revokeSession: vi.fn(),
          revokeSessions: vi.fn(),
          revokeOtherSessions: vi.fn(),
          requestPasswordReset: vi.fn(),
          resetPassword: vi.fn(),
          sendVerificationEmail: vi.fn(),
          verifyEmail: vi.fn(),
        },
      },
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
      mockCustomerAuthService,
    );
  });

  describe("login", () => {
    it("should authenticate customer successfully using CustomerAuthService (Better Auth)", async () => {
      const mockCustomer = {
        id: "cust-1",
        email: "john@example.com",
        name: "John Doe",
      };
      const mockBetterAuthResult = {
        token: "better-auth-token-123",
        session: {
          id: "session-better-1",
          token: "better-auth-token-123",
          userId: "user-better-1",
          userAgent: "Mozilla/5.0",
          ipAddress: "127.0.0.1",
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 86400000),
        },
        user: {
          id: "user-better-1",
          email: "john@example.com",
          name: "John Doe",
        },
      };

      mockPrisma.client.customer.findUnique.mockResolvedValue(mockCustomer);
      mockCustomerAuthService.auth.api.signInEmail.mockResolvedValue(mockBetterAuthResult);

      const req = {
        organization: { id: "org-123", slug: "test-org" },
        headers: { "user-agent": "Mozilla/5.0" },
        ip: "127.0.0.1",
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

      expect(mockCustomerAuthService.auth.api.signInEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {
            email: "john@example.com",
            password: "password123",
          },
        }),
      );

      expect(result.success).toBe(true);
      expect(result.token).toBe("better-auth-token-123");
      expect(result.user).toEqual(mockCustomer);
      expect(result.session.id).toBe("session-better-1");
    });

    it("should throw UnauthorizedException when customer is not found in organization", async () => {
      mockPrisma.client.customer.findUnique.mockResolvedValue(null);

      const req = {
        organization: { id: "org-123", slug: "test-org" },
        headers: {},
      };

      await expect(
        controller.login(req, {
          email: "unknown@example.com",
          password: "password123",
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException when CustomerAuthService fails validation", async () => {
      const mockCustomer = {
        id: "cust-1",
        email: "john@example.com",
      };
      mockPrisma.client.customer.findUnique.mockResolvedValue(mockCustomer);
      mockCustomerAuthService.auth.api.signInEmail.mockRejectedValue(
        new Error("Invalid email or password"),
      );

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

  describe("session management", () => {
    it("should retrieve sessions via CustomerAuthService", async () => {
      const mockSessions = [
        { id: "s1", userId: "u1" },
        { id: "s2", userId: "u1" },
      ];
      mockCustomerAuthService.auth.api.listSessions.mockResolvedValue(mockSessions);

      const req = {
        headers: { authorization: "Bearer token-xyz" },
      };

      const result = await controller.getSessions(req);
      expect(result).toEqual(mockSessions);
    });

    it("should revoke specific session via CustomerAuthService", async () => {
      mockCustomerAuthService.auth.api.revokeSession.mockResolvedValue({ success: true });

      const req = {
        headers: { authorization: "Bearer token-xyz" },
      };

      const result = await controller.revokeSession(req, "s1");
      expect(result.success).toBe(true);
      expect(mockCustomerAuthService.auth.api.revokeSession).toHaveBeenCalled();
    });

    it("should revoke all sessions via CustomerAuthService", async () => {
      mockCustomerAuthService.auth.api.revokeSessions.mockResolvedValue({ success: true });

      const req = {
        headers: { authorization: "Bearer token-xyz" },
      };

      const result = await controller.revokeAllSessions(req);
      expect(result.success).toBe(true);
      expect(mockCustomerAuthService.auth.api.revokeSessions).toHaveBeenCalled();
    });
  });

  describe("password reset & verification", () => {
    it("should dispatch password reset instructions via CustomerAuthService", async () => {
      mockCustomerAuthService.auth.api.requestPasswordReset.mockResolvedValue({});

      const req = {};
      const result = await controller.forgotPassword(req, {
        email: "john@example.com",
      });

      expect(result.success).toBe(true);
      expect(mockCustomerAuthService.auth.api.requestPasswordReset).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {
            email: "john@example.com",
            redirectTo: undefined,
          },
        }),
      );
    });

    it("should reset password via CustomerAuthService", async () => {
      mockCustomerAuthService.auth.api.resetPassword.mockResolvedValue({});

      const req = {};
      const result = await controller.resetPassword(req, {
        token: "reset-token-xyz",
        newPassword: "newSecurePassword123",
      });

      expect(result.success).toBe(true);
      expect(mockCustomerAuthService.auth.api.resetPassword).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {
            token: "reset-token-xyz",
            newPassword: "newSecurePassword123",
          },
        }),
      );
    });

    it("should verify email via CustomerAuthService", async () => {
      mockCustomerAuthService.auth.api.verifyEmail.mockResolvedValue({});

      const req = {};
      const result = await controller.verifyEmail(req, {
        token: "verify-token-xyz",
      });

      expect(result.success).toBe(true);
      expect(mockCustomerAuthService.auth.api.verifyEmail).toHaveBeenCalled();
    });
  });
});
