import React from "react";
import { PageHeader } from "../../../components/page-header";
import { getStockMovementHistory } from "../../actions/stock-management";
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
  }>;
}) {
  const params = await searchParams;
  const locations = await getInventoryLocations();

  const startDate = params.startDate
    ? new Date(params.startDate)
    : subDays(new Date(), 30);
  const endDate = params.endDate ? new Date(params.endDate) : new Date();

  const movements = await getStockMovementHistory({
    locationId: params.locationId,
    startDate,
    endDate,
    limit: 50,
  });

  const totalInbound = movements
    .filter((m) => m.quantity.toNumber() > 0)
    .reduce((acc, m) => acc + m.quantity.toNumber(), 0);

  const totalOutbound = movements
    .filter((m) => m.quantity.toNumber() < 0)
    .reduce((acc, m) => acc + Math.abs(m.quantity.toNumber()), 0);

  const netMovementValue = movements.reduce(
    (acc, m) => acc + m.quantity.toNumber() * m.variant.buyingPrice.toNumber(),
    0,
  );

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

      {/* Analytics Summary Widget */}
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
                  Stock Movement Summary
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
