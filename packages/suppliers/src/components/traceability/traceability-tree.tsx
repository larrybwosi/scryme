'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import { Badge } from '@repo/ui/components/ui/badge';
import { Package, Store, Utensils, ArrowRight } from 'lucide-react';

interface TraceabilityTreeProps {
  batch: any;
}

export const TraceabilityTree: React.FC<TraceabilityTreeProps> = ({ batch }) => {
  if (!batch) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Package className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Production Run: {batch.batchNumber}</h3>
        <Badge variant="outline">{batch.recipe?.name}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {batch.ingredientConsumptions?.map((consumption: any) => (
          <Card key={consumption.id} className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-bold">
                  {consumption.stockBatch?.variant?.product?.name}
                </CardTitle>
                <Badge variant="secondary">
                  {consumption.quantity} {consumption.stockBatch?.variant?.baseUnit?.symbol}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="text-xs text-muted-foreground">
                Batch: <span className="font-mono text-blue-600">{consumption.stockBatch?.batchNumber || 'N/A'}</span>
              </div>

              {consumption.stockBatch?.supplier && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md">
                  <Store className="h-3.5 w-3.5 text-blue-600" />
                  <div>
                    <p className="text-[10px] text-blue-600 uppercase font-bold">Supplier</p>
                    <p className="text-xs font-medium">{consumption.stockBatch.supplier.name}</p>
                  </div>
                </div>
              )}

              {consumption.stockBatch?.productionBatch && (
                <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-md">
                  <Utensils className="h-3.5 w-3.5 text-emerald-600" />
                  <div>
                    <p className="text-[10px] text-emerald-600 uppercase font-bold">Internal Run</p>
                    <p className="text-xs font-medium">
                      {consumption.stockBatch.productionBatch.recipe.name} ({consumption.stockBatch.productionBatch.batchNumber})
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {batch.ingredientConsumptions?.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No ingredient consumption data recorded for this batch.</p>
        </div>
      )}
    </div>
  );
};
