"use client";

import React from "react";
import { CheckSquare, Sparkles, User, FileText, CheckCircle2 } from "lucide-react";

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string | null;
  stage: "PRE_SERVICE" | "IN_SERVICE" | "POST_SERVICE";
  isRequired: boolean;
  isCompleted: boolean;
  completedAt?: string | null;
  completedBy?: {
    user?: {
      name?: string | null;
    } | null;
  } | null;
}

export interface BookingTaskItem {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  stage?: string;
  assignedTo?: {
    user?: {
      name?: string | null;
    } | null;
  } | null;
  checklistItems: ChecklistItem[];
}

interface ChecklistInspectorProps {
  tasks: BookingTaskItem[];
  bookingId: string;
  onToggleItem: (itemId: string, currentVal: boolean) => Promise<void>;
  onGenerateTasks?: () => Promise<void>;
  isGenerating?: boolean;
}

const stageLabels: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  PRE_SERVICE: { label: "Pre-Service Preparation", icon: FileText },
  IN_SERVICE: { label: "Active Service Execution", icon: CheckSquare },
  POST_SERVICE: { label: "Post-Service & Handover", icon: CheckCircle2 },
};

export function ChecklistInspector({
  tasks = [],
  bookingId,
  onToggleItem,
  onGenerateTasks,
  isGenerating = false,
}: ChecklistInspectorProps) {
  const allItems = tasks.flatMap((t) => t.checklistItems || []);
  const completedCount = allItems.filter((i) => i.isCompleted).length;
  const progressPercent = allItems.length > 0 ? Math.round((completedCount / allItems.length) * 100) : 0;

  return (
    <div className="bg-surface-container rounded-xl border border-outline-variant/40 p-4 space-y-4">
      {/* Header and Progress Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-on-surface flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-primary" />
            Service Tasks & Checklists
          </h4>
          <p className="text-xs text-on-surface-variant">
            {completedCount} of {allItems.length} checklist items completed ({progressPercent}%)
          </p>
        </div>

        {tasks.length === 0 && onGenerateTasks && (
          <button
            type="button"
            disabled={isGenerating}
            onClick={onGenerateTasks}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-black hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generate Tasks & Checklist
          </button>
        )}
      </div>

      {allItems.length > 0 && (
        <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Task Groups with Checklists */}
      {tasks.length === 0 ? (
        <div className="py-8 text-center text-xs text-outline border border-dashed border-outline-variant/40 rounded-lg">
          <FileText className="w-8 h-8 mx-auto mb-1 text-outline/50 block" />
          No operational tasks or checklist items generated yet for this booking.
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const stageConfig = stageLabels[task.stage || ""] || {
              label: task.title,
              icon: FileText,
            };
            const StageIcon = stageConfig.icon;

            return (
              <div key={task.id} className="bg-surface-container-low rounded-lg p-3 border border-outline-variant/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StageIcon className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-on-surface">{task.title}</span>
                  </div>
                  {task.assignedTo && (
                    <span className="text-[11px] text-outline flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {task.assignedTo.user?.name || "Assigned"}
                    </span>
                  )}
                </div>

                {task.checklistItems && task.checklistItems.length > 0 ? (
                  <div className="divide-y divide-outline-variant/20 pt-1">
                    {task.checklistItems.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-start gap-2.5 py-2 cursor-pointer hover:bg-surface-container/40 px-1 rounded transition-colors group"
                      >
                        <input
                          type="checkbox"
                          checked={item.isCompleted}
                          onChange={() => onToggleItem(item.id, item.isCompleted)}
                          className="mt-0.5 rounded border-outline-variant/60 text-primary focus:ring-primary h-3.5 w-3.5 bg-surface-container-high"
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs ${
                              item.isCompleted
                                ? "line-through text-outline"
                                : "text-on-surface font-medium"
                            }`}
                          >
                            {item.title}
                            {item.isRequired && (
                              <span className="text-amber-400 text-[10px] ml-1.5">*required</span>
                            )}
                          </p>
                          {item.description && (
                            <p className="text-[11px] text-on-surface-variant truncate">
                              {item.description}
                            </p>
                          )}
                          {item.isCompleted && item.completedBy?.user?.name && (
                            <p className="text-[10px] text-emerald-400 mt-0.5">
                              Completed by {item.completedBy.user.name}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-outline italic">No checklist items defined.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
