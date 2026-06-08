import React from 'react';
import { PageHeader } from "../../../components/page-header";
import { getStockMovementHistory } from "../../actions/stock-management";
import { getInventoryLocations, getInventoryProducts } from "../../actions/inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { FileText, Download, Filter, Calendar as CalendarIcon, FileSpreadsheet } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { format, subDays } from "date-fns";

export default async function ReportsPage({
  searchParams
}: {
  searchParams: Promise<{
    locationId?: string;
    startDate?: string;
    endDate?: string;
  }>
}) {
  const params = await searchParams;
  const locations = await getInventoryLocations();

  const startDate = params.startDate ? new Date(params.startDate) : subDays(new Date(), 30);
  const endDate = params.endDate ? new Date(params.endDate) : new Date();

  const movements = await getStockMovementHistory({
    locationId: params.locationId,
    startDate,
    endDate,
    limit: 50
  });

  return (
    <div className="flex flex-col gap-6 p-8 bg-gray-50/50 min-h-screen">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Stock Reports"
          description="Generate and export detailed inventory movement and valuation reports."
          icon={<FileText size={24} />}
        />
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download size={16} />
            <span>Export PDF</span>
          </Button>
          <Button variant="outline" className="gap-2 text-green-700 hover:text-green-800">
            <FileSpreadsheet size={16} />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Report Controls */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Report Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Report Type</label>
                <select className="w-full p-2 border rounded-md bg-white text-sm">
                  <option>Stock Movement Report</option>
                  <option>Inventory Valuation</option>
                  <option>Slow Moving Inventory</option>
                  <option>Expiry Analysis</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Location</label>
                <select name="locationId" defaultValue={params.locationId} className="w-full p-2 border rounded-md bg-white text-sm">
                  <option value="">All Locations</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Date Range</label>
                <div className="space-y-2">
                  <input
                    type="date"
                    name="startDate"
                    defaultValue={format(startDate, "yyyy-MM-dd")}
                    className="w-full p-2 border rounded-md text-sm"
                  />
                  <input
                    type="date"
                    name="endDate"
                    defaultValue={format(endDate, "yyyy-MM-dd")}
                    className="w-full p-2 border rounded-md text-sm"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full gap-2">
                <Filter size={16} /> Update Report
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Report Preview */}
        <Card className="lg:col-span-3">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText size={20} className="text-blue-600" />
                  Stock Movement Summary
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  From {format(startDate, "PP")} to {format(endDate, "PP")}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold">Fixoria Enterprise</div>
                <div className="text-[10px] text-gray-400 uppercase">Internal Report</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center text-gray-500">
                      No data available for the selected period.
                    </TableCell>
                  </TableRow>
                ) : (
                  movements.map((m) => {
                    const value = m.quantity.toNumber() * m.variant.buyingPrice.toNumber();
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="text-xs">{format(new Date(m.movementDate), "MMM dd, yyyy")}</TableCell>
                        <TableCell>
                          <div className="font-medium text-xs">{m.variant.product.name}</div>
                          <div className="text-[10px] text-gray-400">{m.variant.sku}</div>
                        </TableCell>
                        <TableCell className="text-xs">{m.movementType}</TableCell>
                        <TableCell className="text-xs">{m.toLocation?.name || m.fromLocation?.name || "N/A"}</TableCell>
                        <TableCell className={`text-right font-bold text-xs ${m.quantity.toNumber() > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {m.quantity.toNumber()}
                        </TableCell>
                        <TableCell className="text-right text-xs">${Math.abs(value).toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            <div className="p-4 bg-gray-50 border-t flex justify-end gap-8">
               <div className="text-right">
                 <div className="text-[10px] text-gray-500 uppercase font-bold">Total Inbound</div>
                 <div className="text-sm font-bold text-green-600">
                   +{movements.filter(m => m.quantity.toNumber() > 0).reduce((acc, m) => acc + m.quantity.toNumber(), 0)}
                 </div>
               </div>
               <div className="text-right">
                 <div className="text-[10px] text-gray-500 uppercase font-bold">Total Outbound</div>
                 <div className="text-sm font-bold text-red-600">
                   {movements.filter(m => m.quantity.toNumber() < 0).reduce((acc, m) => acc + m.quantity.toNumber(), 0)}
                 </div>
               </div>
               <div className="text-right border-l pl-8">
                 <div className="text-[10px] text-gray-500 uppercase font-bold">Net Movement Value</div>
                 <div className="text-sm font-bold">
                   ${movements.reduce((acc, m) => acc + (m.quantity.toNumber() * m.variant.buyingPrice.toNumber()), 0).toFixed(2)}
                 </div>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
