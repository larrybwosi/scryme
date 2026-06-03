import { Badge } from '@repo/ui/components/ui/badge';
import { Label } from '@repo/ui/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import { Separator } from '@repo/ui/components/ui/separator';
import { Skeleton } from '@repo/ui/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@repo/ui/components/ui/sheet';
import { useFormattedCurrency } from '@/lib/utils';
import { User, Clock, Calendar, DollarSign, Package, ShoppingCart, Store, Utensils, ClipboardList } from 'lucide-react';
import { getStatusColor } from '@/components/bakery/BatchCard';
import { ReactNode } from 'react';
import { useBatchById, useBatchTraceability } from '@/hooks/bakery';

interface BatchViewProps {
  batchId: string;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function BatchView({ batchId, trigger, open, onOpenChange }: BatchViewProps) {
  const formattedCurrency = useFormattedCurrency();
  const { data: batch, isLoading } = useBatchById(batchId);
  const { data: traceability, isLoading: traceLoading } = useBatchTraceability(batchId);

  // --- Helpers ---
  const getMarginColor = (margin?: number) => {
    if (!margin) return 'text-muted-foreground';
    if (margin >= 50) return 'text-emerald-600';
    if (margin >= 30) return 'text-blue-600';
    if (margin >= 10) return 'text-amber-600';
    return 'text-red-600';
  };

  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString?: string | Date | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // --- Data Normalization ---
  const financials = batch?.financials || {};
  const unitSymbol = batch?.unit?.symbol || 'units';
  const recipeName = batch?.recipeName || batch?.recipe?.name || 'Unknown Recipe';
  const bakerName = batch?.bakerName || (typeof batch?.baker === 'object' && batch?.baker ? (batch?.baker as any)?.member?.user?.name : batch?.baker) || 'Unassigned';
  const ingredients = batch?.ingredients || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}

      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col h-full">
        {isLoading ? (
          <BatchLoadingSkeleton />
        ) : batch ? (
          <>
            <SheetHeader className="px-6 py-4 border-b">
              <div className="flex items-center justify-between mr-8">
                <SheetTitle>Batch {batch.batchNumber}</SheetTitle>
                <Badge variant="outline" className={getStatusColor(batch.status)}>
                  {batch.status?.replace('_', ' ')}
                </Badge>
              </div>
              <SheetDescription>
                  {recipeName} - {formatDate(batch.scheduledStartAt as any)}
              </SheetDescription>
            </SheetHeader>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-6">
                {/* Information Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Batch Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Recipe</Label>
                        <p className="text-sm font-medium mt-1">{recipeName}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Quantity</Label>
                        <p className="text-sm font-medium mt-1">
                          {batch.plannedQuantity} {unitSymbol}
                          {batch.actualQuantity && batch.actualQuantity !== batch.plannedQuantity && (
                            <span className="text-xs text-muted-foreground ml-1">(actual: {batch.actualQuantity})</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Batch Notes */}
                {batch.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <ClipboardList className="h-4 w-4" />
                        Production Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                        {batch.notes}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Traceability Card (New) */}
                {traceability && (
                  <Card className="border-blue-200 bg-blue-50/30">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2 text-blue-700">
                        <Package className="h-4 w-4" />
                        Traceability Tree
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {traceability.ingredientConsumptions?.map((consumption: any) => (
                        <div key={consumption.id} className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold text-sm">{consumption.stockBatch?.variant?.product?.name} {consumption.stockBatch?.variant?.name}</p>
                              <p className="text-xs text-muted-foreground">Batch: {consumption.stockBatch?.batchNumber || 'N/A'}</p>
                            </div>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                              {consumption.quantity} {consumption.stockBatch?.variant?.baseUnit?.symbol}
                            </Badge>
                          </div>

                          {consumption.stockBatch?.supplier && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-blue-50">
                              <Store className="h-3 w-3 text-blue-500" />
                              <span className="text-xs font-medium">Supplier: {consumption.stockBatch.supplier.name}</span>
                            </div>
                          )}

                          {consumption.stockBatch?.productionBatch && (
                            <div className="flex items-center gap-2 mt-1">
                              <Utensils className="h-3 w-3 text-emerald-500" />
                              <span className="text-xs font-medium">Internal Production: {consumption.stockBatch.productionBatch.recipe.name} (Batch {consumption.stockBatch.productionBatch.batchNumber})</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Ingredients Card */}
                {ingredients.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Utensils className="h-4 w-4" />
                        Ingredients Used
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="pl-6">Item</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right pr-6">Cost</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ingredients.map((ing: any) => (
                            <TableRow key={ing.id}>
                              <TableCell className="font-medium pl-6">{ing.name}</TableCell>
                              <TableCell className="text-right">
                                {ing.quantityUsed?.toFixed(2)}{' '}
                                <span className="text-muted-foreground text-xs">{ing.unit}</span>
                              </TableCell>
                              <TableCell className="text-right pr-6">{formattedCurrency(ing.cost)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {/* Financial Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Financial Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Production Cost */}
                    {financials.productionCost !== undefined && (
                      <div className="bg-muted p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <Package className="h-4 w-4 mr-2" />
                            <Label>Production Cost</Label>
                          </div>
                          <span className="text-2xl font-bold">{formattedCurrency(financials.productionCost)}</span>
                        </div>
                        {financials.costPerUnit !== undefined && (
                          <p className="text-sm text-muted-foreground">
                            {formattedCurrency(financials.costPerUnit)} per {unitSymbol}
                          </p>
                        )}
                      </div>
                    )}

                    <Separator />

                    {/* Pricing Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Retail Pricing */}
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          <Label>Retail</Label>
                        </div>
                        <div className="bg-muted p-3 rounded-lg border space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Price/unit:</span>
                            <span className="font-semibold">{formattedCurrency(financials.retailPrice || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Margin:</span>
                            <span className={`font-bold ${getMarginColor(financials.grossMarginRetail)}`}>
                              {financials.grossMarginRetail?.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Wholesale Pricing */}
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Store className="h-4 w-4 mr-2" />
                          <Label>Wholesale</Label>
                        </div>
                        <div className="bg-muted p-3 rounded-lg border space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Price/unit:</span>
                            <span className="font-semibold">{formattedCurrency(financials.wholesalePrice || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Margin:</span>
                            <span className={`font-bold ${getMarginColor(financials.grossMarginWholesale)}`}>
                              {financials.grossMarginWholesale?.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Schedule & Assignment */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Schedule & Assignment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Scheduled</Label>
                        <div className="flex items-center text-sm mt-1">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="font-medium">
                            {formatDate(batch.scheduledStartAt as any)} {formatTime(batch.scheduledStartAt as any)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Assigned To</Label>
                        <div className="flex items-center text-sm mt-1">
                          <User className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="font-medium">{bakerName}</span>
                        </div>
                      </div>
                    </div>
                    {batch.duration && (
                      <div className="mt-4">
                        <Label className="text-muted-foreground">Duration</Label>
                        <div className="flex items-center text-sm mt-1">
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="font-medium">{batch.duration} minutes</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Timestamps */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created:</span>
                        <span className="font-medium">{new Date(batch.createdAt as any).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Updated:</span>
                        <span className="font-medium">{new Date(batch.updatedAt as any).toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">Batch not found</div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// --- Sub-Component: Loading Skeleton ---
function BatchLoadingSkeleton() {
  return (
    <div className="flex flex-col h-full w-full">
      {/* Header Skeleton */}
      <div className="px-6 py-4 border-b space-y-2">
        <div className="flex items-center justify-between mr-8">
          <Skeleton className="h-6 w-32" /> {/* Title */}
          <Skeleton className="h-5 w-20 rounded-full" /> {/* Badge */}
        </div>
        <Skeleton className="h-4 w-48" /> {/* Description */}
      </div>

      {/* Content Skeleton */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Info Card */}
        <div className="border rounded-xl p-6 space-y-4">
          <Skeleton className="h-5 w-1/3 mb-4" /> {/* Card Title */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-5 w-24" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        </div>

        {/* Ingredients Card Skeleton */}
        <div className="border rounded-xl overflow-hidden">
          <div className="p-6 pb-2">
            <Skeleton className="h-5 w-1/3" />
          </div>
          <div className="p-6 pt-2 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        </div>

        {/* Financials Card */}
        <div className="border rounded-xl p-6 space-y-4">
          <Skeleton className="h-5 w-1/3" /> {/* Card Title */}
          <Skeleton className="h-24 w-full rounded-lg" /> {/* Cost Block */}
          <div className="grid grid-cols-2 gap-4 mt-2">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        </div>

        {/* Schedule Card */}
        <div className="border rounded-xl p-6 space-y-4">
          <Skeleton className="h-5 w-1/3 mb-4" />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
