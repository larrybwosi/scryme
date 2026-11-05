export interface ProjectItem {
  id: string;
  name: string;
  tagline: string;
  badge?: string;
  badgeColor?: string;
  health: "On Track" | "At Risk" | "Planning" | "Critical";
  healthColor: string;
  targetDate: string;
  sprint: string;
  progress: number;
  totalIssues: number;
  closedIssues: number;
  inProgressIssues: number;
  backlogIssues: number;
  status: "in-progress" | "planning" | "paused" | "completed";
  leadName: string;
  leadAvatar: string;
}

export const INITIAL_PROJECTS: ProjectItem[] = [
  {
    id: "prj-204",
    name: "Nexus 2.0 Redesign",
    tagline: "Next-gen UI engine & unified tokens",
    badge: "Flagship",
    badgeColor: "bg-surface-container-highest text-primary",
    health: "On Track",
    healthColor: "bg-emerald-400",
    targetDate: "Oct 29",
    sprint: "Sprint 14",
    progress: 68,
    totalIssues: 58,
    closedIssues: 39,
    inProgressIssues: 12,
    backlogIssues: 7,
    status: "in-progress",
    leadName: "Elena Rostova",
    leadAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces",
  },
  {
    id: "prj-102",
    name: "Core Engine v3",
    tagline: "Zero-latency telemetry pipeline",
    badge: "Infra",
    badgeColor: "bg-surface-container-highest text-secondary",
    health: "At Risk",
    healthColor: "bg-amber-400",
    targetDate: "Nov 12",
    sprint: "Sprint 16",
    progress: 42,
    totalIssues: 74,
    closedIssues: 31,
    inProgressIssues: 24,
    backlogIssues: 19,
    status: "in-progress",
    leadName: "Marcus Vance",
    leadAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=faces",
  },
  {
    id: "prj-108",
    name: "Enterprise SSO & RBAC",
    tagline: "SAML 2.0, Okta, and SCIM automated sync",
    badge: "Security",
    badgeColor: "bg-surface-container-highest text-on-surface",
    health: "On Track",
    healthColor: "bg-emerald-400",
    targetDate: "Nov 04",
    sprint: "Sprint 15",
    progress: 84,
    totalIssues: 26,
    closedIssues: 22,
    inProgressIssues: 3,
    backlogIssues: 1,
    status: "in-progress",
    leadName: "Sarah Chen",
    leadAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&crop=faces",
  },
  {
    id: "prj-210",
    name: "Design Tokens Sync",
    tagline: "Automated Figma-to-Tailwind compilation CLI",
    badge: "Tooling",
    badgeColor: "bg-surface-container-highest text-outline",
    health: "Planning",
    healthColor: "bg-sky-400",
    targetDate: "Nov 20",
    sprint: "Sprint 15",
    progress: 15,
    totalIssues: 18,
    closedIssues: 3,
    inProgressIssues: 5,
    backlogIssues: 10,
    status: "planning",
    leadName: "Taro Tanaka",
    leadAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop&crop=faces",
  },
];

export interface TaskItem {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  status: "Backlog" | "Todo" | "In Progress" | "In Review" | "Done";
  priority: "Urgent" | "High" | "Medium" | "Low";
  assigneeName: string;
  assigneeAvatar: string;
  dueDate: string;
  cycle: string;
  completed?: boolean;
}

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: "SCR-104",
    title: "Interactive Analytics Dashboard & Real-time Canvas",
    projectId: "prj-204",
    projectName: "Nexus 2.0 Redesign",
    status: "In Progress",
    priority: "Urgent",
    assigneeName: "Elena Rostova",
    assigneeAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces",
    dueDate: "Oct 24",
    cycle: "Sprint 14",
  },
  {
    id: "SCR-102",
    title: "Implement WebGL 60FPS memory-mapped viewport pipeline",
    projectId: "prj-204",
    projectName: "Nexus 2.0 Redesign",
    status: "In Progress",
    priority: "High",
    assigneeName: "Marcus Vance",
    assigneeAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=faces",
    dueDate: "Oct 25",
    cycle: "Sprint 14",
  },
  {
    id: "SCR-103",
    title: "Design tokens schema validation with Zod runtime guards",
    projectId: "prj-204",
    projectName: "Nexus 2.0 Redesign",
    status: "In Review",
    priority: "Medium",
    assigneeName: "Sarah Chen",
    assigneeAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&crop=faces",
    dueDate: "Oct 26",
    cycle: "Sprint 14",
  },
  {
    id: "SCR-101",
    title: "Configure Turborepo v2 build caching and pruned Dockerfiles",
    projectId: "prj-102",
    projectName: "Core Engine v3",
    status: "Done",
    priority: "High",
    assigneeName: "David Kim",
    assigneeAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop&crop=faces",
    dueDate: "Oct 21",
    cycle: "Sprint 14",
    completed: true,
  },
  {
    id: "SCR-105",
    title: "SAML 2.0 Identity Provider automated metadata rotation",
    projectId: "prj-108",
    projectName: "Enterprise SSO & RBAC",
    status: "Todo",
    priority: "High",
    assigneeName: "Elena Rostova",
    assigneeAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces",
    dueDate: "Oct 28",
    cycle: "Sprint 15",
  },
  {
    id: "SCR-106",
    title: "STOMP WebSocket reconnection exponential backoff jitter",
    projectId: "prj-204",
    projectName: "Nexus 2.0 Redesign",
    status: "Todo",
    priority: "Medium",
    assigneeName: "Marcus Vance",
    assigneeAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=faces",
    dueDate: "Oct 29",
    cycle: "Sprint 14",
  },
  {
    id: "SCR-110",
    title: "SCIM 2.0 User and Group provisioning webhooks handler",
    projectId: "prj-108",
    projectName: "Enterprise SSO & RBAC",
    status: "Backlog",
    priority: "Low",
    assigneeName: "Sarah Chen",
    assigneeAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&crop=faces",
    dueDate: "Nov 05",
    cycle: "Sprint 15",
  },
  {
    id: "SCR-112",
    title: "PostgreSQL read-replica connection pool health checks",
    projectId: "prj-102",
    projectName: "Core Engine v3",
    status: "Backlog",
    priority: "Urgent",
    assigneeName: "David Kim",
    assigneeAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop&crop=faces",
    dueDate: "Nov 08",
    cycle: "Sprint 15",
  },
];
