"use client";

import React from "react";
import { Truck, CheckCircle2, AlertCircle } from "lucide-react";
import { Card } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";

interface DeliveriesTabProps {
  transaction: any;
  onManageDeliveriesClick: () => void;
}

export function DeliveriesTab({
  transaction,
  onManageDeliveriesClick,
}: DeliveriesTabProps) {
  // POS_SALE are direct over-the-counter and don't need delivery configuration options.
  const isPosSale = transaction.type === "POS_SALE";

  return (
    <div className="space-y-4 rounded-none">
      <div className="flex items-center justify-between border-b border-border pb-3 rounded-none">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Truck className="w-4 h-4 text-muted-foreground" />
          Deliveries
        </h3>
        {!isPosSale && (
          <Button
            size="sm"
            className="h-8 text-[11px] font-bold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-sm rounded-none"
            onClick={onManageDeliveriesClick}
          >
            Manage deliveries
          </Button>
        )}
      </div>

      {transaction.fulfillments && transaction.fulfillments.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 rounded-none">
          {transaction.fulfillments.map((f: any) => (
            <Card
              key={f.id}
              className="p-5 border-border bg-card rounded-none shadow-sm dark:shadow-none space-y-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted border border-border rounded-none text-muted-foreground shadow-inner">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-foreground block">
                      {f.type}
                    </span>
                    <span className="text-xs text-muted-foreground block">
                      Carrier:{" "}
                      <strong className="text-foreground">
                        {f.carrier || "Internal courier"}
                      </strong>
                    </span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase font-bold tracking-widest bg-muted border-border text-muted-foreground px-2.5 py-1 rounded-none"
                >
                  {f.status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted p-4 border border-border text-xs rounded-none">
                <div>
                  <span className="text-muted-foreground uppercase font-bold tracking-widest text-[9px] block">
                    Driver
                  </span>
                  <span className="text-foreground font-semibold text-sm">
                    {f.driver?.name || "Not assigned"}
                  </span>
                  {f.driver?.email && (
                    <span className="text-muted-foreground block text-[11px] font-mono mt-0.5">
                      {f.driver.email}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-muted-foreground uppercase font-bold tracking-widest text-[9px] block">
                    Tracking number
                  </span>
                  <span className="text-foreground font-semibold text-sm font-mono block mt-1 bg-background border border-border px-2 py-0.5 w-fit">
                    {f.trackingNumber || "Not assigned"}
                  </span>
                </div>
              </div>

              {f.receivedBy && (
                <div className="flex items-center gap-2 text-xs border-t border-border pt-3 rounded-none">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-muted-foreground">
                    Received and signed by:{" "}
                    <strong className="text-foreground font-semibold">
                      {f.receivedBy}
                    </strong>
                  </span>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-10 text-center border-dashed border-border bg-muted/10 rounded-none space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {isPosSale
              ? "Over-the-counter POS sale has direct fulfillment on collection."
              : "No deliveries scheduled yet."}
          </p>
          <p className="text-xs text-muted-foreground">
            {isPosSale
              ? "Since this is a POS sale, it does not require additional dispatch tracking or couriers."
              : "This order may be digital, picked up on-site, or waiting to be scheduled."}
          </p>
        </Card>
      )}
    </div>
  );
}
