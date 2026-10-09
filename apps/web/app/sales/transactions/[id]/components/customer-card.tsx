"use client";

import React from "react";
import { User, Mail, Phone, ExternalLink } from "lucide-react";
import { Separator } from "@repo/ui/components/ui/separator";
import { Card, CardHeader, CardTitle, CardContent } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";

interface CustomerCardProps {
  transaction: any;
}

export function CustomerCard({ transaction }: CustomerCardProps) {
  const customerId = transaction.customerId || transaction.customer?.id;
  const isRealCustomer =
    Boolean(customerId) &&
    customerId !== "temp-custom-customer" &&
    !customerId.startsWith("temp-");

  const crmBaseUrl = (process.env.NEXT_PUBLIC_CRM_URL || "http://localhost:3001").replace(/\/$/, "");
  const crmCustomerUrl = `${crmBaseUrl}/customers/${customerId}`;

  const name =
    transaction.customer?.name || transaction.metadata?.customerName || "Anonymous customer";
  const email =
    transaction.customer?.email || transaction.metadata?.customerEmail;
  const phone =
    transaction.customer?.phone || transaction.metadata?.customerPhone;

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
              {name.substring(0, 2)}
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">{name}</h4>
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
                title={email || "No email"}
              >
                {email || "No email on file"}
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Phone className="w-4 h-4 text-muted-foreground/60 shrink-0" />
              <span className="font-mono text-foreground font-medium">
                {phone || "No phone on file"}
              </span>
            </div>
          </div>

          {isRealCustomer && (
            <>
              <Separator className="bg-border" />
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full text-xs font-bold uppercase tracking-wider rounded-none gap-1.5 border-border hover:bg-muted"
              >
                <a href={crmCustomerUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3.5 h-3.5" />
                  View in CRM
                </a>
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
