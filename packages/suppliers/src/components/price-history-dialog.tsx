'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/ui/table';
import { useGetSupplierPriceHistory } from '../lib/api/suppliers';
import { formatDate, useFormattedCurrency } from '../lib/utils';
import { TrendingDown, TrendingUp, Minus, Clock } from 'lucide-react';

interface PriceHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  variantId?: string;
  productName: string;
}

export const PriceHistoryDialog: React.FC<PriceHistoryDialogProps> = ({
  open,
  onOpenChange,
  supplierId,
  variantId,
  productName
}) => {
  const { data: history, isLoading } = useGetSupplierPriceHistory(supplierId, variantId);
  const formatCurrency = useFormattedCurrency();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Price History: {productName}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : history && history.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Effective Date</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-center">Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((entry, index) => {
                    const prevEntry = history[index + 1];
                    const diff = prevEntry ? entry.costPrice - prevEntry.costPrice : 0;

                    return (
                      <TableRow key={entry.id}>
                        <TableCell>{formatDate(entry.effectiveDate)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(entry.costPrice)}
                        </TableCell>
                        <TableCell className="text-center">
                          {diff > 0 ? (
                            <div className="flex items-center justify-center text-destructive">
                              <TrendingUp className="h-4 w-4 mr-1" />
                              <span className="text-xs">+{formatCurrency(diff)}</span>
                            </div>
                          ) : diff < 0 ? (
                            <div className="flex items-center justify-center text-green-600">
                              <TrendingDown className="h-4 w-4 mr-1" />
                              <span className="text-xs">{formatCurrency(diff)}</span>
                            </div>
                          ) : (
                            <Minus className="h-4 w-4 mx-auto text-muted-foreground" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No price history available for this product.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
