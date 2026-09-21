import { Metadata } from "next";
import React from "react";
import { PageHeader } from "../../../components/page-header";
import {
  getStockMovementHistory,
  getStockLevels,
  getExpiryReportData,
} from "../../actions/stock-management";
import { getInventoryLocations } from "../../actions/inventory";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import {
  FileText,
  Download,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Calendar,
  Layers,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { Badge } from "@repo/ui/components/ui/badge";
import { format, subDays } from "date-fns";
import { StockReportFilters } from "../../../components/stocking/reports/stock-report-filters";

export const metadata: Metadata = {
  title: "Stock Reports",
  description: "Analyze inventory valuation, turnover rate, slow-moving items, and shrinkage metrics.",
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    locationId?: string;
    startDate?: string;
    endDate?: string;
    reportType?: string;
  }>;
}) {
  const params = await searchParams;
  const locations = await getInventoryLocations();

  const startDate = params.startDate
    ? new Date(params.startDate)
    : subDays(new Date(), 30);
  const endDate = params.endDate ? new Date(params.endDate) : new Date();
  const reportType = params.reportType || "Stock Movement Report";

  // Data fetching and prep based on reportType
  let movements: any[] = [];
  let totalInbound = 0;
  let totalOutbound = 0;
  let netMovementValue = 0;

  let totalValuationItems = 0;
  let totalCostValue = 0;
  let totalRetailValue = 0;
  let potentialProfit = 0;
  let stockLevels: any[] = [];

  let slowMovingFiltered: any[] = [];
  let totalSlowItemsCount = 0;
  let deadStockValue = 0;
  let mostOverstocked: any = null;

  let parsedExpiryBatches: any[] = [];
  let totalExpiredCount = 0;
  let expiringSoonCount = 0;
  let safeCount = 0;

  if (reportType === "Stock Movement Report") {
    movements = await getStockMovementHistory({
      locationId: params.locationId,
      startDate,
      endDate,
      limit: 50,
    });

    totalInbound = movements
      .filter((m) => m.quantity.toNumber() > 0)
      .reduce((acc, m) => acc + m.quantity.toNumber(), 0);

    totalOutbound = movements
      .filter((m) => m.quantity.toNumber() < 0)
      .reduce((acc, m) => acc + Math.abs(m.quantity.toNumber()), 0);

    netMovementValue = movements.reduce(
      (acc, m) => acc + m.quantity.toNumber() * m.variant.buyingPrice.toNumber(),
      0,
    );
  } else if (reportType === "Inventory Valuation") {
    stockLevels = await getStockLevels({
      locationId: params.locationId,
    });

    totalValuationItems = stockLevels.reduce(
      (acc, s) => acc + s.currentStock,
      0,
    );

    totalCostValue = stockLevels.reduce(
      (acc, s) => acc + s.currentStock * s.buyingPrice,
      0,
    );

    totalRetailValue = stockLevels.reduce(
      (acc, s) => acc + s.currentStock * s.retailPrice,
      0,
    );

    potentialProfit = totalRetailValue - totalCostValue;
  } else if (reportType === "Slow Moving Inventory") {
    // ⚡ Bolt Optimization: Parallelize fetching of stock levels and movement history to reduce page load time by ~50%
    const [fetchedStockLevels, movementsForTurnover] = await Promise.all([
      getStockLevels({
        locationId: params.locationId,
      }),
      getStockMovementHistory({
        locationId: params.locationId,
        startDate,
        endDate,
        limit: 1000,
      }),
    ]);
    stockLevels = fetchedStockLevels;

    const outboundMap = new Map<string, number>();
    movementsForTurnover.forEach((m) => {
      const qty = m.quantity.toNumber();
      if (qty < 0) {
        const current = outboundMap.get(m.variantId) || 0;
        outboundMap.set(m.variantId, current + Math.abs(qty));
      }
    });

    const slowMovingItems = stockLevels.map((s) => {
      const soldQty = outboundMap.get(s.variantId) || 0;
      const turnoverRate = s.currentStock > 0 ? (soldQty / s.currentStock) * 100 : 0;
      let status = "Normal";
      if (s.currentStock > 0) {
        if (soldQty === 0) {
          status = "No Movement";
        } else if (turnoverRate < 10) {
          status = "Slow";
        }
      }
      return {
        ...s,
        soldQty,
        turnoverRate,
        status,
      };
    });

    slowMovingFiltered = slowMovingItems
      .filter((item) => item.currentStock > 0)
      .sort((a, b) => {
        if (a.status === "No Movement" && b.status !== "No Movement") return -1;
        if (a.status !== "No Movement" && b.status === "No Movement") return 1;
        return a.turnoverRate - b.turnoverRate;
      });

    totalSlowItemsCount = slowMovingFiltered.filter(
      (i) => i.status === "No Movement" || i.status === "Slow"
    ).length;

    deadStockValue = slowMovingFiltered
      .filter((i) => i.status === "No Movement")
      .reduce((acc, i) => acc + i.currentStock * i.buyingPrice, 0);

    mostOverstocked = slowMovingFiltered.reduce(
      (max, i) => (i.currentStock > (max?.currentStock || 0) ? i : max),
      null as any
    );
  } else if (reportType === "Expiry Analysis") {
    const expiryBatches = await getExpiryReportData({
      locationId: params.locationId,
    });

    const now = new Date();

    parsedExpiryBatches = expiryBatches.map((b) => {
      const expiry = b.expiryDate ? new Date(b.expiryDate) : null;
      let daysRemaining = 0;
      let status = "Safe";

      if (expiry) {
        const diffTime = expiry.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (daysRemaining < 0) {
          status = "Expired";
        } else if (daysRemaining <= 30) {
          status = "Expiring Soon";
        }
      }

      return {
        ...b,
        expiry,
        daysRemaining,
        status,
      };
    });

    totalExpiredCount = parsedExpiryBatches.filter((b) => b.status === "Expired").length;
    expiringSoonCount = parsedExpiryBatches.filter((b) => b.status === "Expiring Soon").length;
    safeCount = parsedExpiryBatches.filter((b) => b.status === "Safe").length;
  }

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 bg-background text-foreground min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Stock Reports"
          description="Generate and export detailed inventory movement and valuation reports."
          icon={<FileText size={24} className="text-primary" />}
        />
        <div className="flex gap-2.5">
          <Button variant="outline" className="gap-2 border-input shadow-sm h-10">
            <Download size={16} />
            <span>Export PDF</span>
          </Button>
          <Button
            variant="outline"
            className="gap-2 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 shadow-sm h-10"
          >
            <FileSpreadsheet size={16} />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Analytics Summary Widgets */}
      {reportType === "Stock Movement Report" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-sm border-border bg-card">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Inbound Qty</p>
                <h3 className="text-2xl font-bold text-foreground">+{totalInbound.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 rounded-full">
                <TrendingUp size={24} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border bg-card">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Outbound Qty</p>
                <h3 className="text-2xl font-bold text-foreground">-{totalOutbound.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400 rounded-full">
                <TrendingDown size={24} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border bg-card">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Net Movement Value</p>
                <h3 className={`text-2xl font-bold ${netMovementValue >= 0 ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400"}`}>
                  {netMovementValue >= 0 ? "+" : ""}${netMovementValue.toFixed(2)}
                </h3>
              </div>
              <div className={`p-3 rounded-full ${netMovementValue >= 0 ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400" : "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"}`}>
                <DollarSign size={24} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {reportType === "Inventory Valuation" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-sm border-border bg-card">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Items On Hand</p>
                <h3 className="text-2xl font-bold text-foreground">{totalValuationItems.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 rounded-full">
                <Layers size={24} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border bg-card">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Cost Value</p>
                <h3 className="text-2xl font-bold text-foreground">${totalCostValue.toFixed(2)}</h3>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 rounded-full">
                <TrendingUp size={24} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border bg-card">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Retail Value</p>
                <h3 className="text-2xl font-bold text-foreground">${totalRetailValue.toFixed(2)}</h3>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 rounded-full">
                <DollarSign size={24} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border bg-card">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Potential Profit</p>
                <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${potentialProfit.toFixed(2)}</h3>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 rounded-full">
                <TrendingUp size={24} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {reportType === "Slow Moving Inventory" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-sm border-border bg-card">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Slow/Dead Stock Items</p>
                <h3 className="text-2xl font-bold text-foreground">{totalSlowItemsCount}</h3>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 rounded-full">
                <AlertTriangle size={24} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border bg-card">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dead Stock Value</p>
                <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">${deadStockValue.toFixed(2)}</h3>
              </div>
              <div className="p-3 bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400 rounded-full">
                <TrendingDown size={24} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border bg-card">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Most Overstocked Item</p>
                <h3 className="text-sm font-bold text-foreground truncate max-w-[200px]" title={mostOverstocked?.name}>
                  {mostOverstocked ? `${mostOverstocked.name} (${mostOverstocked.currentStock})` : "N/A"}
                </h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 rounded-full">
                <Layers size={24} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {reportType === "Expiry Analysis" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-sm border-border bg-card">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expired Batches</p>
                <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">{totalExpiredCount}</h3>
              </div>
              <div className="p-3 bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400 rounded-full">
                <AlertTriangle size={24} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border bg-card">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expiring Soon (&le;30 days)</p>
                <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400">{expiringSoonCount}</h3>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 rounded-full">
                <Calendar size={24} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border bg-card">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Safe Batches</p>
                <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{safeCount}</h3>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 rounded-full">
                <TrendingUp size={24} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar Filters */}
        <Card className="lg:col-span-1 shadow-sm border-border bg-card h-fit">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Filter Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <StockReportFilters
              locations={locations}
              initialLocationId={params.locationId}
              initialStartDate={startDate}
              initialEndDate={endDate}
              initialReportType={reportType}
            />
          </CardContent>
        </Card>

        {/* Right Main Table Content */}
        <Card className="lg:col-span-3 shadow-sm border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <FileText size={20} className="text-muted-foreground" />
              <span>{reportType}</span>
            </CardTitle>
            <div className="text-xs text-muted-foreground font-medium">
              {format(startDate, "MMM dd, yyyy")} - {format(endDate, "MMM dd, yyyy")}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {reportType === "Stock Movement Report" && (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-semibold text-muted-foreground">Date & Time</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Product</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Type</TableHead>
                    <TableHead className="text-right font-semibold text-muted-foreground">Qty</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Location(s)</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">User</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-72 text-center text-muted-foreground font-medium"
                      >
                        No movement records found for the selected criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    movements.map((m) => (
                      <TableRow key={m.id} className="hover:bg-muted/50">
                        <TableCell className="whitespace-nowrap">
                          <div className="text-xs font-semibold text-foreground">
                            {format(new Date(m.movementDate), "MMM dd, yyyy")}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium">
                            {format(new Date(m.movementDate), "HH:mm:ss")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-xs text-foreground">
                            {m.variant.product.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium">
                            SKU: {m.variant.sku}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] px-2 py-0.5 font-bold ${
                              m.movementType === "SALE"
                                ? "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-none"
                                : m.movementType === "PURCHASE_RECEIPT"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-none"
                                : m.movementType === "TRANSFER"
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-none"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-none"
                            }`}
                          >
                            {m.movementType}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={`text-right text-xs font-bold ${
                            m.quantity.toNumber() > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {m.quantity.toNumber() > 0
                            ? `+${m.quantity.toNumber()}`
                            : m.quantity.toNumber()}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-medium">
                          {m.fromLocation?.name && m.toLocation?.name
                            ? `${m.fromLocation.name} → ${m.toLocation.name}`
                            : m.toLocation?.name || m.fromLocation?.name || "-"}
                        </TableCell>
                        <TableCell className="text-xs text-foreground font-medium">
                          {m.member?.user?.name || "System"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}

            {reportType === "Inventory Valuation" && (
              <>
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="font-semibold text-muted-foreground">Product</TableHead>
                      <TableHead className="font-semibold text-muted-foreground">SKU</TableHead>
                      <TableHead className="text-right font-semibold text-muted-foreground">On Hand</TableHead>
                      <TableHead className="text-right font-semibold text-muted-foreground">Cost Price</TableHead>
                      <TableHead className="text-right font-semibold text-muted-foreground">Retail Price</TableHead>
                      <TableHead className="text-right font-semibold text-muted-foreground">Total Cost</TableHead>
                      <TableHead className="text-right font-semibold text-muted-foreground">Total Retail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockLevels.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="h-72 text-center text-muted-foreground font-medium"
                        >
                          No inventory items found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      stockLevels.map((s, index) => {
                        const totalCost = s.currentStock * s.buyingPrice;
                        const totalRetail = s.currentStock * s.retailPrice;
                        return (
                          <TableRow key={index} className="hover:bg-muted/50">
                            <TableCell>
                              <div className="font-semibold text-xs text-foreground">
                                {s.name}
                              </div>
                              {s.variantName && s.variantName !== "Default" && (
                                <div className="text-[10px] text-muted-foreground font-medium">
                                  {s.variantName}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-xs font-mono text-muted-foreground">{s.sku}</TableCell>
                            <TableCell className="text-right text-xs font-bold text-foreground">
                              {s.currentStock}
                            </TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground">
                              ${s.buyingPrice.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground">
                              ${s.retailPrice.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right text-xs font-semibold text-foreground">
                              ${totalCost.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right text-xs font-semibold text-foreground">
                              ${totalRetail.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
                <div className="p-5 bg-muted/40 border-t border-border flex flex-wrap justify-end gap-8">
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Total Cost
                    </div>
                    <div className="text-sm font-bold text-foreground">
                      ${totalCostValue.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Total Retail
                    </div>
                    <div className="text-sm font-bold text-foreground">
                      ${totalRetailValue.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Margin Profit
                    </div>
                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      ${potentialProfit.toFixed(2)}
                    </div>
                  </div>
                </div>
              </>
            )}

            {reportType === "Slow Moving Inventory" && (
              <>
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="font-semibold text-muted-foreground">Product</TableHead>
                      <TableHead className="font-semibold text-muted-foreground">SKU</TableHead>
                      <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
                      <TableHead className="text-right font-semibold text-muted-foreground">Stock Qty</TableHead>
                      <TableHead className="text-right font-semibold text-muted-foreground">Sold (Date Range)</TableHead>
                      <TableHead className="text-right font-semibold text-muted-foreground">Value On Hand</TableHead>
                      <TableHead className="text-right font-semibold text-muted-foreground">Turnover Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slowMovingFiltered.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="h-72 text-center text-muted-foreground font-medium"
                        >
                          No slow-moving inventory detected.
                        </TableCell>
                      </TableRow>
                    ) : (
                      slowMovingFiltered.map((s, index) => {
                        const value = s.currentStock * s.buyingPrice;
                        return (
                          <TableRow key={index} className="hover:bg-muted/50">
                            <TableCell>
                              <div className="font-semibold text-xs text-foreground">
                                {s.name}
                              </div>
                              {s.variantName && s.variantName !== "Default" && (
                                <div className="text-[10px] text-muted-foreground font-medium">
                                  {s.variantName}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-xs font-mono text-muted-foreground">{s.sku}</TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={`text-[10px] px-2 py-0.5 font-bold ${
                                  s.status === "No Movement"
                                    ? "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-none"
                                    : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-none"
                                }`}
                              >
                                {s.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-xs font-bold text-foreground">
                              {s.currentStock}
                            </TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground">
                              {s.soldQty}
                            </TableCell>
                            <TableCell className="text-right text-xs font-semibold text-foreground">
                              ${value.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right text-xs font-semibold text-foreground">
                              {s.turnoverRate.toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
                <div className="p-5 bg-muted/40 border-t border-border flex flex-wrap justify-end gap-8">
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Slow Items
                    </div>
                    <div className="text-sm font-bold text-amber-600 dark:text-amber-400">
                      {totalSlowItemsCount}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Dead Stock Value
                    </div>
                    <div className="text-sm font-bold text-red-600 dark:text-red-400">
                      ${deadStockValue.toFixed(2)}
                    </div>
                  </div>
                </div>
              </>
            )}

            {reportType === "Expiry Analysis" && (
              <>
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="font-semibold text-muted-foreground">Product</TableHead>
                      <TableHead className="font-semibold text-muted-foreground">Batch Number</TableHead>
                      <TableHead className="font-semibold text-muted-foreground">Location</TableHead>
                      <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
                      <TableHead className="text-right font-semibold text-muted-foreground">Stock Qty</TableHead>
                      <TableHead className="font-semibold text-muted-foreground">Expiry Date</TableHead>
                      <TableHead className="text-right font-semibold text-muted-foreground">Days Left</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedExpiryBatches.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="h-72 text-center text-muted-foreground font-medium"
                        >
                          No expiry data found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      parsedExpiryBatches.map((b, index) => {
                        return (
                          <TableRow key={index} className="hover:bg-muted/50">
                            <TableCell>
                              <div className="font-semibold text-xs text-foreground">
                                {b.productName}
                              </div>
                              {b.variantName && b.variantName !== "Default" && (
                                <div className="text-[10px] text-muted-foreground font-medium">
                                  {b.variantName}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-xs font-mono text-muted-foreground">{b.batchNumber || "-"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground font-medium">{b.locationName}</TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={`text-[10px] px-2 py-0.5 font-bold ${
                                  b.status === "Expired"
                                    ? "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-none"
                                    : b.status === "Expiring Soon"
                                    ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-none"
                                    : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-none"
                                }`}
                              >
                                {b.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-xs font-bold text-foreground">
                              {b.currentQuantity}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground font-medium">
                              {b.expiry ? format(b.expiry, "PP") : "-"}
                            </TableCell>
                            <TableCell
                              className={`text-right font-bold text-xs ${
                                b.status === "Expired"
                                  ? "text-red-600 dark:text-red-400"
                                  : b.status === "Expiring Soon"
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {b.status === "Expired" ? `Expired` : `${b.daysRemaining} days`}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
                <div className="p-5 bg-muted/40 border-t border-border flex flex-wrap justify-end gap-8">
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Expired Batches
                    </div>
                    <div className="text-sm font-bold text-red-600 dark:text-red-400">
                      {totalExpiredCount}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Expiring Soon
                    </div>
                    <div className="text-sm font-bold text-amber-600 dark:text-amber-400">
                      {expiringSoonCount}
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
