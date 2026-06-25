import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { format } from "date-fns";
import {
  Eye,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

interface SupplierDeliveriesProps {
  purchases: any[];
}

export function SupplierDeliveries({ purchases }: SupplierDeliveriesProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RECEIVED":
      case "COMPLETED":
      case "BILLED":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none font-bold text-[10px] py-0.5 px-2">
            <CheckCircle2 size={12} className="mr-1" /> RECEIVED
          </Badge>
        );
      case "ORDERED":
      case "PARTIALLY_RECEIVED":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-bold text-[10px] py-0.5 px-2">
            <Clock size={12} className="mr-1" /> IN TRANSIT
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none font-bold text-[10px] py-0.5 px-2">
            <AlertCircle size={12} className="mr-1" /> CANCELLED
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="font-bold text-[10px] py-0.5 px-2 uppercase">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border shadow-sm">
        <div className="flex gap-8">
          <div>
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Total Orders
            </div>
            <div className="text-2xl font-bold text-[#1D1D1F]">
              {purchases.length}
            </div>
          </div>
          <div className="w-px h-10 bg-gray-100 self-center" />
          <div>
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Total Spent
            </div>
            <div className="text-2xl font-bold text-[#1D1D1F]">
              KES{" "}
              {purchases
                .reduce((acc, p) => acc + Number(p.totalAmount), 0)
                .toLocaleString()}
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          className="gap-2 rounded-xl h-10 border-gray-200 font-bold text-sm">
          <FileText size={16} />
          Export History
        </Button>
      </div>

      <div className="border rounded-2xl overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b">
              <TableHead className="font-bold py-4 pl-6">Order ID</TableHead>
              <TableHead className="font-bold">Order Date</TableHead>
              <TableHead className="font-bold">Expected Date</TableHead>
              <TableHead className="font-bold">Items</TableHead>
              <TableHead className="font-bold">Total Amount</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="text-right font-bold pr-6">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-40 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="p-3 bg-muted rounded-full">
                      <TrendingUp size={24} className="opacity-20" />
                    </div>
                    <p>No purchase history found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              purchases.map(purchase => (
                <TableRow
                  key={purchase.id}
                  className="hover:bg-gray-50/30 border-b last:border-0 transition-colors">
                  <TableCell className="py-4 pl-6">
                    <span className="font-mono text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded">
                      {purchase.purchaseNumber}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-[#1D1D1F]">
                    {format(new Date(purchase.orderDate), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-muted-foreground">
                    {purchase.expectedDate
                      ? format(new Date(purchase.expectedDate), "MMM dd, yyyy")
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="font-bold text-[10px] bg-gray-50 border-gray-200">
                      8 ITEMS
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold text-[#1D1D1F]">
                    KES {Number(purchase.totalAmount).toLocaleString()}
                  </TableCell>
                  <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                  <TableCell className="text-right pr-6">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-lg hover:bg-primary/5 hover:text-primary">
                      <Eye size={18} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
