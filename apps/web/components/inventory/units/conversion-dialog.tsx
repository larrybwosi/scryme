"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@repo/ui/components/ui/form";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { toast } from "sonner";
import {
  createOrgUnitConversion,
  updateOrgUnitConversion,
  deleteOrgUnitConversion,
} from "@/app/actions/units";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/ui/alert-dialog";

const conversionSchema = z.object({
  fromUnitId: z.string().min(1, "Source unit is required"),
  toUnitId: z.string().min(1, "Target unit is required"),
  factor: z.coerce.number().positive("Factor must be positive"),
  offset: z.coerce.number().default(0),
  isApproximate: z.boolean().default(false),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
});

type ConversionFormValues = z.infer<typeof conversionSchema>;

interface ConversionDialogProps {
  children?: React.ReactNode;
  conversion?: any;
  orgUnits: any[];
  systemUnits?: any[];
}

export function ConversionDialog({
  children,
  conversion,
  orgUnits,
  systemUnits = [],
}: ConversionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<ConversionFormValues>({
    resolver: zodResolver(conversionSchema) as any,
    defaultValues: {
      fromUnitId: conversion?.fromUnitId || "",
      toUnitId: conversion?.toUnitId || "",
      factor: conversion?.factor ? Number(conversion.factor) : 1,
      offset: conversion?.offset ? Number(conversion.offset) : 0,
      isApproximate: conversion?.isApproximate || false,
      isActive: conversion?.isActive ?? true,
      notes: conversion?.notes || "",
    },
  });

  async function onSubmit(values: ConversionFormValues) {
    if (values.fromUnitId === values.toUnitId) {
      toast.error("Source and target units must be different");
      return;
    }

    try {
      if (conversion) {
        await updateOrgUnitConversion(conversion.id, values as any);
        toast.success("Conversion updated successfully");
      } else {
        await createOrgUnitConversion(values as any);
        toast.success("Conversion created successfully");
      }
      setOpen(false);
      form.reset();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    }
  }

  async function handleDelete() {
    if (!conversion) return;
    setIsDeleting(true);
    try {
      await deleteOrgUnitConversion(conversion.id);
      toast.success("Conversion deleted successfully");
      setIsDeleteDialogOpen(false);
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete conversion");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {conversion ? "Edit Unit Conversion" : "Create Unit Conversion"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="fromUnitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Unit (Source)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!!conversion}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                          Custom Units
                        </div>
                        {orgUnits.map(u => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name} ({u.symbol})
                          </SelectItem>
                        ))}
                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                          System Units
                        </div>
                        {systemUnits.map(u => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name} ({u.symbol})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="toUnitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To Unit (Target)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!!conversion}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {orgUnits.map(u => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name} ({u.symbol})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  1{" "}
                  {orgUnits.find(u => u.id === form.watch("fromUnitId"))
                    ?.symbol || "Source"}{" "}
                  ={" "}
                </span>
                <div className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name="factor"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            {...field}
                            className="bg-white"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <span className="text-sm font-medium text-blue-900">
                    {orgUnits.find(u => u.id === form.watch("toUnitId"))
                      ?.symbol || "Target"}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-blue-700 italic">
                Formula: Target = Source * Factor + Offset
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isApproximate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Approximate</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional notes about this conversion..."
                      className="resize-none h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              {conversion && (
                <Button
                  type="button"
                  variant="outline"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700 gap-2"
                  onClick={() => setIsDeleteDialogOpen(true)}>
                  <Trash2 size={16} />
                  Delete
                </Button>
              )}
              <Button type="submit" className="flex-1">
                {conversion ? "Update Conversion" : "Create Conversion"}
              </Button>
            </div>
          </form>
        </Form>

        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this
                unit conversion.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={e => {
                  e.preventDefault();
                  handleDelete();
                }}
                disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
