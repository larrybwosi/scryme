"use client";

import { Star, MapPin, Globe, Phone, Mail, Edit, Share2 } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar";
import { Badge } from "@repo/ui/components/ui/badge";
import { useState } from "react";
import { toggleFavoriteSupplier } from "../../app/actions/supplier";
import { cn } from "@repo/ui/lib/utils";

interface SupplierDetailsHeaderProps {
  supplier: any;
}

export function SupplierDetailsHeader({ supplier }: SupplierDetailsHeaderProps) {
  const [isFavorite, setIsFavorite] = useState(supplier.isFavorite);

  const handleToggleFavorite = async () => {
    setIsFavorite(!isFavorite);
    await toggleFavoriteSupplier(supplier.id);
  };

  const initials = supplier.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="bg-background border-b px-6 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex gap-6 items-center">
            <Avatar className="h-24 w-24 rounded-2xl border-4 border-muted">
              <AvatarImage src={supplier.logo} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold rounded-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{supplier.name}</h1>
                <Badge variant="secondary" className="uppercase font-bold">
                  {supplier.type.replace("_", " ")}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Star size={16} className="text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold text-foreground">4.5</span>
                  <span>(120 reviews)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin size={16} />
                  <span>{supplier.city}, {supplier.country}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className={cn(
                    "text-[10px] py-0",
                    supplier.riskLevel === "low" ? "text-green-600 border-green-200 bg-green-50" : "text-amber-600 border-amber-200 bg-amber-50"
                  )}>
                    {supplier.riskLevel.toUpperCase()} RISK
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 pt-1">
                 {supplier.website && (
                  <a href={`https://${supplier.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                    <Globe size={14} />
                    {supplier.website}
                  </a>
                 )}
                 <div className="flex items-center gap-1.5 text-xs">
                    <Phone size={14} className="text-muted-foreground" />
                    {supplier.phone}
                 </div>
                 <div className="flex items-center gap-1.5 text-xs">
                    <Mail size={14} className="text-muted-foreground" />
                    {supplier.email}
                 </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" size="sm" className="flex-1 md:flex-none gap-2">
              <Share2 size={16} />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleFavorite}
              className={cn("flex-1 md:flex-none gap-2", isFavorite && "text-yellow-500 border-yellow-500 bg-yellow-50")}
            >
              <Star size={16} className={cn(isFavorite && "fill-current")} />
              {isFavorite ? "Favorite" : "Add to Favorites"}
            </Button>
            <Button size="sm" className="flex-1 md:flex-none gap-2">
              <Edit size={16} />
              Edit Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
