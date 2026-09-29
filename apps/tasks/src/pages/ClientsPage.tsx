import React, { useState } from 'react';
import { useTaskStore, taskStore } from '../lib/store';
import { Users, Plus, Mail, Building2, FolderKanban, DollarSign } from 'lucide-react';

export default function ClientsPage() {
  const { clients } = useTaskStore();
  const [newClientName, setNewClientName] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    taskStore.addClient({
      name: newClientName.trim(),
      company: newClientCompany.trim() || newClientName.trim(),
      email: newClientEmail.trim() || `contact@${newClientName.toLowerCase().replace(/\s+/g, '')}.com`,
      activeProjectsCount: 1,
      totalInvoiced: 15000,
      status: 'ACTIVE'
    });
    setNewClientName('');
    setNewClientCompany('');
    setNewClientEmail('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Clients
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage organization client directory and project billing profiles.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow-xs flex items-center gap-2 self-start sm:self-auto transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Client</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddClient} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm animate-in fade-in duration-150">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add New Client Organization</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              placeholder="Client Name *"
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              value={newClientCompany}
              onChange={(e) => setNewClientCompany(e.target.value)}
              placeholder="Company Name"
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="email"
              value={newClientEmail}
              onChange={(e) => setNewClientEmail(e.target.value)}
              placeholder="Contact Email"
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
              Save Client
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((c) => (
          <div key={c.id} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-sm flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                  {c.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{c.name}</h3>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    <span>{c.company || 'Enterprise'}</span>
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                {c.status}
              </span>
            </div>

            <div className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span>{c.email}</span>
              </div>
              <div className="flex items-center justify-between pt-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1 text-slate-500">
                  <FolderKanban className="h-3.5 w-3.5 text-slate-400" />
                  {c.activeProjectsCount || 1} Active Projects
                </span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  ${(c.totalInvoiced || 0).toLocaleString()} Invoiced
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
