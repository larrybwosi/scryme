import { Test, TestingModule } from "@nestjs/testing";
import { DepartmentUseCase } from "../department.use-case";
import { PrismaService } from "@/prisma/prisma.service";
import { ScrymeService } from "@/v2/scryme/scryme.service";
import { BadRequestException, NotFoundException } from "@nestjs/common";

describe("DepartmentUseCase", () => {
  let useCase: DepartmentUseCase;
  let prismaMock: any;
  let scrymeServiceMock: any;

  const mockOrgId = "org_123";
  const mockActorId = "actor_123";

  beforeEach(async () => {
    prismaMock = {
      client: {
        department: {
          count: vi.fn(),
          findMany: vi.fn(),
          findFirst: vi.fn(),
          findUnique: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(),
        },
        member: {
          findFirst: vi.fn(),
          findUnique: vi.fn(),
        },
        inventoryLocation: {
          findFirst: vi.fn(),
        },
        costCenter: {
          findFirst: vi.fn(),
        },
        scrymeConfiguration: {
          findUnique: vi.fn(),
        },
        planeConfiguration: {
          findUnique: vi.fn(),
        },
        auditLog: {
          create: vi.fn(),
        },
      },
    };

    scrymeServiceMock = {
      provisionChannelForEntity: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentUseCase,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ScrymeService, useValue: scrymeServiceMock },
      ],
    }).compile();

    useCase = module.get<DepartmentUseCase>(DepartmentUseCase);
  });

  describe("createDepartment", () => {
    it("should create department successfully after parallel IDOR validation when all linked entities exist", async () => {
      const dto = {
        name: "Engineering",
        description: "Dev team",
        parentId: "dept_parent",
        headId: "member_head",
        locationId: "loc_1",
        costCenterId: "cc_1",
      };

      prismaMock.client.department.findFirst.mockResolvedValueOnce({ id: dto.parentId, organizationId: mockOrgId });
      prismaMock.client.member.findFirst.mockResolvedValueOnce({ id: dto.headId, organizationId: mockOrgId });
      prismaMock.client.inventoryLocation.findFirst.mockResolvedValueOnce({ id: dto.locationId, organizationId: mockOrgId });
      prismaMock.client.costCenter.findFirst.mockResolvedValueOnce({ id: dto.costCenterId, organizationId: mockOrgId });

      const mockCreatedDept = { id: "dept_new", name: dto.name, organizationId: mockOrgId };
      prismaMock.client.department.create.mockResolvedValueOnce(mockCreatedDept);

      const result = await useCase.createDepartment(mockOrgId, dto, mockActorId);

      expect(prismaMock.client.department.findFirst).toHaveBeenCalledWith({
        where: { id: dto.parentId, organizationId: mockOrgId },
      });
      expect(prismaMock.client.member.findFirst).toHaveBeenCalledWith({
        where: { id: dto.headId, organizationId: mockOrgId },
      });
      expect(prismaMock.client.inventoryLocation.findFirst).toHaveBeenCalledWith({
        where: { id: dto.locationId, organizationId: mockOrgId },
      });
      expect(prismaMock.client.costCenter.findFirst).toHaveBeenCalledWith({
        where: { id: dto.costCenterId, organizationId: mockOrgId },
      });

      expect(result).toEqual(mockCreatedDept);
    });

    it("should throw BadRequestException if linked parent department does not exist or belongs to another org", async () => {
      const dto = {
        name: "Engineering",
        parentId: "dept_invalid",
      };

      prismaMock.client.department.findFirst.mockResolvedValueOnce(null);

      await expect(useCase.createDepartment(mockOrgId, dto, mockActorId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("updateDepartment", () => {
    it("should update department successfully after parallel IDOR validation", async () => {
      const deptId = "dept_123";
      const dto = {
        name: "Engineering Updated",
        headId: "member_head_2",
      };

      prismaMock.client.department.findFirst.mockResolvedValueOnce({ id: deptId, organizationId: mockOrgId });
      prismaMock.client.member.findFirst.mockResolvedValueOnce({ id: dto.headId, organizationId: mockOrgId });

      const mockUpdatedDept = { id: deptId, name: dto.name, organizationId: mockOrgId };
      prismaMock.client.department.update.mockResolvedValueOnce(mockUpdatedDept);

      const result = await useCase.updateDepartment(mockOrgId, deptId, dto, mockActorId);

      expect(result).toEqual(mockUpdatedDept);
    });

    it("should throw NotFoundException if target department to update is missing", async () => {
      prismaMock.client.department.findFirst.mockResolvedValueOnce(null);

      await expect(
        useCase.updateDepartment(mockOrgId, "nonexistent", { name: "Test" }, mockActorId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
