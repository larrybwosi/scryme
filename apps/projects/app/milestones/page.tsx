"use client";

import { useEffect, useState } from "react";
import { ProjectsAPI, Milestone } from "@/lib/api";
import { Milestone as MilestoneIcon, Plus, Calendar, CheckCircle2, Flag } from "lucide-react";

export default function MilestonesPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    ProjectsAPI.getProjectMilestones("proj-1").then(setMilestones);
  }, []);

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const created = await ProjectsAPI.createMilestone({
      title,
      description,
      dueDate,
      projectId: "proj-1",
    });

    setMilestones((prev) => [created, ...prev]);
    setTitle("");
    setDescription("");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <MilestoneIcon className="h-6 w-6 text-indigo-400" /> Milestones Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track major deliverables, release gates, and target target completion dates.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md shadow-indigo-600/20"
        >
          <Plus className="h-4 w-4" /> Add Milestone
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {milestones.map((ms) => (
          <div
            key={ms.id}
            className="bg-[#121824] border border-[#1F293D] rounded-xl p-5 space-y-3 relative overflow-hidden"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Flag className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-100">{ms.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{ms.description || "No description provided."}</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {ms.status}
              </span>
            </div>

            <div className="pt-3 border-t border-[#1F293D] flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                <span>Target Due: {ms.dueDate || "Flexible"}</span>
              </div>
              <div className="flex items-center gap-1 text-emerald-400 text-[11px]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>On Track</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121824] border border-[#1F293D] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-semibold text-slate-100">Add Project Milestone</h3>
            <form onSubmit={handleCreateMilestone} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., V3 Beta Release Candidate"
                  className="w-full bg-[#0B0F17] border border-[#1F293D] rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Milestone release scope and verification objectives..."
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
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded text-xs font-medium shadow-md shadow-indigo-600/20"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
