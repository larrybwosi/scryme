import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient, ProjectsAPI } from "../api";

describe("Projects Features End-to-End API Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Projects Lifecycle", () => {
    it("creates, lists, updates, and deletes projects", async () => {
      const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue({
        data: {
          data: {
            items: [
              { id: "prj-1", key: "PRJ1", name: "Core Platform", status: "ACTIVE" },
            ],
          },
        },
      });
      const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue({
        data: { data: { id: "prj-2", key: "PRJ2", name: "Mobile App", status: "ACTIVE" } },
      });
      const patchSpy = vi.spyOn(apiClient, "patch").mockResolvedValue({
        data: { data: { id: "prj-2", name: "Mobile App v2", status: "COMPLETED" } },
      });
      const deleteSpy = vi.spyOn(apiClient, "delete").mockResolvedValue({
        data: { data: { success: true, id: "prj-2" } },
      });

      // 1. List projects
      const projects = await ProjectsAPI.getProjects();
      expect(getSpy).toHaveBeenCalledWith("/v3/projects");
      expect(projects).toHaveLength(1);
      expect(projects[0].key).toBe("PRJ1");

      // 2. Create project
      const created = await ProjectsAPI.createProject({
        name: "Mobile App",
        key: "PRJ2",
        status: "ACTIVE",
      });
      expect(postSpy).toHaveBeenCalledWith(
        "/v3/projects",
        expect.objectContaining({ name: "Mobile App", key: "PRJ2" })
      );
      expect(created.id).toBe("prj-2");

      // 3. Update project
      const updated = await ProjectsAPI.updateProject("prj-2", {
        name: "Mobile App v2",
        status: "COMPLETED",
      });
      expect(patchSpy).toHaveBeenCalledWith("/v3/projects/prj-2", {
        name: "Mobile App v2",
        status: "COMPLETED",
      });
      expect(updated.status).toBe("COMPLETED");

      // 4. Delete project
      const deleted = await ProjectsAPI.deleteProject("prj-2");
      expect(deleteSpy).toHaveBeenCalledWith("/v3/projects/prj-2");
      expect(deleted.success).toBe(true);
    });
  });

  describe("Issues and Tasks Lifecycle", () => {
    it("supports task creation, status transitions, comments, and subtasks", async () => {
      const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue({
        data: { data: { items: [{ id: "task-101", title: "API Gateway", status: "TODO" }] } },
      });
      const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue({
        data: { data: { id: "task-102", title: "Auth flow", status: "TODO" } },
      });
      const patchSpy = vi.spyOn(apiClient, "patch").mockResolvedValue({
        data: { data: { id: "task-102", status: "DONE" } },
      });
      const deleteSpy = vi.spyOn(apiClient, "delete").mockResolvedValue({
        data: { data: { success: true, id: "task-102" } },
      });

      // 1. Fetch tasks
      const tasks = await ProjectsAPI.getProjectTasks("prj-1");
      expect(getSpy).toHaveBeenCalledWith("/v3/tasks?projectId=prj-1");
      expect(tasks[0].id).toBe("task-101");

      // 2. Create task
      const newTask = await ProjectsAPI.createTask({
        title: "Auth flow",
        projectId: "prj-1",
        status: "TODO",
      });
      expect(postSpy).toHaveBeenCalledWith(
        "/v3/tasks",
        expect.objectContaining({ title: "Auth flow", projectId: "prj-1" })
      );
      expect(newTask.id).toBe("task-102");

      // 3. Update status (e.g. drag & drop Kanban board)
      const movedTask = await ProjectsAPI.updateTaskStatus("task-102", "DONE");
      expect(patchSpy).toHaveBeenCalledWith("/v3/tasks/task-102", { status: "DONE" });
      expect(movedTask.status).toBe("DONE");

      // 4. Add task comment
      await ProjectsAPI.addTaskComment("task-102", "Looks good to merge!");
      expect(postSpy).toHaveBeenCalledWith("/v3/tasks/task-102/comments", {
        content: "Looks good to merge!",
      });

      // 5. Delete task
      const res = await ProjectsAPI.deleteTask("task-102");
      expect(deleteSpy).toHaveBeenCalledWith("/v3/tasks/task-102");
      expect(res.success).toBe(true);
    });
  });

  describe("Sprints and Cycles Lifecycle", () => {
    it("handles sprint cycle creation, status updates, and deletion", async () => {
      const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue({
        data: { data: [{ id: "sp-1", name: "Sprint 1", status: "PLANNED" }] },
      });
      const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue({
        data: { data: { id: "sp-2", name: "Sprint 2", status: "PLANNED" } },
      });
      const patchSpy = vi.spyOn(apiClient, "patch").mockResolvedValue({
        data: { data: { id: "sp-2", status: "ACTIVE" } },
      });
      const deleteSpy = vi.spyOn(apiClient, "delete").mockResolvedValue({
        data: { data: { success: true, id: "sp-2" } },
      });

      // 1. Get project sprints
      const sprints = await ProjectsAPI.getProjectSprints("prj-1");
      expect(getSpy).toHaveBeenCalledWith("/v3/projects/prj-1/sprints");
      expect(sprints).toHaveLength(1);

      // 2. Create sprint
      const created = await ProjectsAPI.createSprint("prj-1", {
        name: "Sprint 2",
        goal: "Finish MVP features",
        scopePoints: 30,
      });
      expect(postSpy).toHaveBeenCalledWith("/v3/projects/prj-1/sprints", {
        name: "Sprint 2",
        goal: "Finish MVP features",
        scopePoints: 30,
      });
      expect(created.id).toBe("sp-2");

      // 3. Update sprint status
      const activeSprint = await ProjectsAPI.updateSprint("sp-2", { status: "ACTIVE" });
      expect(patchSpy).toHaveBeenCalledWith("/v3/projects/sprints/sp-2", { status: "ACTIVE" });
      expect(activeSprint.status).toBe("ACTIVE");

      // 4. Delete sprint
      const deleted = await ProjectsAPI.deleteSprint("sp-2");
      expect(deleteSpy).toHaveBeenCalledWith("/v3/projects/sprints/sp-2");
      expect(deleted.success).toBe(true);
    });
  });

  describe("Milestones Management", () => {
    it("handles milestone creation, status toggling, and deletion", async () => {
      const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue({
        data: { data: [{ id: "ms-1", title: "Alpha Beta Release", status: "OPEN" }] },
      });
      const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue({
        data: { data: { id: "ms-2", title: "Public Launch", status: "OPEN" } },
      });
      const patchSpy = vi.spyOn(apiClient, "patch").mockResolvedValue({
        data: { data: { id: "ms-2", status: "COMPLETED" } },
      });
      const deleteSpy = vi.spyOn(apiClient, "delete").mockResolvedValue({
        data: { data: { success: true, id: "ms-2" } },
      });

      // 1. Get milestones
      const milestones = await ProjectsAPI.getProjectMilestones("prj-1");
      expect(getSpy).toHaveBeenCalledWith("/v3/projects/prj-1/milestones");
      expect(milestones).toHaveLength(1);

      // 2. Create milestone
      const created = await ProjectsAPI.createMilestone({
        projectId: "prj-1",
        title: "Public Launch",
        dueDate: "2026-12-01",
      });
      expect(postSpy).toHaveBeenCalledWith("/v3/projects/prj-1/milestones", {
        projectId: "prj-1",
        title: "Public Launch",
        dueDate: "2026-12-01",
      });
      expect(created.id).toBe("ms-2");

      // 3. Update milestone status
      const completed = await ProjectsAPI.updateMilestone("ms-2", { status: "COMPLETED" });
      expect(patchSpy).toHaveBeenCalledWith("/v3/projects/milestones/ms-2", {
        status: "COMPLETED",
      });
      expect(completed.status).toBe("COMPLETED");

      // 4. Delete milestone
      const deleted = await ProjectsAPI.deleteMilestone("ms-2");
      expect(deleteSpy).toHaveBeenCalledWith("/v3/projects/milestones/ms-2");
      expect(deleted.success).toBe(true);
    });
  });

  describe("Documents, Uploads, and Notes Logic", () => {
    it("uploads file attachments to /v3/upload and links to documents", async () => {
      const uploadMock = {
        id: "att-file-123",
        url: "https://storage.scryme.tech/att-file-123.pdf",
        shortUrl: "https://api.scryme.tech/s/doc-123",
        fileName: "arch-spec.pdf",
      };

      const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue({
        data: uploadMock,
      });

      const fakeFile = new File(["specification content"], "arch-spec.pdf", {
        type: "application/pdf",
      });

      const uploadResult = await ProjectsAPI.uploadFile(fakeFile);
      expect(postSpy).toHaveBeenCalledWith(
        "/v3/upload",
        expect.any(FormData),
        expect.objectContaining({
          headers: { "Content-Type": "multipart/form-data" },
        })
      );
      expect(uploadResult.shortUrl).toBe("https://api.scryme.tech/s/doc-123");
    });

    it("manages project documents and RFC specifications", async () => {
      const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue({
        data: {
          data: [
            {
              id: "doc-1",
              title: "RFC: Microservices Telemetry",
              type: "RFC",
              status: "DRAFT",
              content: "Initial draft",
            },
          ],
        },
      });
      const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue({
        data: {
          data: {
            id: "doc-2",
            title: "Architecture Spec v1",
            type: "SPEC",
            status: "DRAFT",
          },
        },
      });
      const patchSpy = vi.spyOn(apiClient, "patch").mockResolvedValue({
        data: {
          data: {
            id: "doc-2",
            status: "APPROVED",
            summary: "Approved architecture spec",
          },
        },
      });
      const deleteSpy = vi.spyOn(apiClient, "delete").mockResolvedValue({
        data: { data: { success: true, id: "doc-2" } },
      });

      // 1. Fetch documents
      const docs = await ProjectsAPI.getProjectDocuments("prj-1");
      expect(getSpy).toHaveBeenCalledWith("/v3/projects/prj-1/documents");
      expect(docs[0].title).toContain("Microservices Telemetry");

      // 2. Create document
      const created = await ProjectsAPI.createProjectDocument("prj-1", {
        title: "Architecture Spec v1",
        type: "SPEC",
      });
      expect(postSpy).toHaveBeenCalledWith("/v3/projects/prj-1/documents", {
        title: "Architecture Spec v1",
        type: "SPEC",
      });
      expect(created.id).toBe("doc-2");

      // 3. Update document
      const updated = await ProjectsAPI.updateProjectDocument("doc-2", {
        status: "APPROVED",
        summary: "Approved architecture spec",
      });
      expect(patchSpy).toHaveBeenCalledWith("/v3/projects/documents/doc-2", {
        status: "APPROVED",
        summary: "Approved architecture spec",
      });
      expect(updated.status).toBe("APPROVED");

      // 4. Delete document
      const res = await ProjectsAPI.deleteProjectDocument("doc-2");
      expect(deleteSpy).toHaveBeenCalledWith("/v3/projects/documents/doc-2");
      expect(res.success).toBe(true);
    });
  });

  describe("Team Member Assignment & Management", () => {
    it("assigns, manages roles, and removes team members from projects", async () => {
      const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue({
        data: {
          data: {
            id: "pm-1",
            projectId: "prj-1",
            memberId: "mem-100",
            role: "ADMIN",
          },
        },
      });
      const deleteSpy = vi.spyOn(apiClient, "delete").mockResolvedValue({
        data: { data: { success: true, id: "mem-100" } },
      });

      // 1. Assign member with role
      const assigned = await ProjectsAPI.manageProjectMember("prj-1", {
        memberId: "mem-100",
        role: "ADMIN",
      });
      expect(postSpy).toHaveBeenCalledWith("/v3/projects/prj-1/members", {
        memberId: "mem-100",
        role: "ADMIN",
      });
      expect(assigned.memberId).toBe("mem-100");
      expect(assigned.role).toBe("ADMIN");

      // 2. Remove member from project
      const removed = await ProjectsAPI.removeProjectMember("prj-1", "mem-100");
      expect(deleteSpy).toHaveBeenCalledWith("/v3/projects/prj-1/members/mem-100");
      expect(removed.success).toBe(true);
    });
  });
});
