"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderKanban,
  CheckSquare,
  Calendar,
  Clock,
  Milestone,
  Users,
  Settings,
  PlusCircle,
} from "lucide-react";

const navigation = [
  { name: "Projects", href: "/", icon: FolderKanban },
  { name: "Tasks & Kanban", href: "/tasks", icon: CheckSquare },
  { name: "Schedule & Shifts", href: "/schedule", icon: Calendar },
  { name: "Milestones", href: "/milestones", icon: Milestone },
  { name: "Gantt Timeline", href: "/gantt", icon: Clock },
  { name: "Team & Assignments", href: "/team", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#121824] border-r border-[#1F293D] min-h-screen flex flex-col justify-between p-4">
      <div>
        <div className="flex items-center gap-3 px-3 py-2 mb-6">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
            P
          </div>
          <div>
            <h1 className="font-semibold text-slate-100 text-sm tracking-wide">Scryme Projects</h1>
            <p className="text-xs text-slate-400">Task & Schedule Hub</p>
          </div>
        </div>

        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#1A2333]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-[#1F293D] space-y-2">
        <Link
          href="/new"
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-indigo-500/20"
        >
          <PlusCircle className="h-4 w-4" />
          New Project
        </Link>
        <div className="flex items-center gap-2 text-xs text-slate-500 px-3 py-2">
          <Settings className="h-3.5 w-3.5" />
          <span>V3 Enterprise Engine</span>
        </div>
      </div>
    </aside>
  );
}
