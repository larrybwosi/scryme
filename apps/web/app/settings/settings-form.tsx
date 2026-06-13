"use client";

import { useState, useTransition } from "react";
import { Save, Globe, Coins, Package, Building2, Mail, Phone, MapPin, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs";
import { Switch } from "@repo/ui/components/ui/switch";
import { toast } from "sonner";
import { updateOrganizationSettings } from "@/app/actions/organization";
import { OrganizationProfileHeader } from "./profile-header";

const settingsSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  logo: z.string().optional().or(z.literal("")),
  banner: z.string().optional().or(z.literal("")),
  defaultCurrency: z.string().min(1, "Currency is required"),
  defaultTimezone: z.string().min(1, "Timezone is required"),
  country: z.string().min(1, "Country is required"),
  lowStockThreshold: z.number().min(0).default(10),
  negativeStock: z.boolean().default(false),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function SettingsForm({ initialData }: { initialData: any }) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      address: initialData?.address || "",
      logo: initialData?.logo || "",
      banner: initialData?.banner || "",
      defaultCurrency: initialData?.settings?.defaultCurrency || "USD",
      defaultTimezone: initialData?.settings?.defaultTimezone || "UTC",
      country: initialData?.settings?.country || "Kenya",
      lowStockThreshold: initialData?.settings?.lowStockThreshold || 10,
      negativeStock: initialData?.settings?.negativeStock || false,
    },
  });

  const onSubmit = async (data: SettingsFormValues) => {
    startTransition(async () => {
      try {
        await updateOrganizationSettings(data);
        toast.success("Organization settings updated successfully");
      } catch (error) {
        console.error(error);
        toast.error("Failed to update settings");
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <OrganizationProfileHeader
        logo={form.watch("logo")}
        banner={form.watch("banner")}
        onLogoChange={(url) => form.setValue("logo", url, { shouldDirty: true })}
        onBannerChange={(url) => form.setValue("banner", url, { shouldDirty: true })}
        disabled={isPending}
      />

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-zinc-100 p-1">
          <TabsTrigger value="general" className="gap-2">
            <Building2 className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="localization" className="gap-2">
            <Globe className="w-4 h-4" />
            Localization
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-2">
            <Package className="w-4 h-4" />
            Inventory
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profile Information</CardTitle>
                <CardDescription>
                  Update your organization&apos;s public profile and contact details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Organization Name</Label>
                    <Input id="name" {...form.register("name")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Public Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                      <Input id="email" className="pl-9" {...form.register("email")} placeholder="contact@org.com" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                      <Input id="phone" className="pl-9" {...form.register("phone")} placeholder="+1 (555) 000-0000" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                      <Input id="address" className="pl-9" {...form.register("address")} placeholder="123 Business Way" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="localization" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Regional Settings</CardTitle>
                <CardDescription>
                  Configure your organization&apos;s currency and timezone preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultCurrency">Global Currency</Label>
                    <Select
                      onValueChange={(val) => form.setValue("defaultCurrency", val, { shouldDirty: true })}
                      value={form.watch("defaultCurrency")}
                    >
                      <SelectTrigger id="defaultCurrency">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Default Country</Label>
                    <Input id="country" {...form.register("country")} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="defaultTimezone">Timezone</Label>
                    <Select
                      onValueChange={(val) => form.setValue("defaultTimezone", val, { shouldDirty: true })}
                      value={form.watch("defaultTimezone")}
                    >
                      <SelectTrigger id="defaultTimezone">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC (Universal Time)</SelectItem>
                        <SelectItem value="Africa/Nairobi">Africa/Nairobi (EAT)</SelectItem>
                        <SelectItem value="Europe/London">Europe/London (GMT/BST)</SelectItem>
                        <SelectItem value="America/New_York">America/New_York (EST/EDT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Inventory Policies</CardTitle>
                <CardDescription>
                  Manage how your inventory behaves globally across all locations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm">
                  <div className="space-y-0.5">
                    <Label className="text-base">Allow Negative Stock</Label>
                    <p className="text-sm text-zinc-500">
                      Permit sales even if the recorded inventory is zero or less.
                    </p>
                  </div>
                  <Switch
                    checked={form.watch("negativeStock")}
                    onCheckedChange={(val) => form.setValue("negativeStock", val, { shouldDirty: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lowStockThreshold">Global Low Stock Threshold</Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    {...form.register("lowStockThreshold", { valueAsNumber: true })}
                  />
                  <p className="text-xs text-zinc-500">
                    Units remaining before a product is flagged as &quot;Low Stock&quot;.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      <div className="flex justify-end pt-4 border-t">
        <Button
          type="submit"
          disabled={isPending || !form.formState.isDirty}
          className="bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving Changes...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
