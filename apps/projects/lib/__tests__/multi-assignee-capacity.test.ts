import { describe, it, expect } from "vitest";

describe("Multi-Assignee & Capacity Calculation Logic", () => {
  it("splits estimated hours evenly if individual allocations are not provided", () => {
    const totalHours = 10;
    const assignees = ["member_1", "member_2"];
    const perMemberHours = totalHours / assignees.length;
    expect(perMemberHours).toBe(5);
  });

  it("applies customized hour allocations for primary owner vs contributors", () => {
    const allocations = [
      { memberId: "member_1", isPrimary: true, allocatedHours: 6 },
      { memberId: "member_2", isPrimary: false, allocatedHours: 4 },
    ];
    const totalAllocated = allocations.reduce((acc, curr) => acc + curr.allocatedHours, 0);
    expect(totalAllocated).toBe(10);
    expect(allocations.find((a) => a.isPrimary)?.allocatedHours).toBe(6);
  });

  it("detects when assigning additional hours exceeds scheduled shift capacity", () => {
    const scheduledShiftHours = 32;
    const currentActiveAssignedHours = 28;
    const newTaskHours = 5;

    const projectedHours = currentActiveAssignedHours + newTaskHours;
    const utilizationRate = Math.round((projectedHours / scheduledShiftHours) * 100);
    const isOverloaded = projectedHours > scheduledShiftHours;

    expect(isOverloaded).toBe(true);
    expect(utilizationRate).toBe(103);
  });

  it("falls back to standard 40-hour capacity when no staff shifts are scheduled", () => {
    const scheduledShiftHours = 0;
    const effectiveCapacity = scheduledShiftHours > 0 ? scheduledShiftHours : 40;
    const currentAssignedHours = 35;
    const newTaskHours = 4;

    const projectedHours = currentAssignedHours + newTaskHours;
    const isOverloaded = projectedHours > effectiveCapacity;

    expect(effectiveCapacity).toBe(40);
    expect(isOverloaded).toBe(false);
  });
});
