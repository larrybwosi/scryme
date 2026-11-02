import { describe, it, expect } from "vitest";
import { normalizeCalendarEvents, formatEventColor } from "../calendar-utils";

describe("Calendar Utilities", () => {
  it("should correctly format event colors according to item type, status, and priority", () => {
    expect(formatEventColor("sprint", "ACTIVE")).toContain("indigo-500");
    expect(formatEventColor("milestone", "COMPLETED")).toContain("emerald-500");
    expect(formatEventColor("milestone", "OPEN")).toContain("purple-500");
    expect(formatEventColor("task", "DONE")).toContain("emerald-500");
    expect(formatEventColor("task", "TODO", "URGENT")).toContain("amber-500");
    expect(formatEventColor("task", "TODO", "MEDIUM")).toContain("surface-container-high");
  });

  it("should normalize tasks, milestones, and sprints into unified chronological events", () => {
    const tasks = [
      {
        id: "task-1",
        taskKey: "PRJ-101",
        title: "Database Migration",
        dueDate: "2026-11-10T12:00:00.000Z",
        status: "IN_PROGRESS",
        priority: "HIGH",
        projectId: "prj-1",
      },
      {
        id: "task-2",
        taskKey: "PRJ-102",
        title: "Frontend Wireframe",
        dueDate: "2026-11-05T10:00:00.000Z",
        status: "DONE",
        priority: "LOW",
        projectId: "prj-1",
      },
    ];

    const projects = [
      {
        id: "prj-1",
        name: "Projects Core App",
        milestones: [
          {
            id: "m-1",
            title: "Beta Launch",
            dueDate: "2026-11-15T00:00:00.000Z",
            status: "OPEN",
          },
        ],
        sprints: [
          {
            id: "s-1",
            name: "Sprint 42",
            startDate: "2026-11-01T00:00:00.000Z",
            endDate: "2026-11-14T00:00:00.000Z",
            status: "ACTIVE",
          },
        ],
      },
    ];

    const unified = normalizeCalendarEvents(tasks, projects);

    expect(unified).toHaveLength(4);
    // Chronological order verification
    expect(unified[0].id).toBe("task-task-2");
    expect(unified[1].id).toBe("task-task-1");
    expect(unified[2].id).toBe("sprint-s-1");
    expect(unified[3].id).toBe("milestone-m-1");

    expect(unified[0].projectName).toBe("Projects Core App");
    expect(unified[3].type).toBe("milestone");
  });

  it("should handle empty or malformed dates gracefully", () => {
    const tasks = [
      {
        id: "task-invalid",
        title: "Invalid task date",
        dueDate: "invalid-date-string",
      },
      {
        id: "task-missing",
        title: "No date provided",
      },
    ];

    const events = normalizeCalendarEvents(tasks, []);
    expect(events).toHaveLength(0);
  });
});
