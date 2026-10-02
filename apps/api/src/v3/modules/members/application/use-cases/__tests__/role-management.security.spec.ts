import { Test, TestingModule } from "@nestjs/testing";
import { RoleManagementUseCase } from "../role-management.use-case";
import { PrismaService } from "@/prisma/prisma.service";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NotFoundException, BadRequestException } from "@nestjs/common";

describe("RoleManagementUseCase Security", () => {
  let useCase: RoleManagementUseCase;
  let prisma: PrismaService;

  const mockPrisma = {
    client: {
      customRole: {
        findFirst: vi.fn(),
        findFirstOrThrow: vi.fn(),
        updateMany: vi.fn(),
        deleteMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        create: vi.fn(),
      },
      permissionSet: {
        count: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
      member: {
        update: vi.fn(),
        findFirst: vi.fn(),
      }
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleManagementUseCase,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    useCase = module.get<RoleManagementUseCase>(RoleManagementUseCase);
    prisma = module.get<PrismaService>(PrismaService);
    vi.clearAllMocks();
  });

  describe("updateCustomRole", () => {
    it("should fail if role belongs to another organization (IDOR)", async () => {
      const organizationId = "org1";
      const roleId = "role-from-org2";

      // Simulate that updateMany affects 0 records in org1
      mockPrisma.client.customRole.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        useCase.updateCustomRole(organizationId, roleId, { name: "New Name" }, "actor1")
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.client.customRole.updateMany).toHaveBeenCalledWith({
        where: { id: roleId, organizationId },
        data: expect.objectContaining({ name: "New Name" }),
      });
    });

    it("should prevent mass assignment of isSystemRole", async () => {
      const organizationId = "org1";
      const roleId = "role1";
      const mockRole = { id: roleId, organizationId, name: "Role 1", isSystemRole: false };

      mockPrisma.client.customRole.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.client.customRole.findFirstOrThrow.mockResolvedValue(mockRole);

      await useCase.updateCustomRole(organizationId, roleId, { isSystemRole: true } as any, "actor1");

      const updateCall = mockPrisma.client.customRole.updateMany.mock.calls[0][0];
      expect(updateCall.data.isSystemRole).toBeUndefined();
    });
  });

  describe("deleteCustomRole", () => {
    it("should fail if role belongs to another organization (IDOR)", async () => {
      const organizationId = "org1";
      const roleId = "role-from-org2";

      mockPrisma.client.customRole.findFirst.mockResolvedValue(null);

      await expect(
        useCase.deleteCustomRole(organizationId, roleId, "actor1")
      ).rejects.toThrow(NotFoundException);
    });

    it("should use deleteMany with organizationId for tenant isolation", async () => {
      const organizationId = "org1";
      const roleId = "role1";
      const mockRole = { id: roleId, organizationId, name: "Custom Role" };

      mockPrisma.client.customRole.findFirst.mockResolvedValue(mockRole);
      mockPrisma.client.customRole.deleteMany.mockResolvedValue({ count: 1 });

      const result = await useCase.deleteCustomRole(organizationId, roleId, "actor1");

      expect(result).toEqual(mockRole);
      expect(mockPrisma.client.customRole.deleteMany).toHaveBeenCalledWith({
        where: { id: roleId, organizationId },
      });
    });
  });

  describe("createRoleGroup", () => {
    it("should fail if some permission sets belong to another organization", async () => {
      const organizationId = "org1";
      const permissionSetIds = ["ps1", "ps-from-org2"];

      // Only 1 of 2 permission sets found in org1
      mockPrisma.client.permissionSet.count.mockResolvedValue(1);

      await expect(
        useCase.createRoleGroup(organizationId, { name: "Group 1", permissionSetIds }, "actor1")
      ).rejects.toThrow(BadRequestException);
    });
  });
});
