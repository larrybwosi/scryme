import React, { useState } from 'react';
import { useTaskStore, taskStore } from '../lib/store';
import { Plus } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Card } from '@repo/ui/components/ui/card';
import { Badge } from '@repo/ui/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@repo/ui/components/ui/table';

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
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Project Expenses
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Track design assets, cloud infrastructure, and operational expense logs.
          </p>
        </div>

        <Button
          onClick={() => setIsAdding(!isAdding)}
          className="gap-2 self-start sm:self-auto text-xs"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          <span>Log Expense</span>
        </Button>
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
        <Card className="p-5 shadow-xs border-border bg-muted/20">
          <form onSubmit={handleAddExpense} className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">Submit New Expense Claim</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="Software License">Software License</option>
                <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                <option value="Design Assets">Design Assets</option>
                <option value="Travel & Meals">Travel & Meals</option>
              </select>
              <Input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description / Vendor"
                className="text-xs"
              />
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount ($)"
                className="text-xs"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs">
                Submit Expense
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Expenses Table */}
      <Card className="overflow-hidden shadow-xs border-border">
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              <TableHead>Ref #</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Submitted By</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((exp) => (
              <TableRow key={exp.id}>
                <TableCell className="font-mono font-bold text-foreground">{exp.expenseNumber}</TableCell>
                <TableCell className="font-semibold text-foreground">{exp.category}</TableCell>
                <TableCell className="text-muted-foreground">{exp.description}</TableCell>
                <TableCell className="font-bold text-foreground">${exp.amount.toLocaleString()}</TableCell>
                <TableCell className="text-muted-foreground">{exp.submittedBy}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={exp.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'}
                  >
                    {exp.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
