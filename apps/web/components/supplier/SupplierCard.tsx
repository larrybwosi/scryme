"use client";

import Link from "next/link";
import { Star, MapPin, Globe, Phone, Mail, MoreVertical } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@repo/ui/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar";
import { Badge } from "@repo/ui/components/ui/badge";
import { toggleFavoriteSupplier } from "../../app/actions/supplier";
import { useState } from "react";
import { cn } from "@repo/ui/lib/utils";

interface SupplierCardProps {
  supplier: any; // Ideally use a proper type
}

export function SupplierCard({ supplier }: SupplierCardProps) {
  const [isFavorite, setIsFavorite] = useState(supplier.isFavorite);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    await toggleFavoriteSupplier(supplier.id);
  };

  const initials = supplier.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div className="flex gap-3">
            <Avatar className="h-12 w-12 rounded-lg">
              <AvatarImage src={supplier.logo} />
              <AvatarFallback className="bg-primary/10 text-primary rounded-lg font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg leading-tight">{supplier.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-[10px] uppercase font-bold py-0 h-4">
                  {supplier.type.replace("_", " ")}
                </Badge>
                <div className="flex items-center text-yellow-500 fill-yellow-500">
                  <Star size={12} className="fill-current" />
                  <span className="text-xs font-medium ml-1 text-muted-foreground">
                    {supplier.rating || "4.5"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical size={16} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <div className="space-y-1.5 text-sm text-muted-foreground">
          {supplier.website && (
            <div className="flex items-center gap-2">
              <Globe size={14} />
              <span className="truncate">{supplier.website}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Phone size={14} />
            <span>{supplier.phone || "No phone"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail size={14} />
            <span className="truncate">{supplier.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} />
            <span className="truncate">
              {supplier.city && supplier.country ? `${supplier.city}, ${supplier.country}` : "Global"}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button asChild className="flex-1" variant="outline">
          <Link href={`/inventory/supplier/${supplier.id}`}>View Details</Link>
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleToggleFavorite}
          className={cn(isFavorite && "text-yellow-500 border-yellow-500 bg-yellow-50")}
        >
          <Star size={18} className={cn(isFavorite && "fill-current")} />
        </Button>
      </CardFooter>
    </Card>
  );
}
