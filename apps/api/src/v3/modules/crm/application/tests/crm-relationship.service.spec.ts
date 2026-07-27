import { vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { CrmRelationshipService } from "../use-cases/crm-relationship.service";
import { PrismaService } from "@/prisma/prisma.service";
import { describe, it, expect, beforeEach } from "vitest";

describe("CrmRelationshipService Optimizations", () => {
  let service: CrmRelationshipService;

  const mockPrisma = {
    crmRelationshipDefinition: { findFirst: vi.fn(), create: vi.fn(), findMany: vi.fn() },
    crmRecord: { findFirst: vi.fn() },
    crmAssociation: { create: vi.fn(), findMany: vi.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrmRelationshipService,
        { provide: PrismaService, useValue: { client: mockPrisma } },
      ],
    }).compile();

    service = module.get<CrmRelationshipService>(CrmRelationshipService);
    vi.clearAllMocks();
  });

  describe("CrmRelationshipService.getAssociationsForRecord", () => {
    it("should fetch associations with targeted select", async () => {
      const mockAssociations = [
        {
          id: "assoc-1",
          relationshipId: "rel-1",
          sourceRecordId: "rec-1",
          targetRecordId: "rec-2",
          createdAt: new Date(),
          updatedAt: new Date(),
          relationship: {
            id: "rel-1",
            name: "company_employees",
          },
          sourceRecord: {
            id: "rec-1",
          },
          targetRecord: {
            id: "rec-2",
          },
        },
      ];

      mockPrisma.crmAssociation.findMany.mockResolvedValue(mockAssociations);

      const result = await service.getAssociationsForRecord("org-1", "rec-1");

      expect(mockPrisma.crmAssociation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [{ sourceRecordId: "rec-1" }, { targetRecordId: "rec-1" }],
            relationship: { organizationId: "org-1" },
          },
          select: expect.objectContaining({
            id: true,
            relationshipId: true,
            sourceRecordId: true,
            targetRecordId: true,
            relationship: {
              select: {
                id: true,
                name: true,
                type: true,
                sourceObjectId: true,
                targetObjectId: true,
                sourceLabel: true,
                targetLabel: true,
                organizationId: true,
                createdAt: true,
                updatedAt: true,
              },
            },
            sourceRecord: {
              select: {
                id: true,
                objectId: true,
                organizationId: true,
                ownerId: true,
                createdAt: true,
                updatedAt: true,
              },
            },
            targetRecord: {
              select: {
                id: true,
                objectId: true,
                organizationId: true,
                ownerId: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          }),
        })
      );

      expect(result).toEqual(mockAssociations);
    });
  });
});
