"use client";

import { useEffect, useState } from "react";
import { ProjectsAPI, Task } from "@/lib/api";
import { Clock, Play, Plus, CheckCircle2 } from "lucide-react";

export default function GanttTimePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [hours, setHours] = useState<number>(2);
  const [notes, setNotes] = useState<string>("");
  const [logSuccess, setLogSuccess] = useState<boolean>(false);

  useEffect(() => {
    ProjectsAPI.getProjectTasks("proj-1").then((data) => {
      setTasks(data);
      if (data.length > 0) setSelectedTask(data[0].id);
    });
  }, []);

  const handleLogTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || hours <= 0) return;

    await ProjectsAPI.logTimeEntry(selectedTask, hours, notes);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === selectedTask
          ? { ...t, actualHours: (t.actualHours || 0) + Number(hours) }
          : t
      )
    );

    setLogSuccess(true);
    setTimeout(() => setLogSuccess(false), 3000);
    setNotes("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <Clock className="h-6 w-6 text-indigo-400" /> Gantt Timeline & Time Tracking
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Interactive task schedules, gantt timeline visualizer, and time entry logging.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#121824] border border-[#1F293D] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1F293D] pb-3">
            <h2 className="text-base font-semibold text-slate-100">Gantt Schedule Bar Chart</h2>
            <span className="text-xs text-slate-400 font-mono">Q1 2025 Roadmap</span>
          </div>

          <div className="space-y-4 pt-2">
            {tasks.map((task, idx) => {
              const progress = task.estimatedHours
                ? Math.min(100, Math.round(((task.actualHours || 0) / task.estimatedHours) * 100))
                : 0;
              const startOffset = (idx * 15) % 40;
              const barWidth = Math.max(30, 80 - startOffset);

              return (
                <div key={task.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{task.title}</span>
                    <span className="text-slate-400 font-mono">
                      {task.actualHours || 0} / {task.estimatedHours || 0} hrs ({progress}%)
                    </span>
                  </div>

                  <div className="h-7 bg-[#0B0F17] rounded-lg border border-[#1F293D] p-1 relative flex items-center">
                    <div
                      style={{ left: `${startOffset}%`, width: `${barWidth}%` }}
                      className="absolute top-1 bottom-1 rounded bg-indigo-900/60 border border-indigo-500/40 flex items-center overflow-hidden"
                    >
                      <div
                        style={{ width: `${progress}%` }}
                        className="h-full bg-indigo-500 transition-all duration-500"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[#121824] border border-[#1F293D] rounded-xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Play className="h-4 w-4 text-emerald-400" /> Log Time Entry
          </h2>

          {logSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-2.5 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Time entry saved successfully!
            </div>
          )}

          <form onSubmit={handleLogTime} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Select Task *</label>
              <select
                value={selectedTask}
                onChange={(e) => setSelectedTask(e.target.value)}
                className="w-full bg-[#0B0F17] border border-[#1F293D] rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Hours Logged *</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                required
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="w-full bg-[#0B0F17] border border-[#1F293D] rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Notes / Work Summary</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Implemented Gantt timeline progress bar components..."
                className="w-full bg-[#0B0F17] border border-[#1F293D] rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-xs font-medium transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" /> Save Time Entry
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
