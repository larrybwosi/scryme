import { describe, expect, it } from "vitest";
import {
  billableRatio,
  effectiveWeeklyCapacity,
  estimateVariance,
  findConflictingShiftIds,
  formatStopwatch,
  reconcileTimerState,
  shiftsOverlap,
  startOfWeek,
  subtaskProgress,
  timeToMinutes,
  weeklyShiftHours,
} from "../metrics";

const shift = (overrides: Partial<Parameters<typeof shiftsOverlap>[0]> = {}) => ({
  id: "shift_1",
  memberId: "member_1",
  dayOfWeek: 1,
  startTime: "09:00",
  endTime: "17:00",
  isActive: true,
  ...overrides,
});

describe("Feature 8 shared metrics", () => {
  describe("shift conflicts and capacity", () => {
    it("converts times to minutes and rejects malformed values", () => {
      expect(timeToMinutes("09:30")).toBe(570);
      expect(timeToMinutes("invalid")).toBe(0);
    });

    it("detects overlaps only for the same member and weekday", () => {
      const morning = shift({ startTime: "09:00", endTime: "13:00" });
      const overlapping = shift({ id: "shift_2", startTime: "12:30", endTime: "17:00" });
      const adjacent = shift({ id: "shift_3", startTime: "13:00", endTime: "17:00" });
      const otherMember = shift({ id: "shift_4", memberId: "member_2" });
      const otherDay = shift({ id: "shift_5", dayOfWeek: 2 });

      expect(shiftsOverlap(morning, overlapping)).toBe(true);
      expect(shiftsOverlap(morning, adjacent)).toBe(false);
      expect(shiftsOverlap(morning, otherMember)).toBe(false);
      expect(shiftsOverlap(morning, otherDay)).toBe(false);
    });

    it("flags every active shift in a conflict and ignores inactive shifts", () => {
      const conflicts = findConflictingShiftIds([
        shift(),
        shift({ id: "shift_2", startTime: "12:00", endTime: "16:00" }),
        shift({ id: "shift_3", dayOfWeek: 2 }),
        shift({ id: "shift_4", startTime: "10:00", endTime: "11:00", isActive: false }),
      ]);

      expect(conflicts.sort()).toEqual(["shift_1", "shift_2"]);
    });

    it("sums active shift hours and falls back to a standard week", () => {
      const shifts = [
        shift({ startTime: "09:00", endTime: "17:00" }),
        shift({ id: "shift_2", dayOfWeek: 2, startTime: "08:30", endTime: "12:30" }),
        shift({ id: "shift_3", dayOfWeek: 3, startTime: "09:00", endTime: "10:00", isActive: false }),
      ];

      expect(weeklyShiftHours(shifts)).toBe(12);
      expect(effectiveWeeklyCapacity(shifts)).toBe(12);
      expect(effectiveWeeklyCapacity([shifts[2]])).toBe(40);
      expect(effectiveWeeklyCapacity([], 35)).toBe(35);
    });
  });

  describe("time tracking metrics", () => {
    it("computes billable ratio and treats empty logs as fully billable", () => {
      expect(
        billableRatio([
          { hours: 5, isBillable: true },
          { hours: 3, isBillable: false },
          { hours: 2, isBillable: true },
        ]),
      ).toBe(70);
      expect(billableRatio([])).toBe(100);
    });

    it("computes signed estimate variance", () => {
      expect(estimateVariance(8, 10.5)).toBe(2.5);
      expect(estimateVariance(8, 6)).toBe(-2);
    });

    it("resolves the Monday start of the week", () => {
      expect(startOfWeek(new Date(2026, 10, 18, 15, 30)).toISOString()).toBe(
        new Date(2026, 10, 16).toISOString(),
      );
    });

    it("formats stopwatch durations", () => {
      expect(formatStopwatch(0)).toBe("00:00:00");
      expect(formatStopwatch(3661)).toBe("01:01:01");
      expect(formatStopwatch(-10)).toBe("00:00:00");
    });

    it("reconciles running timers from wall clock time", () => {
      const now = 1_000_000;
      const state = reconcileTimerState(
        {
          isRunning: true,
          elapsedSeconds: 60,
          lastTickTimestamp: now - 90_000,
          activeTaskId: "task_1",
          activeTaskTitle: "Feature A",
          activeTaskKey: "DEV-1",
          note: "Review",
        },
        now,
      );

      expect(state.elapsedSeconds).toBe(150);
      expect(state.lastTickTimestamp).toBe(now);
      expect(state.activeTaskId).toBe("task_1");
      expect(state.note).toBe("Review");
    });

    it("does not add wall clock time while a timer is paused", () => {
      const now = 1_000_000;
      const state = reconcileTimerState(
        {
          isRunning: false,
          elapsedSeconds: 120,
          lastTickTimestamp: now - 600_000,
        },
        now,
      );

      expect(state.elapsedSeconds).toBe(120);
      expect(state.lastTickTimestamp).toBe(now);
    });

    it("caps absurd background gaps at one day", () => {
      const now = 10 * 24 * 60 * 60 * 1000;
      const state = reconcileTimerState(
        {
          isRunning: true,
          elapsedSeconds: 10,
          lastTickTimestamp: 0,
        },
        now,
      );

      expect(state.elapsedSeconds).toBe(24 * 60 * 60 + 10);
    });
  });

  describe("task rollups", () => {
    it("calculates subtask progress and handles an empty list", () => {
      expect(
        subtaskProgress([
          { status: "DONE" },
          { status: "DONE" },
          { status: "IN_PROGRESS" },
          { status: "TODO" },
        ]),
      ).toBe(50);
      expect(subtaskProgress([])).toBe(0);
    });
  });
});
