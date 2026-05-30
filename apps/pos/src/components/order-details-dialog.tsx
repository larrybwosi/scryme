'use client';

import { useState, useEffect } from 'react';
import type { Order } from '@/store/store';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@repo/ui/components/ui/dialog';
import { Button } from '@repo/ui/components/ui/button';
import { Badge } from '@repo/ui/components/ui/badge';
import { Card } from '@repo/ui/components/ui/card';
import { Separator } from '@repo/ui/components/ui/separator';
import { Download, Printer, ShoppingBag, Truck, UtensilsCrossed, ChefHat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePosStore } from '@/store/store';

import { PDFReceipt } from '@/components/receipts/pdf-receipt';
import { PDFKitchenTicket } from '@/components/receipts/pdf-kitchen-ticket';
import QRCode from 'qrcode';
import { format } from 'date-fns';
import { usePdfActions } from '@/hooks/use-pdf-actions';

interface OrderDetailsDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailsDialog({ order, open, onOpenChange }: OrderDetailsDialogProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const settings = usePosStore(state => state.settings);
  const businessConfig = usePosStore(state => state.getBusinessConfig());
  const showKitchenTicket = businessConfig.features.kitchenDisplay;

  const { handleDownload, handlePrint, isPrinting, isDownloading } = usePdfActions();
  const isGenerating = isPrinting || isDownloading;

  useEffect(() => {
    if (order && settings.receiptConfig?.showQrCode) {
      const qrData = JSON.stringify({
        orderNumber: order.orderNumber,
        total: order.total,
        date: format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm'),
      });

      QRCode.toDataURL(qrData, { width: 200, margin: 1 })
        .then(url => setQrCodeDataUrl(url))
        .catch(err => console.error('QR Code generation error:', err));
    }
  }, [order, settings.receiptConfig?.showQrCode]);

  if (!order) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-status-waiting text-status-waiting';
      case 'ready':
        return 'bg-status-ready text-status-ready';
      case 'canceled':
        return 'bg-status-canceled text-status-canceled';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getOrderIcon = (type: string) => {
    switch (type) {
      case 'takeaway':
        return <ShoppingBag className="w-4 h-4" />;
      case 'delivery':
        return <Truck className="w-4 h-4" />;
      case 'dine-in':
        return <UtensilsCrossed className="w-4 h-4" />;
      default:
        return <ShoppingBag className="w-4 h-4" />;
    }
  };

  const onPrintReceipt = () => {
    handlePrint(
      <PDFReceipt
        order={order}
        businessName={settings.businessName}
        currency={settings.currency}
        taxRate={settings.taxRate}
        receiptConfig={settings.receiptConfig}
        qrCodeDataUrl={qrCodeDataUrl}
      />,
      `receipt-${order.orderNumber}`,
      order,
      'receipt'
    );
  };

  const onDownloadReceipt = () => {
    handleDownload(
      <PDFReceipt
        order={order}
        businessName={settings.businessName}
        currency={settings.currency}
        taxRate={settings.taxRate}
        receiptConfig={settings.receiptConfig}
        qrCodeDataUrl={qrCodeDataUrl}
      />,
      `receipt-${order.orderNumber}`
    );
  };

  const onDownloadKitchenTicket = () => {
    handleDownload(
      <PDFKitchenTicket order={order} businessName={settings.businessName} />,
      `ticket-${order.orderNumber}`
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Order Details</span>
            <Badge className={cn('capitalize', getStatusColor(order.status))}>{order.status}</Badge>
          </DialogTitle>
          <DialogDescription>
            Order placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
            {new Date(order.createdAt).toLocaleTimeString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Information */}
          <Card className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Order Number</p>
                <p className="font-semibold">{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Customer Name</p>
                <p className="font-semibold">{order.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Order Type</p>
                <div className="flex items-center gap-2">
                  {getOrderIcon(order.orderType)}
                  <span className="font-semibold capitalize">
                    {order.orderType === 'dine-in' ? 'Dine In' : order.orderType}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Payment Method</p>
                <p className="font-semibold capitalize">{order.paymentMethod}</p>
              </div>
              {order.tableNumber && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Table Number</p>
                  <p className="font-semibold">{order.tableNumber}</p>
                </div>
              )}
            </div>

            {order.instructions && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Special Instructions</p>
                <p className="text-sm bg-muted p-3 rounded-md">{order.instructions}</p>
              </div>
            )}
          </Card>

          {/* Order Items */}
          <div>
            <h3 className="font-semibold mb-3">Order Items ({order.items.length})</h3>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <Card key={index} className="p-3">
                  <div className="flex gap-3">
                    <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={item.imageUrl || '/placeholder.svg?height=64&width=64'}
                        alt={item.productName}
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{item.productName}</h4>
                      <p className="text-sm text-muted-foreground">Variant: {item.variantName}</p>
                      <p className="text-sm text-muted-foreground">Unit: {item.selectedUnit?.unitName || 'N/A'}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm">Qty: {item.quantity}</span>
                        <span className="font-semibold">
                          {settings.currency} {((item.selectedUnit?.price || 0) * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Payment Summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>
                {settings.currency} {order.subTotal.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span>
                - {settings.currency} {order.discount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span>
                {settings.currency} {order.taxes.toLocaleString()}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>
                {settings.currency} {order.total.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <Button
                onClick={onPrintReceipt}
                variant="outline"
                className="flex-1 bg-transparent"
                disabled={isGenerating}
              >
                <Printer className="w-4 h-4 mr-2" />
                {isGenerating ? 'Processing...' : 'Print Receipt'}
              </Button>
              <Button onClick={onDownloadReceipt} disabled={isGenerating} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                {isGenerating ? 'Processing...' : 'Download Receipt'}
              </Button>
            </div>

            {showKitchenTicket && (
              <Button
                onClick={onDownloadKitchenTicket}
                disabled={isGenerating}
                variant="outline"
                className="w-full bg-transparent"
              >
                <ChefHat className="w-4 h-4 mr-2" />
                {isGenerating ? 'Processing...' : 'Download Kitchen Ticket'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
