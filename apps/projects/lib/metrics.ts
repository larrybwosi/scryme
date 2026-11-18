/**
 * Pure calculations shared by the time tracking, scheduling and task views.
 * These functions have no framework or network dependency so they can be
 * reasoned about and tested on their own.
 */

export interface ShiftInterval {
  id?: string;
  memberId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive?: boolean;
}

export interface TimedEntry {
  hours: number | string;
  isBillable?: boolean;
}

export interface SubtaskLike {
  status: string;
}

export interface StoredTimerState {
  isRunning: boolean;
  elapsedSeconds: number;
  lastTickTimestamp: number;
  activeTaskId: string;
  activeTaskTitle: string;
  activeTaskKey: string;
  note: string;
}

const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const SECONDS_PER_MINUTE = 60;
const DEFAULT_WEEKLY_CAPACITY_HOURS = 40;

export function timeToMinutes(time: string): number {
  const parts = time.split(":").map(Number);
  if (parts.length !== 2 || parts.some((part) => !Number.isFinite(part))) {
    return 0;
  }
  return parts[0] * MINUTES_PER_HOUR + parts[1];
}

export function shiftsOverlap(left: ShiftInterval, right: ShiftInterval): boolean {
  if (left.memberId !== right.memberId || left.dayOfWeek !== right.dayOfWeek) {
    return false;
  }
  return (
    Math.max(timeToMinutes(left.startTime), timeToMinutes(right.startTime)) <
    Math.min(timeToMinutes(left.endTime), timeToMinutes(right.endTime))
  );
}

export function findConflictingShiftIds(shifts: ShiftInterval[]): string[] {
  const conflicts = new Set<string>();
  for (let index = 0; index < shifts.length; index += 1) {
    const current = shifts[index];
    if (current.isActive === false) continue;
    for (let other = index + 1; other < shifts.length; other += 1) {
      const candidate = shifts[other];
      if (candidate.isActive === false) continue;
      if (shiftsOverlap(current, candidate)) {
        if (current.id) conflicts.add(current.id);
        if (candidate.id) conflicts.add(candidate.id);
      }
    }
  }
  return Array.from(conflicts);
}

export function weeklyShiftHours(shifts: ShiftInterval[]): number {
  return shifts.reduce((total, shift) => {
    if (shift.isActive === false) return total;
    const minutes = timeToMinutes(shift.endTime) - timeToMinutes(shift.startTime);
    return minutes > 0 ? total + minutes / MINUTES_PER_HOUR : total;
  }, 0);
}

export function effectiveWeeklyCapacity(
  shifts: ShiftInterval[],
  fallbackHours: number = DEFAULT_WEEKLY_CAPACITY_HOURS,
): number {
  const scheduled = weeklyShiftHours(shifts);
  return scheduled > 0 ? scheduled : fallbackHours;
}

export function estimateVariance(estimatedHours: number, actualHours: number): number {
  return Math.round((actualHours - estimatedHours) * 10) / 10;
}

export function billableRatio(entries: TimedEntry[]): number {
  const total = entries.reduce((sum, entry) => sum + Number(entry.hours || 0), 0);
  if (total <= 0) return 100;
  const billable = entries.reduce(
    (sum, entry) => sum + (entry.isBillable === false ? 0 : Number(entry.hours || 0)),
    0,
  );
  return Math.round((billable / total) * 100);
}

export function subtaskProgress(subtasks: SubtaskLike[]): number {
  if (subtasks.length === 0) return 0;
  const done = subtasks.filter((subtask) => subtask.status === "DONE").length;
  return Math.round((done / subtasks.length) * 100);
}

export function startOfWeek(date: Date): Date {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayIndex = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - dayIndex);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function formatStopwatch(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remaining = safeSeconds % 60;
  return [hours, minutes, remaining].map((value) => String(value).padStart(2, "0")).join(":");
}

export function reconcileTimerState(
  stored: Partial<StoredTimerState>,
  now: number = Date.now(),
): StoredTimerState {
  const base: StoredTimerState = {
    isRunning: false,
    elapsedSeconds: 0,
    lastTickTimestamp: now,
    activeTaskId: "",
    activeTaskTitle: "",
    activeTaskKey: "",
    note: "",
    ...stored,
  };

  const elapsedSeconds = Math.max(0, Number(stored.elapsedSeconds) || 0);
  if (!base.isRunning) {
    return { ...base, elapsedSeconds, lastTickTimestamp: now };
  }

  const parsedLastTick = Number(stored.lastTickTimestamp);
  const lastTick = Number.isFinite(parsedLastTick) && parsedLastTick >= 0 ? parsedLastTick : now;
  const deltaSeconds = Math.max(0, Math.floor((now - lastTick) / 1000));
  const boundedDelta = Math.min(deltaSeconds, HOURS_PER_DAY * 60 * SECONDS_PER_MINUTE);
  return {
    ...base,
    elapsedSeconds: elapsedSeconds + boundedDelta,
    lastTickTimestamp: now,
  };
}
