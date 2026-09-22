"use client";

import {
  Star,
  MapPin,
  Globe,
  Phone,
  Mail,
  Edit,
  Trash2,
  Building2,
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/ui/avatar";
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

export function SupplierDetailsHeader({
  supplier,
}: SupplierDetailsHeaderProps) {
  const [isFavorite, setIsFavorite] = useState(supplier.isFavorite);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleToggleFavorite = async () => {
    setIsFavorite(!isFavorite);
    await toggleFavoriteSupplier(supplier.id);
  };

  return (
    <div className="bg-card border-b border-border px-6 py-8 shadow-sm">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
          <div className="flex gap-6 items-center">
            <Avatar className="h-24 w-24 rounded-xl border border-border shadow-sm bg-muted">
              <AvatarImage
                src={supplier.logo || undefined}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold rounded-xl">
                <Building2 className="h-10 w-10" />
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  {supplier.name}
                </h1>
                <Badge
                  variant="secondary"
                  className="uppercase font-semibold px-2.5 py-0.5 bg-primary/10 text-primary border-none">
                  {supplier.type.replace("_", " ")}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Star size={16} className="text-amber-500 fill-amber-500" />
                  <span className="font-semibold text-foreground text-sm">
                    {supplier.avgRating}
                  </span>
                  <span className="text-muted-foreground">
                    ({supplier.reviewCount} reviews)
                  </span>
                </div>
                {supplier.city && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={16} className="text-muted-foreground" />
                    <span className="font-medium">
                      {supplier.city}, {supplier.country}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] py-0.5 px-2 font-semibold tracking-wider",
                      supplier.riskLevel === "low"
                        ? "text-emerald-700 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
                        : supplier.riskLevel === "medium"
                          ? "text-amber-700 dark:text-amber-400 border-amber-500/20 bg-amber-500/10"
                          : "text-rose-700 dark:text-rose-400 border-rose-500/20 bg-rose-500/10",
                    )}>
                    {supplier.riskLevel.toUpperCase()} RISK
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-5 pt-1">
                {supplier.website && (
                  <a
                    href={`https://${supplier.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                    <Globe size={15} />
                    {supplier.website}
                  </a>
                )}
                {supplier.phone && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Phone size={15} />
                    <span className="font-medium text-foreground">{supplier.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail size={15} />
                  <span className="font-medium text-foreground">{supplier.email}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              onClick={handleToggleFavorite}
              className={cn(
                "flex-1 md:flex-none gap-2 rounded-lg h-10 px-4 border-border",
                isFavorite &&
                  "text-amber-500 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20",
              )}>
              <Star size={16} className={cn(isFavorite && "fill-current")} />
              {isFavorite ? "Favorite" : "Favorite"}
            </Button>
            <Button
              variant="outline"
              className="flex-1 md:flex-none gap-2 rounded-lg h-10 px-4 border-border"
              onClick={() => setIsEditModalOpen(true)}>
              <Edit size={16} />
              Edit Profile
            </Button>
            <Button
              variant="destructive"
              className="flex-1 md:flex-none gap-2 rounded-lg h-10 px-4"
              onClick={() => setIsDeleteModalOpen(true)}>
              <Trash2 size={16} />
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
