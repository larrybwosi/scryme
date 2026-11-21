import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Task } from "@/lib/api";

const mocks = vi.hoisted(() => ({
  useMyTasks: vi.fn(),
  useProjects: vi.fn(),
  useWorkspaceContext: vi.fn(),
  useUpdateTaskStatus: vi.fn(),
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
  notifyWarning: vi.fn(),
}));

vi.mock("@/lib/hooks/use-projects", () => ({
  useMyTasks: mocks.useMyTasks,
  useProjects: mocks.useProjects,
  useWorkspaceContext: mocks.useWorkspaceContext,
  useUpdateTaskStatus: mocks.useUpdateTaskStatus,
}));

vi.mock("@/lib/permissions", () => ({
  usePermissions: () => ({ canManageTasks: true }),
}));

vi.mock("@/lib/feedback", () => ({
  notifySuccess: mocks.notifySuccess,
  notifyError: mocks.notifyError,
  notifyWarning: mocks.notifyWarning,
  getErrorMessage: (error: unknown, fallback?: string) =>
    (error as { response?: { status?: number } })?.response?.status === 404
      ? "This item was not found"
      : fallback ?? "Something went wrong. Try again",
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
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

vi.mock("@/components/CreateTaskModal", () => ({
  CreateTaskModal: () => null,
}));

vi.mock("@repo/ui/components/ui/input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
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
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

import TasksPage from "@/app/tasks/page";

const baseTask: Task = {
  id: "task-1",
  taskKey: "PRJ-101",
  title: "Ship the redesigned task list",
  status: "TODO",
  priority: "HIGH",
  projectId: "project-1",
  project: { id: "project-1", name: "Projects", key: "PRJ" },
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
};

function mockTasks(
  overrides: Partial<{
    data: Task[];
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    refetch: () => void;
    mutateAsync: (input: { taskId: string; status: Task["status"] }) => Promise<unknown>;
    isPending: boolean;
  }> = {},
) {
  const mutateAsync = overrides.mutateAsync ?? vi.fn().mockResolvedValue({});
  const refetch = overrides.refetch ?? vi.fn();

  mocks.useWorkspaceContext.mockReturnValue({ data: { memberId: "member-1" } });
  mocks.useMyTasks.mockReturnValue({
    data: overrides.data ?? [baseTask],
    isLoading: overrides.isLoading ?? false,
    isError: overrides.isError ?? false,
    error: overrides.error,
    refetch,
  });
  mocks.useProjects.mockReturnValue({ data: [] });
  mocks.useUpdateTaskStatus.mockReturnValue({
    mutateAsync,
    isPending: overrides.isPending ?? false,
  });

  return { mutateAsync, refetch };
}

describe("Tasks list", () => {
  beforeEach(() => {
    mockTasks();
  });

  it("renders tasks with links into the task detail route", () => {
    render(<TasksPage />);

    expect(screen.getByText("Ship the redesigned task list")).toBeInTheDocument();
    expect(screen.getByText("PRJ-101")).toBeInTheDocument();

    const links = screen.getAllByRole("link", { name: /Ship the redesigned task list|PRJ-101/ });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAttribute("href", "/tasks/task-1");
    }
  });

  it("shows the shared empty state when there are no tasks", () => {
    mockTasks({ data: [] });
    render(<TasksPage />);

    expect(screen.getByRole("heading", { name: "No tasks assigned to you" })).toBeInTheDocument();
    expect(
      screen.getByText("When tasks are assigned to you, they will appear here."),
    ).toBeInTheDocument();
  });

  it("shows an error state with retry and a back link", async () => {
    const refetch = vi.fn();
    mockTasks({
      data: [],
      isError: true,
      error: { response: { status: 500 } },
      refetch,
    });

    render(<TasksPage />);

    expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeInTheDocument();
    expect(screen.getByText("Could not load tasks")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalledTimes(1);

    expect(screen.getByRole("link", { name: "Back to projects" })).toHaveAttribute(
      "href",
      "/projects",
    );
  });

  it("changes status through confirmation and reports success", async () => {
    const { mutateAsync } = mockTasks();
    render(<TasksPage />);

    await userEvent.click(
      screen.getByRole("button", { name: "Mark Ship the redesigned task list done" }),
    );

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Mark task done?")).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole("button", { name: "Mark done" }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({ taskId: "task-1", status: "DONE" });
    });
    expect(mocks.notifySuccess).toHaveBeenCalledWith("Status updated");
    expect(mocks.notifyError).not.toHaveBeenCalled();
  });

  it("keeps the previous status and reports an error when the status change fails", async () => {
    const error = { response: { status: 500 } };
    const { mutateAsync } = mockTasks({
      mutateAsync: vi.fn().mockRejectedValue(error),
    });

    render(<TasksPage />);

    await userEvent.click(
      screen.getByRole("button", { name: "Mark Ship the redesigned task list done" }),
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Mark done" }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledTimes(1);
    });

    expect(mocks.notifyError).toHaveBeenCalledWith(error, "Could not change status");
    expect(mocks.notifySuccess).not.toHaveBeenCalled();
    expect(screen.getByText("TODO")).toBeInTheDocument();
    expect(screen.queryByText("DONE")).not.toBeInTheDocument();
  });
});
