"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectsAPI } from "@/lib/api";
import { FolderKanban, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    await ProjectsAPI.createProject({
      name,
      description,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      status: "ACTIVE",
    });

    router.push("/");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <FolderKanban className="h-5 w-5 text-indigo-400" /> Create New Project
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Set up a new project workspace to manage tasks, schedules, and team assignments.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#121824] border border-[#1F293D] rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Project Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., POS Payment Gateway Integration"
            className="w-full bg-[#0B0F17] border border-[#1F293D] rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief scope, target objectives, and milestones..."
            className="w-full bg-[#0B0F17] border border-[#1F293D] rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-[#0B0F17] border border-[#1F293D] rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Target End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-[#0B0F17] border border-[#1F293D] rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-[#1F293D] flex justify-end gap-3">
          <Link
            href="/"
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-xs font-medium transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Create Project"}
          </button>
        </div>
      </form>
    </div>
  );
}
