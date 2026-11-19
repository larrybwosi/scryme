import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  useTasks: vi.fn(),
  useServiceBookings: vi.fn(),
  useWeeklyTimesheets: vi.fn(),
  refetchTasks: vi.fn(),
}));

vi.mock("@/lib/hooks/use-projects", () => ({
  useTasks: mocks.useTasks,
  useServiceBookings: mocks.useServiceBookings,
  useWeeklyTimesheets: mocks.useWeeklyTimesheets,
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

import { NotificationPanel } from "@/components/NotificationPanel";

function setData({
  tasks = [],
  bookings = [],
  timesheets = [],
}: {
  tasks?: unknown[];
  bookings?: unknown[];
  timesheets?: unknown[];
}) {
  mocks.useTasks.mockReturnValue({
    data: tasks,
    isLoading: false,
    isError: false,
    refetch: mocks.refetchTasks,
  });
  mocks.useServiceBookings.mockReturnValue({
    data: bookings,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  });
  mocks.useWeeklyTimesheets.mockReturnValue({
    data: timesheets,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  });
}

describe("Notification panel", () => {
  it("shows overdue tasks, booking conflicts, and pending approvals with source links", async () => {
    setData({
      tasks: [
        {
          id: "task-1",
          title: "Fix overdue task",
          status: "TODO",
          dueDate: "2020-01-01T10:00:00.000Z",
        },
        {
          id: "task-2",
          title: "Completed task",
          status: "DONE",
          dueDate: "2026-11-01T10:00:00.000Z",
        },
      ],
      bookings: [
        {
          id: "booking-1",
          serviceName: "Deep clean",
          conflicts: [{ id: "conflict-1", message: "Staff overlap" }],
        },
      ],
      timesheets: [
        {
          memberId: "member-1",
          memberName: "Ada",
          weekStartDate: "2026-11-16T00:00:00.000Z",
          status: "SUBMITTED",
          totalHours: 8,
        },
        {
          memberId: "member-2",
          memberName: "Grace",
          weekStartDate: "2026-11-16T00:00:00.000Z",
          status: "APPROVED",
          totalHours: 8,
        },
      ],
    });

    render(<NotificationPanel />);

    await userEvent.click(screen.getByRole("button", { name: "Notifications, 3 new" }));

    expect(screen.getByRole("link", { name: /Fix overdue task/ })).toHaveAttribute(
      "href",
      "/tasks/task-1",
    );
    expect(screen.getByRole("link", { name: /Staff overlap/ })).toHaveAttribute(
      "href",
      "/bookings?booking=booking-1",
    );
    expect(screen.getByRole("link", { name: /Ada timesheet/ })).toHaveAttribute(
      "href",
      "/time-tracking?tab=approvals&week=2026-11-16T00%3A00%3A00.000Z",
    );
    expect(screen.queryByText("Completed task")).not.toBeInTheDocument();
    expect(screen.queryByText("Grace timesheet")).not.toBeInTheDocument();
  });

  it("shows the all caught up state when there is nothing to report", async () => {
    setData({});

    render(<NotificationPanel />);

    await userEvent.click(screen.getByRole("button", { name: "Notifications" }));

    expect(screen.getByText("You are all caught up.")).toBeInTheDocument();
  });

  it("hides only the failing group and offers a retry", async () => {
    setData({});
    mocks.useTasks.mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
      refetch: mocks.refetchTasks,
    });

    render(<NotificationPanel />);

    await userEvent.click(screen.getByRole("button", { name: "Notifications" }));

    expect(screen.getByText("Could not load overdue tasks")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.getByText("No booking conflicts")).toBeInTheDocument();
    expect(screen.getByText("No pending approvals")).toBeInTheDocument();
  });
});
