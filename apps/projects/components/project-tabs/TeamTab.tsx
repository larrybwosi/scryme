"use client";

import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import { useMembers } from "@/lib/hooks/use-projects";
import { MemberPerformanceDrawer } from "@/components/MemberPerformanceDrawer";

export function TeamTab({ projectId }: { projectId?: string } = {}) {
  const { data: members = [], isLoading } = useMembers();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  return (
    <div className="flex flex-col w-full gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
            Organization Team & Access ({members.length})
          </h3>
          <p className="font-body-sm text-body-sm text-outline mt-1">
            Click on any member card to inspect real-time performance analytics, velocity, on-time rate, and active workloads.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="p-8 text-center text-outline text-body-sm">Loading team members...</div>
      )}

      {!isLoading && members.length === 0 && (
        <div className="p-8 text-center text-outline text-body-sm border border-dashed border-outline-variant/30 rounded-lg">
          No members found in this organization.
        </div>
      )}

      {!isLoading && members.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {members.map((m) => (
            <div
              key={m.id}
              onClick={() => setSelectedMemberId(m.id)}
              className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 hover:border-primary-container/60 hover:bg-surface-container cursor-pointer transition-all flex items-center justify-between shadow-xs group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-headline-sm text-body-md font-semibold shrink-0">
                  {m.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="font-headline-sm text-body-sm text-on-surface font-medium truncate group-hover:text-primary transition-colors">
                    {m.name}
                  </div>
                  <div className="text-[11px] text-outline truncate">{m.email}</div>
                  <div className="text-[10px] font-label-code text-primary uppercase mt-1">
                    {m.role}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-outline group-hover:text-on-surface transition-colors">
                <span className="text-[11px] font-medium hidden sm:inline">Analytics</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Member Performance Drawer */}
      <MemberPerformanceDrawer
        isOpen={!!selectedMemberId}
        memberId={selectedMemberId}
        onClose={() => setSelectedMemberId(null)}
      />
    </div>
  );
}
