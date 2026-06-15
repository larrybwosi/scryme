"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@repo/ui/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/ui/table';
import { Badge } from '@repo/ui/components/ui/badge';
import { Button } from '@repo/ui/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui/components/ui/tooltip';
import { Input } from '@repo/ui/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select';
import {
  Download,
  Eye,
  FileText,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { Delivery, DeliveryItem } from '../types/index';
import { formatDate, useFormattedCurrency } from '../lib/utils';
import { cn } from '@repo/ui/lib/utils';

interface DeliveriesTabProps {
  deliveries: Delivery[];
  isLoading?: boolean;
}

export const DeliveriesTab: React.FC<DeliveriesTabProps> = ({ deliveries, isLoading }) => {
  const formatCurrency = useFormattedCurrency();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredDeliveries = deliveries.filter(d => {
    const matchesSearch = d.purchaseNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter || d.type === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string, type: string) => {
    const s = status.toUpperCase();
    if (type === 'PO') {
      switch (s) {
        case 'DRAFT': return <Badge variant="outline" className="bg-gray-50">Draft</Badge>;
        case 'PENDING_APPROVAL': return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending Approval</Badge>;
        case 'APPROVED': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Approved</Badge>;
        case 'ORDERED': return <Badge variant="default" className="bg-indigo-600">Ordered</Badge>;
        case 'CANCELLED': return <Badge variant="destructive">Cancelled</Badge>;
        default: return <Badge variant="secondary">{status}</Badge>;
      }
    } else {
      switch (s) {
        case 'RECEIVED': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Received</Badge>;
        case 'PARTIALLY_RECEIVED': return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Partial</Badge>;
        default: return <Badge variant="secondary">{status}</Badge>;
      }
    }
  };

  const handleDownloadPO = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // Logic to trigger PO PDF download
    console.log('Downloading PO:', id);
    // window.open(`/api/purchases/${id}/pdf`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-8 items-center justify-center text-muted-foreground">
        <Clock className="h-8 w-8 animate-spin" />
        <p>Loading records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order number..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Records</SelectItem>
              <SelectItem value="PO">Purchase Orders</SelectItem>
              <SelectItem value="RECEIPT">Stock Receipts</SelectItem>
              <SelectItem value="ORDERED">Ordered</SelectItem>
              <SelectItem value="RECEIVED">Received</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reference #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeliveries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileText className="h-8 w-8 opacity-20" />
                      <p>No records found matching your filters.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDeliveries.map((delivery) => (
                  <React.Fragment key={delivery.id}>
                    <TableRow
                      className={cn(
                        "cursor-pointer hover:bg-muted/50",
                        expandedId === delivery.id && "bg-muted/30"
                      )}
                      onClick={() => setExpandedId(expandedId === delivery.id ? null : delivery.id)}
                    >
                      <TableCell>
                        {expandedId === delivery.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={delivery.type === 'PO' ? 'border-blue-200 text-blue-700' : 'border-green-200 text-green-700'}>
                          {delivery.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{delivery.purchaseNumber}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{formatDate(delivery.orderDate || delivery.deliveryDate || delivery.expectedDate || '')}</span>
                          <span className="text-xs text-muted-foreground">
                            {delivery.type === 'PO' ? 'Order Date' : 'Received Date'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(delivery.status, delivery.type)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {formatCurrency(delivery.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {delivery.type === 'PO' && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => handleDownloadPO(e, delivery.id)}
                                  aria-label="Download Purchase Order"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Download PO</TooltipContent>
                            </Tooltip>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label="View Details">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View Details</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedId === delivery.id && (
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableCell colSpan={7} className="p-0">
                          <div className="px-14 py-4 border-t border-muted animate-in slide-in-from-top-2">
                            <h4 className="text-sm font-semibold mb-3">Line Items</h4>
                            <div className="rounded-md border bg-background overflow-hidden">
                              <Table>
                                <TableHeader className="bg-muted/50">
                                  <TableRow>
                                    <TableHead className="h-8 text-xs">Product</TableHead>
                                    <TableHead className="h-8 text-xs">SKU</TableHead>
                                    <TableHead className="h-8 text-xs text-right">Qty</TableHead>
                                    <TableHead className="h-8 text-xs text-right">Unit Price</TableHead>
                                    <TableHead className="h-8 text-xs text-right">Total</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {(delivery.items || []).map((item, idx) => (
                                    <TableRow key={idx} className="text-xs">
                                      <TableCell>{item.name}</TableCell>
                                      <TableCell>{item.sku}</TableCell>
                                      <TableCell className="text-right">
                                        {item.quantityReceived || item.quantityOrdered} {item.unit}
                                      </TableCell>
                                      <TableCell className="text-right">{formatCurrency(item.unitCost || 0)}</TableCell>
                                      <TableCell className="text-right font-medium">{formatCurrency(item.totalCost || 0)}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
