import React, { useState } from 'react';
import { useTaskStore, taskStore } from '../lib/store';
import { FileText, Plus, DollarSign, CheckCircle2 } from 'lucide-react';

export default function InvoicesPage() {
  const { invoices, clients, projects } = useTaskStore();
  const [isAdding, setIsAdding] = useState(false);
  const [clientName, setClientName] = useState(clients[0]?.name || 'TechNova Solutions');
  const [amount, setAmount] = useState('15000');

  const handleAddInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    taskStore.addInvoice({
      invoiceNumber: `INV-2024-00${invoices.length + 1}`,
      clientName,
      projectName: projects[0]?.name || 'Workspace Project',
      amount: parseFloat(amount) || 15000,
      issueDate: new Date().toISOString().split('T')[0] || '2024-02-16',
      dueDate: '2024-03-16',
      status: 'SENT',
      itemsCount: 4
    });
    setIsAdding(false);
  };

  const totalInvoicedAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Project Invoices
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track client billings, invoice status, and milestone payments.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow-xs flex items-center gap-2 self-start sm:self-auto transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Create Invoice</span>
        </button>
      </div>

      {/* Summary Card */}
      <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl text-white shadow-md flex justify-between items-center">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Total Portfolio Revenue</span>
          <div className="text-3xl font-extrabold mt-1">${totalInvoicedAmount.toLocaleString()}</div>
        </div>
        <div className="text-right text-xs text-indigo-200">
          <div>{invoices.length} Invoices Issued</div>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleAddInvoice} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm animate-in fade-in duration-150">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Generate New Client Invoice</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount ($)"
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
              Issue Invoice
            </button>
          </div>
        </form>
      )}

      {/* Invoices List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-slate-50/50 dark:bg-slate-900/40">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{inv.invoiceNumber}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{inv.clientName}</td>
                  <td className="py-3 px-4 text-slate-500">{inv.projectName}</td>
                  <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">${inv.amount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-slate-500">{inv.dueDate}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
