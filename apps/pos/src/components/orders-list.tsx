'use client';

import { useState } from 'react';
import { usePosStore } from '@/store/store';
import { Card } from '@repo/ui/components/ui/card';
import { Badge } from '@repo/ui/components/ui/badge';
import { Button } from '@repo/ui/components/ui/button';
import { ShoppingBag, Truck, UtensilsCrossed, ChevronDown, ChevronUp } from 'lucide-react';
import { cn, useFormattedCurrency } from '@/lib/utils';
import { OrderDetailsDialog } from '@/components/order-details-dialog';
import type { Order } from '@/store/store';
import PaymentDialog from '@/components/pos/payment-dialog';

export default function PendingOrdersList() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [orderToPay, setOrderToPay] = useState<Order | null>(null);

  const orders = usePosStore(state => state.orders.filter(o => o.status !== 'completed').slice(0, 3));
  const formatCurrency = useFormattedCurrency();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-status-waiting text-status-waiting border-transparent';
      case 'cooking':
        return 'bg-amber-100/50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'ready':
        return 'bg-status-ready text-status-ready border-transparent';
      case 'canceled':
        return 'bg-status-canceled text-status-canceled border-transparent';
      default:
        return 'bg-muted text-muted-foreground border-transparent';
    }
  };

  const getOrderIcon = (type: string) => {
    switch (type) {
      case 'takeaway':
      case 'pickup':
        return <ShoppingBag className="w-3.5 h-3.5" />;
      case 'delivery':
      case 'online':
        return <Truck className="w-3.5 h-3.5" />;
      case 'dine-in':
        return <UtensilsCrossed className="w-3.5 h-3.5" />;
      default:
        return <ShoppingBag className="w-3.5 h-3.5" />;
    }
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  const handlePayOrder = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    setOrderToPay(order);
    setPaymentDialogOpen(true);
  };

  const mapOrderType = (type: string): any => {
    switch (type) {
      case 'dine-in': return 'Dine in';
      case 'takeaway': return 'Takeaway';
      case 'delivery': return 'Delivery';
      case 'pickup': return 'Pickup';
      case 'online': return 'Online';
      default: return 'Takeaway';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <>
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight">Orders List</h2>
            <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)} className="h-7 w-7">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
          <button className="text-sm font-medium text-primary hover:underline">View all orders</button>
        </div>

        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {orders.map(order => (
              <Card
                key={order.id}
                className="p-3.5 flex flex-col gap-2.5 cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all duration-200"
                onClick={() => handleOrderClick(order)}
              >
                {/* Top Row: Type & Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md text-xs font-medium">
                    {getOrderIcon(order.orderType)}
                    <span>{mapOrderType(order.orderType)}</span>
                  </div>
                  <Badge className={cn('text-[10px] uppercase tracking-wider h-5 px-1.5', getStatusColor(order.status))}>
                    {order.status}
                  </Badge>
                </div>

                {/* Middle Row: Customer & Total */}
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground truncate pr-2">
                    {order.customerName || 'Guest'}
                  </span>
                  <span className="font-semibold text-foreground whitespace-nowrap">
                    {formatCurrency(order.total)}
                  </span>
                </div>

                {/* Bottom Row: Metadata Grid */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <span className="text-foreground/70">{order.orderNumber}</span>
                  <span>•</span>
                  <span>{formatTime(order.createdAt.toString())}</span>
                  <span>•</span>
                  <span>{order.items?.length || 0} items</span>
                  {order.tableNumber && (
                    <>
                      <span>•</span>
                      <span className="text-primary/80">Table {order.tableNumber}</span>
                    </>
                  )}
                </div>

                {/* Action Button */}
                {order.paymentMethod === 'pending' && (
                  <Button 
                    size="sm" 
                    variant="default" 
                    className="w-full h-8 mt-1 text-xs font-semibold shadow-none" 
                    onClick={e => handlePayOrder(order, e)}
                  >
                    Pay Now
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <OrderDetailsDialog order={selectedOrder} open={dialogOpen} onOpenChange={setDialogOpen} />

      {orderToPay && (
        <PaymentDialog
          isOpen={paymentDialogOpen}
          onClose={() => setPaymentDialogOpen(false)}
          cartItems={orderToPay.items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: item.selectedUnit.price,
            imageUrl: item.imageUrl,
            variantId: item.variantId,
            variantName: item.variantName,
            unitId: item.selectedUnit.unitId,
            unitName: item.selectedUnit.unitName,
            selectedUnit: item.selectedUnit,
          }))}
          subtotal={orderToPay.subTotal}
          discount={orderToPay.discount}
          customer={
            orderToPay.customerName
              ? {
                  id: 'temp-id',
                  name: orderToPay.customerName,
                  phone: '',
                  email: '',
                }
              : null
          }
          orderType={mapOrderType(orderToPay.orderType)}
          tableNumber={orderToPay.tableNumber}
          onPaymentComplete={order => {
            console.log(order);
            const state = usePosStore.getState();
            state.updateOrderStatus(orderToPay.id, 'completed');
            if (orderToPay.tableNumber) {
               const table = state.tables.find(t => t.number === orderToPay.tableNumber);
               if (table) {
                 state.clearTableOrder(table.id);
               }
            }
            setPaymentDialogOpen(false);
          }}
        />
      )}
    </>
  );
}