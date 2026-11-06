import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetSession = vi.fn();

vi.mock("../auth-client", () => {
  return {
    authClient: {
      getSession: (...args: any[]) => mockGetSession(...args),
    },
  };
});

import { apiClient, ProjectsAPI } from "../api";

describe("Projects App API Routing, Authorization, and Permissions Verification", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockGetSession.mockReset();
  });

  describe("API Client Header Interceptor (Authorization & Multi-Tenancy)", () => {
    it("attaches Authorization and tenant headers when user session exists", async () => {
      mockGetSession.mockResolvedValue({
        data: {
          session: {
            token: "mock-session-jwt-token-xyz",
            activeOrganizationId: "org-uuid-1234",
            activeOrganizationSlug: "acme-corp",
          },
          user: {
            id: "user-uuid-5678",
            name: "Test Engineer",
            email: "dev@acme.com",
            activeOrganizationId: "org-uuid-1234",
            activeOrganizationSlug: "acme-corp",
          },
        },
        error: null,
      });

      const fakeConfig: any = { headers: {} };
      // Retrieve the request interceptor function registered on apiClient
      const interceptor = (apiClient.interceptors.request as any).handlers[0]?.fulfilled;
      expect(interceptor).toBeDefined();

      const enrichedConfig = await interceptor(fakeConfig);

      expect(enrichedConfig.headers["Authorization"]).toBe("Bearer mock-session-jwt-token-xyz");
      expect(enrichedConfig.headers["x-organization-id"]).toBe("org-uuid-1234");
      expect(enrichedConfig.headers["x-org-id"]).toBe("org-uuid-1234");
      expect(enrichedConfig.headers["x-org-slug"]).toBe("acme-corp");
    });

    it("gracefully leaves headers unchanged if getSession rejects or returns null", async () => {
      mockGetSession.mockRejectedValue(new Error("Network failure"));

      const fakeConfig: any = { headers: {} };
      const interceptor = (apiClient.interceptors.request as any).handlers[0]?.fulfilled;
      const enrichedConfig = await interceptor(fakeConfig);

      expect(enrichedConfig.headers["Authorization"]).toBeUndefined();
      expect(enrichedConfig.headers["x-organization-id"]).toBeUndefined();
      expect(enrichedConfig.headers["x-org-slug"]).toBeUndefined();
    });
  });

  describe("ProjectsAPI Route Path Invariance (V3 Path Validation against 404s)", () => {
    it("calls correct endpoints for Workspace and Projects management", async () => {
      const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue({ data: { data: [] } });
      const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue({ data: { data: {} } });
      const patchSpy = vi.spyOn(apiClient, "patch").mockResolvedValue({ data: { data: {} } });
      const deleteSpy = vi.spyOn(apiClient, "delete").mockResolvedValue({ data: { data: { success: true } } });

      await ProjectsAPI.getWorkspaceContext();
      expect(getSpy).toHaveBeenLastCalledWith("/v3/tasks/workspace");

      await ProjectsAPI.getProjects();
      expect(getSpy).toHaveBeenLastCalledWith("/v3/projects");

      await ProjectsAPI.getProject("prj-101");
      expect(getSpy).toHaveBeenLastCalledWith("/v3/projects/prj-101");

      await ProjectsAPI.createProject({ name: "Alpha", key: "ALP" });
      expect(postSpy).toHaveBeenLastCalledWith(
        "/v3/projects",
        expect.objectContaining({ name: "Alpha", key: "ALP" })
      );

      await ProjectsAPI.updateProject("prj-101", { name: "Alpha Updated" });
      expect(patchSpy).toHaveBeenLastCalledWith(
        "/v3/projects/prj-101",
        expect.objectContaining({ name: "Alpha Updated" })
      );

      await ProjectsAPI.deleteProject("prj-101");
      expect(deleteSpy).toHaveBeenLastCalledWith("/v3/projects/prj-101");
    });

    it("calls correct endpoints for Task and Issue Tracking", async () => {
      const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue({ data: { data: [] } });
      const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue({ data: { data: {} } });
      const patchSpy = vi.spyOn(apiClient, "patch").mockResolvedValue({ data: { data: {} } });
      const deleteSpy = vi.spyOn(apiClient, "delete").mockResolvedValue({ data: { data: { success: true } } });

      await ProjectsAPI.getProjectTasks();
      expect(getSpy).toHaveBeenLastCalledWith("/v3/tasks");

      await ProjectsAPI.getProjectTasks("prj-101");
      expect(getSpy).toHaveBeenLastCalledWith("/v3/tasks?projectId=prj-101");

      await ProjectsAPI.getTask("tsk-555");
      expect(getSpy).toHaveBeenLastCalledWith("/v3/tasks/tsk-555");

      await ProjectsAPI.createTask({ title: "Fix bug", projectId: "prj-101" });
      expect(postSpy).toHaveBeenLastCalledWith(
        "/v3/tasks",
        expect.objectContaining({ title: "Fix bug", projectId: "prj-101" })
      );

      await ProjectsAPI.updateTask("tsk-555", { title: "Fix bug updated" });
      expect(patchSpy).toHaveBeenLastCalledWith(
        "/v3/tasks/tsk-555",
        expect.objectContaining({ title: "Fix bug updated" })
      );

      await ProjectsAPI.updateTaskStatus("tsk-555", "DONE");
      expect(patchSpy).toHaveBeenLastCalledWith("/v3/tasks/tsk-555", { status: "DONE" });

      await ProjectsAPI.deleteTask("tsk-555");
      expect(deleteSpy).toHaveBeenLastCalledWith("/v3/tasks/tsk-555");

      await ProjectsAPI.manageTaskAssignees("tsk-555", ["mem-1", "mem-2"]);
      expect(postSpy).toHaveBeenLastCalledWith("/v3/tasks/tsk-555/assignees", {
        memberIds: ["mem-1", "mem-2"],
      });

      await ProjectsAPI.manageTaskAssignees("tsk-555", [
        { memberId: "mem-1", isPrimary: true, allocatedHours: 10 },
      ]);
      expect(postSpy).toHaveBeenLastCalledWith("/v3/tasks/tsk-555/assignees", {
        assignees: [{ memberId: "mem-1", isPrimary: true, allocatedHours: 10 }],
      });

      await ProjectsAPI.addTaskComment("tsk-555", "Reviewed and verified");
      expect(postSpy).toHaveBeenLastCalledWith("/v3/tasks/tsk-555/comments", {
        content: "Reviewed and verified",
      });

      await ProjectsAPI.getSubtasks("tsk-555");
      expect(getSpy).toHaveBeenLastCalledWith("/v3/tasks/tsk-555/subtasks");
    });

    it("calls correct endpoints for Time Tracking & Timesheets", async () => {
      const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue({ data: { data: [] } });
      const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue({ data: { data: {} } });
      const deleteSpy = vi.spyOn(apiClient, "delete").mockResolvedValue({ data: { data: { success: true } } });

      await ProjectsAPI.listTimeEntries("tsk-555");
      expect(getSpy).toHaveBeenLastCalledWith("/v3/tasks/tsk-555/time-entries");

      await ProjectsAPI.logTimeEntry("tsk-555", 3.5, "Refactoring");
      expect(postSpy).toHaveBeenLastCalledWith("/v3/tasks/tsk-555/time-entries", {
        taskId: "tsk-555",
        hours: 3.5,
        description: "Refactoring",
        category: undefined,
        isBillable: undefined,
      });

      await ProjectsAPI.logTimeEntry(undefined, 2.0, "General dev");
      expect(postSpy).toHaveBeenLastCalledWith("/v3/tasks/time-entries", {
        taskId: undefined,
        hours: 2.0,
        description: "General dev",
        category: undefined,
        isBillable: undefined,
      });

      await ProjectsAPI.deleteTimeEntry("tsk-555", "te-999");
      expect(deleteSpy).toHaveBeenLastCalledWith("/v3/tasks/tsk-555/time-entries/te-999");

      await ProjectsAPI.getWeeklyTimesheets("mem-1", "2026-11-01");
      expect(getSpy).toHaveBeenLastCalledWith("/v3/tasks/timesheets/weekly?memberId=mem-1&weekStartDate=2026-11-01");

      await ProjectsAPI.submitWeeklyTimesheet({ weekStartDate: "2026-11-01", notes: "All done" });
      expect(postSpy).toHaveBeenLastCalledWith("/v3/tasks/timesheets/submit", {
        weekStartDate: "2026-11-01",
        notes: "All done",
      });

      await ProjectsAPI.processWeeklyTimesheet("ts-100", { action: "APPROVE", notes: "Approved" });
      expect(postSpy).toHaveBeenLastCalledWith("/v3/tasks/timesheets/ts-100/process", {
        action: "APPROVE",
        notes: "Approved",
      });
    });

    it("calls correct endpoints for Milestones, Sprints, and Documents", async () => {
      const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue({ data: { data: [] } });
      const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue({ data: { data: {} } });
      const patchSpy = vi.spyOn(apiClient, "patch").mockResolvedValue({ data: { data: {} } });
      const deleteSpy = vi.spyOn(apiClient, "delete").mockResolvedValue({ data: { data: { success: true } } });

      // Milestones
      await ProjectsAPI.getProjectMilestones("prj-101");
      expect(getSpy).toHaveBeenLastCalledWith("/v3/projects/prj-101/milestones");

      await ProjectsAPI.createMilestone({ projectId: "prj-101", title: "v1.0 Release" });
      expect(postSpy).toHaveBeenLastCalledWith("/v3/projects/prj-101/milestones", {
        projectId: "prj-101",
        title: "v1.0 Release",
      });

      await ProjectsAPI.updateMilestone("ms-1", { status: "COMPLETED" });
      expect(patchSpy).toHaveBeenLastCalledWith("/v3/projects/milestones/ms-1", {
        status: "COMPLETED",
      });

      await ProjectsAPI.deleteMilestone("ms-1");
      expect(deleteSpy).toHaveBeenLastCalledWith("/v3/projects/milestones/ms-1");

      // Sprints
      await ProjectsAPI.getProjectSprints("prj-101");
      expect(getSpy).toHaveBeenLastCalledWith("/v3/projects/prj-101/sprints");

      await ProjectsAPI.createSprint("prj-101", { name: "Sprint 1", scopePoints: 20 });
      expect(postSpy).toHaveBeenLastCalledWith("/v3/projects/prj-101/sprints", {
        name: "Sprint 1",
        scopePoints: 20,
      });

      await ProjectsAPI.updateSprint("sp-1", { status: "ACTIVE" });
      expect(patchSpy).toHaveBeenLastCalledWith("/v3/projects/sprints/sp-1", {
        status: "ACTIVE",
      });

      await ProjectsAPI.deleteSprint("sp-1");
      expect(deleteSpy).toHaveBeenLastCalledWith("/v3/projects/sprints/sp-1");

      // Documents
      await ProjectsAPI.getProjectDocuments("prj-101");
      expect(getSpy).toHaveBeenLastCalledWith("/v3/projects/prj-101/documents");

      await ProjectsAPI.createProjectDocument("prj-101", { title: "Arch RFC", type: "RFC" });
      expect(postSpy).toHaveBeenLastCalledWith("/v3/projects/prj-101/documents", {
        title: "Arch RFC",
        type: "RFC",
      });

      await ProjectsAPI.updateProjectDocument("doc-1", { title: "Arch RFC Updated" });
      expect(patchSpy).toHaveBeenLastCalledWith("/v3/projects/documents/doc-1", {
        title: "Arch RFC Updated",
      });

      await ProjectsAPI.deleteProjectDocument("doc-1");
      expect(deleteSpy).toHaveBeenLastCalledWith("/v3/projects/documents/doc-1");
    });

    it("calls correct endpoints for Shifts, Scheduling, Calendar, and Members", async () => {
      const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue({ data: { data: [] } });
      const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue({ data: { data: {} } });
      const patchSpy = vi.spyOn(apiClient, "patch").mockResolvedValue({ data: { data: {} } });
      const deleteSpy = vi.spyOn(apiClient, "delete").mockResolvedValue({ data: { data: { success: true } } });

      await ProjectsAPI.getCalendarEvents("prj-101");
      expect(getSpy).toHaveBeenLastCalledWith("/v3/tasks/calendar/events?projectId=prj-101");

      await ProjectsAPI.getMembers();
      expect(getSpy).toHaveBeenLastCalledWith("/v3/members");

      await ProjectsAPI.getUnifiedCalendar({ projectId: "prj-101", from: "2026-11-01", to: "2026-11-30" });
      expect(getSpy).toHaveBeenLastCalledWith("/v3/scheduling/unified-calendar?from=2026-11-01&to=2026-11-30&projectId=prj-101");

      await ProjectsAPI.updateUnifiedEventStatus("evt-1", { category: "task", status: "DONE" });
      expect(patchSpy).toHaveBeenLastCalledWith("/v3/scheduling/unified-calendar/events/evt-1/status", {
        category: "task",
        status: "DONE",
      });

      await ProjectsAPI.getMemberPerformance("mem-1", "2026-11-01", "2026-11-30");
      expect(getSpy).toHaveBeenLastCalledWith("/v3/tasks/members/mem-1/performance?from=2026-11-01&to=2026-11-30");

      await ProjectsAPI.getTeamPerformance("2026-11-01", "2026-11-30");
      expect(getSpy).toHaveBeenLastCalledWith("/v3/tasks/team/performance?from=2026-11-01&to=2026-11-30");

      await ProjectsAPI.getStaffShifts("mem-1");
      expect(getSpy).toHaveBeenLastCalledWith("/v3/shifts?memberId=mem-1");

      await ProjectsAPI.createStaffShift({ memberId: "mem-1", dayOfWeek: 1, startTime: "09:00", endTime: "17:00" });
      expect(postSpy).toHaveBeenLastCalledWith("/v3/shifts", {
        memberId: "mem-1",
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "17:00",
      });

      await ProjectsAPI.updateStaffShift("sh-1", { startTime: "10:00" });
      expect(patchSpy).toHaveBeenLastCalledWith("/v3/shifts/sh-1", { startTime: "10:00" });

      await ProjectsAPI.deleteStaffShift("sh-1");
      expect(deleteSpy).toHaveBeenLastCalledWith("/v3/shifts/sh-1");

      await ProjectsAPI.getShiftTrades("PENDING");
      expect(getSpy).toHaveBeenLastCalledWith("/v3/shifts/trades?status=PENDING");

      await ProjectsAPI.requestShiftTrade({ shiftId: "sh-1", reason: "Personal appointment" });
      expect(postSpy).toHaveBeenLastCalledWith("/v3/shifts/trades", {
        shiftId: "sh-1",
        reason: "Personal appointment",
      });

      await ProjectsAPI.processShiftTrade("st-1", "APPROVE");
      expect(postSpy).toHaveBeenLastCalledWith("/v3/shifts/trades/st-1/process", { action: "APPROVE" });
    });
  });
});
