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

export default function InvoicesPage() {
  const { invoices, clients, projects } = useTaskStore();
  const [isAdding, setIsAdding] = useState(false);
  const [clientName, setClientName] = useState(clients[0]?.name || 'Snazzy Studio');
  const [amount, setAmount] = useState('3500');

  const handleAddInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    taskStore.addInvoice({
      invoiceNumber: `INV-2024-0${invoices.length + 1}`,
      clientName,
      projectName: projects[0]?.name || 'Workspace Project',
      amount: parseFloat(amount) || 3500,
      issueDate: '2024-02-16',
      dueDate: '2024-03-15',
      status: 'SENT',
      itemsCount: 1
    });
    setIsAdding(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Invoices
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Issue billing invoices, track payment status, and record client transactions.
          </p>
        </div>

        <Button
          onClick={() => setIsAdding(!isAdding)}
          className="gap-2 self-start sm:self-auto text-xs"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          <span>New Invoice</span>
        </Button>
      </div>

      {isAdding && (
        <Card className="p-5 shadow-xs border-border bg-muted/20">
          <form onSubmit={handleAddInvoice} className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">Issue New Invoice</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Invoice Amount ($)"
                className="text-xs"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs">
                Issue Invoice
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Invoices Table */}
      <Card className="overflow-hidden shadow-xs border-border">
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-mono font-bold text-foreground">{inv.invoiceNumber}</TableCell>
                <TableCell className="font-semibold text-foreground">{inv.clientName}</TableCell>
                <TableCell className="text-muted-foreground">{inv.projectName}</TableCell>
                <TableCell className="font-bold text-emerald-600 dark:text-emerald-400">${inv.amount.toLocaleString()}</TableCell>
                <TableCell className="text-muted-foreground">{inv.dueDate}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'}
                  >
                    {inv.status}
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
