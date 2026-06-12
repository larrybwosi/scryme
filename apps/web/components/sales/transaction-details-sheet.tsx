'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/ui/sheet";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { ScrollArea } from "@repo/ui/components/ui/scroll-area";
import { Separator } from "@repo/ui/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import {
  format
} from 'date-fns';
import {
  Package,
  Truck,
  CreditCard,
  Clock,
  User,
  MapPin,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  MoreVertical,
  Download,
  Receipt,
} from 'lucide-react';
import { getTransactionById, updateTransactionStatus } from '../../app/actions/sales';
import { cn } from "@repo/ui/lib/utils";
import { toast } from 'sonner';
import { AddPaymentModal } from './add-payment-modal';

interface TransactionDetailsSheetProps {
  transactionId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionDetailsSheet({
  transactionId,
  isOpen,
  onClose,
}: TransactionDetailsSheetProps) {
  const [transaction, setTransaction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const fetchTransaction = useCallback(async () => {
    if (!transactionId) return;
    setIsLoading(true);
    try {
      const data = await getTransactionById(transactionId);
      setTransaction(data);
    } catch (error) {
      toast.error('Failed to fetch transaction details');
    } finally {
      setIsLoading(false);
    }
  }, [transactionId]);

  useEffect(() => {
    if (transactionId && isOpen) {
      fetchTransaction();
    }
  }, [transactionId, isOpen, fetchTransaction]);

  const handleStatusUpdate = async (status: string) => {
    if (!transaction) return;
    try {
      await updateTransactionStatus(transaction.id, status as any);
      toast.success(`Status updated to ${status}`);
      fetchTransaction();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (!transaction && isLoading) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="sm:max-w-[600px]">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900" />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (!transaction) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[700px] p-0 flex flex-col h-full bg-zinc-50/50">
        <div className="p-6 bg-white border-b sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-2xl font-bold">{transaction.number}</SheetTitle>
                <Badge variant="outline" className="uppercase font-bold text-[10px]">
                  {transaction.type}
                </Badge>
              </div>
              <p className="text-sm text-zinc-500">
                Created on {format(new Date(transaction.createdAt), 'PPPP p')}
              </p>
            </div>
            <div className="flex items-center gap-2">
               <Button variant="outline" size="sm" className="gap-2" asChild>
                 <a href={`/api/sales/documents/${transaction.id}?type=invoice`} download>
                   <Download className="w-4 h-4" />
                   Invoice
                 </a>
               </Button>
               <Button variant="outline" size="sm" className="gap-2" asChild>
                 <a href={`/api/sales/documents/${transaction.id}?type=receipt`} download>
                   <Receipt className="w-4 h-4" />
                   Receipt
                 </a>
               </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-zinc-400">Status</span>
              <StatusBadge status={transaction.status} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-zinc-400">Payment</span>
              <PaymentStatusBadge status={transaction.paymentStatus} />
            </div>
            <div className="flex flex-col gap-1 ml-auto text-right">
              <span className="text-[10px] uppercase font-bold text-zinc-400">Total Amount</span>
              <span className="text-xl font-bold text-zinc-900">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: transaction.currencyCode || 'USD' }).format(transaction.finalTotal)}
              </span>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-8">
            {/* Timeline Workflow */}
            <section>
              <h3 className="text-sm font-bold text-zinc-900 mb-6 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Order Workflow
              </h3>
              <TransactionTimeline transaction={transaction} />
            </section>

            <Tabs defaultValue="items" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-zinc-100 p-1">
                <TabsTrigger value="items">Items ({transaction.items?.length || 0})</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="details">Customer & Delivery</TabsTrigger>
              </TabsList>

              <TabsContent value="items" className="mt-6">
                <div className="bg-white border rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50 border-b">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-zinc-600">Product</th>
                        <th className="px-4 py-3 font-semibold text-zinc-600 text-center">Qty</th>
                        <th className="px-4 py-3 font-semibold text-zinc-600 text-right">Unit</th>
                        <th className="px-4 py-3 font-semibold text-zinc-600 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {transaction.items?.map((item: any) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="font-medium text-zinc-900">{item.productName}</span>
                              <span className="text-xs text-zinc-500">{item.variantName} ({item.sku})</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">{item.quantity}</td>
                          <td className="px-4 py-3 text-right">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: transaction.currencyCode || 'USD' }).format(item.unitPrice)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: transaction.currencyCode || 'USD' }).format(item.lineTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-zinc-50/50 font-medium">
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-right text-zinc-500 text-xs uppercase">Subtotal</td>
                        <td className="px-4 py-2 text-right">
                           {new Intl.NumberFormat('en-US', { style: 'currency', currency: transaction.currencyCode || 'USD' }).format(transaction.subtotal)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-right text-zinc-500 text-xs uppercase">Tax</td>
                        <td className="px-4 py-2 text-right">
                           {new Intl.NumberFormat('en-US', { style: 'currency', currency: transaction.currencyCode || 'USD' }).format(transaction.taxTotal)}
                        </td>
                      </tr>
                      <tr className="text-zinc-900 border-t">
                        <td colSpan={3} className="px-4 py-3 text-right font-bold uppercase">Final Total</td>
                        <td className="px-4 py-3 text-right font-bold text-lg">
                           {new Intl.NumberFormat('en-US', { style: 'currency', currency: transaction.currencyCode || 'USD' }).format(transaction.finalTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="payments" className="mt-6">
                 <div className="space-y-4">
                    {transaction.payments?.length > 0 ? (
                      transaction.payments.map((payment: any) => (
                        <div key={payment.id} className="bg-white border rounded-xl p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                              <CreditCard className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-zinc-900">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: transaction.currencyCode || 'USD' }).format(payment.amount)}
                              </span>
                              <span className="text-xs text-zinc-500">
                                {payment.method.replace(/_/g, ' ')} • {format(new Date(payment.createdAt), 'MMM d, HH:mm')}
                              </span>
                            </div>
                          </div>
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            {payment.status}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="bg-white border rounded-xl p-8 text-center">
                        <p className="text-zinc-500 text-sm">No payments recorded yet.</p>
                      </div>
                    )}
                    <Button
                      className="w-full gap-2 py-6 text-base font-bold"
                      variant="outline"
                      onClick={() => setIsPaymentModalOpen(true)}
                      disabled={transaction.paymentStatus === 'PAID'}
                    >
                      <CreditCard className="w-4 h-4" />
                      Add New Payment
                    </Button>
                 </div>
              </TabsContent>

              <TabsContent value="details" className="mt-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border rounded-xl p-4 space-y-3">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase flex items-center gap-2">
                      <User className="w-3 h-3" /> Customer Information
                    </h4>
                    <div className="space-y-1">
                      <p className="font-bold text-zinc-900">{transaction.customer?.name || 'Walk-in Customer'}</p>
                      <p className="text-sm text-zinc-500">{transaction.customer?.email || 'No email'}</p>
                      <p className="text-sm text-zinc-500">{transaction.customer?.phone || 'No phone'}</p>
                    </div>
                  </div>
                  <div className="bg-white border rounded-xl p-4 space-y-3">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase flex items-center gap-2">
                      <MapPin className="w-3 h-3" /> Sales Location
                    </h4>
                    <div className="space-y-1">
                      <p className="font-bold text-zinc-900">{transaction.location?.name}</p>
                      <p className="text-sm text-zinc-500">Managed by {transaction.member?.user?.name}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-xl p-4 space-y-4">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase flex items-center gap-2">
                    <Truck className="w-3 h-3" /> Fulfillment Tracking
                  </h4>
                  {transaction.fulfillments?.length > 0 ? (
                    <div className="space-y-4">
                      {transaction.fulfillments.map((f: any) => (
                        <div key={f.id} className="flex items-start gap-4">
                          <div className="mt-1">
                             <Truck className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-zinc-900">{f.type} Fulfillment</span>
                              <Badge variant="outline">{f.status}</Badge>
                            </div>
                            <p className="text-xs text-zinc-500">
                              Method: {f.type} {f.carrier && `via ${f.carrier}`}
                            </p>
                            {f.trackingNumber && (
                               <p className="text-xs text-zinc-900 font-medium">Tracking: {f.trackingNumber}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500 italic">No fulfillment records found.</p>
                  )}
                </div>

                {transaction.notes && (
                   <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                     <h4 className="text-xs font-bold text-amber-900 uppercase mb-2">Order Notes</h4>
                     <p className="text-sm text-amber-800">{transaction.notes}</p>
                   </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>

        <div className="p-6 bg-white border-t flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleStatusUpdate('CANCELLED')}
            disabled={['COMPLETED', 'CANCELLED'].includes(transaction.status)}
          >
            Cancel Order
          </Button>
          {transaction.status === 'PENDING_CONFIRMATION' && (
            <Button
              className="flex-1 bg-zinc-900 hover:bg-zinc-800"
              onClick={() => handleStatusUpdate('CONFIRMED')}
            >
              Confirm Order
            </Button>
          )}
          {transaction.status === 'CONFIRMED' && (
            <Button
              className="flex-1 bg-zinc-900 hover:bg-zinc-800"
              onClick={() => handleStatusUpdate('PROCESSING')}
            >
              Start Processing
            </Button>
          )}
           {transaction.status === 'PROCESSING' && (
            <Button
              className="flex-1 bg-zinc-900 hover:bg-zinc-800"
              onClick={() => handleStatusUpdate('COMPLETED')}
            >
              Complete Order
            </Button>
          )}
        </div>
        <AddPaymentModal
          transaction={transaction}
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            fetchTransaction();
          }}
        />
      </SheetContent>
    </Sheet>
  );
}

function TransactionTimeline({ transaction }: { transaction: any }) {
  const stages = [
    { key: 'DRAFT', label: 'Drafted', icon: FileText },
    { key: 'PENDING_CONFIRMATION', label: 'Placed', icon: Clock },
    { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle2 },
    { key: 'PROCESSING', label: 'Processing', icon: Package },
    { key: 'READY', label: 'Ready', icon: CheckCircle2 },
    { key: 'COMPLETED', label: 'Delivered', icon: Truck },
  ];

  // Logic to find current index and past stages
  const statusOrder = stages.map(s => s.key);
  const currentIndex = statusOrder.indexOf(transaction.status);

  return (
    <div className="relative flex justify-between items-start w-full">
      {/* Background Line */}
      <div className="absolute top-5 left-0 right-0 h-0.5 bg-zinc-100 z-0 mx-6" />

      {stages.map((stage, idx) => {
        const isCompleted = idx < currentIndex || (transaction.status === 'COMPLETED' && idx <= currentIndex);
        const isCurrent = idx === currentIndex;
        const Icon = stage.icon;

        return (
          <div key={stage.key} className="relative z-10 flex flex-col items-center gap-2 group">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                isCompleted ? "bg-emerald-600 border-emerald-600 text-white" :
                isCurrent ? "bg-white border-zinc-900 text-zinc-900 ring-4 ring-zinc-100" :
                "bg-white border-zinc-200 text-zinc-300"
              )}
            >
              {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
            </div>
            <div className="flex flex-col items-center">
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-wider",
                isCompleted ? "text-emerald-700" : isCurrent ? "text-zinc-900" : "text-zinc-400"
              )}>
                {stage.label}
              </span>
              {isCurrent && (
                <span className="text-[9px] text-zinc-500 font-medium">In Progress</span>
              )}
            </div>
          </div>
        );
      })}
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
    <Badge variant="outline" className={cn("font-bold px-3 py-1", styles[status] || "bg-zinc-50 text-zinc-700 border-zinc-200")}>
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
    <Badge variant="outline" className={cn("font-bold px-3 py-1", styles[status] || "bg-zinc-50 text-zinc-700 border-zinc-200")}>
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}
