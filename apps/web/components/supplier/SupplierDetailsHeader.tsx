"use client";

import { Star, MapPin, Globe, Phone, Mail, Edit, Share2, Trash2, Building2 } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar";
import { Badge } from "@repo/ui/components/ui/badge";
import { useState } from "react";
import { toggleFavoriteSupplier } from "../../app/actions/supplier";
import { cn } from "@repo/ui/lib/utils";
import { Supplier } from "../../types/supplier";
import { EditSupplierModal } from "./edit-supplier-modal";
import { DeleteSupplierModal } from "./delete-supplier-modal";

interface SupplierDetailsHeaderProps {
  supplier: Supplier;
}

export function SupplierDetailsHeader({ supplier }: SupplierDetailsHeaderProps) {
  const [isFavorite, setIsFavorite] = useState(supplier.isFavorite);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
    <div className="bg-background border-b px-6 py-10 shadow-sm">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
          <div className="flex gap-8 items-center">
            <Avatar className="h-28 w-28 rounded-2xl border-4 border-white shadow-xl bg-muted">
              <AvatarImage src={supplier.logo || undefined} className="object-cover" />
              <AvatarFallback className="bg-primary/5 text-primary text-3xl font-bold rounded-2xl">
                <Building2 className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-4xl font-bold tracking-tight text-[#1D1D1F]">{supplier.name}</h1>
                <Badge variant="secondary" className="uppercase font-bold px-3 py-1 bg-primary/10 text-primary border-none">
                  {supplier.type.replace("_", " ")}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Star size={18} className="text-yellow-500 fill-yellow-500" />
                  <span className="font-bold text-foreground text-base">{supplier.avgRating}</span>
                  <span className="text-muted-foreground">({supplier.reviewCount} reviews)</span>
                </div>
                {supplier.city && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={18} className="text-muted-foreground" />
                    <span className="font-medium">{supplier.city}, {supplier.country}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className={cn(
                    "text-[10px] py-0.5 px-2 font-bold tracking-wider",
                    supplier.riskLevel === "low" ? "text-green-600 border-green-200 bg-green-50" :
                    supplier.riskLevel === "medium" ? "text-amber-600 border-amber-200 bg-amber-50" :
                    "text-red-600 border-red-200 bg-red-50"
                  )}>
                    {supplier.riskLevel.toUpperCase()} RISK
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-6 pt-2">
                 {supplier.website && (
                  <a href={`https://${supplier.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                    <Globe size={16} />
                    {supplier.website}
                  </a>
                 )}
                 {supplier.phone && (
                   <div className="flex items-center gap-1.5 text-sm">
                      <Phone size={16} className="text-muted-foreground" />
                      <span className="font-medium">{supplier.phone}</span>
                   </div>
                 )}
                 <div className="flex items-center gap-1.5 text-sm">
                    <Mail size={16} className="text-muted-foreground" />
                    <span className="font-medium">{supplier.email}</span>
                 </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              onClick={handleToggleFavorite}
              className={cn("flex-1 md:flex-none gap-2 rounded-xl h-11 px-5", isFavorite && "text-yellow-500 border-yellow-500 bg-yellow-50 hover:bg-yellow-100 hover:text-yellow-600")}
            >
              <Star size={18} className={cn(isFavorite && "fill-current")} />
              {isFavorite ? "Favorite" : "Favorite"}
            </Button>
            <Button
              variant="outline"
              className="flex-1 md:flex-none gap-2 rounded-xl h-11 px-5"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit size={18} />
              Edit Profile
            </Button>
            <Button
              variant="destructive"
              className="flex-1 md:flex-none gap-2 rounded-xl h-11 px-5"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <Trash2 size={18} />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <EditSupplierModal
        supplier={supplier}
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      />

      <DeleteSupplierModal
        supplierId={supplier.id}
        supplierName={supplier.name}
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
      />
    </div>
  );
}
