"use client";

import React from "react";
import { useMembers } from "@/lib/hooks/use-projects";

export function TeamTab({ projectId }: { projectId?: string } = {}) {
  const { data: members = [], isLoading } = useMembers();

  return (
    <div className="flex flex-col w-full gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
          Organization Team & Access ({members.length})
        </h3>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {members.map((m) => (
            <div key={m.id} className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-headline-sm text-body-md">
                {m.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="font-headline-sm text-body-sm text-on-surface font-medium truncate">{m.name}</div>
                <div className="text-[11px] text-outline truncate">{m.email}</div>
                <div className="text-[10px] font-label-code text-primary uppercase mt-1">{m.role}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
