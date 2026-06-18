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
  Hash,
  Palette,
  ShieldCheck,
  FileText,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { updateInvoiceConfig } from "../../actions/invoice-config";
import { uploadFileAction } from "../../actions/sales";
import Image from "next/image";

const formSchema = z.object({
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  companyEmail: z.string().optional(),
  companyPhone: z.string().optional(),
  companyWebsite: z.string().optional(),
  primaryColor: z.string().optional(),
  logoUrl: z.string().optional(),
  invoiceNumberPrefix: z.string().optional(),
  invoiceNumberSuffix: z.string().optional(),
  invoiceNumberStart: z.number().min(1),
  invoiceNumberPadding: z.number().min(0).max(10),
  footerText: z.string().optional(),
  defaultTerms: z.string().optional(),
  defaultNotes: z.string().optional(),
  showPoweredBy: z.boolean(),
  watermarkText: z.string().optional(),
  enableAuditTrail: z.boolean(),
  showLogo: z.boolean(),
  showTaxBreakdown: z.boolean(),
  showTerms: z.boolean(),
  showNotes: z.boolean(),
  showLineNumbers: z.boolean(),
  customFields: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
      }),
    )
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface InvoiceConfigFormProps {
  initialConfig: any;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function InvoiceConfigForm({ initialConfig }: InvoiceConfigFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
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
      invoiceNumberStart: Number(initialConfig?.invoiceNumberStart) || 1,
      invoiceNumberPadding: Number(initialConfig?.invoiceNumberPadding) || 0,
      footerText: initialConfig?.footerText || "",
      defaultTerms: initialConfig?.defaultTerms || "",
      defaultNotes: initialConfig?.defaultNotes || "",
      showPoweredBy: initialConfig?.showPoweredBy ?? true,
      watermarkText: initialConfig?.watermarkText || "",
      enableAuditTrail: initialConfig?.enableAuditTrail ?? false,
      showLogo: initialConfig?.showLogo ?? true,
      showTaxBreakdown: initialConfig?.showTaxBreakdown ?? true,
      showTerms: initialConfig?.showTerms ?? true,
      showNotes: initialConfig?.showNotes ?? true,
      showLineNumbers: initialConfig?.showLineNumbers ?? false,
      customFields: Array.isArray(initialConfig?.customFields)
        ? initialConfig.customFields
        : [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "customFields",
  });

  async function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        await updateInvoiceConfig(values);
        toast.success("Invoice configuration updated successfully");
      } catch (error) {
        toast.error("Failed to update invoice configuration");
      }
    });
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File size exceeds 10MB limit");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadFileAction(formData);
      form.setValue("logoUrl", result.fileUrl, { shouldDirty: true });
      toast.success("Logo uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload logo");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-10">
        {/* Branding & Identity */}
        <Card className="shadow-sm border border-muted/60">
          <CardHeader className="bg-muted/10">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-emerald-600" />
              <CardTitle>Branding & Identity</CardTitle>
            </div>
            <CardDescription>
              Customize how your business appears on documents. These override
              global settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name Override</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Leave blank to use default"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="primaryColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Primary Color</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          className="w-12 p-1 h-9"
                          {...field}
                        />
                        <Input {...field} placeholder="#000000" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo Override</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        {field.value ? (
                          <div className="relative w-32 h-32 border rounded-lg overflow-hidden group">
                            {/*<Image
                              src={field.value}
                              alt="Invoice Logo"
                              fill
                              className="object-contain p-2"
                            />*/}
                            <button
                              type="button"
                              onClick={() => field.onChange("")}
                              className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-32 h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors">
                            {isUploading ? (
                              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            ) : (
                              <>
                                <Upload className="w-6 h-6 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground font-medium">
                                  Upload Logo
                                </span>
                              </>
                            )}
                          </div>
                        )}
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileChange}
                          disabled={isUploading}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Custom logo specifically for invoices (Max 10MB)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="showLogo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm h-full">
                    <div className="space-y-0.5">
                      <FormLabel>Display Logo</FormLabel>
                      <FormDescription>
                        Toggle logo visibility on invoices
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
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
              name="companyAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Override</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Full billing address..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Numbering Configuration */}
        <Card className="shadow-sm border border-muted/60">
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
                name="invoiceNumberStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Starting Number</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={e =>
                          field.onChange(e.target.valueAsNumber || 0)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      The next invoice will use this number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="invoiceNumberPadding"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number Padding</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={e =>
                          field.onChange(e.target.valueAsNumber || 0)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      e.g. 5 becomes 00005 if padding is 5
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Content & Footer */}
        <Card className="shadow-sm border border-muted/60">
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
              name="footerText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Footer Text</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Registered in England & Wales No. 123456"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Appears at the very bottom of every page
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="defaultNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Thank you for your business!"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="defaultTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terms & Conditions</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please pay within 30 days..."
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

        {/* Custom Fields */}
        <Card className="shadow-sm border border-muted/60">
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
                  name={`customFields.${index}.label`}
                  render={({ field: fieldProps }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Label</FormLabel>
                      <FormControl>
                        <Input placeholder="VAT Number" {...fieldProps} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name={`customFields.${index}.value`}
                  render={({ field: fieldProps }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Value</FormLabel>
                      <FormControl>
                        <Input placeholder="GB123456789" {...fieldProps} />
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
              onClick={() => append({ label: "", value: "" })}
              className="mt-2">
              <Plus className="w-4 h-4 mr-2" /> Add Custom Field
            </Button>
          </CardContent>
        </Card>

        {/* Enterprise Features */}
        <Card className="shadow-sm border border-muted/60">
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
              name="showPoweredBy"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>
                      Show &quot;Powered by Scryme&quot; branding
                    </FormLabel>
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
              name="watermarkText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Watermark Text</FormLabel>
                  <FormControl>
                    <Input placeholder="DRAFT, CONFIDENTIAL, etc." {...field} />
                  </FormControl>
                  <FormDescription>
                    Displays diagonally across every page
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <div className="grid grid-cols-2 gap-6">
              <FormField
                name="showTaxBreakdown"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <FormLabel className="text-xs">
                      Show Tax Breakdown
                    </FormLabel>
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
                name="showLineNumbers"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <FormLabel className="text-xs">Show Line Numbers</FormLabel>
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
