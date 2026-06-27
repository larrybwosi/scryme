"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  X,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import type { CustomerWithRelations } from "@/lib/types";
import { createFollowUp, updateFollowUp } from "@/app/actions/follow-ups";
import { getOrganizationMembers } from "@/app/actions/members";
import { toast } from "sonner";

interface FollowUpsTabProps {
  customer: CustomerWithRelations;
}

function FollowUpCard({
  followUp,
  onComplete,
}: {
  followUp: any;
  onComplete: (id: string) => void;
}) {
  const isCompleted = followUp.status === "COMPLETED";
  const isOverdue =
    followUp.status === "OVERDUE" ||
    (!isCompleted && new Date(followUp.dueDate) < new Date());
  const daysUntilDue = Math.ceil(
    (new Date(followUp.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  const assignedToName = followUp.assignedTo?.user?.name || "Unassigned";
  const assignedToInitials = assignedToName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        "bg-card rounded-xl border p-4 transition-opacity",
        isCompleted
          ? "border-border opacity-60"
          : isOverdue
            ? "border-destructive/30"
            : "border-border",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Complete toggle */}
        <button
          onClick={() => !isCompleted && onComplete(followUp.id)}
          className="mt-0.5 flex-shrink-0"
          aria-label={isCompleted ? "Completed" : "Mark as complete"}
          disabled={isCompleted}
        >
          {isCompleted ? (
            <CheckCircle2 size={18} className="text-status-success" />
          ) : (
            <Circle
              size={18}
              className="text-muted-foreground hover:text-primary transition-colors"
            />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "text-[13.5px] font-semibold",
                isCompleted
                  ? "line-through text-muted-foreground"
                  : "text-foreground",
              )}
            >
              {followUp.title}
            </span>
            <StatusBadge status={followUp.priority} size="sm" />
            <StatusBadge status={followUp.status} size="sm" />
          </div>

          {followUp.description && (
            <p className="text-[12.5px] text-muted-foreground mt-1 leading-relaxed">
              {followUp.description}
            </p>
          )}

          <div className="flex items-center gap-4 mt-3">
            {/* Due date */}
            <div className="flex items-center gap-1.5">
              {isOverdue ? (
                <AlertTriangle size={12} className="text-destructive" />
              ) : (
                <Clock size={12} className="text-muted-foreground" />
              )}
              <span
                className={cn(
                  "text-[11.5px] font-medium",
                  isOverdue
                    ? "text-destructive"
                    : isCompleted
                      ? "text-muted-foreground"
                      : daysUntilDue <= 2
                        ? "text-status-warning"
                        : "text-muted-foreground",
                )}
              >
                {isCompleted
                  ? `Completed ${followUp.completedAt ? formatDate(followUp.completedAt) : ""}`
                  : isOverdue
                    ? `Overdue · ${formatDate(followUp.dueDate)}`
                    : daysUntilDue === 0
                      ? "Due today"
                      : daysUntilDue === 1
                        ? "Due tomorrow"
                        : `Due ${formatDate(followUp.dueDate)}`}
              </span>
            </div>

            {/* Assigned to */}
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                {assignedToInitials}
              </div>
              <span className="text-[11.5px] text-muted-foreground">
                {assignedToName}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const STATUSES = ["PENDING", "COMPLETED", "OVERDUE", "CANCELLED"];

export function FollowUpsTab({ customer }: FollowUpsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [members, setMembers] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: new Date().toISOString().split("T")[0],
    priority: "MEDIUM" as any,
    assignedToId: "",
  });

  useEffect(() => {
    async function fetchMembers() {
      try {
        const data = await getOrganizationMembers(customer.organizationId);
        setMembers(data);
      } catch (error) {
        console.error("Failed to fetch members", error);
      }
    }
    fetchMembers();
  }, [customer.organizationId]);

  const followUps = customer.crmRecord?.followUps || [];

  const filtered =
    filterStatus === "All"
      ? followUps
      : followUps.filter((f) => f.status === filterStatus);

  const pendingCount = followUps.filter((f) => f.status === "PENDING").length;
  const overdueCount = followUps.filter(
    (f) =>
      f.status === "OVERDUE" ||
      (f.status === "PENDING" && new Date(f.dueDate) < new Date()),
  ).length;

  const handleComplete = async (id: string) => {
    try {
      await updateFollowUp(id, { status: "COMPLETED" });
      toast.success("Follow-up completed");
    } catch (error: any) {
      toast.error(error.message || "Failed to complete follow-up");
    }
  };

  const handleAdd = async () => {
    if (!form.title.trim() || !form.dueDate || !customer.crmRecordId) return;

    setLoading(true);
    try {
      await createFollowUp(
        {
          title: form.title.trim(),
          description: form.description.trim(),
          dueDate: new Date(form.dueDate),
          priority: form.priority,
          recordId: customer.crmRecordId,
          status: "PENDING",
          assignedToId: form.assignedToId || null,
        },
        customer.organizationId,
      );

      toast.success("Follow-up created");
      setForm({
        title: "",
        description: "",
        dueDate: new Date().toISOString().split("T")[0],
        priority: "MEDIUM",
        assignedToId: "",
      });
      setShowForm(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to create follow-up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-[15px] font-bold text-foreground">Follow-ups</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {pendingCount} pending
            {overdueCount > 0 && (
              <>
                {" "}
                &middot;{" "}
                <span className="text-destructive font-medium">
                  {overdueCount} overdue
                </span>
              </>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-lg bg-primary text-white border border-primary hover:bg-primary/90 transition-colors"
        >
          {showForm ? <X size={13} /> : <Plus size={13} />}
          {showForm ? "Cancel" : "Add Follow-up"}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mb-5 bg-card border border-primary/30 rounded-xl p-5">
          <h4 className="text-[13px] font-bold text-foreground mb-4">
            New Follow-up
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Title *
              </label>
              <input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="e.g. Send renewal proposal"
                className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Due Date *
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dueDate: e.target.value }))
                }
                className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm((f) => ({ ...f, priority: e.target.value as any }))
                }
                className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
              >
                {["HIGH", "MEDIUM", "LOW"].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Assigned To
              </label>
              <select
                value={form.assignedToId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, assignedToId: e.target.value }))
                }
                className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.user.name || m.user.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="What needs to happen?"
                rows={2}
                className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={handleAdd}
              disabled={loading || !form.title.trim() || !form.dueDate}
              className="text-[12.5px] font-semibold px-5 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Saving..." : "Save Follow-up"}
            </button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {["All", ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`text-[11.5px] font-medium px-3 py-1 rounded-full border transition-colors ${
              filterStatus === s
                ? "bg-primary text-white border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No follow-ups found"
          description={
            filterStatus === "All"
              ? "No follow-ups recorded for this customer."
              : `No follow-ups with status "${filterStatus}".`
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((f) => (
            <FollowUpCard key={f.id} followUp={f} onComplete={handleComplete} />
          ))}
        </div>
      )}
    </div>
  );
}
