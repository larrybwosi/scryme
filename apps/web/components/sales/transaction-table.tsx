'use client';

import React, { useState } from 'react';
import {
  MoreHorizontal,
  Eye,
  CreditCard,
  Truck,
  CheckCircle2,
  XCircle,
  FileText,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { AddPaymentModal } from './add-payment-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import { cn } from "@repo/ui/lib/utils";
import { TransactionDetailsSheet } from './transaction-details-sheet';
import { ManageDeliveryModal } from './manage-delivery-modal';

export function TransactionTable({ transactions }: { transactions: any[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [paymentTrx, setPaymentTrx] = useState<any>(null);
  const [viewTransactionId, setViewTransactionId] = useState<string | null>(null);
  const [manageDeliveryTrx, setManageDeliveryTrx] = useState<any>(null);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === transactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(transactions.map(t => t.id));
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/50">
              <th className="px-6 py-4 w-12 text-center">
                <input
                  type="checkbox"
                  className="rounded border-zinc-300 w-4 h-4 text-[#34A853] focus:ring-[#34A853]"
                  checked={selectedIds.length === transactions.length && transactions.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs">
                Order Info
              </th>
              <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs">
                Customer
              </th>
              <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs">
                Location
              </th>
              <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs text-right">
                Amount
              </th>
              <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs">
                Status
              </th>
              <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs">
                Payment
              </th>
              <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {transactions.map((trx) => (
              <tr
                key={trx.id}
                className={cn(
                  "hover:bg-zinc-50/50 transition-colors",
                  selectedIds.includes(trx.id) && "bg-zinc-50"
                )}
              >
                <td className="px-6 py-4 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-zinc-300 w-4 h-4 text-[#34A853] focus:ring-[#34A853]"
                    checked={selectedIds.includes(trx.id)}
                    onChange={() => toggleSelect(trx.id)}
                  />
                </td>
                <td className="px-6 py-4 cursor-pointer" onClick={() => setViewTransactionId(trx.id)}>
                  <div className="flex flex-col">
                    <span className="font-bold text-zinc-900 hover:underline">{trx.number}</span>
                    <span className="text-xs text-zinc-500">
                      {format(new Date(trx.createdAt), 'MMM d, yyyy HH:mm')}
                    </span>
                    <Badge variant="outline" className="w-fit mt-1 text-[10px] uppercase font-bold py-0 h-4">
                      {trx.type}
                    </Badge>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-zinc-900">
                      {trx.customer?.name || 'Walk-in Customer'}
                    </span>
                    {trx.customer?.email && (
                      <span className="text-xs text-zinc-500">{trx.customer.email}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-zinc-600">
                  {trx.location?.name}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-zinc-900">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: trx.currencyCode || 'USD' }).format(trx.finalTotal)}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {trx._count?.items ?? 0} items
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                   <StatusBadge status={trx.status} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1.5 min-w-[120px]">
                    <PaymentStatusBadge status={trx.paymentStatus} />
                    <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden border border-zinc-200/50">
                      <div
                        className={cn(
                          "h-full transition-all duration-500",
                          trx.paymentStatus === 'PAID' ? "bg-emerald-500" :
                          trx.paymentStatus === 'PARTIALLY_PAID' ? "bg-amber-500" : "bg-zinc-300"
                        )}
                        style={{ width: `${Math.min(100, (Number(trx.totalPaid || 0) / Number(trx.finalTotal || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setViewTransactionId(trx.id)}>
                        <Eye className="mr-2 h-4 w-4" /> View Details
                      </DropdownMenuItem>
                      {trx.type !== "POS_SALE" && trx.paymentStatus !== "PAID" && (
                        <DropdownMenuItem onClick={() => setPaymentTrx(trx)}>
                          <CreditCard className="mr-2 h-4 w-4" /> Add Payment
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => setManageDeliveryTrx(trx)}>
                        <Truck className="mr-2 h-4 w-4" /> Manage Delivery
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <a href={`/api/sales/documents/${trx.id}?type=invoice`} download>
                          <FileText className="mr-2 h-4 w-4" /> Generate Invoice
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href={`/api/sales/documents/${trx.id}?type=receipt`} download>
                          <Download className="mr-2 h-4 w-4" /> Download Receipt
                        </a>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-zinc-900 text-white px-6 py-3 flex items-center justify-between animate-in slide-in-from-bottom-4">
          <span className="text-sm font-medium">{selectedIds.length} transactions selected</span>
          <div className="flex gap-3">
             <Button variant="secondary" size="sm" className="h-8 text-xs">
                Mark as Dispatched
             </Button>
             <Button variant="secondary" size="sm" className="h-8 text-xs">
                Change Status
             </Button>
          </div>
        </div>
      )}

      <AddPaymentModal
        transaction={paymentTrx}
        isOpen={!!paymentTrx}
        onClose={() => setPaymentTrx(null)}
      />

      <TransactionDetailsSheet
        transactionId={viewTransactionId}
        isOpen={!!viewTransactionId}
        onClose={() => setViewTransactionId(null)}
      />

      <ManageDeliveryModal
        transaction={manageDeliveryTrx}
        isOpen={!!manageDeliveryTrx}
        onClose={() => setManageDeliveryTrx(null)}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    PENDING_CONFIRMATION: "bg-amber-50 text-amber-700 border-amber-200",
    CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
    PROCESSING: "bg-indigo-50 text-indigo-700 border-indigo-200",
    CANCELLED: "bg-red-50 text-red-700 border-red-200",
    DRAFT: "bg-zinc-50 text-zinc-700 border-zinc-200",
  };

  return (
    <Badge variant="outline" className={cn("font-medium", styles[status] || "bg-zinc-50 text-zinc-700 border-zinc-200")}>
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
    UNPAID: "bg-red-50 text-red-700 border-red-200",
    PARTIALLY_PAID: "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <Badge variant="outline" className={cn("font-medium", styles[status] || "bg-zinc-50 text-zinc-700 border-zinc-200")}>
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}
