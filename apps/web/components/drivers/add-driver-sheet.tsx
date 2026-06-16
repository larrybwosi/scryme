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
import { createDriver, getVehicles, getDeliveryPartners } from "../../app/actions/drivers";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
          getDeliveryPartners()
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

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="sm:max-w-[450px]">
        <SheetHeader>
          <SheetTitle>Add New Driver</SheetTitle>
          <SheetDescription>
            Register a new driver for your organization.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address (Optional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={e =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="+254..."
              value={formData.phone}
              onChange={e =>
                setFormData({ ...formData, phone: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="partner">Delivery Partner</Label>
            <Select
              value={formData.deliveryPartnerId}
              onValueChange={value =>
                setFormData({ ...formData, deliveryPartnerId: value })
              }>
              <SelectTrigger>
                <SelectValue placeholder="In-house (None)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">In-house (No Partner)</SelectItem>
                {partners.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vehicle">Assigned Vehicle</Label>
            <Select
              value={formData.vehicleId}
              onValueChange={value =>
                setFormData({ ...formData, vehicleId: value })
              }>
              <SelectTrigger>
                <SelectValue placeholder="No Vehicle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No Vehicle</SelectItem>
                {vehicles.map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.licensePlate} ({v.make} {v.model})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <SheetFooter className="pt-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Driver...
                </>
              ) : (
                "Add Driver"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
