import { describe, it, expect, beforeEach, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";
import { StrapiConnectionUseCase } from "../strapi-connection.use-case";

describe("StrapiConnectionUseCase - Security Tests", () => {
  let useCase: StrapiConnectionUseCase;
  let mockPrisma: any;
  let mockStrapiProvider: any;

  const orgId = "org-123";

  beforeEach(() => {
    mockPrisma = {
      client: {
        inventoryLocation: {
          findFirst: vi.fn(),
        },
        ecommerceConnection: {
          findFirst: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
        },
        strapiConnectionConfig: {
          create: vi.fn(),
          update: vi.fn(),
          findUnique: vi.fn(),
        },
        $transaction: vi.fn((cb) => cb(mockPrisma.client)),
      },
    };

    mockStrapiProvider = {
      ping: vi.fn().mockResolvedValue({ strapiVersion: "4.0.0" }),
    };

    useCase = new StrapiConnectionUseCase(
      mockPrisma as any,
      mockStrapiProvider as any,
    );
  });

  describe("create", () => {
    it("should throw NotFoundException if defaultLocationId does not belong to organization", async () => {
      mockPrisma.client.inventoryLocation.findFirst.mockResolvedValue(null);

      const dto = {
        name: "Strapi Store",
        strapiUrl: "https://strapi.example.com",
        apiToken: "valid-token",
        defaultLocationId: "invalid-loc",
      };

      await expect(useCase.create(orgId, dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrisma.client.inventoryLocation.findFirst).toHaveBeenCalledWith
      ({
        where: { id: "invalid-loc", organizationId: orgId },
      });
    });

    it("should proceed if defaultLocationId belongs to organization", async () => {
      mockPrisma.client.inventoryLocation.findFirst.mockResolvedValue({
        id: "loc-123",
        organizationId: orgId,
      });
      mockPrisma.client.ecommerceConnection.findFirst
        .mockResolvedValueOnce(null) // no existing connection
        .mockResolvedValueOnce({
          id: "conn-123",
          name: "Strapi Store",
          storeUrl: "https://strapi.example.com",
          syncDirection: "BIDIRECTIONAL",
          enabledSyncTypes: [],
          autoSync: false,
          defaultLocationId: "loc-123",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          strapiConfig: {},
        }); // toResponse query

      mockPrisma.client.ecommerceConnection.create.mockResolvedValue({
        id: "conn-123",
      });

      const dto = {
        name: "Strapi Store",
        strapiUrl: "https://strapi.example.com",
        apiToken: "valid-token",
        defaultLocationId: "loc-123",
      };

      const result = await useCase.create(orgId, dto);

      expect(result.id).toBe("conn-123");
      expect(mockPrisma.client.inventoryLocation.findFirst).toHaveBeenCalledWith
      ({
        where: { id: "loc-123", organizationId: orgId },
      });
    });
  });

  describe("update", () => {
    it("should throw NotFoundException if defaultLocationId does not belong to organization", async () => {
      mockPrisma.client.ecommerceConnection.findFirst.mockResolvedValue({
        id: "conn-123",
        organizationId: orgId,
      });
      mockPrisma.client.inventoryLocation.findFirst.mockResolvedValue(null);

      const dto = {
        defaultLocationId: "invalid-loc",
      };

      await expect(
        useCase.update(orgId, "conn-123", dto),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.client.inventoryLocation.findFirst).toHaveBeenCalledWith
      ({
        where: { id: "invalid-loc", organizationId: orgId },
      });
    });

    it("should update connection if defaultLocationId belongs to organization", async () => {
      mockPrisma.client.ecommerceConnection.findFirst.mockResolvedValue({
        id: "conn-123",
        organizationId: orgId,
        strapiConfig: {},
      });
      mockPrisma.client.inventoryLocation.findFirst.mockResolvedValue({
        id: "loc-123",
        organizationId: orgId,
      });

      const dto = {
        defaultLocationId: "loc-123",
      };

      await useCase.update(orgId, "conn-123", dto);

      expect(mockPrisma.client.inventoryLocation.findFirst).toHaveBeenCalledWith
      ({
        where: { id: "loc-123", organizationId: orgId },
      });
      expect(mockPrisma.client.ecommerceConnection.update).toHaveBeenCalled();
    });
  });
});
