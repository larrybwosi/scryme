import { Metadata } from "next";
import React from "react";
import { PageHeader } from "@/components/page-header";
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
  Edit,
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
            className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
            Pending Approval
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge
            variant="secondary"
            className="bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800">
            Approved
          </Badge>
        );
      case "SHIPPED":
        return (
          <Badge
            variant="secondary"
            className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
            Shipped
          </Badge>
        );
      case "IN_TRANSIT":
        return (
          <Badge
            variant="secondary"
            className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800">
            In Transit
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge
            variant="secondary"
            className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
            Completed
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge
            variant="destructive"
            className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">
            Rejected
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge
            variant="secondary"
            className="bg-muted text-muted-foreground border-border">
            Cancelled
          </Badge>
        );
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
    <div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
      <div className="flex items-center gap-4">
        <Link href="/stocking/transfers">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">
              {transfer.transferNumber}
            </h1>
            {getStatusBadge(transfer.status)}
          </div>
          <p className="text-sm text-muted-foreground">
            Requested on{" "}
            {format(new Date(transfer.requestedDate), "MMMM dd, yyyy")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/api/stocking/transfers/${transfer.id}/packing-list`}>
            <Button variant="outline" className="gap-2">
              <FileText size={16} />
              Download Packing List
            </Button>
          </Link>

          {!["COMPLETED", "CANCELLED", "REJECTED"].includes(
            transfer.status,
          ) && (
            <Link href={`/stocking/transfers/${transfer.id}/edit`}>
              <Button variant="outline" className="gap-2">
                <Edit size={16} />
                Edit
              </Button>
            </Link>
          )}

          {transfer.status === "PENDING_APPROVAL" && (
            <form action={handleAction}>
              <input type="hidden" name="transferId" value={transfer.id} />
              <input type="hidden" name="status" value="APPROVED" />
              <Button
                type="submit"
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600">
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
                className="gap-2 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600">
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
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600">
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
                className="gap-2 text-destructive hover:text-destructive border-destructive hover:bg-destructive/10">
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
                        <div className="font-medium text-foreground">
                          {item.variant.product.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.variant.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.variant.sku}
                      </TableCell>
                      <TableCell className="text-right font-medium text-foreground">
                        {item.requestedQuantity.toNumber()}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        ${item.unitCost.toNumber().toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-foreground">
                        $
                        {(
                          item.requestedQuantity.toNumber() *
                          item.unitCost.toNumber()
                        ).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell
                      colSpan={4}
                      className="text-right text-foreground">
                      Total Estimated Value
                    </TableCell>
                    <TableCell className="text-right text-foreground">
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
                <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <Calendar size={16} />
                </div>
                <div>
                  <div className="font-medium text-foreground">Requested</div>
                  <div className="text-sm text-muted-foreground">
                    By {transfer.requestedBy.user.name} on{" "}
                    {format(new Date(transfer.requestedDate), "PPP p")}
                  </div>
                </div>
              </div>

              {transfer.approvedBy && (
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Approved</div>
                    <div className="text-sm text-muted-foreground">
                      By {transfer.approvedBy.user.name}
                    </div>
                  </div>
                </div>
              )}

              {transfer.shippedDate && (
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                    <Truck size={16} />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Shipped</div>
                    <div className="text-sm text-muted-foreground">
                      By {transfer.shippedBy?.user.name} on{" "}
                      {format(new Date(transfer.shippedDate), "PPP p")}
                    </div>
                  </div>
                </div>
              )}

              {transfer.completedDate && (
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <PackageCheck size={16} />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">
                      Received & Completed
                    </div>
                    <div className="text-sm text-muted-foreground">
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
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                Route Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-3">
                <MapPin className="text-muted-foreground mt-1" size={18} />
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-bold">
                    From Location
                  </div>
                  <div className="font-bold text-foreground">
                    {transfer.fromLocation.name}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="text-muted-foreground mt-1" size={18} />
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-bold">
                    To Location
                  </div>
                  <div className="font-bold text-foreground">
                    {transfer.toLocation.name}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <FileText className="text-muted-foreground mt-1" size={18} />
                <p className="text-sm text-muted-foreground">
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

export const metadata: Metadata = {
  title: "Stock Transfer Details",
  description: "Review inter-branch inventory movement details and dispatch status.",
};
