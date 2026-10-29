"use client";

import { useState } from "react";
import { useMilestones, useCreateMilestone } from "@/lib/hooks/use-projects";
import { Milestone as MilestoneIcon, Plus, CheckCircle2, Clock, AlertCircle, Calendar } from "lucide-react";

export default function MilestonesPage() {
  const projectId = "proj-1";
  const { data: milestones = [], isLoading } = useMilestones(projectId);
  const createMilestoneMutation = useCreateMilestone(projectId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createMilestoneMutation.mutate(
      {
        title,
        description,
        dueDate,
        projectId,
        status: "PLANNED",
      },
      {
        onSuccess: () => {
          setTitle("");
          setDescription("");
          setDueDate("");
          setIsModalOpen(false);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <MilestoneIcon className="h-6 w-6 text-indigo-400" /> Project Milestones
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track key delivery goals, target deadlines, and project baseline progress.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md shadow-indigo-600/20"
        >
          <Plus className="h-4 w-4" /> Add Milestone
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#121824] border border-[#1F293D] p-5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase">Total Milestones</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">{milestones.length}</div>
          </div>
          <MilestoneIcon className="h-6 w-6 text-indigo-400" />
        </div>

        <div className="bg-[#121824] border border-[#1F293D] p-5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase">In Progress</div>
            <div className="text-2xl font-bold text-indigo-400 mt-1">
              {milestones.filter((m) => m.status === "IN_PROGRESS").length}
            </div>
          </div>
          <Clock className="h-6 w-6 text-indigo-400" />
        </div>

        <div className="bg-[#121824] border border-[#1F293D] p-5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase">Completed</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              {milestones.filter((m) => m.status === "COMPLETED").length}
            </div>
          </div>
          <CheckCircle2 className="h-6 w-6 text-emerald-400" />
        </div>
      </div>

      <div className="bg-[#121824] border border-[#1F293D] rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-100">Milestone Timeline</h2>

        {isLoading ? (
          <div className="py-12 text-center text-slate-500 text-sm">Loading milestones...</div>
        ) : milestones.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">No milestones created yet.</div>
        ) : (
          <div className="space-y-4">
            {milestones.map((milestone) => (
              <div
                key={milestone.id}
                className="bg-[#0B0F17] border border-[#1F293D] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-100">{milestone.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        milestone.status === "COMPLETED"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : milestone.status === "IN_PROGRESS"
                          ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                          : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                      }`}
                    >
                      {milestone.status}
                    </span>
                  </div>
                  {milestone.description && (
                    <p className="text-xs text-slate-400">{milestone.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono bg-[#121824] px-3 py-1.5 rounded-lg border border-[#1F293D] self-start sm:self-auto">
                  <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Due: {milestone.dueDate || "Not set"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121824] border border-[#1F293D] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-semibold text-slate-100">Add New Milestone</h3>
            <form onSubmit={handleCreateMilestone} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Milestone Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Release v1.0 Production Readiness"
                  className="w-full bg-[#0B0F17] border border-[#1F293D] rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Scope criteria and verification targets..."
                  className="w-full bg-[#0B0F17] border border-[#1F293D] rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-[#1F293D] rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-[#1F293D] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMilestoneMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded text-xs font-medium shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {createMilestoneMutation.isPending ? "Saving..." : "Save Milestone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
