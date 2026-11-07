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

describe("ProjectsAPI Task Creation with Integrations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should post complete task payload including bookingId, batchId, sprintId, milestoneId, and assignees", async () => {
    const apiClientPostSpy = vi.spyOn(apiClient, "post").mockResolvedValue({
      data: {
        data: {
          id: "task-100",
          taskKey: "PRJ-100",
          title: "Full Integration Task",
          bookingId: "bkg-123",
          sprintId: "spr-456",
          milestoneId: "mls-789",
        },
      },
    });

    const payload: CreateTaskInput = {
      projectId: "prj-1",
      title: "Full Integration Task",
      description: "Detailed scope with all integrations",
      priority: "URGENT",
      status: "IN_PROGRESS",
      estimatedHours: 8,
      startDate: "2026-10-15T00:00:00.000Z",
      dueDate: "2026-10-20T00:00:00.000Z",
      bookingId: "bkg-123",
      batchId: "batch-456",
      sprintId: "spr-456",
      milestoneId: "mls-789",
      labelIds: ["label-1"],
      assignees: [
        { memberId: "mem-1", isPrimary: true, allocatedHours: 5 },
        { memberId: "mem-2", isPrimary: false, allocatedHours: 3 },
      ],
    };

    const result = await ProjectsAPI.createTask(payload);
    expect(result.id).toBe("task-100");
    expect(apiClientPostSpy).toHaveBeenCalledWith("/v3/tasks", payload);
  });
});
