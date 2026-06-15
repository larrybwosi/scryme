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
import { Textarea } from "@repo/ui/components/ui/textarea";
import { Switch } from "@repo/ui/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Separator } from "@repo/ui/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Save, Hash, Palette, ShieldCheck, FileText, Plus, Trash2 } from "lucide-react";
import { updateInvoiceConfig } from "../../actions/invoice-config";

const formSchema = z.object({
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  companyEmail: z.string().email().optional().or(z.literal("")),
  companyPhone: z.string().optional(),
  companyWebsite: z.string().url().optional().or(z.literal("")),
  primaryColor: z.string().optional(),
  logoUrl: z.string().optional(),
  invoiceNumberPrefix: z.string().optional(),
  invoiceNumberSuffix: z.string().optional(),
  invoiceNumberStart: z.coerce.number().min(1),
  invoiceNumberPadding: z.coerce.number().min(0).max(10),
  footerText: z.string().optional(),
  defaultTerms: z.string().optional(),
  defaultNotes: z.string().optional(),
  showPoweredBy: z.boolean(),
  watermarkText: z.string().optional(),
  enableAuditTrail: z.boolean(),
  showTaxBreakdown: z.boolean(),
  showTerms: z.boolean(),
  showNotes: z.boolean(),
  showLineNumbers: z.boolean(),
  customFields: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).optional(),
});

interface InvoiceConfigFormProps {
  initialConfig: any;
}

export function InvoiceConfigForm({ initialConfig }: InvoiceConfigFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: initialConfig?.companyName || "",
      companyAddress: initialConfig?.companyAddress || "",
      companyEmail: initialConfig?.companyEmail || "",
      companyPhone: initialConfig?.companyPhone || "",
      companyWebsite: initialConfig?.companyWebsite || "",
      primaryColor: initialConfig?.primaryColor || "#1e3a5f",
      logoUrl: initialConfig?.logoUrl || "",
      invoiceNumberPrefix: initialConfig?.invoiceNumberPrefix || "",
      invoiceNumberSuffix: initialConfig?.invoiceNumberSuffix || "",
      invoiceNumberStart: initialConfig?.invoiceNumberStart || 1,
      invoiceNumberPadding: initialConfig?.invoiceNumberPadding || 0,
      footerText: initialConfig?.footerText || "",
      defaultTerms: initialConfig?.defaultTerms || "",
      defaultNotes: initialConfig?.defaultNotes || "",
      showPoweredBy: initialConfig?.showPoweredBy ?? true,
      watermarkText: initialConfig?.watermarkText || "",
      enableAuditTrail: initialConfig?.enableAuditTrail ?? false,
      showTaxBreakdown: initialConfig?.showTaxBreakdown ?? true,
      showTerms: initialConfig?.showTerms ?? true,
      showNotes: initialConfig?.showNotes ?? true,
      showLineNumbers: initialConfig?.showLineNumbers ?? false,
      customFields: Array.isArray(initialConfig?.customFields) ? initialConfig.customFields : [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "customFields",
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      try {
        await updateInvoiceConfig(values);
        toast.success("Invoice configuration updated successfully");
      } catch (error) {
        toast.error("Failed to update invoice configuration");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-10">
        {/* Branding & Identity */}
        <Card borderType="none" className="shadow-sm border border-muted/60">
          <CardHeader className="bg-muted/10">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-emerald-600" />
              <CardTitle>Branding & Identity</CardTitle>
            </div>
            <CardDescription>
              Customize how your business appears on documents. These override global settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name Override</FormLabel>
                    <FormControl>
                      <Input placeholder="Leave blank to use default" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="primaryColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Primary Color</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input type="color" className="w-12 p-1 h-9" {...field} />
                        <Input {...field} placeholder="#000000" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL Override</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormDescription>Custom logo specifically for invoices</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="companyEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input placeholder="billing@company.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="companyPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="companyAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Override</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Full billing address..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Numbering Configuration */}
        <Card borderType="none" className="shadow-sm border border-muted/60">
          <CardHeader className="bg-muted/10">
            <div className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-emerald-600" />
              <CardTitle>Invoice Numbering</CardTitle>
            </div>
            <CardDescription>
              Configure the format and sequence of your invoice numbers.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="invoiceNumberPrefix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prefix</FormLabel>
                    <FormControl>
                      <Input placeholder="INV-" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="invoiceNumberSuffix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Suffix</FormLabel>
                    <FormControl>
                      <Input placeholder="-2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="invoiceNumberStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Starting Number</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>The next invoice will use this number</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="invoiceNumberPadding"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number Padding</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>e.g. 5 becomes 00005 if padding is 5</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Content & Footer */}
        <Card borderType="none" className="shadow-sm border border-muted/60">
          <CardHeader className="bg-muted/10">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <CardTitle>Document Content</CardTitle>
            </div>
            <CardDescription>
              Default text for various sections of the invoice.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <FormField
              control={form.control}
              name="footerText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Footer Text</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Registered in England & Wales No. 123456" {...field} />
                  </FormControl>
                  <FormDescription>Appears at the very bottom of every page</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="defaultNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Thank you for your business!" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="defaultTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terms & Conditions</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Please pay within 30 days..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Custom Fields */}
        <Card borderType="none" className="shadow-sm border border-muted/60">
          <CardHeader className="bg-muted/10">
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600" />
              <CardTitle>Custom Fields</CardTitle>
            </div>
            <CardDescription>
              Add specific regulatory IDs, tax numbers, or custom labels.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-4 items-end">
                <FormField
                  control={form.control}
                  name={`customFields.${index}.label`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Label</FormLabel>
                      <FormControl>
                        <Input placeholder="VAT Number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`customFields.${index}.value`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Value</FormLabel>
                      <FormControl>
                        <Input placeholder="GB123456789" {...field} />
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
                  onClick={() => remove(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ label: "", value: "" })}
              className="mt-2"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Custom Field
            </Button>
          </CardContent>
        </Card>

        {/* Enterprise Features */}
        <Card borderType="none" className="shadow-sm border border-muted/60">
          <CardHeader className="bg-muted/10">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <CardTitle>Enterprise Options</CardTitle>
            </div>
            <CardDescription>
              Advanced controls for white-labeling and security.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <FormField
              control={form.control}
              name="showPoweredBy"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Show "Powered by Scryme" branding</FormLabel>
                    <FormDescription>
                      Remove Scryme branding from the bottom of your documents.
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
              name="enableAuditTrail"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Enable Document Audit Trail</FormLabel>
                    <FormDescription>
                      Track every time a document is generated or modified.
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
              name="watermarkText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Watermark Text</FormLabel>
                  <FormControl>
                    <Input placeholder="DRAFT, CONFIDENTIAL, etc." {...field} />
                  </FormControl>
                  <FormDescription>Displays diagonally across every page</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <div className="grid grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="showTaxBreakdown"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <FormLabel className="text-xs">Show Tax Breakdown</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="showLineNumbers"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <FormLabel className="text-xs">Show Line Numbers</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
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
