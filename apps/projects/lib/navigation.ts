import type { LucideIcon } from "lucide-react";
import {
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  ChartNoAxesCombined,
  FolderKanban,
  GanttChartSquare,
  KanbanSquare,
  ListTodo,
  Timer,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  command: string;
  matchPrefixes?: string[];
}

export interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "views",
    title: "Views",
    items: [
      {
        label: "Tasks",
        href: "/tasks",
        icon: ListTodo,
        command: "Go to tasks",
        matchPrefixes: ["/tasks"],
      },
      {
        label: "Board",
        href: "/board",
        icon: KanbanSquare,
        command: "Go to board",
      },
      {
        label: "Timeline",
        href: "/gantt",
        icon: GanttChartSquare,
        command: "Go to timeline",
      },
      {
        label: "Calendar",
        href: "/calendar",
        icon: CalendarDays,
        command: "Go to calendar",
      },
      {
        label: "Schedule",
        href: "/schedule",
        icon: CalendarClock,
        command: "Go to schedule",
      },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    items: [
      {
        label: "Projects",
        href: "/projects",
        icon: FolderKanban,
        command: "Go to projects",
      },
      {
        label: "Bookings",
        href: "/bookings",
        icon: CalendarCheck,
        command: "Go to bookings",
      },
      {
        label: "Time tracking",
        href: "/time-tracking",
        icon: Timer,
        command: "Go to time tracking",
      },
      {
        label: "Performance",
        href: "/performance",
        icon: ChartNoAxesCombined,
        command: "Go to performance",
      },
    ],
  },
];

export const CREATE_COMMANDS = [
  {
    label: "Create task",
    href: "/new?type=TASK",
    icon: ListTodo,
    command: "Create task",
    shortcut: "C",
  },
  {
    label: "Create project",
    href: "/new?type=PROJECT",
    icon: FolderKanban,
    command: "Create project",
    shortcut: "P",
  },
];

export const SIDEBAR_COLLAPSED_KEY = "scryme_projects_sidebar_collapsed";

export function isPathActive(
  pathname: string,
  item: Pick<NavItem, "href" | "matchPrefixes">,
) {
  const prefixes = item.matchPrefixes ?? [item.href];
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface";
