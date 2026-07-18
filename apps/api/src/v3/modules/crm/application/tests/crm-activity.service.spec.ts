import { vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { CrmActivityService } from "../use-cases/crm-activity.service";
import { CrmNoteService } from "../use-cases/crm-note.service";
import { PrismaService } from "@/prisma/prisma.service";
import { describe, it, expect, beforeEach } from "vitest";

describe("CrmActivityService & CrmNoteService Optimizations", () => {
  let activityService: CrmActivityService;
  let noteService: CrmNoteService;

  const mockPrisma = {
    crmRecord: { findFirst: vi.fn() },
    crmNote: { findMany: vi.fn(), create: vi.fn() },
    crmActivity: { findMany: vi.fn(), create: vi.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrmActivityService,
        CrmNoteService,
        { provide: PrismaService, useValue: { client: mockPrisma } },
      ],
    }).compile();

    activityService = module.get<CrmActivityService>(CrmActivityService);
    noteService = module.get<CrmNoteService>(CrmNoteService);
    vi.clearAllMocks();
  });

  describe("CrmActivityService.getTimeline", () => {
    it("should fetch notes and activities with targeted select and return sorted timeline", async () => {
      const mockNotes = [
        {
          id: "note-1",
          content: "First Note",
          timelineDate: new Date("2023-10-27T10:00:00Z"),
          createdBy: { id: "user-1", user: { name: "Alice", image: null } },
        },
      ];

      const mockActivities = [
        {
          id: "act-1",
          type: "CREATION",
          description: "Record Created",
          metadata: { details: "initial" },
          createdAt: new Date("2023-10-27T09:00:00Z"),
          member: { id: "user-2", user: { name: "System", image: null } },
        },
      ];

      mockPrisma.crmNote.findMany.mockResolvedValue(mockNotes);
      mockPrisma.crmActivity.findMany.mockResolvedValue(mockActivities);

      const result = await activityService.getTimeline("org-1", "rec-1");

      expect(mockPrisma.crmNote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { recordId: "rec-1", organizationId: "org-1" },
          select: {
            id: true,
            content: true,
            timelineDate: true,
            createdBy: {
              select: { id: true, user: { select: { name: true, image: true } } },
            },
          },
        })
      );

      expect(mockPrisma.crmActivity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { recordId: "rec-1", organizationId: "org-1" },
          select: {
            id: true,
            type: true,
            description: true,
            metadata: true,
            createdAt: true,
            member: {
              select: { id: true, user: { select: { name: true, image: true } } },
            },
          },
        })
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: "note-1",
        type: "NOTE",
        content: "First Note",
        timestamp: mockNotes[0].timelineDate,
        createdBy: mockNotes[0].createdBy,
      });
      expect(result[1]).toEqual({
        id: "act-1",
        type: "CREATION",
        description: "Record Created",
        metadata: { details: "initial" },
        timestamp: mockActivities[0].createdAt,
        createdBy: mockActivities[0].member,
      });
    });
  });

  describe("CrmNoteService.getNotesForRecord", () => {
    it("should fetch notes with targeted select block", async () => {
      const mockNotes = [
        {
          id: "note-1",
          recordId: "rec-1",
          content: "Highly detailed markdown note.",
          createdById: "member-1",
          timelineDate: new Date(),
          createdAt: new Date(),
          createdBy: { id: "member-1", user: { name: "Bob", image: null } },
        },
      ];

      mockPrisma.crmNote.findMany.mockResolvedValue(mockNotes);

      const result = await noteService.getNotesForRecord("org-1", "rec-1");

      expect(mockPrisma.crmNote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { recordId: "rec-1", organizationId: "org-1" },
          orderBy: { timelineDate: "desc" },
          select: {
            id: true,
            recordId: true,
            content: true,
            createdById: true,
            timelineDate: true,
            createdAt: true,
            createdBy: {
              select: {
                id: true,
                user: {
                  select: {
                    name: true,
                    image: true,
                  },
                },
              },
            },
          },
        })
      );

      expect(result).toEqual(mockNotes);
    });
  });
});
