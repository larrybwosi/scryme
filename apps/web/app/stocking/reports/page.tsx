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
    stockLevels = await getStockLevels({
      locationId: params.locationId,
    });

    const movementsForTurnover = await getStockMovementHistory({
      locationId: params.locationId,
      startDate,
      endDate,
      limit: 1000,
    });

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
    <div className="flex flex-col gap-6 p-8 bg-gray-50/50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Stock Reports"
          description="Generate and export detailed inventory movement and valuation reports."
          icon={<FileText size={24} className="text-blue-600" />}
        />
        <div className="flex gap-2.5">
          <Button variant="outline" className="gap-2 border-gray-200 shadow-sm h-10">
            <Download size={16} />
            <span>Export PDF</span>
          </Button>
          <Button
            variant="outline"
            className="gap-2 text-green-700 hover:text-green-800 border-green-100 hover:bg-green-50 shadow-sm h-10"
          >
            <FileSpreadsheet size={16} />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Analytics Summary Widgets */}
      {reportType === "Stock Movement Report" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-sm border-gray-100">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Inbound Qty</p>
                <h3 className="text-2xl font-bold text-gray-900">+{totalInbound.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-green-50 rounded-full text-green-600">
                <TrendingUp size={24} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-100">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Outbound Qty</p>
                <h3 className="text-2xl font-bold text-gray-900">-{totalOutbound.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-red-50 rounded-full text-red-600">
                <TrendingDown size={24} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-100">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Movement Value</p>
                <h3 className={`text-2xl font-bold ${netMovementValue >= 0 ? "text-blue-600" : "text-amber-600"}`}>
                  {netMovementValue >= 0 ? "+" : ""}${netMovementValue.toFixed(2)}
                </h3>
              </div>
              <div className={`p-3 rounded-full ${netMovementValue >= 0 ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"}`}>
                <DollarSign size={24} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {reportType === "Inventory Valuation" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-sm border-gray-100">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Items On Hand</p>
                <h3 className="text-2xl font-bold text-gray-900">{totalValuationItems.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                <Layers size={24} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-100">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Cost Value</p>
                <h3 className="text-2xl font-bold text-gray-900">${totalCostValue.toFixed(2)}</h3>
              </div>
              <div className="p-3 bg-green-50 rounded-full text-green-600">
                <TrendingUp size={24} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-100">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Retail Value</p>
                <h3 className="text-2xl font-bold text-gray-900">${totalRetailValue.toFixed(2)}</h3>
              </div>
              <div className="p-3 bg-purple-50 rounded-full text-purple-600">
                <DollarSign size={24} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-100">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Potential Profit</p>
                <h3 className="text-2xl font-bold text-green-600">${potentialProfit.toFixed(2)}</h3>
              </div>
              <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
                <TrendingUp size={24} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {reportType === "Slow Moving Inventory" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-sm border-gray-100">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Slow/Dead Stock Items</p>
                <h3 className="text-2xl font-bold text-gray-900">{totalSlowItemsCount}</h3>
              </div>
              <div className="p-3 bg-amber-50 rounded-full text-amber-600">
                <AlertTriangle size={24} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-100">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dead Stock Value</p>
                <h3 className="text-2xl font-bold text-red-600">${deadStockValue.toFixed(2)}</h3>
              </div>
              <div className="p-3 bg-red-50 rounded-full text-red-600">
                <TrendingDown size={24} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-100">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Most Overstocked Item</p>
                <h3 className="text-sm font-bold text-gray-900 truncate max-w-[200px]" title={mostOverstocked?.name}>
                  {mostOverstocked ? `${mostOverstocked.name} (${mostOverstocked.currentStock})` : "N/A"}
                </h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                <Layers size={24} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {reportType === "Expiry Analysis" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-sm border-gray-100">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Expired Batches</p>
                <h3 className="text-2xl font-bold text-red-600">{totalExpiredCount}</h3>
              </div>
              <div className="p-3 bg-red-50 rounded-full text-red-600">
                <AlertTriangle size={24} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-100">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Expiring Soon (30d)</p>
                <h3 className="text-2xl font-bold text-amber-600">{expiringSoonCount}</h3>
              </div>
              <div className="p-3 bg-amber-50 rounded-full text-amber-600">
                <Calendar size={24} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-100">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Safe Batches</p>
                <h3 className="text-2xl font-bold text-green-600">{safeCount}</h3>
              </div>
              <div className="p-3 bg-green-50 rounded-full text-green-600">
                <TrendingUp size={24} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Report Controls */}
        <Card className="lg:col-span-1 shadow-sm border-gray-100 h-fit bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">
              Report Parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StockReportFilters
              locations={locations}
              initialLocationId={params.locationId}
              initialStartDate={startDate}
              initialEndDate={endDate}
              initialReportType={reportType}
            />
          </CardContent>
        </Card>

        {/* Report Preview */}
        <Card className="lg:col-span-3 shadow-sm border-gray-100 bg-white">
          <CardHeader className="border-b border-gray-100 py-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
                  <FileText size={20} className="text-blue-600" />
                  {reportType}
                </CardTitle>
                <p className="text-xs text-gray-400 mt-1 uppercase font-semibold tracking-wider">
                  {format(startDate, "PP")} — {format(endDate, "PP")}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-sm font-bold text-gray-800">Fixoria Enterprise</div>
                <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                  Internal Report
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {reportType === "Stock Movement Report" && (
              <>
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow>
                      <TableHead className="w-[120px] font-semibold text-gray-600">Date</TableHead>
                      <TableHead className="font-semibold text-gray-600">Product</TableHead>
                      <TableHead className="font-semibold text-gray-600">Activity</TableHead>
                      <TableHead className="font-semibold text-gray-600">Location</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Qty</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="h-72 text-center text-gray-400 font-medium"
                        >
                          No data available for the selected period.
                        </TableCell>
                      </TableRow>
                    ) : (
                      movements.map((m) => {
                        const value =
                          m.quantity.toNumber() * m.variant.buyingPrice.toNumber();
                        const isPositive = m.quantity.toNumber() > 0;
                        return (
                          <TableRow key={m.id} className="hover:bg-gray-50/40">
                            <TableCell className="text-xs text-gray-500 font-medium">
                              {format(new Date(m.movementDate), "MMM dd, yyyy")}
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold text-xs text-gray-800">
                                {m.variant.product.name}
                              </div>
                              <div className="text-[10px] text-gray-400 font-mono">
                                {m.variant.sku}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={`text-[10px] px-2 py-0.5 font-bold ${
                                  isPositive
                                    ? "bg-green-50 text-green-700 hover:bg-green-50 border-none"
                                    : "bg-amber-50 text-amber-700 hover:bg-amber-50 border-none"
                                }`}
                              >
                                {m.movementType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-gray-600 font-medium">
                              {m.toLocation?.name || m.fromLocation?.name || "N/A"}
                            </TableCell>
                            <TableCell
                              className={`text-right font-bold text-xs ${
                                isPositive ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {isPositive ? "+" : ""}
                              {m.quantity.toNumber()}
                            </TableCell>
                            <TableCell className="text-right text-xs font-semibold text-gray-800">
                              ${Math.abs(value).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
                <div className="p-5 bg-gray-50/60 border-t border-gray-100 flex flex-wrap justify-end gap-8">
                  <div className="text-right">
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                      Total Inbound
                    </div>
                    <div className="text-sm font-bold text-green-600">
                      +{totalInbound.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                      Total Outbound
                    </div>
                    <div className="text-sm font-bold text-red-600">
                      -{totalOutbound.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right border-l border-gray-200 pl-8">
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                      Net Movement Value
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      ${netMovementValue.toFixed(2)}
                    </div>
                  </div>
                </div>
              </>
            )}

            {reportType === "Inventory Valuation" && (
              <>
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600">Product</TableHead>
                      <TableHead className="font-semibold text-gray-600">SKU</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">On Hand</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Cost Price</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Retail Price</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Total Cost Value</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Total Retail Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockLevels.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="h-72 text-center text-gray-400 font-medium"
                        >
                          No valuation data available.
                        </TableCell>
                      </TableRow>
                    ) : (
                      stockLevels.map((s, index) => {
                        const itemCost = s.currentStock * s.buyingPrice;
                        const itemRetail = s.currentStock * s.retailPrice;
                        return (
                          <TableRow key={index} className="hover:bg-gray-50/40">
                            <TableCell>
                              <div className="font-semibold text-xs text-gray-800">
                                {s.name}
                              </div>
                              {s.variantName && s.variantName !== "Default" && (
                                <div className="text-[10px] text-gray-400 font-medium">
                                  {s.variantName}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-xs font-mono text-gray-500">{s.sku}</TableCell>
                            <TableCell className="text-right text-xs font-bold text-gray-800">
                              {s.currentStock}
                            </TableCell>
                            <TableCell className="text-right text-xs text-gray-600">
                              ${s.buyingPrice.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right text-xs text-gray-600">
                              ${s.retailPrice.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right text-xs font-semibold text-gray-900">
                              ${itemCost.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right text-xs font-semibold text-green-700">
                              ${itemRetail.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
                <div className="p-5 bg-gray-50/60 border-t border-gray-100 flex flex-wrap justify-end gap-8">
                  <div className="text-right">
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                      Total Cost Value
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      ${totalCostValue.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                      Total Retail Value
                    </div>
                    <div className="text-sm font-bold text-green-700">
                      ${totalRetailValue.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right border-l border-gray-200 pl-8">
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                      Potential Profit
                    </div>
                    <div className="text-sm font-bold text-emerald-600">
                      ${potentialProfit.toFixed(2)}
                    </div>
                  </div>
                </div>
              </>
            )}

            {reportType === "Slow Moving Inventory" && (
              <>
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600">Product</TableHead>
                      <TableHead className="font-semibold text-gray-600">SKU</TableHead>
                      <TableHead className="font-semibold text-gray-600">Status</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Stock Qty</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Sold (Date Range)</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Value On Hand</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Turnover Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slowMovingFiltered.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="h-72 text-center text-gray-400 font-medium"
                        >
                          No slow-moving inventory detected.
                        </TableCell>
                      </TableRow>
                    ) : (
                      slowMovingFiltered.map((s, index) => {
                        const value = s.currentStock * s.buyingPrice;
                        return (
                          <TableRow key={index} className="hover:bg-gray-50/40">
                            <TableCell>
                              <div className="font-semibold text-xs text-gray-800">
                                {s.name}
                              </div>
                              {s.variantName && s.variantName !== "Default" && (
                                <div className="text-[10px] text-gray-400 font-medium">
                                  {s.variantName}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-xs font-mono text-gray-500">{s.sku}</TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={`text-[10px] px-2 py-0.5 font-bold ${
                                  s.status === "No Movement"
                                    ? "bg-red-50 text-red-700 hover:bg-red-50 border-none"
                                    : "bg-amber-50 text-amber-700 hover:bg-amber-50 border-none"
                                }`}
                              >
                                {s.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-xs font-bold text-gray-800">
                              {s.currentStock}
                            </TableCell>
                            <TableCell className="text-right text-xs text-gray-600">
                              {s.soldQty}
                            </TableCell>
                            <TableCell className="text-right text-xs font-semibold text-gray-800">
                              ${value.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right text-xs font-semibold text-gray-900">
                              {s.turnoverRate.toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
                <div className="p-5 bg-gray-50/60 border-t border-gray-100 flex flex-wrap justify-end gap-8">
                  <div className="text-right">
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                      Slow Items
                    </div>
                    <div className="text-sm font-bold text-amber-600">
                      {totalSlowItemsCount}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                      Dead Stock Value
                    </div>
                    <div className="text-sm font-bold text-red-600">
                      ${deadStockValue.toFixed(2)}
                    </div>
                  </div>
                </div>
              </>
            )}

            {reportType === "Expiry Analysis" && (
              <>
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600">Product</TableHead>
                      <TableHead className="font-semibold text-gray-600">Batch Number</TableHead>
                      <TableHead className="font-semibold text-gray-600">Location</TableHead>
                      <TableHead className="font-semibold text-gray-600">Status</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Stock Qty</TableHead>
                      <TableHead className="font-semibold text-gray-600">Expiry Date</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Days Left</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedExpiryBatches.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="h-72 text-center text-gray-400 font-medium"
                        >
                          No expiry data found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      parsedExpiryBatches.map((b, index) => {
                        return (
                          <TableRow key={index} className="hover:bg-gray-50/40">
                            <TableCell>
                              <div className="font-semibold text-xs text-gray-800">
                                {b.productName}
                              </div>
                              {b.variantName && b.variantName !== "Default" && (
                                <div className="text-[10px] text-gray-400 font-medium">
                                  {b.variantName}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-xs font-mono text-gray-500">{b.batchNumber || "-"}</TableCell>
                            <TableCell className="text-xs text-gray-600 font-medium">{b.locationName}</TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={`text-[10px] px-2 py-0.5 font-bold ${
                                  b.status === "Expired"
                                    ? "bg-red-50 text-red-700 hover:bg-red-50 border-none"
                                    : b.status === "Expiring Soon"
                                    ? "bg-amber-50 text-amber-700 hover:bg-amber-50 border-none"
                                    : "bg-green-50 text-green-700 hover:bg-green-50 border-none"
                                }`}
                              >
                                {b.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-xs font-bold text-gray-800">
                              {b.currentQuantity}
                            </TableCell>
                            <TableCell className="text-xs text-gray-600 font-medium">
                              {b.expiry ? format(b.expiry, "PP") : "-"}
                            </TableCell>
                            <TableCell
                              className={`text-right font-bold text-xs ${
                                b.status === "Expired"
                                  ? "text-red-600"
                                  : b.status === "Expiring Soon"
                                  ? "text-amber-600"
                                  : "text-green-600"
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
                <div className="p-5 bg-gray-50/60 border-t border-gray-100 flex flex-wrap justify-end gap-8">
                  <div className="text-right">
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                      Expired Batches
                    </div>
                    <div className="text-sm font-bold text-red-600">
                      {totalExpiredCount}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                      Expiring Soon
                    </div>
                    <div className="text-sm font-bold text-amber-600">
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
