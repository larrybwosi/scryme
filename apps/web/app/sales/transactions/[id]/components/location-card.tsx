"use client";

import React from "react";
import { Building2, MapPin, User } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@repo/ui/components/ui/card";

interface LocationCardProps {
  transaction: any;
}

export function LocationCard({ transaction }: LocationCardProps) {
  const locationName = transaction.location?.name || "Head office";
  const handler = transaction.member?.user;

  return (
    <Card className="border border-border/80 bg-card rounded-md shadow-xs overflow-hidden">
      {/* Tight header matching design system */}
      <CardHeader className="bg-muted/40 px-4 py-2.5 border-b border-border/60">
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
          Location & Team
        </CardTitle>
      </CardHeader>

      {/* Compact Content */}
      <CardContent className="p-3.5 space-y-2.5">
        {/* Location row */}
        <div className="flex items-center gap-2 text-xs font-medium text-foreground">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="truncate" title={locationName}>
            {locationName}
          </span>
        </div>

        {/* Handled by details container */}
        {handler && (
          <div className="bg-muted/30 rounded-lg p-2.5 space-y-1 border border-border/40 text-xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
              Handled by
            </span>
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
              <div className="min-w-0 flex-1 leading-tight">
                <p className="font-semibold text-foreground text-xs truncate">
                  {handler.name}
                </p>
                {handler.email && (
                  <p className="font-mono text-[11px] text-muted-foreground truncate">
                    {handler.email}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}