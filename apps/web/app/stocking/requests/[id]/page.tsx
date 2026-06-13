import React from "react";
import { PageHeader } from "@/components/page-header";
import { ShoppingCart, ArrowLeft, Clock, MapPin, User, FileText } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import Link from "next/link";
import { getStockRequestDetails } from "@/app/actions/stock-management";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Badge } from "@repo/ui/components/ui/badge";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@repo/ui/components/ui/table";

export default async function StockRequestDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const request = await getStockRequestDetails(id);

  if (!request) {
    return <div>Request not found</div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="text-amber-600 bg-amber-50">Pending</Badge>;
      case "APPROVED":
        return <Badge variant="outline" className="text-green-600 bg-green-50">Approved</Badge>;
      case "PARTIALLY_FULFILLED":
        return <Badge variant="outline" className="text-blue-600 bg-blue-50">Partial</Badge>;
      case "FULFILLED":
        return <Badge variant="outline" className="text-purple-600 bg-purple-50">Fulfilled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6 p-8 bg-gray-50/50 min-h-screen">
      <div className="flex items-center justify-between">
        <PageHeader
          title={`Request ${request.requestNumber}`}
          description="View detailed information and fulfillment status for this stock request."
          icon={<ShoppingCart size={24} />}
        />
        <Link href="/stocking/requests">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft size={18} />
            Back to Requests
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Requested Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-center">Requested</TableHead>
                    <TableHead className="text-center">Allocated</TableHead>
                    <TableHead className="text-right pr-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {request.items.map((item: any) => {
                    const isFullyAllocated = Number(item.allocatedQuantity) >= Number(item.requestedQuantity);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="pl-6 font-medium">
                          {item.variant.product.name} {item.variant.name !== "Default" && ` - ${item.variant.name}`}
                        </TableCell>
                        <TableCell className="text-[10px] font-mono text-gray-400 uppercase">{item.variant.sku}</TableCell>
                        <TableCell className="text-center">{Number(item.requestedQuantity)}</TableCell>
                        <TableCell className="text-center font-bold text-blue-600">{Number(item.allocatedQuantity)}</TableCell>
                        <TableCell className="text-right pr-6">
                          {isFullyAllocated ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Allocated</Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {(request.transfers.length > 0 || request.purchases.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Fulfillment Records</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {request.transfers.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <ArrowLeft size={16} className="rotate-180 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Transfer {t.transferNumber}</p>
                        <p className="text-xs text-gray-500">From {t.fromLocation.name}</p>
                      </div>
                    </div>
                    <Link href={`/stocking/transfers/${t.id}`}>
                      <Button variant="ghost" size="sm" className="text-blue-600">View</Button>
                    </Link>
                  </div>
                ))}
                {request.purchases.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <ShoppingCart size={16} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Purchase Order {p.purchaseNumber}</p>
                        <p className="text-xs text-gray-500">Supplier: {p.supplier.name}</p>
                      </div>
                    </div>
                    <Link href={`/purchases/${p.id}`}>
                      <Button variant="ghost" size="sm" className="text-blue-600">View</Button>
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                {getStatusBadge(request.status)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Priority</span>
                <Badge variant="secondary">{request.priority}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Requested Date</span>
                <span className="text-sm font-medium">{format(new Date(request.requestDate), "MMM d, yyyy")}</span>
              </div>
              <div className="pt-4 border-t space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={16} className="text-gray-400" />
                  <span className="text-gray-500">Target:</span>
                  <span className="font-medium">{request.toLocation.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User size={16} className="text-gray-400" />
                  <span className="text-gray-500">By:</span>
                  <span className="font-medium">{request.requestedBy.user.name}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {request.justification && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                    <FileText size={16} /> Justification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 italic">"{request.justification}"</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
