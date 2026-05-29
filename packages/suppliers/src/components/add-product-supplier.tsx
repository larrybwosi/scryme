'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/ui/dialog';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select';
import { Switch } from '@repo/ui/components/ui/switch';
import { useAddProductSupplier } from '../lib/api/suppliers';

const addProductSupplierSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  costPrice: z.coerce.number().min(0, "Cost price must be positive"),
  supplierSku: z.string().optional(),
  isPreferred: z.boolean().default(false),
});

type AddProductSupplierValues = z.infer<typeof addProductSupplierSchema>;

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
}

export const AddProductDialog: React.FC<AddProductDialogProps> = ({ open, onOpenChange, supplierId }) => {
  const mutation = useAddProductSupplier(supplierId);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AddProductSupplierValues>({
    resolver: zodResolver(addProductSupplierSchema as any),
    defaultValues: {
      productId: '',
      costPrice: 0,
      supplierSku: '',
      isPreferred: false,
    },
  });

  const onSubmit = async (data: AddProductSupplierValues) => {
    try {
      await mutation.mutateAsync(data);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Product to Supplier</DialogTitle>
          <DialogDescription>Link a product to this supplier with pricing</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="productId">Product</Label>
            <Input {...register('productId')} placeholder="Product ID" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="costPrice">Cost Price</Label>
            <Input type="number" step="0.01" {...register('costPrice')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplierSku">Supplier SKU</Label>
            <Input {...register('supplierSku')} />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="isPreferred"
              checked={watch('isPreferred')}
              onCheckedChange={(checked) => setValue('isPreferred', checked)}
            />
            <Label htmlFor="isPreferred">Set as Preferred Supplier</Label>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {isSubmitting || mutation.isPending ? 'Adding...' : 'Add to Supplier'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
