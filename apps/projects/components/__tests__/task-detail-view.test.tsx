import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Task } from "@/lib/api";

const mocks = vi.hoisted(() => ({
  useTasks: vi.fn(),
  useTask: vi.fn(),
  useMembers: vi.fn(),
  useStaffShifts: vi.fn(),
  useSubtasks: vi.fn(),
  useCreateTask: vi.fn(),
  useUpdateTaskStatus: vi.fn(),
  useUpdateTask: vi.fn(),
  useDeleteTask: vi.fn(),
  useManageTaskAssignees: vi.fn(),
  useAddTaskComment: vi.fn(),
  useMilestones: vi.fn(),
  useSprints: vi.fn(),
  useTaskLabels: vi.fn(),
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
  refetch: vi.fn(),
  push: vi.fn(),
}));

vi.mock("@/lib/hooks/use-projects", () => ({
  useTasks: mocks.useTasks,
  useTask: mocks.useTask,
  useMembers: mocks.useMembers,
  useStaffShifts: mocks.useStaffShifts,
  useSubtasks: mocks.useSubtasks,
  useCreateTask: mocks.useCreateTask,
  useUpdateTaskStatus: mocks.useUpdateTaskStatus,
  useUpdateTask: mocks.useUpdateTask,
  useDeleteTask: mocks.useDeleteTask,
  useManageTaskAssignees: mocks.useManageTaskAssignees,
  useAddTaskComment: mocks.useAddTaskComment,
  useMilestones: mocks.useMilestones,
  useSprints: mocks.useSprints,
  useTaskLabels: mocks.useTaskLabels,
}));

vi.mock("@/lib/permissions", () => ({
  usePermissions: () => ({ canManageTasks: true }),
}));

vi.mock("@/lib/feedback", () => ({
  notifySuccess: mocks.notifySuccess,
  notifyError: mocks.notifyError,
  getErrorMessage: (error: unknown, fallback?: string) =>
    (error as { message?: string })?.message || fallback || "Something went wrong. Try again",
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: mocks.push, replace: vi.fn(), back: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={typeof href === "string" ? href : "#"} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/CapacityWarningModal", () => ({
  CapacityWarningModal: () => null,
}));

vi.mock("@repo/ui/components/ui/input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

vi.mock("@repo/ui/components/ui/textarea", () => ({
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} />
  ),
}));

