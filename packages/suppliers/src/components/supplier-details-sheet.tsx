import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/components/ui/sheet';
import { SupplierUI as Supplier } from '../types/index';

interface SupplierDetailsSheetProps {
  supplier: Supplier | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SupplierDetailsSheet: React.FC<SupplierDetailsSheetProps> = ({ supplier, isOpen, onOpenChange }) => {
  if (!supplier) return null;
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{supplier.name}</SheetTitle>
        </SheetHeader>
        <div className="py-4">
          <p>Details for {supplier.name}</p>
        </div>
      </SheetContent>
    </Sheet>
  );
};
export default SupplierDetailsSheet;
