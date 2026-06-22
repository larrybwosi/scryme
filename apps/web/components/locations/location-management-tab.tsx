"use client";

import React, { useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Switch } from "@repo/ui/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Separator } from "@repo/ui/components/ui/separator";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  ShieldCheck,
  Maximize2,
  Plus,
  Trash2,
  Activity,
} from "lucide-react";
import { updateLocation } from "../../app/actions/locations";

const managementSchema = z.object({
  capacity: z.object({
    total: z.number().min(0).optional(),
    unit: z.string().optional(),
    lowThreshold: z.number().min(0).optional(),
    highThreshold: z.number().min(0).optional(),
  }).optional(),
  settings: z.object({
    isProductionSite: z.boolean().default(false),
    allowDirectSales: z.boolean().default(true),
    requiresQC: z.boolean().default(false),
    restrictedAccess: z.boolean().default(false),
    operatingHours: z.string().optional(),
  }).default({
    isProductionSite: false,
    allowDirectSales: true,
    requiresQC: false,
    restrictedAccess: false,
  }),
  customFields: z.array(z.object({
    key: z.string().min(1, "Key is required"),
    value: z.string().min(1, "Value is required"),
  })).optional(),
});

type ManagementFormValues = z.infer<typeof managementSchema>;

interface LocationManagementTabProps {
  location: any;
}

export function LocationManagementTab({ location }: LocationManagementTabProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<ManagementFormValues>({
    resolver: zodResolver(managementSchema) as any,
    defaultValues: {
      capacity: {
        total: location?.capacity?.total || 0,
        unit: location?.capacity?.unit || "units",
        lowThreshold: location?.capacity?.lowThreshold || 10,
        highThreshold: location?.capacity?.highThreshold || 90,
      },
      settings: {
        isProductionSite: location?.settings?.isProductionSite ?? false,
        allowDirectSales: location?.settings?.allowDirectSales ?? true,
        requiresQC: location?.settings?.requiresQC ?? false,
        restrictedAccess: location?.settings?.restrictedAccess ?? false,
        operatingHours: location?.settings?.operatingHours || "09:00 - 18:00",
      },
      customFields: Array.isArray(location?.customFields)
        ? location.customFields
        : Object.entries(location?.customFields || {}).map(([key, value]) => ({ key, value: String(value) })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "customFields",
  });

  async function onSubmit(values: ManagementFormValues) {
    startTransition(async () => {
      try {
        // Convert customFields back to object for storage if preferred,
        // but here we'll keep it as an array as requested in schema or just pass it as is
        await updateLocation(location.id, {
          capacity: values.capacity,
          settings: values.settings,
          customFields: values.customFields,
        });
        toast.success("Location management settings updated");
      } catch (error: any) {
        toast.error(error.message || "Failed to update settings");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-10">
        {/* Operational Settings */}
        <Card className="shadow-sm border border-muted/60">
          <CardHeader className="bg-muted/10">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <CardTitle>Operational Configuration</CardTitle>
            </div>
            <CardDescription>
              Define how this location functions within your enterprise operations.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="settings.isProductionSite"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Production Facility</FormLabel>
                      <FormDescription>
                        Enable manufacturing and assembly features.
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
              <FormField
                control={form.control}
                name="settings.requiresQC"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Quality Control Required</FormLabel>
                      <FormDescription>
                        Mandate inspections for incoming stock.
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
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="settings.allowDirectSales"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Point of Sale Enabled</FormLabel>
                      <FormDescription>
                        Allow direct customer transactions here.
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
               <FormField
                control={form.control}
                name="settings.operatingHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operating Hours</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Mon-Fri 8am-10pm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Capacity Management */}
        <Card className="shadow-sm border border-muted/60">
          <CardHeader className="bg-muted/10">
            <div className="flex items-center gap-2">
              <Maximize2 className="w-5 h-5 text-orange-600" />
              <CardTitle>Enterprise Capacity</CardTitle>
            </div>
            <CardDescription>
              Monitor and restrict stock levels based on physical constraints.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="capacity.total"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Capacity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={e => field.onChange(e.target.valueAsNumber || 0)}
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
                    <FormLabel>Capacity Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Pallets, Units, m³" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="capacity.lowThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Low Capacity Alert (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={e => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormDescription>Alert when occupancy drops below this.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="capacity.highThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>High Capacity Alert (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={e => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormDescription>Alert when occupancy exceeds this.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Custom Attributes */}
        <Card className="shadow-sm border border-muted/60">
          <CardHeader className="bg-muted/10">
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600" />
              <CardTitle>Custom Attributes</CardTitle>
            </div>
            <CardDescription>
              Add specific metadata for ERP integration or reporting.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-4 items-end">
                <FormField
                  control={form.control}
                  name={`customFields.${index}.key`}
                  render={({ field: fieldProps }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Key</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Region" {...fieldProps} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`customFields.${index}.value`}
                  render={({ field: fieldProps }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Value</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. North East" {...fieldProps} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => remove(index)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ key: "", value: "" })}
              className="mt-2">
              <Plus className="w-4 h-4 mr-2" /> Add Attribute
            </Button>
          </CardContent>
        </Card>

        {/* Security Options */}
        <Card className="shadow-sm border border-muted/60 border-l-4 border-l-amber-500">
          <CardHeader className="bg-muted/10">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              <CardTitle>Security & Access Control</CardTitle>
            </div>
            <CardDescription>
              Restrict how members interact with this location.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <FormField
              control={form.control}
              name="settings.restrictedAccess"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Strict Access Control</FormLabel>
                    <FormDescription>
                      Only assigned members can perform transactions or check-ins.
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

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isPending} className="px-8 bg-blue-600 hover:bg-blue-700">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating Enterprise Settings...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Enterprise Configuration
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
