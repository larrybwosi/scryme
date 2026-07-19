"use client";

import React, { useState, useEffect, useRef } from "react";
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
  SheetDescription,
} from "@repo/ui/components/ui/sheet";
import {
  Form,
  FormControl,
  FormDescription,
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@repo/ui/components/ui/card";
import { Separator } from "@repo/ui/components/ui/separator";
import { Badge } from "@repo/ui/components/ui/badge";
import { createLocation, updateLocation } from "../../app/actions/locations";
import { toast } from "sonner";
import { LocationType } from "@repo/db/client";
import { ImageUpload } from "../image-upload";
import { LocationMap } from "./location-map";
import {
  Building,
  MapPin,
  Phone,
  ImageIcon,
  Settings2,
  Boxes,
  Star,
} from "lucide-react";

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
  capacity: z
    .object({
      total: z.number().optional(),
      unit: z.string().optional(),
    })
    .optional(),
  settings: z
    .object({
      imageUrl: z.string().optional().nullable(),
      latitude: z.number().optional().nullable(),
      longitude: z.number().optional().nullable(),
    })
    .optional(),
});

type LocationFormValues = z.infer<typeof locationSchema>;

interface LocationSheetProps extends React.ComponentPropsWithoutRef<
  typeof SheetTrigger
> {
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
  ...props
}: LocationSheetProps) {
  const [open, setOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const locationSettings = (location?.settings as any) || {};

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
      capacity: {
        total: location?.capacity?.total || 0,
        unit: location?.capacity?.unit || "units",
      },
      settings: {
        imageUrl: locationSettings.imageUrl || "",
        latitude: locationSettings.latitude || null,
        longitude: locationSettings.longitude || null,
      },
    },
  });

  const locationName = form.watch("name");
  const isDefault = form.watch("isDefault");

  useEffect(() => {
    if (!isEdit && locationName && !form.getValues("code")) {
      const generatedCode = locationName
        .toUpperCase()
        .replace(/\s+/g, "-")
        .substring(0, 10);
      form.setValue("code", generatedCode, { shouldValidate: true });
    }
  }, [locationName, isEdit, form]);

  // Auto-scroll to top when sheet opens
  useEffect(() => {
    if (open && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [open]);

  async function onSubmit(values: LocationFormValues) {
    const submissionData = {
      ...values,
      parentLocationId:
        values.parentLocationId === "none" ? null : values.parentLocationId,
      managerId: values.managerId === "none" ? null : values.managerId,
      settings: {
        ...((location?.settings as any) || {}),
        ...values.settings,
      },
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
      <SheetTrigger asChild {...props}>
        {children}
      </SheetTrigger>
      <SheetContent
        className="sm:max-w-xl flex flex-col h-dvh p-0"
        side="right">
        {/* Fixed Header */}
        <div className="shrink-0 p-6 pb-4 border-b">
          <SheetHeader className="space-y-1.5 p-0">
            <div className="flex items-center gap-2">
              <SheetTitle>
                {isEdit ? "Edit Location" : "Add Location"}
              </SheetTitle>
              {isDefault && <Badge className="shrink-0">Default</Badge>}
            </div>
            <SheetDescription>
              {isEdit
                ? "Update the location details below."
                : "Fill in the details to create a new location."}
            </SheetDescription>
          </SheetHeader>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col min-h-0 flex-1">
            {/* Scrollable Content */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto px-6 py-6"
              style={{
                overscrollBehavior: "contain",
                WebkitOverflowScrolling: "touch",
              }}>
              <div className="space-y-5">
                {/* Basic Information */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base font-medium">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      Basic Information
                    </CardTitle>
                    <CardDescription>
                      Identity, hierarchy, and ownership for this location.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Name <span className="text-destructive">*</span>
                            </FormLabel>
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
                            <FormLabel>
                              Location Code{" "}
                              <span className="text-destructive">*</span>
                            </FormLabel>
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
                                    {type.replace(/_/g, " ")}
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
                              className="resize-none"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Address */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base font-medium">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      Address Details
                    </CardTitle>
                    <CardDescription>
                      Physical mailing address for this location.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="address.street"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main St" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="address.city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="New York" {...field} />
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
                              <Input placeholder="NY" {...field} />
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
                              <Input placeholder="10001" {...field} />
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
                              <Input placeholder="United States" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Contact */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base font-medium">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      Contact Info
                    </CardTitle>
                    <CardDescription>
                      How customers or staff can reach this location.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="contact.email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="warehouse@company.com"
                                {...field}
                              />
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
                              <Input
                                placeholder="+1 (555) 000-0000"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Branch Customization */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base font-medium">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      Branch Customization
                    </CardTitle>
                    <CardDescription>
                      Visual identity and map placement.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <FormField
                      control={form.control}
                      name="settings.imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Branch Custom Image / Banner</FormLabel>
                          <FormControl>
                            <ImageUpload
                              value={field.value ? [field.value] : []}
                              onChange={urls => field.onChange(urls[0] || "")}
                              maxImages={1}
                            />
                          </FormControl>
                          <FormDescription>
                            Upload an image to represent this branch on its home
                            page.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <div className="space-y-1.5">
                      <FormLabel>Select Location & Pin on Map</FormLabel>
                      <LocationMap
                        latitude={form.watch("settings.latitude")}
                        longitude={form.watch("settings.longitude")}
                        onPinChange={coords => {
                          form.setValue("settings.latitude", coords.latitude);
                          form.setValue("settings.longitude", coords.longitude);
                        }}
                        editable
                      />
                      <FormDescription>
                        Click anywhere on the vector grid above to drop a
                        physical pin.
                      </FormDescription>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="settings.latitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Latitude</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="any"
                                placeholder="e.g. 40.7589"
                                value={field.value ?? ""}
                                onChange={e =>
                                  field.onChange(
                                    e.target.value
                                      ? parseFloat(e.target.value)
                                      : null,
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="settings.longitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Longitude</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="any"
                                placeholder="e.g. -73.9851"
                                value={field.value ?? ""}
                                onChange={e =>
                                  field.onChange(
                                    e.target.value
                                      ? parseFloat(e.target.value)
                                      : null,
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Settings */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base font-medium">
                      <Settings2 className="h-4 w-4 text-muted-foreground" />
                      Settings
                    </CardTitle>
                    <CardDescription>
                      Behavioral defaults for this location.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="isDefault"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3.5">
                          <div className="space-y-0.5">
                            <FormLabel className="flex items-center gap-1.5 text-sm font-medium">
                              <Star className="h-3.5 w-3.5 text-muted-foreground" />
                              Default Location
                            </FormLabel>
                            <FormDescription className="text-[13px]">
                              Set as the primary location for new products and
                              transactions.
                            </FormDescription>
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
                  </CardContent>
                </Card>

                {/* Capacity */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base font-medium">
                      <Boxes className="h-4 w-4 text-muted-foreground" />
                      Enterprise Capacity
                    </CardTitle>
                    <CardDescription>
                      Throughput and storage limits for planning.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="capacity.total"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Capacity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="1000"
                                {...field}
                                onChange={e =>
                                  field.onChange(e.target.valueAsNumber || 0)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="capacity.unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Pallets, Items, etc."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="shrink-0 flex items-center justify-end gap-3 p-6 border-t bg-background">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="min-w-[150px]">
                {isEdit ? "Update Location" : "Create Location"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
