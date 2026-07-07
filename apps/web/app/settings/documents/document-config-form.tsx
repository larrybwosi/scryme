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
import { Loader2, Save, Palette, Upload, X } from "lucide-react";
import { updateReceiptConfig, updateWaybillConfig } from "../../actions/document-config";
import { uploadFileAction } from "../../actions/sales";
import Image from "next/image";

const formSchema = z.object({
  showLogo: z.boolean(),
  logoUrl: z.string().optional(),
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  companyPhone: z.string().optional(),
  companyEmail: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface DocumentConfigFormProps {
  type: "RECEIPT" | "WAYBILL";
  initialConfig: any;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function DocumentConfigForm({ type, initialConfig }: DocumentConfigFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      showLogo: initialConfig?.showLogo ?? true,
      logoUrl: initialConfig?.logoUrl || "",
      companyName: initialConfig?.companyName || "",
      companyAddress: initialConfig?.companyAddress || "",
      companyPhone: initialConfig?.companyPhone || "",
      companyEmail: initialConfig?.companyEmail || "",
      primaryColor: initialConfig?.primaryColor || "",
      secondaryColor: initialConfig?.secondaryColor || "",
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
              <FormField
                name="secondaryColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Secondary Color</FormLabel>
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
                    <Input
                      placeholder="Full billing address..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  <FormLabel>Logo Override</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      {field.value ? (
                        <div className="relative w-32 h-32 border rounded-lg overflow-hidden group">
                          <Image
                            src={field.value}
                            alt={`${type} Logo`}
                            fill
                            className="object-contain p-2"
                          />
                          <button
                            type="button"
                            onClick={() => field.onChange("")}
                            className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="w-32 h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          {isUploading ? (
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                          ) : (
                            <>
                              <Upload className="w-6 h-6 text-muted-foreground" />
                              <span className="text-[10px] text-muted-foreground font-medium">Upload Logo</span>
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
                  <FormDescription>Custom logo specifically for {type.toLowerCase()}s (Max 10MB)</FormDescription>
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
