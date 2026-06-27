"use client";
"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@repo/ui/components/ui/dialog";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";

// Types
type InvoiceStatus = "pending" | "paid" | "overdue";

interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  amount: number;
  status: InvoiceStatus;
  items: any[];
  notes: string;
  invoiceUrl: string;
}

interface NewInvoiceForm {
  number: string;
  date: string;
  dueDate: string;
  amount: string;
  status: InvoiceStatus;
}

interface AddInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddInvoice: (invoice: Invoice) => void;
}

export function AddInvoiceDialog({
  open,
  onOpenChange,
  onAddInvoice,
}: AddInvoiceDialogProps) {
  const [newInvoice, setNewInvoice] = useState<NewInvoiceForm>({
    number: "",
    date: "",
    dueDate: "",
    amount: "",
    status: "pending",
  });

  const handleAdd = (): void => {
    if (newInvoice.number && newInvoice.amount) {
      onAddInvoice({
        id: `inv_${Date.now()}`,
        number: newInvoice.number,
        date: newInvoice.date,
        dueDate: newInvoice.dueDate,
        amount: parseFloat(newInvoice.amount),
        status: newInvoice.status,
        items: [],
        notes: "",
        invoiceUrl: `https://example.com/invoices/${newInvoice.number}.pdf`,
      });

      // Reset form
      setNewInvoice({
        number: "",
        date: "",
        dueDate: "",
        amount: "",
        status: "pending",
      });
      onOpenChange(false);
    }
  };

  const handleCancel = (): void => {
    setNewInvoice({
      number: "",
      date: "",
      dueDate: "",
      amount: "",
      status: "pending",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Invoice</DialogTitle>
          <DialogDescription>Enter the invoice details below</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Invoice Number</Label>
            <Input
              value={newInvoice.number}
              onChange={(e) =>
                setNewInvoice({ ...newInvoice, number: e.target.value })
              }
              placeholder="INV-2024-004"
            />
          </div>
          <div>
            <Label>Invoice Date</Label>
            <Input
              type="date"
              value={newInvoice.date}
              onChange={(e) =>
                setNewInvoice({ ...newInvoice, date: e.target.value })
              }
            />
          </div>
          <div>
            <Label>Due Date</Label>
            <Input
              type="date"
              value={newInvoice.dueDate}
              onChange={(e) =>
                setNewInvoice({ ...newInvoice, dueDate: e.target.value })
              }
            />
          </div>
          <div>
            <Label>Amount</Label>
            <Input
              type="number"
              value={newInvoice.amount}
              onChange={(e) =>
                setNewInvoice({ ...newInvoice, amount: e.target.value })
              }
              placeholder="0.00"
            />
          </div>
          <div>
            <Label>Status</Label>
            <Select
              value={newInvoice.status}
              onValueChange={(val: InvoiceStatus) =>
                setNewInvoice({ ...newInvoice, status: val })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleAdd}>Add Invoice</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
