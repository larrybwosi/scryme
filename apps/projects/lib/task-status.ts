import type { Task } from "./api";

export const TASK_STATUSES: Task["status"][] = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
  "CANCELED",
];

export const TASK_STATUS_LABELS: Record<Task["status"], string> = {
  BACKLOG: "Backlog",
  TODO: "Todo",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
  CANCELED: "Canceled",
};

export const ALLOWED_TASK_TRANSITIONS: Record<Task["status"], Task["status"][]> = {
  BACKLOG: ["TODO", "CANCELED"],
  TODO: ["IN_PROGRESS", "BACKLOG", "CANCELED"],
  IN_PROGRESS: ["IN_REVIEW", "TODO", "CANCELED"],
  IN_REVIEW: ["DONE", "IN_PROGRESS", "CANCELED"],
  DONE: ["IN_REVIEW"],
  CANCELED: ["BACKLOG"],
};

export function canTransitionTaskStatus(
  from: Task["status"],
  to: Task["status"],
): boolean {
  return ALLOWED_TASK_TRANSITIONS[from]?.includes(to) ?? false;
}

export function statusChangeNeedsConfirmation(to: Task["status"]): boolean {
  return to === "DONE" || to === "CANCELED";
}
