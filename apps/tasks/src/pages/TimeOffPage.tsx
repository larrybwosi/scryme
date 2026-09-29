import React, { useState } from 'react';
import { useTaskStore, taskStore } from '../lib/store';
import { CalendarOff, Plus, CheckCircle2, Clock } from 'lucide-react';

export default function TimeOffPage() {
  const { timeOffRequests, teamMembers } = useTaskStore();
  const [isAdding, setIsAdding] = useState(false);
  const [memberId, setMemberId] = useState(teamMembers[0]?.id || 'm-1');
  const [type, setType] = useState<'VACATION' | 'SICK_LEAVE' | 'PERSONAL'>('VACATION');
  const [startDate, setStartDate] = useState('2024-03-20');
  const [endDate, setEndDate] = useState('2024-03-22');
  const [reason, setReason] = useState('');

  const handleAddRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedMember = teamMembers.find((m) => m.id === memberId);
    taskStore.addTimeOff({
      memberId,
      memberName: selectedMember ? selectedMember.name : 'Sarah Jenkins',
      memberAvatar: selectedMember?.avatar,
      type,
      startDate,
      endDate,
      daysCount: 3,
      status: 'PENDING',
      reason: reason.trim() || 'Scheduled leave'
    });
    setIsAdding(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Time Off & Leave Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track team leave schedules, vacation balance, and project availability.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow-xs flex items-center gap-2 self-start sm:self-auto transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Request Leave</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddRequest} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm animate-in fade-in duration-150">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Submit Leave Request</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
            >
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
            >
              <option value="VACATION">Vacation</option>
              <option value="SICK_LEAVE">Sick Leave</option>
              <option value="PERSONAL">Personal Leave</option>
            </select>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason / Notes"
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
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
              Submit Request
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {timeOffRequests.map((req) => (
          <div key={req.id} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              {req.memberAvatar && (
                <img src={req.memberAvatar} alt={req.memberName} className="h-10 w-10 rounded-full object-cover" />
              )}
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{req.memberName}</h3>
                <div className="text-xs text-slate-500">
                  {req.type} • {req.startDate} to {req.endDate} ({req.daysCount} days)
                </div>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
              req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
            }`}>
              {req.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
