"use client";

import React from "react";
import { Building2, MapPin, User } from "lucide-react";
import { Separator } from "@repo/ui/components/ui/separator";
import { Card, CardHeader, CardTitle, CardContent } from "@repo/ui/components/ui/card";

interface LocationCardProps {
  transaction: any;
}

export function LocationCard({ transaction }: LocationCardProps) {
  return (
    <Card className="border-border bg-card rounded-none shadow-sm dark:shadow-none overflow-hidden">
      <CardHeader className="bg-muted px-5 py-4 border-b border-border">
        <CardTitle className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          Location & team
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2.5 text-xs text-foreground font-bold">
          <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
          <span>{transaction.location?.name || "Head office"}</span>
        </div>
        {transaction.member?.user && (
          <>
            <Separator className="bg-border my-2" />
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground block">
                Handled by
              </span>
              <p className="font-bold text-foreground">
                {transaction.member.user.name}
              </p>
              <p className="font-mono text-[11px]">
                {transaction.member.user.email}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
