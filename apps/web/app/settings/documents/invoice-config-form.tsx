"use client";

import { useState, useTransition } from "react";
import { Save, Hash, Type, FileText, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { Switch } from "@repo/ui/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { toast } from "sonner";
import { updateInvoiceConfig } from "@/app/actions/organization";

const configSchema = z.object({
  invoicePrefix: z.string().min(1, "Prefix is required"),
  nextInvoiceNumber: z.coerce.number(),
  footerText: z.string().optional(),
  showTaxBreakdown: z.boolean(),
  showTerms: z.boolean(),
  showNotes: z.boolean(),
  showLineNumbers: z.boolean(),
}).refine(data => data.nextInvoiceNumber >= 1, {
    message: "Next number must be at least 1",
    path: ["nextInvoiceNumber"]
});

type ConfigFormValues = {
  invoicePrefix: string;
  nextInvoiceNumber: number;
  footerText?: string;
  showTaxBreakdown: boolean;
  showTerms: boolean;
  showNotes: boolean;
  showLineNumbers: boolean;
};

export function InvoiceConfigForm({ initialConfig }: { initialConfig: any }) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(configSchema) as any,
    defaultValues: {
      invoicePrefix: initialConfig?.invoicePrefix || "INV-",
      nextInvoiceNumber: initialConfig?.nextInvoiceNumber || 1,
      footerText: initialConfig?.footerText || "",
      showTaxBreakdown: initialConfig?.showTaxBreakdown ?? true,
      showTerms: initialConfig?.showTerms ?? true,
      showNotes: initialConfig?.showNotes ?? true,
      showLineNumbers: initialConfig?.showLineNumbers ?? false,
    },
  });

  const onSubmit = async (data: ConfigFormValues) => {
    startTransition(async () => {
      try {
        await updateInvoiceConfig(data);
        toast.success("Document configuration updated");
      } catch (error) {
        console.error(error);
        toast.error("Failed to update configuration");
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card className="border-muted/40 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Hash className="w-5 h-5 text-emerald-600" />
            Numbering & Sequences
          </CardTitle>
          <CardDescription>
            Customize how your invoices are numbered and identified.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
              <Input
                id="invoicePrefix"
                {...form.register("invoicePrefix")}
                placeholder="INV-"
                className="bg-zinc-50/50 font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextInvoiceNumber">Next Invoice Number</Label>
              <Input
                id="nextInvoiceNumber"
                type="number"
                {...form.register("nextInvoiceNumber")}
                className="bg-zinc-50/50 font-mono"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-muted/40 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Type className="w-5 h-5 text-emerald-600" />
            Document Content
          </CardTitle>
          <CardDescription>
            Manage the text content that appears on your generated documents.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="footerText">Default Footer Text</Label>
            <Textarea
              id="footerText"
              {...form.register("footerText")}
              placeholder="e.g. Thank you for your business!"
              className="min-h-[100px] bg-zinc-50/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex items-center justify-between p-3 border rounded-lg bg-zinc-50/30">
              <div className="space-y-0.5">
                <Label>Tax Breakdown</Label>
                <p className="text-[10px] text-muted-foreground">Show detailed tax per item</p>
              </div>
              <Switch
                checked={form.watch("showTaxBreakdown")}
                onCheckedChange={(val) => form.setValue("showTaxBreakdown", val)}
              />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg bg-zinc-50/30">
              <div className="space-y-0.5">
                <Label>Show Terms</Label>
                <p className="text-[10px] text-muted-foreground">Display payment terms</p>
              </div>
              <Switch
                checked={form.watch("showTerms")}
                onCheckedChange={(val) => form.setValue("showTerms", val)}
              />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg bg-zinc-50/30">
              <div className="space-y-0.5">
                <Label>Show Notes</Label>
                <p className="text-[10px] text-muted-foreground">Display document notes</p>
              </div>
              <Switch
                checked={form.watch("showNotes")}
                onCheckedChange={(val) => form.setValue("showNotes", val)}
              />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg bg-zinc-50/30">
              <div className="space-y-0.5">
                <Label>Line Numbers</Label>
                <p className="text-[10px] text-muted-foreground">Show # for each row</p>
              </div>
              <Switch
                checked={form.watch("showLineNumbers")}
                onCheckedChange={(val) => form.setValue("showLineNumbers", val)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-zinc-50/30 border-t p-4">
          <Button
            type="submit"
            disabled={isPending}
            className="ml-auto bg-zinc-900 text-white"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Configuration
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
