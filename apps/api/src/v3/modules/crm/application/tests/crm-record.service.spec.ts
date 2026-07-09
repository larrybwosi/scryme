import { vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { CrmRecordService } from "../use-cases/crm-record.service";
import { PrismaService } from "@/prisma/prisma.service";
import { describe, it, expect, beforeEach } from "vitest";
import { NotFoundException } from "@nestjs/common";

describe("CrmRecordService Security", () => {
  let service: CrmRecordService;

  const mockPrisma = {
    crmRecord: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    crmObjectDefinition: { findFirst: vi.fn() },
    member: { findFirst: vi.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrmRecordService,
        { provide: PrismaService, useValue: { client: mockPrisma } },
      ],
    }).compile();

    service = module.get<CrmRecordService>(CrmRecordService);
    vi.clearAllMocks();
  });

  describe("createRecord", () => {
    it("should throw NotFoundException if object definition belongs to another org", async () => {
      (mockPrisma.crmObjectDefinition.findFirst as any).mockResolvedValue(null);

      await expect(
        service.createRecord("org1", "obj1", {
          objectId: "obj1",
          data: {},
        }),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.crmObjectDefinition.findFirst).toHaveBeenCalledWith({
        where: { id: "obj1", organizationId: "org1" },
      });
    });

    it("should throw NotFoundException if owner belongs to another org", async () => {
      (mockPrisma.crmObjectDefinition.findFirst as any).mockResolvedValue({ id: "obj1" });
      (mockPrisma.member.findFirst as any).mockResolvedValue(null);

      await expect(
        service.createRecord("org1", "obj1", {
          objectId: "obj1",
          data: {},
          ownerId: "mem2",
        }),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.member.findFirst).toHaveBeenCalledWith({
        where: { id: "mem2", organizationId: "org1" },
      });
    });

    it("should create record if all validations pass", async () => {
      (mockPrisma.crmObjectDefinition.findFirst as any).mockResolvedValue({ id: "obj1" });
      (mockPrisma.member.findFirst as any).mockResolvedValue({ id: "mem1" });
      (mockPrisma.crmRecord.create as any).mockResolvedValue({ id: "rec1", data: {} });

      const result = await service.createRecord("org1", "obj1", {
        objectId: "obj1",
        data: { name: "Test" },
        ownerId: "mem1",
      });

      expect(result).toBeDefined();
      expect(mockPrisma.crmRecord.create).toHaveBeenCalled();
    });
  });

  describe("updateRecord", () => {
    it("should throw NotFoundException if owner to update belongs to another org", async () => {
      (mockPrisma.crmRecord.findFirst as any).mockResolvedValue({ id: "rec1", organizationId: "org1" });
      (mockPrisma.member.findFirst as any).mockResolvedValue(null);

      await expect(
        service.updateRecord("org1", "rec1", {
          ownerId: "mem_other",
        }),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.member.findFirst).toHaveBeenCalledWith({
        where: { id: "mem_other", organizationId: "org1" },
      });
    });
  });
});
