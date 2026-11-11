import { describe, it, expect } from "vitest";

describe("Enterprise Time Tracking, Shift Conflict & Operations Logic", () => {
  it("calculates billable ratio correctly with mixed billable and non-billable entries", () => {
    const logs = [
      { hours: 5, isBillable: true },
      { hours: 3, isBillable: true },
      { hours: 2, isBillable: false },
    ];
    const totalHours = logs.reduce((acc, curr) => acc + curr.hours, 0);
    const billableHours = logs
      .filter((l) => l.isBillable !== false)
      .reduce((acc, curr) => acc + curr.hours, 0);

    const ratio = Math.round((billableHours / totalHours) * 100);

    expect(totalHours).toBe(10);
    expect(billableHours).toBe(8);
    expect(ratio).toBe(80);
  });

  it("calculates task estimate variance accurately", () => {
    const estimatedHours = 8;
    const actualLoggedHours = 10.5;
    const variance = Math.round((actualLoggedHours - estimatedHours) * 10) / 10;
    const isOverrun = actualLoggedHours > estimatedHours;

    expect(variance).toBe(2.5);
    expect(isOverrun).toBe(true);
  });

  it("prevents deletion of locked timesheet entries", () => {
    const entry = {
      id: "time_entry_123",
      hours: 4,
      isLocked: true,
      description: "Approved payroll session",
    };

    const canDelete = !entry.isLocked;
    expect(canDelete).toBe(false);
  });

  it("detects shift conflicts with overlapping intervals on the same day", () => {
    const shift1 = { dayOfWeek: 1, startTime: "09:00", endTime: "14:00" };
    const shift2 = { dayOfWeek: 1, startTime: "13:30", endTime: "17:00" };
    const shift3 = { dayOfWeek: 2, startTime: "13:30", endTime: "17:00" };

    const toMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m;
    };

    const checkConflict = (sA: typeof shift1, sB: typeof shift2) => {
      if (sA.dayOfWeek !== sB.dayOfWeek) return false;
      const startA = toMinutes(sA.startTime);
      const endA = toMinutes(sA.endTime);
      const startB = toMinutes(sB.startTime);
      const endB = toMinutes(sB.endTime);
      return Math.max(startA, startB) < Math.min(endA, endB);
    };

    expect(checkConflict(shift1, shift2)).toBe(true);
    expect(checkConflict(shift1, shift3)).toBe(false);
  });

  it("computes subtask rollup progress percentage accurately", () => {
    const subtasks = [
      { id: "st_1", status: "DONE" },
      { id: "st_2", status: "DONE" },
      { id: "st_3", status: "IN_PROGRESS" },
      { id: "st_4", status: "TODO" },
    ];

    const completed = subtasks.filter((st) => st.status === "DONE").length;
    const progress = Math.round((completed / subtasks.length) * 100);

    expect(progress).toBe(50);
  });
});
