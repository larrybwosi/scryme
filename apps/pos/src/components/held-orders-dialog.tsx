'use client';

import { useState, useMemo } from 'react';
import { usePosStore, type HeldOrder, type HeldOrderPriority } from '@/store/store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search,
  Clock,
  User,
  ShoppingBag,
  Play,
  Trash2,
  MoreVertical,
  AlertTriangle,
  AlertCircle,
  Package,
  Timer,
  ChevronUp,
  ChevronDown,
  Eraser,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface HeldOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SortOption = 'time-asc' | 'time-desc' | 'priority' | 'total-desc' | 'total-asc';

const priorityConfig: Record<HeldOrderPriority, { label: string; color: string; icon: React.ReactNode }> = {
  normal: {
    label: 'Normal',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: <Clock className="w-3 h-3" />,
  },
  high: {
    label: 'High',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: <AlertTriangle className="w-3 h-3" />,
  },
  urgent: {
    label: 'Urgent',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: <AlertCircle className="w-3 h-3" />,
  },
};

export function HeldOrdersDialog({ open, onOpenChange }: HeldOrdersDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('time-desc');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [clearAllConfirmOpen, setClearAllConfirmOpen] = useState(false);

  const heldOrders = usePosStore(state => state.heldOrders);
  const retrieveHeldOrder = usePosStore(state => state.retrieveHeldOrder);
  const deleteHeldOrder = usePosStore(state => state.deleteHeldOrder);
  const clearAllHeldOrders = usePosStore(state => state.clearAllHeldOrders);
  const updateHeldOrderPriority = usePosStore(state => state.updateHeldOrderPriority);
  const currency = usePosStore(state => state.settings.currency) || 'KSH';

  // Filter and sort held orders
  const filteredOrders = useMemo(() => {
    let orders = [...heldOrders];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      orders = orders.filter(
        order =>
          order.customerName.toLowerCase().includes(query) ||
          order.orderNumber.toLowerCase().includes(query) ||
          order.reason?.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case 'time-asc':
        orders.sort((a, b) => new Date(a.heldAt).getTime() - new Date(b.heldAt).getTime());
        break;
      case 'time-desc':
        orders.sort((a, b) => new Date(b.heldAt).getTime() - new Date(a.heldAt).getTime());
        break;
      case 'priority':
        const priorityOrder = { urgent: 0, high: 1, normal: 2 };
        orders.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        break;
      case 'total-desc':
        orders.sort((a, b) => b.estimatedTotal - a.estimatedTotal);
        break;
      case 'total-asc':
        orders.sort((a, b) => a.estimatedTotal - b.estimatedTotal);
        break;
    }

    return orders;
  }, [heldOrders, searchQuery, sortBy]);

  const handleRetrieve = (id: string) => {
    retrieveHeldOrder(id);
    onOpenChange(false);
  };

  const handleDelete = (id: string) => {
    deleteHeldOrder(id);
    setDeleteConfirmId(null);
  };

  const handleClearAll = () => {
    clearAllHeldOrders();
    setClearAllConfirmOpen(false);
  };

  const getTimeHeld = (heldAt: Date) => {
    try {
      return formatDistanceToNow(new Date(heldAt), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  const isExpiringSoon = (order: HeldOrder) => {
    if (!order.expiresAt) return false;
    const expiresAt = new Date(order.expiresAt);
    const now = new Date();
    const hoursRemaining = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursRemaining < 2 && hoursRemaining > 0;
  };

  const isExpired = (order: HeldOrder) => {
    if (!order.expiresAt) return false;
    return new Date(order.expiresAt) < new Date();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Held Orders
              {heldOrders.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {heldOrders.length}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Manage temporarily held transactions. Recall an order to continue checkout.
            </DialogDescription>
          </DialogHeader>

          {/* Search and Controls */}
          <div className="flex flex-col sm:flex-row gap-3 py-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer, order number, or reason..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    {sortBy.includes('asc') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortBy('time-desc')}>Newest First</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('time-asc')}>Oldest First</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortBy('priority')}>By Priority</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortBy('total-desc')}>Highest Total</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('total-asc')}>Lowest Total</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {heldOrders.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-destructive hover:text-destructive"
                  onClick={() => setClearAllConfirmOpen(true)}
                >
                  <Eraser className="w-4 h-4" />
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {/* Orders List */}
          <ScrollArea className="flex-1 -mx-6 px-6">
            {filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <div className="p-4 bg-muted rounded-full mb-4">
                  <Package className="w-8 h-8 opacity-50" />
                </div>
                {heldOrders.length === 0 ? (
                  <>
                    <h4 className="font-medium text-foreground">No Held Orders</h4>
                    <p className="text-sm mt-1">Orders you hold will appear here</p>
                  </>
                ) : (
                  <>
                    <h4 className="font-medium text-foreground">No Results</h4>
                    <p className="text-sm mt-1">Try a different search term</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3 pb-4">
                {filteredOrders.map(order => (
                  <Card
                    key={order.id}
                    className={cn(
                      'p-4 transition-all hover:shadow-md border',
                      isExpired(order) && 'opacity-60 bg-muted/50',
                      isExpiringSoon(order) && !isExpired(order) && 'border-amber-300 bg-amber-50/30',
                      order.priority === 'urgent' && 'border-red-200',
                      order.priority === 'high' && 'border-amber-200'
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Order Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{order.orderNumber}</span>
                          <Badge
                            variant="outline"
                            className={cn('text-[10px] px-1.5 py-0', priorityConfig[order.priority].color)}
                          >
                            {priorityConfig[order.priority].icon}
                            <span className="ml-1">{priorityConfig[order.priority].label}</span>
                          </Badge>
                          {isExpired(order) && (
                            <Badge variant="destructive" className="text-[10px]">
                              Expired
                            </Badge>
                          )}
                          {isExpiringSoon(order) && !isExpired(order) && (
                            <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-600">
                              <Timer className="w-3 h-3 mr-1" />
                              Expiring Soon
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {order.customerName}
                          </span>
                          <span className="flex items-center gap-1">
                            <ShoppingBag className="w-3 h-3" />
                            {order.items.length} item{order.items.length !== 1 && 's'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getTimeHeld(order.heldAt)}
                          </span>
                        </div>

                        {order.reason && (
                          <p className="mt-2 text-xs italic text-muted-foreground truncate">"{order.reason}"</p>
                        )}

                        {order.heldByName && (
                          <p className="mt-1 text-[10px] text-muted-foreground">Held by: {order.heldByName}</p>
                        )}
                      </div>

                      {/* Right: Total & Actions */}
                      <div className="flex flex-col items-end gap-2">
                        <span className="font-bold text-lg">
                          {currency} {order.estimatedTotal.toLocaleString()}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => handleRetrieve(order.id)}
                            className="gap-1"
                            disabled={isExpired(order)}
                          >
                            <Play className="w-3.5 h-3.5" />
                            Recall
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => updateHeldOrderPriority(order.id, 'normal')}
                                disabled={order.priority === 'normal'}
                              >
                                Set Normal Priority
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateHeldOrderPriority(order.id, 'high')}
                                disabled={order.priority === 'high'}
                              >
                                Set High Priority
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateHeldOrderPriority(order.id, 'urgent')}
                                disabled={order.priority === 'urgent'}
                              >
                                Set Urgent Priority
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteConfirmId(order.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Held Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The held order and all its items will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Confirmation Dialog */}
      <AlertDialog open={clearAllConfirmOpen} onOpenChange={setClearAllConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Held Orders?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {heldOrders.length} held order
              {heldOrders.length !== 1 && 's'}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
