"use client";

import React from "react";
import { User, Mail, Phone } from "lucide-react";
import { Separator } from "@repo/ui/components/ui/separator";
import { Card, CardHeader, CardTitle, CardContent } from "@repo/ui/components/ui/card";

interface CustomerCardProps {
  transaction: any;
}

export function CustomerCard({ transaction }: CustomerCardProps) {
  return (
    <Card className="border-border bg-card rounded-none shadow-sm dark:shadow-none overflow-hidden">
      <CardHeader className="bg-muted px-5 py-4 border-b border-border">
        <CardTitle className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          Customer
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <div className="space-y-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted border border-border flex items-center justify-center font-bold text-sm text-foreground rounded-none shadow-inner uppercase">
              {(transaction.customer?.name || "A").substring(0, 2)}
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">
                {transaction.customer?.name || "Anonymous customer"}
              </h4>
              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest block mt-0.5">
                Buyer
              </span>
            </div>
          </div>

          <Separator className="bg-border" />

          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Mail className="w-4 h-4 text-muted-foreground/60 shrink-0" />
              <span
                className="font-mono text-foreground font-medium truncate max-w-[200px]"
                title={transaction.customer?.email || "No email"}
              >
                {transaction.customer?.email || "No email on file"}
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Phone className="w-4 h-4 text-muted-foreground/60 shrink-0" />
              <span className="font-mono text-foreground font-medium">
                {transaction.customer?.phone || "No phone on file"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
