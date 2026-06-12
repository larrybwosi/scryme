"use client";

import { useState, useTransition } from "react";
import {
  Save,
  Globe,
  Coins,
  Clock,
  Building2,
  Mail,
  Phone,
  MapPin,
  Upload,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Textarea } from "@repo/ui/components/ui/textarea";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import { toast } from "sonner";
import {
  updateOrganizationSettings,
  updateOrganization,
  uploadOrganizationAsset,
} from "@/app/actions/organization";
import { cn } from "@repo/ui/lib/utils";

const settingsSchema = z.object({
  defaultCurrency: z.string().min(1, "Currency is required"),
  defaultTimezone: z.string().min(1, "Timezone is required"),
  country: z.string().min(1, "Country is required"),
});

const orgSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  description: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;
type OrgFormValues = z.infer<typeof orgSchema>;

export function SettingsForm({
  organization,
  initialSettings,
}: {
  organization: any;
  initialSettings: any;
}) {
  const [isPending, startTransition] = useTransition();
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const settingsForm = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      defaultCurrency: initialSettings?.defaultCurrency || "USD",
      defaultTimezone: initialSettings?.defaultTimezone || "UTC",
      country: initialSettings?.country || "Kenya",
    },
  });

  const orgForm = useForm<OrgFormValues>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      name: organization?.name || "",
      description: organization?.description || "",
      email: organization?.email || "",
      phone: organization?.phone || "",
      address: organization?.address || "",
    },
  });

  const onSettingsSubmit = async (data: SettingsFormValues) => {
    startTransition(async () => {
      try {
        await updateOrganizationSettings(data);
        toast.success("Localization settings updated successfully");
      } catch (error) {
        console.error(error);
        toast.error("Failed to update settings");
      }
    });
  };

  const onOrgSubmit = async (data: OrgFormValues) => {
    startTransition(async () => {
      try {
        await updateOrganization(data);
        toast.success("Organization details updated successfully");
      } catch (error) {
        console.error(error);
        toast.error("Failed to update organization");
      }
    });
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "banner"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "logo") setIsUploadingLogo(true);
    else setIsUploadingBanner(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      await uploadOrganizationAsset(formData, type);
      toast.success(
        `${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`
      );
    } catch (error) {
      console.error(error);
      toast.error(`Failed to upload ${type}`);
    } finally {
      if (type === "logo") setIsUploadingLogo(false);
      else setIsUploadingBanner(false);
    }
  };

  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="mb-4 bg-muted/50 p-1">
        <TabsTrigger value="general" className="px-6">
          General
        </TabsTrigger>
        <TabsTrigger value="branding" className="px-6">
          Branding
        </TabsTrigger>
        <TabsTrigger value="localization" className="px-6">
          Localization
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-6 outline-none">
        <form onSubmit={orgForm.handleSubmit(onOrgSubmit)} className="space-y-6">
          <Card className="border-muted/40 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                Organization Details
              </CardTitle>
              <CardDescription>
                Update your organization&apos;s basic information and contact
                details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">Organization Name</Label>
                  <Input
                    id="name"
                    {...orgForm.register("name")}
                    placeholder="e.g. Acme Corp"
                    className="bg-zinc-50/50"
                  />
                  {orgForm.formState.errors.name && (
                    <p className="text-xs text-red-500">
                      {orgForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...orgForm.register("description")}
                    placeholder="Brief description of your organization"
                    className="min-h-[100px] bg-zinc-50/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" /> Official Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...orgForm.register("email")}
                    placeholder="contact@acme.com"
                    className="bg-zinc-50/50"
                  />
                  {orgForm.formState.errors.email && (
                    <p className="text-xs text-red-500">
                      {orgForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" /> Phone Number
                  </Label>
                  <Input
                    id="phone"
                    {...orgForm.register("phone")}
                    placeholder="+1 (555) 000-0000"
                    className="bg-zinc-50/50"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" /> Physical Address
                  </Label>
                  <Textarea
                    id="address"
                    {...orgForm.register("address")}
                    placeholder="123 Business St, Suite 100, City, Country"
                    className="min-h-[80px] bg-zinc-50/50"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-zinc-50/30 border-t p-4">
              <Button
                type="submit"
                disabled={isPending}
                className="ml-auto bg-zinc-900 text-white hover:bg-zinc-800 transition-all shadow-sm"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </TabsContent>

      <TabsContent value="branding" className="space-y-6 outline-none">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-muted/40 shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-600" />
                Logo
              </CardTitle>
              <CardDescription>
                Your organization&apos;s primary logo used in documents and the
                dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted rounded-xl bg-zinc-50/50 hover:bg-zinc-50 transition-colors group relative overflow-hidden">
                {organization?.logo ? (
                  <div className="relative w-32 h-32">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={organization.logo}
                      alt="Org Logo"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <div className="p-3 bg-white rounded-full shadow-sm border border-muted group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <span className="text-sm text-muted-foreground font-medium">
                      Click to upload logo
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      PNG, JPG up to 2MB
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, "logo")}
                  disabled={isUploadingLogo}
                />
                {isUploadingLogo && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted/40 shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-600" />
                Banner
              </CardTitle>
              <CardDescription>
                A featured banner image for your organization&apos;s profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted rounded-xl bg-zinc-50/50 hover:bg-zinc-50 transition-colors group relative overflow-hidden h-[180px]">
                {organization?.banner ? (
                  <div className="w-full h-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={organization.banner}
                      alt="Org Banner"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 bg-white rounded-full shadow-sm border border-muted group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <span className="text-sm text-muted-foreground font-medium">
                      Click to upload banner
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, "banner")}
                  disabled={isUploadingBanner}
                />
                {isUploadingBanner && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="localization" className="space-y-6 outline-none">
        <form
          onSubmit={settingsForm.handleSubmit(onSettingsSubmit)}
          className="space-y-6"
        >
          <Card className="border-muted/40 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-600" />
                Currency & Region
              </CardTitle>
              <CardDescription>
                Set your organization&apos;s primary currency and region
                settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="defaultCurrency"
                    className="flex items-center gap-2"
                  >
                    <Coins className="w-3.5 h-3.5" /> Global Currency
                  </Label>
                  <Select
                    onValueChange={(val) =>
                      settingsForm.setValue("defaultCurrency", val)
                    }
                    defaultValue={settingsForm.getValues("defaultCurrency")}
                  >
                    <SelectTrigger id="defaultCurrency" className="bg-zinc-50/50">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="UGX">
                        UGX - Ugandan Shilling
                      </SelectItem>
                      <SelectItem value="TZS">
                        TZS - Tanzanian Shilling
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground px-1">
                    Default currency for all transactions and reporting.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Primary Country</Label>
                  <Input
                    id="country"
                    {...settingsForm.register("country")}
                    placeholder="e.g. Kenya"
                    className="bg-zinc-50/50"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label
                    htmlFor="defaultTimezone"
                    className="flex items-center gap-2"
                  >
                    <Clock className="w-3.5 h-3.5" /> Organization Timezone
                  </Label>
                  <Select
                    onValueChange={(val) =>
                      settingsForm.setValue("defaultTimezone", val)
                    }
                    defaultValue={settingsForm.getValues("defaultTimezone")}
                  >
                    <SelectTrigger id="defaultTimezone" className="bg-zinc-50/50">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC (Universal Time)</SelectItem>
                      <SelectItem value="Africa/Nairobi">
                        Africa/Nairobi (EAT)
                      </SelectItem>
                      <SelectItem value="Europe/London">
                        Europe/London (GMT/BST)
                      </SelectItem>
                      <SelectItem value="America/New_York">
                        America/New_York (EST/EDT)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-zinc-50/30 border-t p-4">
              <Button
                type="submit"
                disabled={isPending}
                className="ml-auto bg-zinc-900 text-white hover:bg-zinc-800 transition-all shadow-sm"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isPending ? "Saving..." : "Save Localization"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </TabsContent>
    </Tabs>
  );
}
