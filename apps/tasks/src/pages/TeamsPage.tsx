import React, { useState } from 'react';
import { useTaskStore, taskStore } from '../lib/store';
import { UserCheck, Plus, Mail, CheckCircle2, Clock, ShieldCheck, Activity } from 'lucide-react';

export default function TeamsPage() {
  const { teamMembers } = useTaskStore();
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Product Designer');

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    taskStore.addTeamMember({
      name: name.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@snazzy.studio`,
      role,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      department: 'Engineering',
      assignedTasksCount: 2,
      completedTasksCount: 5,
      weeklyCapacityHours: 40,
      loggedHoursThisWeek: 20,
      status: 'ONLINE'
    });
    setName('');
    setEmail('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Teams & Workload
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor team capacity, task allocation, and logged velocity across projects.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow-xs flex items-center gap-2 self-start sm:self-auto transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Invite Team Member</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddMember} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm animate-in fade-in duration-150">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Invite Team Member</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name *"
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Role Title"
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl"
            >
              Send Invite
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamMembers.map((m) => {
          const loadPct = Math.round((m.loggedHoursThisWeek / m.weeklyCapacityHours) * 100);
          return (
            <div key={m.id} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={m.avatar} alt={m.name} className="h-10 w-10 rounded-full object-cover ring-2 ring-indigo-50 dark:ring-indigo-950" />
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{m.name}</h3>
                    <div className="text-[11px] text-slate-400 font-medium">{m.role}</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  m.status === 'ONLINE' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {m.status}
                </span>
              </div>

              {/* Weekly Workload Bar */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                  <span>Weekly Capacity ({m.loggedHoursThisWeek}h / {m.weeklyCapacityHours}h)</span>
                  <span>{loadPct}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      loadPct > 90 ? 'bg-rose-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${Math.min(100, loadPct)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  {m.completedTasksCount} completed
                </span>
                <span className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                  <Clock className="h-3.5 w-3.5" />
                  {m.assignedTasksCount} active tasks
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
