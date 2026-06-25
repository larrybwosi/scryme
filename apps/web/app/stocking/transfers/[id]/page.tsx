import React from "react";
import { PageHeader } from "../../../../components/page-header";
import {
  getStockTransferDetails,
  updateStockTransferStatus,
} from "../../../actions/stock-management";
import { notFound } from "next/navigation";
import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Truck,
  PackageCheck,
  Calendar,
  User,
  MapPin,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@repo/ui/components/ui/badge";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";

export default async function TransferDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const transfer = await getStockTransferDetails(id);

  if (!transfer) notFound();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return (
          <Badge
            variant="secondary"
            className="bg-blue-50 text-blue-700 border-blue-200">
            Pending Approval
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge
            variant="secondary"
            className="bg-indigo-50 text-indigo-700 border-indigo-200">
            Approved
          </Badge>
        );
      case "SHIPPED":
        return (
          <Badge
            variant="secondary"
            className="bg-amber-50 text-amber-700 border-amber-200">
            Shipped
          </Badge>
        );
      case "IN_TRANSIT":
        return (
          <Badge
            variant="secondary"
            className="bg-orange-50 text-orange-700 border-orange-200">
            In Transit
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge
            variant="secondary"
            className="bg-green-50 text-green-700 border-green-200">
            Completed
          </Badge>
        );
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      case "CANCELLED":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleAction = async (formData: FormData) => {
    "use server";
    const status = formData.get("status") as any;
    const transferId = formData.get("transferId") as string;
    await updateStockTransferStatus(transferId, status);
  };

  return (
    <div className="flex flex-col gap-6 p-8 bg-gray-50/50 min-h-screen">
      <div className="flex items-center gap-4">
        <Link href="/stocking/transfers">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{transfer.transferNumber}</h1>
            {getStatusBadge(transfer.status)}
          </div>
          <p className="text-sm text-gray-500">
            Requested on{" "}
            {format(new Date(transfer.requestedDate), "MMMM dd, yyyy")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {transfer.status === "PENDING_APPROVAL" && (
            <form action={handleAction}>
              <input type="hidden" name="transferId" value={transfer.id} />
              <input type="hidden" name="status" value="APPROVED" />
              <Button
                type="submit"
                className="gap-2 bg-green-600 hover:bg-green-700">
                <CheckCircle2 size={16} />
                Approve
              </Button>
            </form>
          )}

          {transfer.status === "APPROVED" && (
            <form action={handleAction}>
              <input type="hidden" name="transferId" value={transfer.id} />
              <input type="hidden" name="status" value="SHIPPED" />
              <Button
                type="submit"
                className="gap-2 bg-amber-600 hover:bg-amber-700">
                <Truck size={16} />
                Mark as Shipped
              </Button>
            </form>
          )}

          {(transfer.status === "SHIPPED" ||
            transfer.status === "IN_TRANSIT") && (
            <form action={handleAction}>
              <input type="hidden" name="transferId" value={transfer.id} />
              <input type="hidden" name="status" value="COMPLETED" />
              <Button
                type="submit"
                className="gap-2 bg-green-600 hover:bg-green-700">
                <PackageCheck size={16} />
                Receive Stock
              </Button>
            </form>
          )}

          {(transfer.status === "PENDING_APPROVAL" ||
            transfer.status === "APPROVED") && (
            <form action={handleAction}>
              <input type="hidden" name="transferId" value={transfer.id} />
              <input type="hidden" name="status" value="REJECTED" />
              <Button
                type="submit"
                variant="outline"
                className="gap-2 text-red-600 hover:text-red-700">
                <XCircle size={16} />
                Reject
              </Button>
            </form>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Items Table */}
          <Card>
            <CardHeader>
              <CardTitle>Items to Transfer</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(transfer.items as any[]).map(item => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">
                          {item.variant.product.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.variant.name}
                        </div>
                      </TableCell>
                      <TableCell>{item.variant.sku}</TableCell>
                      <TableCell className="text-right font-medium">
                        {item.requestedQuantity.toNumber()}
                      </TableCell>
                      <TableCell className="text-right">
                        ${item.unitCost.toNumber().toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        $
                        {(
                          item.requestedQuantity.toNumber() *
                          item.unitCost.toNumber()
                        ).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-gray-50/50 font-bold">
                    <TableCell colSpan={4} className="text-right">
                      Total Estimated Value
                    </TableCell>
                    <TableCell className="text-right">
                      $
                      {(transfer.items as any[])
                        .reduce(
                          (acc, item) =>
                            acc +
                            item.requestedQuantity.toNumber() *
                              item.unitCost.toNumber(),
                          0,
                        )
                        .toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Transfer Timeline / Details */}
          <Card>
            <CardHeader>
              <CardTitle>Transfer Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <Calendar size={16} />
                </div>
                <div>
                  <div className="font-medium">Requested</div>
                  <div className="text-sm text-gray-500">
                    By {transfer.requestedBy.user.name} on{" "}
                    {format(new Date(transfer.requestedDate), "PPP p")}
                  </div>
                </div>
              </div>

              {transfer.approvedBy && (
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <div className="font-medium">Approved</div>
                    <div className="text-sm text-gray-500">
                      By {transfer.approvedBy.user.name}
                    </div>
                  </div>
                </div>
              )}

              {transfer.shippedDate && (
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                    <Truck size={16} />
                  </div>
                  <div>
                    <div className="font-medium">Shipped</div>
                    <div className="text-sm text-gray-500">
                      By {transfer.shippedBy?.user.name} on{" "}
                      {format(new Date(transfer.shippedDate), "PPP p")}
                    </div>
                  </div>
                </div>
              )}

              {transfer.completedDate && (
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <PackageCheck size={16} />
                  </div>
                  <div>
                    <div className="font-medium">Received & Completed</div>
                    <div className="text-sm text-gray-500">
                      By {transfer.receivedBy?.user.name} on{" "}
                      {format(new Date(transfer.completedDate), "PPP p")}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-gray-500">
                Route Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-3">
                <MapPin className="text-gray-400 mt-1" size={18} />
                <div>
                  <div className="text-xs text-gray-400 uppercase font-bold">
                    From Location
                  </div>
                  <div className="font-bold text-gray-900">
                    {transfer.fromLocation.name}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="text-gray-400 mt-1" size={18} />
                <div>
                  <div className="text-xs text-gray-400 uppercase font-bold">
                    To Location
                  </div>
                  <div className="font-bold text-gray-900">
                    {transfer.toLocation.name}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-gray-500">
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <FileText className="text-gray-400 mt-1" size={18} />
                <p className="text-sm text-gray-600">
                  {transfer.notes || "No notes provided."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
