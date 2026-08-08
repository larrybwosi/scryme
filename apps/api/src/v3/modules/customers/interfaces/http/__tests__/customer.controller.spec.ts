import { CustomerController } from "../customer.controller";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UnauthorizedException } from "@nestjs/common";

describe("CustomerController Sessions", () => {
  let controller: CustomerController;
  let mockRedisService: any;
  let mockPrismaService: any;

  beforeEach(() => {
    mockRedisService = {
      keys: vi.fn(),
      get: vi.fn(),
      del: vi.fn(),
    };
    mockPrismaService = {};

    controller = new CustomerController(
      {} as any, // getCustomersUseCase
      {} as any, // registerCustomerUseCase
      {} as any, // updateCustomerUseCase
      {} as any, // getCustomerByIdUseCase
      {} as any, // deleteCustomerUseCase
      {} as any, // manageAddressesUseCase
      mockPrismaService as any,
      mockRedisService as any,
    );
  });

  describe("getSessions", () => {
    it("should throw UnauthorizedException if customer context is missing", async () => {
      const req = {};
      await expect(controller.getSessions(req)).rejects.toThrow(
        new UnauthorizedException("Customer context required"),
      );
    });

    it("should fetch sessions in parallel and return list of parsed sessions", async () => {
      const req = {
        v3Context: { customerId: "cust_123" },
      };

      const mockKeys = [
        "customer_session:cust_123:sess_1",
        "customer_session:cust_123:sess_2",
      ];
      mockRedisService.keys.mockResolvedValue(mockKeys);

      const mockSession1 = { id: "sess_1", customerId: "cust_123", email: "test@example.com" };
      const mockSession2 = { id: "sess_2", customerId: "cust_123", email: "test@example.com" };

      mockRedisService.get.mockImplementation(async (key: string) => {
        if (key === "customer_session:cust_123:sess_1") {
          return JSON.stringify(mockSession1);
        }
        if (key === "customer_session:cust_123:sess_2") {
          return JSON.stringify(mockSession2);
        }
        return null;
      });

      const result = await controller.getSessions(req);

      expect(mockRedisService.keys).toHaveBeenCalledWith("customer_session:cust_123:*");
      expect(mockRedisService.get).toHaveBeenCalledTimes(2);
      expect(result).toEqual([mockSession1, mockSession2]);
    });
  });

  describe("revokeAllSessions", () => {
    it("should delete all keys in batch if mode is not other", async () => {
      const req = {
        v3Context: { customerId: "cust_123" },
      };

      const mockKeys = [
        "customer_session:cust_123:sess_1",
        "customer_session:cust_123:sess_2",
      ];
      mockRedisService.keys.mockResolvedValue(mockKeys);

      const result = await controller.revokeAllSessions(req);

      expect(mockRedisService.keys).toHaveBeenCalledWith("customer_session:cust_123:*");
      expect(mockRedisService.del).toHaveBeenCalledWith(
        "customer_session:cust_123:sess_1",
        "customer_session:cust_123:sess_2",
      );
      expect(result).toEqual({
        success: true,
        message: "All sessions successfully revoked",
      });
    });

    it("should filter out current session in mode other", async () => {
      const req = {
        v3Context: { customerId: "cust_123", sessionId: "sess_1" },
      };

      const mockKeys = [
        "customer_session:cust_123:sess_1",
        "customer_session:cust_123:sess_2",
      ];
      mockRedisService.keys.mockResolvedValue(mockKeys);

      const result = await controller.revokeAllSessions(req, "other");

      expect(mockRedisService.keys).toHaveBeenCalledWith("customer_session:cust_123:*");
      expect(mockRedisService.del).toHaveBeenCalledWith(
        "customer_session:cust_123:sess_2",
      );
      expect(result).toEqual({
        success: true,
        message: "Other sessions successfully revoked",
      });
    });
  });
});
