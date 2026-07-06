import { requireSession } from "@/app/lib/session";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
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
import { ArrowLeft, Package, Clock, CreditCard, CheckCircle2, Truck, Box, Factory } from "lucide-react";
import Link from "next/link";
import { cn } from "@repo/ui/lib/utils";
import { getPortalSDK } from "@/app/lib/portal-sdk";

const statusSteps = [
  { status: "PENDING_CONFIRMATION", label: "Pending", icon: Clock },
  { status: "CONFIRMED", label: "Confirmed", icon: CheckCircle2 },
  { status: "PROCESSING", label: "Processing", icon: Factory },
  { status: "READY", label: "Ready", icon: Box },
  { status: "DISPATCHED", label: "Dispatched", icon: Truck },
  { status: "DELIVERED", label: "Delivered", icon: CheckCircle2 },
];

export default async function OrderDetailPage({
  params
}: {
  params: Promise<{ orgSlug: string, id: string }>
}) {
  const { orgSlug, id } = await params;
  await requireSession(orgSlug);

  const sdk = await getPortalSDK();
  const orders = await sdk.b2b.getOrders(orgSlug);
  const order = orders.find((o: any) => o.id === id);

  if (!order) notFound();

  const currentStatusIndex = statusSteps.findIndex(s => s.status === order.status);
  const isCancelled = order.status === "CANCELLED";
  const isFailed = order.status === "FAILED";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "DELIVERED": return "default";
      case "PENDING_CONFIRMATION": return "secondary";
      case "CANCELLED":
      case "FAILED": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto text-primary-foreground">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${orgSlug}/orders`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order #{order.number}</h1>
          <p className="text-muted-foreground">Placed on {order.createdAt ? format(new Date(order.createdAt), "PPP 'at' p") : "N/A"}</p>
        </div>
        <div className="ml-auto">
          <Badge variant={getStatusColor(order.status) as any} className="text-sm px-3 py-1">
            {order.status.replace(/_/g, ' ')}
          </Badge>
        </div>
      </div>

      {!isCancelled && !isFailed && (
        <Card className="bg-muted/50 border-none shadow-none">
          <CardContent className="p-6">
            <div className="relative flex justify-between items-center w-full max-w-4xl mx-auto">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -translate-y-1/2 -z-0" />
              <div
                className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 transition-all duration-500 -z-0"
                style={{ width: `${(Math.max(0, currentStatusIndex) / (statusSteps.length - 1)) * 100}%` }}
              />

              {statusSteps.map((step, index) => {
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;

                return (
                  <div key={step.status} className="relative z-10 flex flex-col items-center gap-2">
                    <div className={cn(
                      "size-10 rounded-full flex items-center justify-center transition-colors",
                      isCompleted ? "bg-primary text-primary-foreground" : "bg-background border-2 border-muted text-muted-foreground",
                      isCurrent && "ring-4 ring-primary/20"
                    )}>
                      <step.icon className="size-5" />
                    </div>
                    <span className={cn(
                      "text-[10px] font-medium uppercase tracking-wider",
                      isCompleted ? "text-primary" : "text-muted-foreground"
                    )}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items?.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">{item.productName}</div>
                      <div className="text-xs text-muted-foreground">{item.variantName}</div>
                    </TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">${Number(item.unitPrice).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">${Number(item.lineTotal).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${Number(order.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>${Number(order.taxTotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>${Number(order.shippingTotal).toFixed(2)}</span>
              </div>
              <div className="border-t pt-4 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${Number(order.finalTotal).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Package className="size-4 mt-1 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Fulfillment Location</div>
                  <div className="text-xs text-muted-foreground">{order.location?.name}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CreditCard className="size-4 mt-1 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Payment Status</div>
                  <Badge variant="outline" className="mt-1">{order.paymentStatus}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
