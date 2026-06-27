import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";
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
import { Textarea } from "@repo/ui/components/ui/textarea";
import { SupplierUI as Supplier } from "../types/index";

interface EditSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier;
  onSave: (supplierData: Partial<Supplier>) => void;
}

export const EditSupplierDialog: React.FC<EditSupplierDialogProps> = ({
  open,
  onOpenChange,
  supplier,
  onSave,
}) => {
  const handleSave = () => {
    onSave({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Supplier Information</DialogTitle>
          <DialogDescription>
            Update supplier details and contact information
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Supplier Name</Label>
              <Input defaultValue={supplier.name} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select defaultValue={supplier.type}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manufacturer">Manufacturer</SelectItem>
                  <SelectItem value="distributor">Distributor</SelectItem>
                  <SelectItem value="wholesaler">Wholesaler</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primary Contact</Label>
              <Input defaultValue={supplier.contact.primaryContact} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" defaultValue={supplier.contact.email} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input defaultValue={supplier.contact.phone} />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input defaultValue={supplier.contact.website} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Textarea defaultValue={supplier.address.street} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
