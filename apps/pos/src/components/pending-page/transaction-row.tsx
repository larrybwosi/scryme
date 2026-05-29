'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  CheckCircle2,
  Download,
  Loader2,
  MoreHorizontal,
  Plus,
  Truck,
  Package,
  FileText,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Printer,
} from 'lucide-react';
import { cn, useFormattedCurrency } from '@/lib/utils';
import { Transaction } from '@/types';

interface TransactionRowProps {
  tx: Transaction;
  isHighlighted: boolean;
  isDownloading: boolean;
  openMenuId: string | null;
  onOpenMenuChange: (isOpen: boolean) => void;
  onCopyId: (id: string) => void;
  onDownloadInvoice: (tx: Transaction) => void;
  onDownloadWaybill: (tx: Transaction) => void;
  onPrintInvoice: (tx: Transaction) => void;
  onPrintWaybill: (tx: Transaction) => void;
  onOpenReconcile: (id: string) => void;
  onOpenPayment: (id: string) => void;
  onOpenDispatch: (id: string) => void;
}

export function TransactionRow({
  tx,
  isHighlighted,
  isDownloading,
  openMenuId,
  onOpenMenuChange,
  onCopyId,
  onDownloadInvoice,
  onDownloadWaybill,
  onPrintInvoice,
  onPrintWaybill,
  onOpenReconcile,
  onOpenPayment,
  onOpenDispatch,
}: TransactionRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCurrency = useFormattedCurrency();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'dispatched':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0';
      case 'pending':
        return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0';
      case 'paid':
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white border-0';
      case 'partially_paid':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0';
    }
  };

  const hasItems = tx.items && tx.items.length > 0;

  return (
    <>
      <TableRow
        key={tx.id}
        id={`tx-row-${tx.id}`}
        className={cn(
          'transition-all duration-300 hover:bg-muted/50 cursor-pointer group',
          isHighlighted ? 'bg-indigo-50 dark:bg-indigo-950/30 border-l-4 border-l-indigo-500' : '',
          isExpanded ? 'bg-muted/30' : ''
        )}
        onClick={() => hasItems && setIsExpanded(!isExpanded)}
      >
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            {hasItems && (
              <button
                className="p-1 hover:bg-muted rounded transition-colors"
                onClick={e => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            )}
            <span className="font-mono text-sm">{tx.number || tx.id.slice(-6)}</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{tx.customer}</span>
            <span className="text-xs text-muted-foreground">{tx.email}</span>
          </div>
        </TableCell>
        <TableCell>
          <Badge className={cn('capitalize shadow-sm transition-all', getStatusColor(tx.status))}>
            {tx.status === 'dispatched' && <Truck className="w-3 h-3 mr-1" />}
            {tx.status.replace('_', ' ')}
          </Badge>
        </TableCell>
        <TableCell className="w-[200px]">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Paid: {formatCurrency(tx.paidAmount)}</span>
              <span className="font-medium text-foreground">{Math.round((tx.paidAmount / tx.totalAmount) * 100)}%</span>
            </div>
            <Progress value={(tx.paidAmount / tx.totalAmount) * 100} className="h-2 bg-muted" />
          </div>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex flex-col items-end">
            <span className="font-bold font-mono text-lg text-foreground">
              {formatCurrency(tx.totalAmount - tx.paidAmount)}
            </span>
            <span className="text-xs text-muted-foreground">of {formatCurrency(tx.totalAmount)}</span>
          </div>
        </TableCell>
        <TableCell onClick={e => e.stopPropagation()}>
          <DropdownMenu open={openMenuId === tx.id} onOpenChange={onOpenMenuChange}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onCopyId(tx.id)}>Copy ID</DropdownMenuItem>

              {tx.invoiceLink && (
                <>
                  <DropdownMenuItem
                    onClick={() => onDownloadInvoice(tx)}
                    disabled={isDownloading}
                    className="text-green-600 focus:text-green-600 cursor-pointer"
                  >
                    {isDownloading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Download Invoice
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onPrintInvoice(tx)}
                    disabled={isDownloading}
                    className="text-blue-600 focus:text-blue-600 cursor-pointer"
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print Invoice (A4)
                  </DropdownMenuItem>
                </>
              )}

              {tx.fulfillmentId && (
                <>
                  <DropdownMenuItem
                    onClick={() => onDownloadWaybill(tx)}
                    disabled={isDownloading}
                    className="cursor-pointer"
                  >
                    {isDownloading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="mr-2 h-4 w-4" />
                    )}
                    Download Waybill
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onPrintWaybill(tx)}
                    disabled={isDownloading}
                    className="cursor-pointer"
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print Waybill
                  </DropdownMenuItem>
                </>
              )}

              {tx.status !== 'dispatched' && (
                <DropdownMenuItem
                  onClick={() => onOpenDispatch(tx.id)}
                  className="text-purple-600 focus:text-purple-600"
                >
                  <Package className="mr-2 h-4 w-4" /> Dispatch Order
                </DropdownMenuItem>
              )}

              {tx.status === 'dispatched' && (
                <DropdownMenuItem onClick={() => onOpenReconcile(tx.id)} className="text-blue-600 focus:text-blue-600">
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Reconcile Delivery
                </DropdownMenuItem>
              )}

              <DropdownMenuItem onClick={() => onOpenPayment(tx.id)}>
                <Plus className="mr-2 h-4 w-4" /> Add Payment
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {/* Expanded Items Section */}
      {isExpanded && hasItems && (
        <TableRow>
          <TableCell colSpan={6} className="bg-muted/20 p-0 border-t-0">
            <div className="p-6 space-y-3 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
                <ShoppingBag className="h-4 w-4" />
                <span>Order Items ({tx.items?.length || 0})</span>
              </div>

              <div className="grid gap-3">
                {tx.items?.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-background rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>

                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{item.productName}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          {item.variantName && (
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              {item.variantName}
                            </span>
                          )}
                          {item.unitName && (
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              Unit: {item.unitName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <div className="text-muted-foreground text-xs">Quantity</div>
                        <div className="font-semibold text-foreground">{item.quantity}</div>
                      </div>

                      <div className="text-right">
                        <div className="text-muted-foreground text-xs">Unit Price</div>
                        <div className="font-mono text-foreground">{formatCurrency(item.unitPrice)}</div>
                      </div>

                      <div className="text-right min-w-[100px]">
                        <div className="text-muted-foreground text-xs">Total</div>
                        <div className="font-bold font-mono text-foreground text-lg">
                          {formatCurrency(item.totalPrice)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary in expanded view */}
              <div className="mt-4 pt-4 border-t border-border flex justify-end">
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between gap-8">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-mono">{formatCurrency(tx.totalAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-8">
                    <span className="text-muted-foreground">Paid:</span>
                    <span className="font-mono text-green-600">{formatCurrency(tx.paidAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-8 text-base font-bold pt-1 border-t">
                    <span>Balance Due:</span>
                    <span className="font-mono text-orange-600">{formatCurrency(tx.totalAmount - tx.paidAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
