"use client";

import React, { useTransition } from "react";
import { useForm } from "react-hook-form";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save, Palette } from "lucide-react";
import { updateReceiptConfig, updateWaybillConfig } from "../../actions/document-config";

const formSchema = z.object({
  showLogo: z.boolean(),
  logoUrl: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface DocumentConfigFormProps {
  type: "RECEIPT" | "WAYBILL";
  initialConfig: any;
}

export function DocumentConfigForm({ type, initialConfig }: DocumentConfigFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      showLogo: initialConfig?.showLogo ?? true,
      logoUrl: initialConfig?.logoUrl || "",
    },
  });

  async function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        if (type === "RECEIPT") {
          await updateReceiptConfig(values);
        } else {
          await updateWaybillConfig(values);
        }
        toast.success(`${type.charAt(0) + type.slice(1).toLowerCase()} configuration updated successfully`);
      } catch (error) {
        toast.error(`Failed to update ${type.toLowerCase()} configuration`);
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-10">
        <Card className="shadow-sm border border-muted/60">
          <CardHeader className="bg-muted/10">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-emerald-600" />
              <CardTitle>{type.charAt(0) + type.slice(1).toLowerCase()} Branding</CardTitle>
            </div>
            <CardDescription>
              Customize how your {type.toLowerCase()}s appear.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <FormField
              name="showLogo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Display Logo</FormLabel>
                    <FormDescription>
                      Toggle logo visibility on {type.toLowerCase()}s
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
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL Override</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormDescription>Custom logo specifically for {type.toLowerCase()}s</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending} className="px-8">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Configuration
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
