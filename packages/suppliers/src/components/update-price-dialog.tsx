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
import { useUpdateProductPrice } from '../lib/api/suppliers';
import { toast } from 'sonner';

const updatePriceSchema = z.object({
  costPrice: z.coerce.number().min(0.01, "Price must be greater than zero"),
  effectiveDate: z.string().optional(),
});

type UpdatePriceValues = z.infer<typeof updatePriceSchema>;

interface UpdatePriceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  productId: string;
  productName: string;
  currentPrice: number;
}

export const UpdatePriceDialog: React.FC<UpdatePriceDialogProps> = ({
  open,
  onOpenChange,
  supplierId,
  productId,
  productName,
  currentPrice
}) => {
  const mutation = useUpdateProductPrice(supplierId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePriceValues>({
    resolver: zodResolver(updatePriceSchema as any),
    defaultValues: {
      costPrice: currentPrice,
      effectiveDate: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: UpdatePriceValues) => {
    try {
      await mutation.mutateAsync({
        productId,
        costPrice: data.costPrice
      });
      toast.success('Price updated successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update price');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Price</DialogTitle>
          <DialogDescription>
            Update the cost price for <strong>{productName}</strong>. This will be recorded in the price history.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="currentPrice">Current Price</Label>
              <Input id="currentPrice" value={currentPrice} disabled className="bg-muted" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="costPrice">New Price</Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                {...register('costPrice')}
                autoFocus
              />
              {errors.costPrice && (
                <p className="text-sm text-destructive">{errors.costPrice.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="effectiveDate">Effective From</Label>
              <Input
                id="effectiveDate"
                type="date"
                {...register('effectiveDate')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {isSubmitting || mutation.isPending ? 'Updating...' : 'Update Price'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
