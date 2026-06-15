"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@repo/ui/components/ui/sheet";
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
import { Textarea } from "@repo/ui/components/ui/textarea";
import { Switch } from "@repo/ui/components/ui/switch";
import { createLocation, updateLocation } from "../../app/actions/locations";
import { toast } from "sonner";
import { LocationType } from "@repo/db/client";
import { ScrollArea } from "@repo/ui/components/ui/scroll-area";

const locationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(1, "Location code is required"),
  description: z.string().optional(),
  locationType: z.enum(LocationType).default(LocationType.RETAIL_SHOP),
  isDefault: z.boolean().default(false),
  parentLocationId: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  contact: z
    .object({
      email: z.string().email().optional().or(z.literal("")),
      phone: z.string().optional(),
    })
    .optional(),
});

type LocationFormValues = z.infer<typeof locationSchema>;

interface LocationSheetProps {
  children?: React.ReactNode;
  location?: any;
  locations?: any[];
  members?: any[];
  isEdit?: boolean;
}

export function LocationSheet({
  children,
  location,
  locations = [],
  members = [],
  isEdit = false,
}: LocationSheetProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema) as any,
    defaultValues: {
      name: location?.name || "",
      code: location?.code || "",
      description: location?.description || "",
      locationType: location?.locationType || LocationType.RETAIL_SHOP,
      isDefault: location?.isDefault || false,
      parentLocationId: location?.parentLocationId || null,
      managerId: location?.managerId || null,
      address: {
        street: location?.address?.street || "",
        city: location?.address?.city || "",
        state: location?.address?.state || "",
        zipCode: location?.address?.zipCode || "",
        country: location?.address?.country || "",
      },
      contact: {
        email: location?.contact?.email || "",
        phone: location?.contact?.phone || "",
      },
    },
  });

  const locationName = form.watch("name");

  useEffect(() => {
    if (!isEdit && locationName && !form.getValues("code")) {
      const generatedCode = locationName
        .toUpperCase()
        .replace(/\s+/g, "-")
        .substring(0, 10);
      form.setValue("code", generatedCode, { shouldValidate: true });
    }
  }, [locationName, isEdit, form]);

  async function onSubmit(values: LocationFormValues) {
    const submissionData = {
      ...values,
      parentLocationId:
        values.parentLocationId === "none" ? null : values.parentLocationId,
      managerId: values.managerId === "none" ? null : values.managerId,
    };

    try {
      if (isEdit && location?.id) {
        await updateLocation(location.id, submissionData as any);
        toast.success("Location updated successfully");
      } else {
        await createLocation(submissionData as any);
        toast.success("Location created successfully");
      }
      setOpen(false);
      form.reset();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="sm:max-w-xl flex flex-col h-full p-0">
        <SheetHeader className="p-6 border-b">
          <SheetTitle>{location ? "Edit Location" : "Add Location"}</SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col h-full overflow-hidden">
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6 pb-8">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Main Warehouse" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location Code</FormLabel>
                        <FormControl>
                          <Input placeholder="WH-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="locationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(LocationType).map(type => (
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
                    name="parentLocationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Location</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="None" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {locations
                              .filter(l => l.id !== location?.id)
                              .map(l => (
                                <SelectItem key={l.id} value={l.id}>
                                  {l.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="managerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manager</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Assign manager" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Unassigned</SelectItem>
                          {members.map(m => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.user.name}
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe this location..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <h3 className="text-sm font-medium border-b pb-2">
                    Address Details
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="address.street"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="address.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address.state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State / Province</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="address.zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP / Postal Code</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address.country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium border-b pb-2">
                    Contact Info
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contact.email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contact.phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Default Location
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Set as the primary location for new products and
                          transactions.
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>
            <SheetFooter className="p-6 border-t bg-white">
              <Button type="submit" className="w-full">
                {location ? "Update Location" : "Create Location"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
