import React, { useState } from 'react';
import { useTaskStore, taskStore } from '../lib/store';
import { CreditCard, Plus } from 'lucide-react';

export default function ExpensesPage() {
  const { expenses, projects } = useTaskStore();
  const [isAdding, setIsAdding] = useState(false);
  const [category, setCategory] = useState('Software License');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('450');

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    taskStore.addExpense({
      expenseNumber: `EXP-2024-0${expenses.length + 1}`,
      category,
      description: description.trim(),
      amount: parseFloat(amount) || 450,
      projectName: projects[0]?.name || 'Workspace Project',
      submittedBy: 'Sarah Jenkins',
      date: new Date().toISOString().split('T')[0] || '2024-02-16',
      status: 'PENDING'
    });
    setDescription('');
    setIsAdding(false);
  };

  const totalExpenseAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Project Expenses
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track design assets, cloud infrastructure, and operational expense logs.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow-xs flex items-center gap-2 self-start sm:self-auto transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Log Expense</span>
        </button>
      </div>

      {/* Summary Banner */}
      <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl text-white shadow-md flex justify-between items-center">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Total Logged Expenses</span>
          <div className="text-3xl font-extrabold mt-1">${totalExpenseAmount.toLocaleString()}</div>
        </div>
        <div className="text-right text-xs text-indigo-200">
          <div>{expenses.length} Claims Filed</div>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleAddExpense} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm animate-in fade-in duration-150">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Submit New Expense Claim</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
            >
              <option value="Software License">Software License</option>
              <option value="Cloud Infrastructure">Cloud Infrastructure</option>
              <option value="Design Assets">Design Assets</option>
              <option value="Travel & Meals">Travel & Meals</option>
            </select>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description / Vendor"
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
            />
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
              Submit Expense
            </button>
          </div>
        </form>
      )}

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-slate-50/50 dark:bg-slate-900/40">
                <th className="py-3 px-4">Ref #</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Submitted By</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{exp.expenseNumber}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{exp.category}</td>
                  <td className="py-3 px-4 text-slate-500">{exp.description}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">${exp.amount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-slate-500">{exp.submittedBy}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      exp.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                    }`}>
                      {exp.status}
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