vi.mock("@repo/ui/components/ui/select", () => ({
  Select: ({
    value,
    onValueChange,
    disabled,
    children,
  }: {
    value?: string;
    onValueChange?: (value: string) => void;
    disabled?: boolean;
    children: React.ReactNode;
  }) => (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onValueChange?.(event.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({
    value,
    children,
    disabled,
  }: {
    value: string;
    children: React.ReactNode;
    disabled?: boolean;
  }) => (
    <option value={value} disabled={disabled}>
      {children}
    </option>
  ),
}));

import TaskDetailPage from "@/components/TaskDetailView";

const task: Task = {
  id: "task-1",
  taskKey: "PRJ-101",
  title: "Ship the redesigned task list",
  description: "Group fields and add field level errors.",
  status: "TODO",
  priority: "HIGH",
  projectId: "project-1",
  project: { id: "project-1", name: "Projects App", key: "PRJ" },
  estimatedHours: 8,
  actualHours: 3,
  assignees: [],
  comments: [],
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
};

function setupTask(
  overrides: Partial<{
    data: Task | undefined;
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    statusMutateAsync: (input: { taskId: string; status: Task["status"] }) => Promise<unknown>;
  }> = {},
) {
  const statusMutateAsync = overrides.statusMutateAsync ?? vi.fn().mockResolvedValue({});

  mocks.useTask.mockReturnValue({
    data: overrides.data === undefined && !("data" in overrides) ? task : overrides.data,
    isLoading: overrides.isLoading ?? false,
    isError: overrides.isError ?? false,
    error: overrides.error,
    refetch: mocks.refetch,
  });
  mocks.useTasks.mockReturnValue({ data: [task] });
  mocks.useMembers.mockReturnValue({ data: [] });
  mocks.useStaffShifts.mockReturnValue({ data: [] });
  mocks.useSubtasks.mockReturnValue({ data: [] });
  mocks.useCreateTask.mockReturnValue({ mutateAsync: vi.fn(), mutate: vi.fn(), isPending: false });
  mocks.useUpdateTaskStatus.mockReturnValue({
    mutateAsync: statusMutateAsync,
    mutate: vi.fn(),
    isPending: false,
  });
  mocks.useUpdateTask.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  mocks.useDeleteTask.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  mocks.useManageTaskAssignees.mockReturnValue({ mutate: vi.fn(), isPending: false });
  mocks.useAddTaskComment.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  mocks.useMilestones.mockReturnValue({ data: [] });
  mocks.useSprints.mockReturnValue({ data: [] });
  mocks.useTaskLabels.mockReturnValue({ data: [] });

  return { statusMutateAsync };
}

describe("Task detail", () => {
  beforeEach(() => {
    setupTask();
  });

  it("renders the task details, status, and priority", () => {
    render(<TaskDetailPage taskId="task-1" />);

    expect(
      screen.getByRole("heading", { name: "Ship the redesigned task list" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("PRJ-101").length).toBeGreaterThan(0);
    expect(screen.getByText("Group fields and add field level errors.")).toBeInTheDocument();

    const comboboxes = screen.getAllByRole("combobox");
    expect(comboboxes[0]).toHaveValue("TODO");
    expect(comboboxes[1]).toHaveValue("HIGH");
  });

  it("changes status and reports success", async () => {
    const { statusMutateAsync } = setupTask();
    render(<TaskDetailPage taskId="task-1" />);

    await userEvent.selectOptions(screen.getAllByRole("combobox")[0], "IN_PROGRESS");

    await waitFor(() => {
      expect(statusMutateAsync).toHaveBeenCalledWith({
        taskId: "task-1",
        status: "IN_PROGRESS",
      });
    });
    expect(mocks.notifySuccess).toHaveBeenCalledWith("Status updated");
    expect(mocks.notifyError).not.toHaveBeenCalled();
  });

  it("reports an error and keeps the current status when the change fails", async () => {
    const error = { response: { status: 500 } };
    const { statusMutateAsync } = setupTask({
      statusMutateAsync: vi.fn().mockRejectedValue(error),
    });

    render(<TaskDetailPage taskId="task-1" />);

    await userEvent.selectOptions(screen.getAllByRole("combobox")[0], "IN_PROGRESS");

    await waitFor(() => {
      expect(statusMutateAsync).toHaveBeenCalledTimes(1);
    });
    expect(mocks.notifyError).toHaveBeenCalledWith(error, "Could not change status");
    expect(mocks.notifySuccess).not.toHaveBeenCalled();
    expect(screen.getAllByRole("combobox")[0]).toHaveValue("TODO");
  });

  it("shows the missing task state with a link back to tasks", () => {
    setupTask({ data: undefined, isError: false });
    render(<TaskDetailPage taskId="task-1" />);

    expect(screen.getByRole("heading", { name: "Task not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to my tasks" })).toHaveAttribute(
      "href",
      "/tasks",
    );
  });

  it("shows the missing task state for a 404 response", () => {
    setupTask({
      data: undefined,
      isError: true,
      error: { response: { status: 404 } },
    });
    render(<TaskDetailPage taskId="task-1" />);

    expect(screen.getByRole("heading", { name: "Task not found" })).toBeInTheDocument();
    expect(screen.getByText("This item was not found")).toBeInTheDocument();
  });

  it("shows a retryable error state when loading fails", async () => {
    setupTask({
      isError: true,
      error: { message: "Cannot reach the server. Try again" },
    });
    render(<TaskDetailPage taskId="task-1" />);

    expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeInTheDocument();
    expect(screen.getByText("Cannot reach the server. Try again")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(mocks.refetch).toHaveBeenCalledTimes(1);
  });

  it("shows the shared loading state", () => {
    setupTask({ data: undefined, isLoading: true });
    render(<TaskDetailPage taskId="task-1" />);

    expect(screen.getByLabelText("Loading task detail")).toBeInTheDocument();
  });
});
