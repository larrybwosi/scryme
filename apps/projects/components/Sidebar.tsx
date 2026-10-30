"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderKanban,
  CheckSquare,
  Kanban,
  Calendar,
  Clock,
  Milestone,
  Users,
  PlusCircle,
  FileText,
  Timer,
  CalendarDays,
  FolderDot
} from "lucide-react";

const navigation = [
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Board", href: "/board", icon: Kanban },
  { name: "Timeline / Gantt", href: "/gantt", icon: Clock },
  { name: "Calendar", href: "/calendar", icon: CalendarDays },
  { name: "Schedule", href: "/schedule", icon: Calendar },
  { name: "Milestones", href: "/milestones", icon: Milestone },
  { name: "Notes & Docs", href: "/notes-and-docs", icon: FileText },
  { name: "Time Tracking", href: "/time-tracking", icon: Timer },
  { name: "Team & Workload", href: "/team", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-[#0d0e11] border-r border-[#2E3039]/50 min-h-screen flex flex-col justify-between p-3 select-none shrink-0">
      <div>
        <div className="flex items-center justify-between px-2 py-2 mb-4 border-b border-[#2E3039]/40 pb-3">
          <Link href="/projects" className="flex items-center gap-2.5 group">
            <div className="h-7 w-7 rounded-lg bg-[#5E6AD2] flex items-center justify-center font-bold text-white text-xs shadow-sm group-hover:bg-[#717DE3] transition-colors">
              S
            </div>
            <div className="flex flex-col">
              <h1 className="font-semibold text-slate-100 text-xs tracking-tight">Scryme Workspace</h1>
              <p className="text-[10px] text-slate-400 font-mono">Nexus 2.0 Engine</p>
            </div>
          </Link>
        </div>

        <div className="px-2 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Workspace Views
        </div>

        <nav className="space-y-0.5">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[#1f1f23] text-indigo-300 border-l-2 border-[#5E6AD2] font-semibold shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#171922]"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-[#5E6AD2]" : "text-slate-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-3 border-t border-[#2E3039]/40 space-y-2">
        <Link
          href="/new"
          className="w-full flex items-center justify-center gap-2 bg-[#5E6AD2] hover:bg-[#717DE3] text-white px-3 py-2 rounded-md text-xs font-medium transition-all shadow-md"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Project / Task</span>
        </Link>
      </div>
    </aside>
  );
}
