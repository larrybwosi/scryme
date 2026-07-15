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

      // Simulate that the role is not found in org1
      mockPrisma.client.customRole.findFirst.mockResolvedValue(null);

      await expect(
        useCase.updateCustomRole(organizationId, roleId, { name: "New Name" }, "actor1")
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.client.customRole.findFirst).toHaveBeenCalledWith({
        where: { id: roleId, organizationId }
      });
    });

    it("should prevent mass assignment of isSystemRole", async () => {
      const organizationId = "org1";
      const roleId = "role1";
      const mockRole = { id: roleId, organizationId, name: "Role 1", isSystemRole: false };

      mockPrisma.client.customRole.findFirst.mockResolvedValue(mockRole);
      mockPrisma.client.customRole.update.mockResolvedValue({ ...mockRole, isSystemRole: true });

      await useCase.updateCustomRole(organizationId, roleId, { isSystemRole: true } as any, "actor1");

      const updateCall = mockPrisma.client.customRole.update.mock.calls[0][0];
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
