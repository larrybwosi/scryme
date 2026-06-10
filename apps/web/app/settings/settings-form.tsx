"use client";

import { useState, useTransition } from "react";
import { Save, Globe, Coins, Clock } from "lucide-react";
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
import { toast } from "sonner";
import { updateOrganizationSettings } from "@/app/actions/organization";

const settingsSchema = z.object({
  defaultCurrency: z.string().min(1, "Currency is required"),
  defaultTimezone: z.string().min(1, "Timezone is required"),
  country: z.string().min(1, "Country is required"),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function SettingsForm({ initialSettings }: { initialSettings: any }) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      defaultCurrency: initialSettings?.defaultCurrency || "USD",
      defaultTimezone: initialSettings?.defaultTimezone || "UTC",
      country: initialSettings?.country || "Kenya",
    },
  });

  const onSubmit = async (data: SettingsFormValues) => {
    startTransition(async () => {
      try {
        await updateOrganizationSettings(data);
        toast.success("Settings updated successfully");
      } catch (error) {
        console.error(error);
        toast.error("Failed to update settings");
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-600" />
            Currency & Localization
          </CardTitle>
          <CardDescription>
            Set your organization&apos;s primary currency and region settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultCurrency">Global Currency</Label>
              <Select
                onValueChange={(val) => form.setValue("defaultCurrency", val)}
                defaultValue={form.getValues("defaultCurrency")}
              >
                <SelectTrigger id="defaultCurrency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="UGX">UGX - Ugandan Shilling</SelectItem>
                  <SelectItem value="TZS">TZS - Tanzanian Shilling</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                This will be the default currency for all new transactions and
                reports.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                {...form.register("country")}
                placeholder="e.g. Kenya"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultTimezone">Timezone</Label>
              <Select
                onValueChange={(val) => form.setValue("defaultTimezone", val)}
                defaultValue={form.getValues("defaultTimezone")}
              >
                <SelectTrigger id="defaultTimezone">
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
        <CardFooter className="bg-zinc-50/50 border-t p-4">
          <Button
            type="submit"
            disabled={isPending}
            className="ml-auto bg-zinc-900 text-white"
          >
            {isPending ? (
              "Saving..."
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
