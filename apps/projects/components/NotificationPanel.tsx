"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  CalendarCheck,
  CheckCheck,
  Clock,
  Loader2,
  RotateCw,
} from "lucide-react";
import { Dialog } from "@/components/Dialog";
import {
  useServiceBookings,
  useTasks,
  useWeeklyTimesheets,
} from "@/lib/hooks/use-projects";
import { startOfWeek } from "@/lib/metrics";

interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  href: string;
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function GroupShell({
  title,
  count,
  loading,
  error,
  onRetry,
  items,
  icon: Icon,
  emptyText,
}: {
  title: string;
  count: number;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  items: NotificationItem[];
  icon: React.ComponentType<{ className?: string }>;
  emptyText: string;
}) {
  if (error) {
    return (
      <section className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="flex items-center gap-2 font-body-sm text-body-sm text-outline">
          <AlertTriangle className="h-4 w-4 text-status-warning" aria-hidden />
          Could not load {title.toLowerCase()}
        </span>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-body-sm text-body-sm text-primary transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <RotateCw className="h-3 w-3" aria-hidden />
          Retry
        </button>
      </section>
    );
  }

  return (
    <section aria-label={title}>
      <h3 className="flex items-center gap-2 border-b border-outline-variant px-4 py-2 font-label-badge text-label-badge uppercase tracking-wider text-outline">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        <span>{title}</span>
        {count > 0 && (
          <span className="rounded-sm bg-surface-container-high px-1.5 py-0.5 font-label-code text-[10px] text-on-surface">
            {count}
          </span>
        )}
      </h3>
      {loading ? (
        <div
          className="flex items-center gap-2 px-4 py-3 font-body-sm text-body-sm text-outline"
          role="status"
        >
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          Loading
        </div>
      ) : items.length === 0 ? (
        <p className="px-4 py-3 font-body-sm text-body-sm text-outline">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-outline-variant/40">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex flex-col gap-0.5 px-4 py-2.5 transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
              >
                <span className="truncate font-body-sm text-body-sm font-medium text-on-surface">
                  {item.title}
                </span>
                <span className="truncate font-body-sm text-[11px] text-outline">{item.detail}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function NotificationPanel() {
  const [open, setOpen] = useState(false);

  const tasksQuery = useTasks();
  const bookingsQuery = useServiceBookings();
  const weekStartDate = useMemo(() => startOfWeek(new Date()).toISOString(), []);
  const timesheetsQuery = useWeeklyTimesheets(undefined, weekStartDate);

  const overdueItems = useMemo<NotificationItem[]>(() => {
    const today = startOfLocalDay(new Date());

    return (tasksQuery.data ?? [])
      .filter((task) => {
        if (!task.dueDate) return false;
        if (task.status === "DONE" || task.status === "CANCELED") return false;
        const due = new Date(task.dueDate);
        return !Number.isNaN(due.getTime()) && due < today;
      })
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .map((task) => ({
        id: `task-${task.id}`,
        title: task.title,
        detail: `Due ${new Date(task.dueDate!).toLocaleDateString()}`,
        href: `/tasks/${task.id}`,
      }));
  }, [tasksQuery.data]);

  const conflictItems = useMemo<NotificationItem[]>(() => {
    return (bookingsQuery.data ?? []).flatMap((booking) =>
      (booking.conflicts ?? []).map((conflict, index) => ({
        id: `booking-${booking.id}-${conflict.id || index}`,
        title: conflict.message || conflict.description || "Booking conflict",
        detail: booking.serviceName,
        href: `/bookings?booking=${booking.id}`,
      })),
    );
  }, [bookingsQuery.data]);

  const approvalItems = useMemo<NotificationItem[]>(() => {
    return (timesheetsQuery.data ?? [])
      .filter((timesheet) => timesheet.status !== "APPROVED" && timesheet.status !== "REJECTED")
      .map((timesheet) => ({
        id: `timesheet-${timesheet.memberId}-${timesheet.weekStartDate}`,
        title: `${timesheet.memberName || "Member"} timesheet`,
        detail: `${timesheet.totalHours}h for week of ${new Date(timesheet.weekStartDate).toLocaleDateString()}`,
        href: `/time-tracking?tab=approvals&week=${encodeURIComponent(timesheet.weekStartDate)}`,
      }));
  }, [timesheetsQuery.data]);

  const totalCount = overdueItems.length + conflictItems.length + approvalItems.length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={
          totalCount > 0 ? `Notifications, ${totalCount} new` : "Notifications"
        }
        title="Notifications"
        className="relative flex h-8 w-8 items-center justify-center rounded-sm text-outline transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        <Bell className="h-4 w-4" aria-hidden />
        {totalCount > 0 && (
          <span
            aria-hidden
            className="absolute right-0.5 top-0.5 flex min-w-3.5 items-center justify-center rounded-full bg-primary-container px-1 font-label-code text-[9px] font-semibold leading-3 text-on-primary-container"
          >
            {totalCount > 9 ? "9+" : totalCount}
          </span>
        )}
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Notifications"
        description="Overdue work, booking conflicts, and pending approvals"
        align="right"
        className="mt-0 max-w-md"
      >
        <div className="divide-y divide-outline-variant">
          <GroupShell
            title="Overdue tasks"
            count={overdueItems.length}
            loading={tasksQuery.isLoading}
            error={tasksQuery.isError}
            onRetry={() => tasksQuery.refetch()}
            items={overdueItems}
            icon={Clock}
            emptyText="No overdue tasks"
          />
          <GroupShell
            title="Booking conflicts"
            count={conflictItems.length}
            loading={bookingsQuery.isLoading}
            error={bookingsQuery.isError}
            onRetry={() => bookingsQuery.refetch()}
            items={conflictItems}
            icon={CalendarCheck}
            emptyText="No booking conflicts"
          />
          <GroupShell
            title="Pending approvals"
            count={approvalItems.length}
            loading={timesheetsQuery.isLoading}
            error={timesheetsQuery.isError}
            onRetry={() => timesheetsQuery.refetch()}
            items={approvalItems}
            icon={CheckCheck}
            emptyText="No pending approvals"
          />
        </div>
        {!tasksQuery.isLoading &&
          !bookingsQuery.isLoading &&
          !timesheetsQuery.isLoading &&
          totalCount === 0 &&
          !tasksQuery.isError &&
          !bookingsQuery.isError &&
          !timesheetsQuery.isError && (
            <div className="flex items-center justify-center gap-2 border-t border-outline-variant px-4 py-3 font-body-sm text-body-sm text-outline">
              <CheckCheck className="h-4 w-4 text-status-success" aria-hidden />
              You are all caught up.
            </div>
          )}
      </Dialog>
    </>
  );
}
