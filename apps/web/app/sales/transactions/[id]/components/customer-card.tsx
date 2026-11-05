"use client";

import React from "react";
import { User, Mail, Phone, ExternalLink } from "lucide-react";
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

  const crmBaseUrl = (process.env.NEXT_PUBLIC_CRM_URL || "https://crm.scryme.tech").replace(/\/$/, "");
  const crmCustomerUrl = `${crmBaseUrl}/customers/${customerId}`;

  const name =
    transaction.customer?.name || transaction.metadata?.customerName || "Anonymous customer";
  const email =
    transaction.customer?.email || transaction.metadata?.customerEmail;
  const phone =
    transaction.customer?.phone || transaction.metadata?.customerPhone;

  // Generate proper initials (e.g. "John Doe" -> "JD")
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part: string) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "CU";

  return (
    <Card className="border border-border/80 bg-card rounded-md shadow-xs overflow-hidden">
      {/* Tight header with aligned CRM action */}
      <CardHeader className="bg-muted/40 px-4 py-2.5 border-b border-border/60">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            Customer
          </CardTitle>
          {isRealCustomer && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted gap-1 rounded-md"
            >
              <a href={crmCustomerUrl} target="_blank" rel="noopener noreferrer">
                <span>View in CRM</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Compact Content */}
      <CardContent className="p-3.5 space-y-3">
        {/* Compact Avatar & Header */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 text-primary border border-primary/20 rounded-full flex items-center justify-center font-semibold text-xs shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <h4 className="text-xs font-semibold text-foreground truncate" title={name}>
              {name}
            </h4>
            <span className="text-[11px] text-muted-foreground block mt-0.5">
              Buyer
            </span>
          </div>
        </div>

        {/* Grouped Contact Details container */}
        <div className="bg-muted/30 rounded-lg p-2.5 space-y-2 border border-border/40 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground min-w-0">
            <Mail className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
            <span
              className={`truncate font-mono text-[11px] ${email ? "text-foreground" : "text-muted-foreground/60 italic"}`}
              title={email || "No email"}
            >
              {email || "No email on file"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground min-w-0">
            <Phone className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
            <span
              className={`font-mono text-[11px] ${phone ? "text-foreground" : "text-muted-foreground/60 italic"}`}
            >
              {phone || "No phone on file"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}