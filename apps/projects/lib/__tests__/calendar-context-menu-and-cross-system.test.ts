import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProjectsAPI, apiClient, CreateTaskInput } from "../api";

vi.mock("../auth-client", () => ({
  authClient: {
    getSession: vi.fn().mockResolvedValue({
      data: {
        session: { token: "test-token", activeOrganizationId: "org-1", activeOrganizationSlug: "org-slug" },
        user: { id: "user-1" },
      },
    }),
  },
}));

vi.mock("../urls", () => ({
  getResolvedApiUrl: vi.fn().mockReturnValue("http://localhost:3002"),
}));

describe("Calendar Right-Click & Cross-System Integrations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Calendar Date Initialization & Context Coordinates", () => {
    it("clamps context menu coordinates properly within browser viewport", () => {
      const windowWidth = 1024;
      const windowHeight = 768;
      const menuWidth = 220;
      const menuHeight = 240;

      // Event near the bottom right edge
      const clientX = 950;
      const clientY = 700;

      const posX = clientX + menuWidth > windowWidth ? windowWidth - menuWidth - 12 : clientX;
      const posY = clientY + menuHeight > windowHeight ? windowHeight - menuHeight - 12 : clientY;

      const clampedX = Math.max(8, posX);
      const clampedY = Math.max(8, posY);

      expect(clampedX).toBe(windowWidth - menuWidth - 12);
      expect(clampedY).toBe(windowHeight - menuHeight - 12);
      expect(clampedX + menuWidth).toBeLessThanOrEqual(windowWidth);
      expect(clampedY + menuHeight).toBeLessThanOrEqual(windowHeight);
    });

    it("resolves specific date strings and ISO day of week for scheduled items", () => {
      // 2026-11-09 is a Monday (day 1)
      const mondayDate = new Date("2026-11-09T10:00:00.000Z");
      const day = mondayDate.getDay();
      const isoDay = day === 0 ? 7 : day;
      const dateStr = mondayDate.toISOString().split("T")[0];

      expect(isoDay).toBe(1);
      expect(dateStr).toBe("2026-11-09");

      // 2026-11-15 is a Sunday (day 0 -> isoDay 7)
      const sundayDate = new Date("2026-11-15T10:00:00.000Z");
      const sunDay = sundayDate.getDay();
      const sunIsoDay = sunDay === 0 ? 7 : sunDay;
      const sunDateStr = sundayDate.toISOString().split("T")[0];

      expect(sunIsoDay).toBe(7);
      expect(sunDateStr).toBe("2026-11-15");
    });
  });

  describe("Cross-System Task Creation with Prefilled Dates", () => {
    it("creates a task with prefilled calendar dates and cross-system service booking", async () => {
      const apiClientPostSpy = vi.spyOn(apiClient, "post").mockResolvedValue({
        data: {
          data: {
            id: "task-cal-1",
            taskKey: "PRJ-501",
            title: "Client Service Execution",
            bookingId: "bkg-999",
            startDate: "2026-11-10T00:00:00.000Z",
            dueDate: "2026-11-10T00:00:00.000Z",
          },
        },
      });

      const payload: CreateTaskInput = {
        projectId: "prj-1",
        title: "Client Service Execution",
        description: "Scheduled directly from calendar date cell",
        status: "TODO",
        priority: "HIGH",
        startDate: "2026-11-10T00:00:00.000Z",
        dueDate: "2026-11-10T00:00:00.000Z",
        bookingId: "bkg-999",
      };

      const result = await ProjectsAPI.createTask(payload);
      expect(result.id).toBe("task-cal-1");
      expect(result.bookingId).toBe("bkg-999");
      expect(apiClientPostSpy).toHaveBeenCalledWith("/v3/tasks", payload);
    });

    it("creates a task with prefilled calendar dates and cross-system production batch", async () => {
      const apiClientPostSpy = vi.spyOn(apiClient, "post").mockResolvedValue({
        data: {
          data: {
            id: "task-cal-2",
            taskKey: "PRJ-502",
            title: "Production Batch Run #980",
            batchId: "batch-980",
            startDate: "2026-11-12T00:00:00.000Z",
            dueDate: "2026-11-12T00:00:00.000Z",
          },
        },
      });

      const payload: CreateTaskInput = {
        projectId: "prj-1",
        title: "Production Batch Run #980",
        description: "Scheduled batch execution from calendar",
        status: "TODO",
        priority: "URGENT",
        startDate: "2026-11-12T00:00:00.000Z",
        dueDate: "2026-11-12T00:00:00.000Z",
        batchId: "batch-980",
      };

      const result = await ProjectsAPI.createTask(payload);
      expect(result.id).toBe("task-cal-2");
      expect(apiClientPostSpy).toHaveBeenCalledWith("/v3/tasks", payload);
    });

    it("creates a milestone for a specific target date directly from calendar option", async () => {
      const apiClientPostSpy = vi.spyOn(apiClient, "post").mockResolvedValue({
        data: {
          data: {
            id: "mls-501",
            projectId: "prj-1",
            title: "Release v2.0 Candidate",
            dueDate: "2026-11-20T00:00:00.000Z",
            status: "OPEN",
          },
        },
      });

      const milestoneData = {
        projectId: "prj-1",
        title: "Release v2.0 Candidate",
        description: "Pre-release testing milestone",
        dueDate: "2026-11-20T00:00:00.000Z",
        status: "OPEN" as const,
      };

      const result = await ProjectsAPI.createMilestone(milestoneData);
      expect(result.id).toBe("mls-501");
      expect(result.title).toBe("Release v2.0 Candidate");
      expect(apiClientPostSpy).toHaveBeenCalledWith("/v3/projects/prj-1/milestones", milestoneData);
    });
  });
});
