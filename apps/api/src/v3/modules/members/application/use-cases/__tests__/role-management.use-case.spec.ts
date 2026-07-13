import { Test, TestingModule } from "@nestjs/testing";
import { RoleManagementUseCase } from "../role-management.use-case";
import { PrismaService } from "@/prisma/prisma.service";
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("RoleManagementUseCase", () => {
  let useCase: RoleManagementUseCase;
  let prisma: PrismaService;

  const mockPrisma = {
    client: {
      roleGroup: {
        findMany: vi.fn(),
      },
      customRole: {
        count: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      permissionSet: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
      member: {
        update: vi.fn(),
      },
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
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });

  describe("getRoleGroups", () => {
    it("should return role groups with optimized selection", async () => {
      const organizationId = "org1";
      const mockRoleGroups = [
        {
          id: "rg1",
          name: "Manager Group",
          description: "Group for managers",
          organizationId,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { permissionSets: 2 },
        },
      ];

      mockPrisma.client.roleGroup.findMany.mockResolvedValue(mockRoleGroups);

      const result = await useCase.getRoleGroups(organizationId);

      expect(result).toEqual(mockRoleGroups);
      expect(mockPrisma.client.roleGroup.findMany).toHaveBeenCalledWith({
        where: { organizationId },
        select: {
          id: true,
          name: true,
          description: true,
          organizationId: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { permissionSets: true },
          },
        },
        orderBy: { name: "asc" },
      });
    });
  });
});
