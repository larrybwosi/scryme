import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@repo/ui/components/ui/dialog";
import { Button } from "@repo/ui/components/ui/button";
import { Label } from "@repo/ui/components/ui/label";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { Download } from "lucide-react";
import { useFormattedCurrency } from "../lib/utils";

// Types
type InvoiceStatus = "paid" | "pending" | "overdue";

interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  amount: number;
  status: InvoiceStatus;
  items: InvoiceItem[];
  notes: string;
  invoiceUrl: string;
}

interface InvoiceDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedInvoice: Invoice | null;
  onDownloadInvoice: (invoiceUrl: string) => void;
}

const statusColors: Record<InvoiceStatus, string> = {
  paid: "bg-green-100 text-green-800",
  pending: "bg-blue-100 text-blue-800",
  overdue: "bg-red-100 text-red-800",
};

export function InvoiceDetailsDialog({
  open,
  onOpenChange,
  selectedInvoice,
  onDownloadInvoice,
}: InvoiceDetailsDialogProps) {
  const formatCurrency = useFormattedCurrency();

  if (!selectedInvoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Invoice Details - {selectedInvoice.number}</DialogTitle>
          <DialogDescription>
            Complete details for invoice from {selectedInvoice.date}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Invoice Number</Label>
              <p className="font-medium">{selectedInvoice.number}</p>
            </div>
            <div>
              <Label>Status</Label>
              <Badge className={statusColors[selectedInvoice.status]}>
                {selectedInvoice.status}
              </Badge>
            </div>
            <div>
              <Label>Invoice Date</Label>
              <p>{selectedInvoice.date}</p>
            </div>
            <div>
              <Label>Due Date</Label>
              <p>{selectedInvoice.dueDate}</p>
            </div>
            <div>
              <Label>Total Amount</Label>
              <p className="font-bold">
                {formatCurrency(selectedInvoice.amount)}
              </p>
            </div>
            <div>
              <Label>Invoice URL</Label>
              <a
                href={selectedInvoice.invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View Invoice
              </a>
            </div>
          </div>

          {selectedInvoice.items && selectedInvoice.items.length > 0 && (
            <div>
              <Label>Items</Label>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedInvoice.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell>{formatCurrency(item.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {selectedInvoice.notes && (
            <div>
              <Label>Notes</Label>
              <p className="mt-1 p-3 bg-slate-50 rounded-md">
                {selectedInvoice.notes}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onDownloadInvoice(selectedInvoice.invoiceUrl)}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Invoice
            </Button>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
