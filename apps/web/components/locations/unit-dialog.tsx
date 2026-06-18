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
import { createUnit, updateUnit } from "../../app/actions/locations";
import { toast } from "sonner";
import { StorageUnitType, UnitType } from "@repo/db/client";

const unitSchema = z.object({
  name: z.string().min(1, "Name is required"),
  reference: z.string().optional(),
  unitType: z.nativeEnum(StorageUnitType).default(StorageUnitType.SHELF),
  zoneId: z.string().optional().nullable(),
  capacity: z.coerce.number().optional(),
  capacityUnit: z.nativeEnum(UnitType).optional(),
});

type UnitFormValues = z.infer<typeof unitSchema>;

interface UnitDialogProps extends React.ComponentPropsWithoutRef<typeof DialogTrigger> {
  children?: React.ReactNode;
  locationId: string;
  zones?: any[];
  unit?: any;
}

export function UnitDialog({
  children,
  locationId,
  zones = [],
  unit,
  ...props
}: UnitDialogProps) {
  // If we receive button-like props (variant, size), it means we are being used directly as a trigger
  // In that case, we should render a Button
  const trigger = (props as any).variant ? (
    <Button {...(props as any)}>{children}</Button>
  ) : (
    children
  );

  const [open, setOpen] = useState(false);

  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitSchema) as any,
    defaultValues: {
      name: unit?.name || "",
      reference: unit?.reference || "",
      unitType: unit?.unitType || StorageUnitType.SHELF,
      zoneId: unit?.zoneId || null,
      capacity: unit?.capacity || undefined,
      capacityUnit: unit?.capacityUnit || UnitType.COUNT,
    },
  });

  async function onSubmit(values: UnitFormValues) {
    const submissionData = {
      ...values,
      zoneId: values.zoneId === "none" ? null : values.zoneId,
    };

    try {
      if (unit) {
        await updateUnit(unit.id, submissionData as any);
        toast.success("Storage unit updated successfully");
      } else {
        await createUnit({ ...submissionData, locationId } as any);
        toast.success("Storage unit created successfully");
      }
      setOpen(false);
      form.reset();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild {...props}>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {unit ? "Edit Storage Unit" : "Add Storage Unit"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Name / Label</FormLabel>
                    <FormControl>
                      <Input placeholder="Shelf A1 / Bin 42" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference Code</FormLabel>
                    <FormControl>
                      <Input placeholder="REF-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unitType"
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
                        {Object.values(StorageUnitType).map(type => (
                          <SelectItem key={type} value={type}>
                            {type.replace("_", " ")}
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
                name="zoneId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage Zone</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="No zone (Standalone)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">
                          No zone (Standalone)
                        </SelectItem>
                        {zones.map(zone => (
                          <SelectItem key={zone.id} value={zone.id}>
                            {zone.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="capacityUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(UnitType).map(unit => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full">
              {unit ? "Update Unit" : "Create Unit"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
