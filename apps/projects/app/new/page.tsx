"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateProject, useCreateTask } from "@/lib/hooks/use-projects";
import { Folder, CheckSquare, ArrowLeft, Plus, Flame, Clock } from "lucide-react";

export default function NewProjectOrTaskPage() {
  const router = useRouter();
  const createProject = useCreateProject();
  const createTask = useCreateTask();

  const [type, setType] = useState<"PROJECT" | "TASK">("TASK");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("HIGH");
  const [estimatedHours, setEstimatedHours] = useState("4");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (type === "PROJECT") {
      createProject.mutate(
        { name: title, description },
        {
          onSuccess: () => {
            router.push("/projects");
          }
        }
      );
    } else {
      createTask.mutate(
        {
          title,
          description,
          priority,
          estimatedHours: parseFloat(estimatedHours) || 4
        },
        {
          onSuccess: () => {
            router.push("/tasks");
          }
        }
      );
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2E3039]/50 pb-4">
        <div>
          <Link href="/projects" className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 mb-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Workspace</span>
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            Create New {type === "PROJECT" ? "Project" : "Task / Issue"}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Add a new initiative or execution task to your Scryme workspace.
          </p>
        </div>

        {/* Type Switcher */}
        <div className="flex items-center gap-1 bg-[#12141A] p-1 rounded-md border border-[#2E3039] text-xs">
          <button
            type="button"
            onClick={() => setType("TASK")}
            className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
              type === "TASK" ? "bg-[#5E6AD2] text-white font-semibold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span>Task</span>
          </button>
          <button
            type="button"
            onClick={() => setType("PROJECT")}
            className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
              type === "PROJECT" ? "bg-[#5E6AD2] text-white font-semibold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Folder className="h-3.5 w-3.5" />
            <span>Project</span>
          </button>
        </div>
      </div>

      {/* Creation Form */}
      <form onSubmit={handleSubmit} className="bg-[#12141A] border border-[#2E3039] rounded-lg p-5 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            {type === "PROJECT" ? "Project Name" : "Task Title"}
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={type === "PROJECT" ? "e.g. Nexus 2.0 Redesign" : "e.g. Implement WebGL streaming buffer"}
            className="w-full bg-[#171922] border border-[#2E3039] rounded-md px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#5E6AD2]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Description / Scope
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Technical details, acceptance criteria, or specification links..."
            className="w-full bg-[#171922] border border-[#2E3039] rounded-md p-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#5E6AD2]"
          />
        </div>

        {type === "TASK" && (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-amber-400" />
                <span>Priority</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH" | "URGENT")}
                className="w-full bg-[#171922] border border-[#2E3039] rounded-md px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#5E6AD2]"
              >
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-[#5E6AD2]" />
                <span>Estimated Hours</span>
              </label>
              <input
                type="number"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                className="w-full bg-[#171922] border border-[#2E3039] rounded-md px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#5E6AD2]"
              />
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-[#2E3039]/50 flex items-center justify-end gap-3">
          <Link
            href="/projects"
            className="px-3 py-1.5 bg-[#171922] hover:bg-[#1f1f23] border border-[#2E3039] text-slate-300 rounded-md text-xs font-medium transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="px-4 py-1.5 bg-[#5E6AD2] hover:bg-[#717DE3] text-white rounded-md text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create {type === "PROJECT" ? "Project" : "Task"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
