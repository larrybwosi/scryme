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
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { toast } from "sonner";
import {
  createOrganizationUnit,
  updateOrganizationUnit,
  deleteOrganizationUnit,
} from "@/app/actions/units";
import { UnitType, IndustryCategory } from "@repo/db/client";
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

const unitSchema = z.object({
  name: z.string().min(1, "Name is required"),
  symbol: z.string().min(1, "Symbol is required"),
  abbreviation: z.string().optional(),
  pluralName: z.string().optional(),
  type: z.nativeEnum(UnitType),
  category: z.nativeEnum(IndustryCategory).default(IndustryCategory.OTHER),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  baseSystemUnitId: z.string().optional().nullable(),
  conversionFactor: z.coerce.number().optional(),
  conversionOffset: z.coerce.number().default(0),
});

type UnitFormValues = z.infer<typeof unitSchema>;

interface UnitDialogProps {
  children?: React.ReactNode;
  unit?: any;
  systemUnits?: any[];
}

export function UnitDialog({
  children,
  unit,
  systemUnits = [],
}: UnitDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitSchema) as any,
    defaultValues: {
      name: unit?.name || "",
      symbol: unit?.symbol || "",
      abbreviation: unit?.abbreviation || "",
      pluralName: unit?.pluralName || "",
      type: unit?.type || UnitType.COUNT,
      category: unit?.category || IndustryCategory.OTHER,
      description: unit?.description || "",
      isActive: unit?.isActive ?? true,
      baseSystemUnitId: unit?.baseSystemUnitId || null,
      conversionFactor: unit?.conversionFactor
        ? Number(unit.conversionFactor)
        : undefined,
      conversionOffset: unit?.conversionOffset
        ? Number(unit.conversionOffset)
        : 0,
    },
  });

  async function onSubmit(values: UnitFormValues) {
    try {
      const submissionData = {
        ...values,
        baseSystemUnitId:
          values.baseSystemUnitId === "none" ? null : values.baseSystemUnitId,
      };

      if (unit) {
        await updateOrganizationUnit(unit.id, submissionData as any);
        toast.success("Organization unit updated successfully");
      } else {
        await createOrganizationUnit(submissionData as any);
        toast.success("Organization unit created successfully");
      }
      setOpen(false);
      form.reset();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    }
  }

  async function handleDelete() {
    if (!unit) return;
    setIsDeleting(true);
    try {
      await deleteOrganizationUnit(unit.id);
      toast.success("Unit deleted successfully");
      setIsDeleteDialogOpen(false);
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete unit");
    } finally {
      setIsDeleting(false);
    }
  }

  const selectedType = form.watch("type");
  const filteredSystemUnits = systemUnits.filter(u => u.type === selectedType);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {unit ? "Edit Organization Unit" : "Create Organization Unit"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Baker's Dozen" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Symbol</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., bdz" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(UnitType).map(type => (
                          <SelectItem key={type} value={type}>
                            {type}
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(IndustryCategory).map(cat => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium">System Mapping (Optional)</h3>
              <p className="text-xs text-gray-500">
                Link this custom unit to a system base unit for automatic
                conversions.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="baseSystemUnitId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base System Unit</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="No mapping" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No mapping</SelectItem>
                          {filteredSystemUnits.map(u => (
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
                  name="conversionFactor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Factor</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          placeholder="1.0"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Value in base system unit
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

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
                    <FormDescription>
                      This unit will be available for use in the system.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain how this unit is used..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              {unit && (
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
                {unit ? "Update Unit" : "Create Unit"}
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
                This action cannot be undone. This will permanently delete the
                custom unit <strong>{unit?.name}</strong>.
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
