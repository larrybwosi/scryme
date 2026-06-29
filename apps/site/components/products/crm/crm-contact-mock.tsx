"use client";

import { Mail, Phone, Calendar, FileText } from "lucide-react";

const timeline = [
  {
    icon: Mail,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    title: "Email sent — Q3 Proposal",
    time: "2 hours ago",
    detail: "Sent pricing proposal to james@beaconhardware.com",
  },
  {
    icon: Phone,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    title: "Call logged — 18 min",
    time: "Yesterday",
    detail: "Discovery call with procurement lead. Needs ERP integration.",
  },
  {
    icon: Calendar,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    title: "Meeting scheduled",
    time: "Jul 22, 2025",
    detail: "Product demo — 11:00 AM via Zoom",
  },
  {
    icon: FileText,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    title: "Note added",
    time: "Jul 19, 2025",
    detail: "Decision maker is CFO. Budget confirmed at $90K.",
  },
];

export function CrmContactMock() {
  return (
    <div className="rounded-2xl border border-border bg-surface-1 shadow-xl overflow-hidden">
      {/* Contact header */}
      <div className="flex items-center gap-4 px-5 py-4 border-b border-border bg-surface-2">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
          BH
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Beacon Hardware</p>
          <p className="text-xs text-muted">James Okafor — Procurement Director</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400">
            Proposal
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-5 py-4 space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2">
          Activity timeline
        </p>
        {timeline.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex gap-3">
              <div
                className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${item.bg}`}
              >
                <Icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {item.title}
                  </p>
                  <span className="text-[10px] text-muted shrink-0">{item.time}</span>
                </div>
                <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                  {item.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
