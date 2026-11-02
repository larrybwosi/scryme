export interface CalendarUnifiedEvent {
  id: string;
  title: string;
  date: Date;
  startDate?: Date;
  endDate?: Date;
  type: "task" | "milestone" | "sprint" | "review";
  status?: string;
  priority?: string;
  projectId?: string;
  projectName?: string;
  color: string;
  rawItem: any;
}

export function formatEventColor(type: string, status?: string, priority?: string): string {
  if (type === "sprint") {
    return "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30";
  }
  if (type === "milestone") {
    if (status === "COMPLETED") {
      return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
    }
    return "bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold";
  }
  // Task
  if (status === "DONE") {
    return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
  }
  if (priority === "URGENT" || priority === "HIGH") {
    return "bg-amber-500/20 text-amber-300 border border-amber-500/30";
  }
  return "bg-surface-container-high text-primary border border-primary/30";
}

export function normalizeCalendarEvents(
  tasks: any[] = [],
  projects: any[] = []
): CalendarUnifiedEvent[] {
  const events: CalendarUnifiedEvent[] = [];

  // Project map for quick name resolution
  const projectMap = new Map<string, string>();
  projects.forEach((p) => {
    if (p.id) projectMap.set(p.id, p.name);
  });

  // 1. Process Tasks
  tasks.forEach((t) => {
    const rawDate = t.dueDate || t.startDate || t.createdAt;
    if (!rawDate) return;
    const parsedDate = new Date(rawDate);
    if (isNaN(parsedDate.getTime())) return;

    events.push({
      id: `task-${t.id}`,
      title: `${t.taskKey || t.id.slice(-6)}: ${t.title}`,
      date: parsedDate,
      startDate: t.startDate ? new Date(t.startDate) : undefined,
      endDate: t.dueDate ? new Date(t.dueDate) : undefined,
      type: "task",
      status: t.status,
      priority: t.priority,
      projectId: t.projectId,
      projectName: projectMap.get(t.projectId) || t.project?.name,
      color: formatEventColor("task", t.status, t.priority),
      rawItem: t,
    });
  });

  // 2. Process Project Milestones & Sprints embedded in projects
  projects.forEach((p) => {
    if (Array.isArray(p.milestones)) {
      p.milestones.forEach((m: any) => {
        if (!m.dueDate) return;
        const parsedDate = new Date(m.dueDate);
        if (isNaN(parsedDate.getTime())) return;

        events.push({
          id: `milestone-${m.id}`,
          title: `Milestone: ${m.title}`,
          date: parsedDate,
          endDate: parsedDate,
          type: "milestone",
          status: m.status,
          projectId: p.id,
          projectName: p.name,
          color: formatEventColor("milestone", m.status),
          rawItem: m,
        });
      });
    }

    if (Array.isArray(p.sprints)) {
      p.sprints.forEach((s: any) => {
        const rawDate = s.endDate || s.startDate || s.createdAt;
        if (!rawDate) return;
        const parsedDate = new Date(rawDate);
        if (isNaN(parsedDate.getTime())) return;

        events.push({
          id: `sprint-${s.id}`,
          title: `Sprint: ${s.name}`,
          date: parsedDate,
          startDate: s.startDate ? new Date(s.startDate) : undefined,
          endDate: s.endDate ? new Date(s.endDate) : undefined,
          type: "sprint",
          status: s.status,
          projectId: p.id,
          projectName: p.name,
          color: formatEventColor("sprint", s.status),
          rawItem: s,
        });
      });
    }
  });

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}
