import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/ui/card";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Package,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { FulfillmentStatus } from "@repo/db/client";

export default async function DeliveriesOverviewPage() {
  const auth = await getServerAuth();
  if (!auth?.organizationId) return null;

  const [
    totalFulfillments,
    deliveredCount,
    inTransitCount,
    pendingCount,
    reconciledCount,
    unreconciledCount,
    activeDriversCount,
    totalDriversCount,
    recentDeliveries,
  ] = await Promise.all([
    db.fulfillment.count({
      where: { transaction: { organizationId: auth.organizationId } },
    }),
    db.fulfillment.count({
      where: {
        transaction: { organizationId: auth.organizationId },
        status: { in: [FulfillmentStatus.DELIVERED, FulfillmentStatus.COMPLETED] },
      },
    }),
    db.fulfillment.count({
      where: {
        transaction: { organizationId: auth.organizationId },
        status: { in: [FulfillmentStatus.IN_TRANSIT, FulfillmentStatus.SHIPPED] },
      },
    }),
    db.fulfillment.count({
      where: {
        transaction: { organizationId: auth.organizationId },
        status: FulfillmentStatus.PENDING,
      },
    }),
    db.fulfillment.count({
      where: {
        transaction: { organizationId: auth.organizationId },
        isReconciled: true,
      },
    }),
    db.fulfillment.count({
      where: {
        transaction: { organizationId: auth.organizationId },
        status: { in: [FulfillmentStatus.DELIVERED, FulfillmentStatus.COMPLETED] },
        isReconciled: false,
      },
    }),
    db.driver.count({
      where: {
        organizationId: auth.organizationId,
        availability: { in: ["ONLINE", "ON_DELIVERY"] },
      },
    }),
    db.driver.count({
      where: { organizationId: auth.organizationId },
    }),
    db.fulfillment.findMany({
      where: { transaction: { organizationId: auth.organizationId } },
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        transaction: { include: { customer: true } },
        driver: true,
        items: { include: { batch: true, stockBatch: true, transactionItem: true } },
      },
    }),
  ]);

  const completionRate = totalFulfillments > 0 ? Math.round((deliveredCount / totalFulfillments) * 100) : 0;
  const reconciliationRate = deliveredCount > 0 ? Math.round((reconciledCount / deliveredCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Deliveries</p>
              <h3 className="text-2xl font-bold mt-1">{totalFulfillments}</h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> {completionRate}% Completed
              </p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <Truck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active In-Transit</p>
              <h3 className="text-2xl font-bold mt-1">{inTransitCount}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {pendingCount} Pending Dispatch
              </p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Fleet & Drivers</p>
              <h3 className="text-2xl font-bold mt-1">{activeDriversCount} / {totalDriversCount}</h3>
              <p className="text-xs text-muted-foreground mt-1">Available / Total</p>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Reconciliation</p>
              <h3 className="text-2xl font-bold mt-1">{unreconciledCount}</h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                {reconciliationRate}% Reconciled
              </p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid Section */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Recent Deliveries & Batch Tracing */}
        <Card className="md:col-span-2 border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold">Recent Dispatches & Deliveries</CardTitle>
              <CardDescription>Real-time delivery status and batch origins</CardDescription>
            </div>
            <Link
              href="/sales/deliveries/list"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/40">
              {recentDeliveries.map((f) => {
                const batchCount = f.items.filter((i) => i.batchId || i.stockBatchId).length;
                return (
                  <div key={f.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted text-foreground">
                        <Package className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            {f.transaction?.number || `Order #${f.transactionId.slice(-6)}`}
                          </span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {f.status.toLowerCase().replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Customer: {f.transaction?.customer?.name || "Walk-in Customer"} • Driver: {f.driver?.name || "Unassigned"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {batchCount > 0 ? (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-none text-xs">
                          {batchCount} Batch{batchCount > 1 ? "es" : ""} Linked
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No Batch Linked</span>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(f.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
              {recentDeliveries.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No delivery records found yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Module Navigation */}
        <div className="space-y-6">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Delivery Operations</CardTitle>
              <CardDescription>Quick access to delivery tools</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                href="/sales/deliveries/list"
                className="block p-3 rounded-lg border border-border/60 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <h4 className="text-sm font-medium">Manage Dispatches</h4>
                      <p className="text-xs text-muted-foreground">Assign drivers & link batch tags</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>

              <Link
                href="/sales/deliveries/reconciliation"
                className="block p-3 rounded-lg border border-border/60 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <h4 className="text-sm font-medium">Delivery Reconciliation</h4>
                      <p className="text-xs text-muted-foreground">Verify POD & stock returns</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>

              <Link
                href="/sales/deliveries/drivers"
                className="block p-3 rounded-lg border border-border/60 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <div>
                      <h4 className="text-sm font-medium">Driver & Fleet Roster</h4>
                      <p className="text-xs text-muted-foreground">Manage vehicles and active status</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-muted/20">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-sm">
                <AlertTriangle className="w-4 h-4" /> Batch & Delivery Insights
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Full end-to-end traceability is active. Every production batch output (`Batch`) or inventory stock batch (`StockBatch`) linked to a delivery item allows batch recall and defect tracking in quality incidents.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
