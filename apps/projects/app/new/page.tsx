"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Project } from "@/lib/api";
import { useCreateProject } from "@/lib/hooks/use-projects";
import { FolderPlus, ArrowLeft } from "lucide-react";

export default function CreateProjectPage() {
  const router = useRouter();
  const createProjectMutation = useCreateProject();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Project["status"]>("PLANNING");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createProjectMutation.mutate(
      {
        name,
        description,
        status,
        startDate,
        endDate,
      },
      {
        onSuccess: () => {
          router.push("/");
        },
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="p-2 rounded-lg bg-[#121824] border border-[#1F293D] text-slate-400 hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <FolderPlus className="h-6 w-6 text-indigo-400" /> Create New Project
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Initialize a new project, schedule sprint targets, and configure workspace settings.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#121824] border border-[#1F293D] rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Project Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., V3 Realtime Analytics Engine"
            className="w-full bg-[#0B0F17] border border-[#1F293D] rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Project["status"])}
            className="w-full bg-[#0B0F17] border border-[#1F293D] rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
          >
            <option value="PLANNING">PLANNING</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="ON_HOLD">ON_HOLD</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
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
            disabled={createProjectMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-xs font-medium transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
          >
            {createProjectMutation.isPending ? "Saving..." : "Create Project"}
          </button>
        </div>
      </form>
    </div>
  );
}
