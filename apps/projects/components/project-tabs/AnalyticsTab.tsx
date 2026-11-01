"use client";

import React from "react";
import { useTasks, useMilestones } from "@/lib/hooks/use-projects";

export function AnalyticsTab({ projectId }: { projectId: string }) {
  const { data: tasks = [] } = useTasks(projectId);
  const { data: milestones = [] } = useMilestones(projectId);

  const doneTasks = tasks.filter((t) => t.status === "DONE").length;
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "IN_REVIEW").length;
  const backlogTasks = tasks.filter((t) => t.status === "BACKLOG" || t.status === "TODO").length;

  const totalLoggedHours = tasks.reduce((acc, t) => acc + (Number(t.actualHours) || 0), 0);
  const totalEstimatedHours = tasks.reduce((acc, t) => acc + (Number(t.estimatedHours) || 0), 0);

  return (
    <div className="flex flex-col w-full gap-6">
      <div>
        <h3 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
          Project Telemetry & Analytics
        </h3>
        <p className="text-body-sm text-outline">
          Velocity metrics and burndown statistics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
          <span className="text-outline text-body-sm">Total Issues</span>
          <span className="text-headline-lg font-headline-lg text-on-surface font-semibold">{tasks.length}</span>
        </div>
        <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
          <span className="text-outline text-body-sm">Done</span>
          <span className="text-headline-lg font-headline-lg text-emerald-400 font-semibold">{doneTasks}</span>
        </div>
        <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
          <span className="text-outline text-body-sm">In Progress</span>
          <span className="text-headline-lg font-headline-lg text-primary font-semibold">{inProgressTasks}</span>
        </div>
        <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
          <span className="text-outline text-body-sm">Backlog</span>
          <span className="text-headline-lg font-headline-lg text-outline font-semibold">{backlogTasks}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-2">
          <span className="text-body-sm font-medium text-on-surface">Hours Overview</span>
          <div className="flex justify-between text-body-sm text-outline mt-2">
            <span>Logged Time:</span>
            <span className="font-label-code text-on-surface font-semibold">{totalLoggedHours}h</span>
          </div>
          <div className="flex justify-between text-body-sm text-outline">
            <span>Estimated Scope:</span>
            <span className="font-label-code text-on-surface font-semibold">{totalEstimatedHours}h</span>
          </div>
        </div>

        <div className="p-5 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-2">
          <span className="text-body-sm font-medium text-on-surface">Milestones Delivered</span>
          <div className="text-headline-lg font-semibold text-primary mt-1">
            {milestones.filter((m) => m.status === "COMPLETED").length} / {milestones.length}
          </div>
          <span className="text-[11px] text-outline font-label-code">
            {milestones.length > 0
              ? `${Math.round((milestones.filter((m) => m.status === "COMPLETED").length / milestones.length) * 100)}% completion rate`
              : "No milestones configured"}
          </span>
        </div>
      </div>
    </div>
  );
}
