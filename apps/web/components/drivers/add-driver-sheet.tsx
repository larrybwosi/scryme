"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@repo/ui/components/ui/sheet";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  createDriver,
  getVehicles,
  getDeliveryPartners,
} from "../../app/actions/drivers";
import { toast } from "sonner";
import { Loader2, UserPlus, Mail, Phone, Truck, Building2 } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

export function AddDriverSheet({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    vehicleId: "",
    deliveryPartnerId: "",
  });

  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        const [vResult, pResult] = await Promise.all([
          getVehicles(),
          getDeliveryPartners(),
        ]);
        if (vResult.success) setVehicles(vResult.data || []);
        if (pResult.success) setPartners(pResult.data || []);
      };
      fetchData();
    }
  }, [open]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setFormData({
        name: "",
        email: "",
        phone: "",
        vehicleId: "",
        deliveryPartnerId: "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await createDriver(formData);

    if (result.success) {
      toast.success("Driver added successfully");
      handleOpenChange(false);
    } else {
      toast.error(result.error || "Failed to add driver");
    }
    setLoading(false);
  };

  const isFormValid = formData.name.trim() && formData.phone.trim();

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-border/50 bg-linear-to-r from-primary/5 to-transparent">
            <SheetHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <UserPlus className="h-5 w-5 text-primary" />
                </div>
                <SheetTitle className="text-2xl font-semibold">
                  Add New Driver
                </SheetTitle>
              </div>
              <SheetDescription className="text-sm text-muted-foreground">
                Fill in the driver details to register them for your
                organization.
              </SheetDescription>
            </SheetHeader>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-medium flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-muted-foreground" />
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Enter driver's full name"
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email Address{" "}
                <span className="text-muted-foreground text-xs">
                  (Optional)
                </span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="driver@example.com"
                value={formData.email}
                onChange={e =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label
                htmlFor="phone"
                className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                placeholder="+254 700 000 000"
                value={formData.phone}
                onChange={e =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                required
                className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Delivery Partner */}
            <div className="space-y-2">
              <Label
                htmlFor="partner"
                className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Delivery Partner{" "}
                <span className="text-muted-foreground text-xs">
                  (Optional)
                </span>
              </Label>
              <Select
                value={formData.deliveryPartnerId}
                onValueChange={value =>
                  setFormData({ ...formData, deliveryPartnerId: value })
                }>
                <SelectTrigger className="h-11 transition-all focus:ring-2 focus:ring-primary/20">
                  <SelectValue placeholder="Select delivery partner" />
                </SelectTrigger>
                <SelectContent>
                  {partners.length > 0 ? (
                    partners.map(p => (
                      <SelectItem
                        key={p.id}
                        value={p.id}
                        className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {p.name}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                      No partners available
                    </div>
                  )}
                </SelectContent>
              </Select>
              {partners.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  No delivery partners found. Add a partner first.
                </p>
              )}
            </div>

            {/* Vehicle */}
            <div className="space-y-2">
              <Label
                htmlFor="vehicle"
                className="text-sm font-medium flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                Assigned Vehicle{" "}
                <span className="text-muted-foreground text-xs">
                  (Optional)
                </span>
              </Label>
              <Select
                value={formData.vehicleId}
                onValueChange={value =>
                  setFormData({ ...formData, vehicleId: value })
                }>
                <SelectTrigger className="h-11 transition-all focus:ring-2 focus:ring-primary/20">
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.length > 0 ? (
                    vehicles.map(v => (
                      <SelectItem
                        key={v.id}
                        value={v.id}
                        className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <span>{v.licensePlate}</span>
                          <span className="text-muted-foreground text-xs">
                            {v.make} {v.model}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                      No vehicles available
                    </div>
                  )}
                </SelectContent>
              </Select>
              {vehicles.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  No vehicles found. Add a vehicle first.
                </p>
              )}
            </div>

            {/* Footer */}
            <SheetFooter className="pt-4">
              <Button
                type="submit"
                className={cn(
                  "w-full h-11 text-base font-medium transition-all",
                  "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
                  isFormValid ? "bg-primary" : "opacity-50 cursor-not-allowed",
                )}
                disabled={loading || !isFormValid}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Adding Driver...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-5 w-5" />
                    Add Driver
                  </>
                )}
              </Button>
            </SheetFooter>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
