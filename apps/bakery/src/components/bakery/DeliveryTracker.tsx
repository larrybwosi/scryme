// fallow-ignore-next-line unused-files
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { Badge } from "@repo/ui/components/ui/badge";
import { Truck, CheckCircle, AlertCircle, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import sdk from "@/lib/sdk";
import { Skeleton } from "@repo/ui/components/ui/skeleton";

export function DeliveryTracker() {
  const { data: deliveries, isLoading } = useQuery({
    queryKey: ["active-deliveries"],
    queryFn: () => sdk.client.get("/bakery/deliveries/active"),
  });

  if (isLoading) return <Skeleton className="h-[400px] w-full" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Truck className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  In Transit
                </p>
                <h3 className="text-2xl font-bold">
                  {(deliveries as any[])?.length || 0}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Shipments</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Partner / Driver</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(deliveries as any[])?.map((delivery) => (
                <TableRow key={delivery.id}>
                  <TableCell className="font-mono font-bold">
                    #{delivery.transaction.number}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {delivery.transaction.deliveryPartner?.name ||
                          "In-house"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {delivery.driver?.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {delivery.transaction.customer?.name || "Guest"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge>{delivery.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" className="h-8">
                      Reconcile
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!deliveries || (deliveries as any[]).length === 0) && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No active deliveries at the moment.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
