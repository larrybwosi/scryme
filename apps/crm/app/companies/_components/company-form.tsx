"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray } from "react-hook-form";
import {
  businessAccountSchema,
  type BusinessAccountFormValues,
} from "../../../lib/validations";
import { createCompany, updateCompany } from "../../actions/companies";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@repo/ui/components/ui/form";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";
import {
  Plus,
  Trash2,
  Contact,
  Loader2,
  Building2,
  Palette,
  Percent,
  Users,
  Briefcase,
  CreditCard,
  FileText,
  Globe,
  Shield,
  MapPin,
  Calendar,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@repo/ui/components/ui/card";
import { Separator } from "@repo/ui/components/ui/separator";
import { Badge } from "@repo/ui/components/ui/badge";
import { Switch } from "@repo/ui/components/ui/switch";
import { cn } from "@repo/ui/lib/utils";

interface CompanyFormProps {
  initialData?: BusinessAccountFormValues & { id: string };
  onSuccess: () => void;
}

export function CompanyForm({ initialData, onSuccess }: CompanyFormProps) {
  const form = useForm<BusinessAccountFormValues>({
    resolver: zodResolver(businessAccountSchema),
    defaultValues: initialData || {
      name: "",
      taxId: "",
      contacts: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "contacts",
  });

  const isEnterprise = form.watch("isEnterprise");

  const onSubmit = async (values: BusinessAccountFormValues) => {
    try {
      if (initialData) {
        await updateCompany(initialData.id, values);
      } else {
        await createCompany(values);
      }
      onSuccess();
    } catch (error) {
      console.error("Failed to save company", error);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-slate-50 to-transparent p-4 rounded-xl border border-border/50 backdrop-blur-sm">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    {initialData ? "Edit Company" : "New Company"}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {initialData
                      ? "Update business account details and commercial terms."
                      : "Create a new business account for this organization."}
                  </p>
                </div>
              </div>
            </div>
            {isEnterprise && (
              <Badge className="shrink-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1.5 rounded-full font-medium shadow-sm hover:shadow-md transition-shadow">
                <Shield className="h-3.5 w-3.5 mr-1.5" /> Enterprise
              </Badge>
            )}
          </div>

          <Separator className="bg-gradient-to-r from-border via-border to-transparent" />

          {/* Profile Card - Wider layout */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="bg-gradient-to-r from-slate-50/50 to-transparent pb-6 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-semibold">
                  Company Profile
                </CardTitle>
              </div>
              <CardDescription className="text-sm">
                Core identity and registration details for your business
                account.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2 lg:col-span-3 xl:col-span-2">
                      <FormLabel className="flex items-center gap-1.5">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        Company Name <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Acme Corporation"
                          {...field}
                          className="h-11 transition-colors focus:ring-2 focus:ring-primary/20"
                        />
                      </FormControl>
                      <FormDescription>
                        The legal name of your business entity.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2 lg:col-span-3 xl:col-span-2">
                      <FormLabel className="flex items-center gap-1.5">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        Logo URL
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/logo.png"
                          {...field}
                          value={field.value || ""}
                          className="h-11 transition-colors focus:ring-2 focus:ring-primary/20"
                        />
                      </FormControl>
                      <FormDescription>
                        Public URL to your company logo image.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Tax ID / Registration
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Tax ID or Registration Number"
                          {...field}
                          value={field.value || ""}
                          className="h-11 transition-colors focus:ring-2 focus:ring-primary/20"
                        />
                      </FormControl>
                      <FormDescription>
                        Government-issued business identifier.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customTheme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <Palette className="h-4 w-4 text-muted-foreground" />
                        Theme Color (Hex)
                      </FormLabel>
                      <FormControl>
                        <div className="flex gap-3">
                          <Input
                            placeholder="#000000"
                            {...field}
                            value={field.value || ""}
                            className="h-11 transition-colors focus:ring-2 focus:ring-primary/20"
                          />
                          {field.value && (
                            <div
                              className="h-11 w-11 rounded-lg border border-border shrink-0 shadow-sm"
                              style={{ backgroundColor: field.value }}
                            />
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Custom brand color for your account.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Commercial Terms Card - Wider layout */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="bg-gradient-to-r from-slate-50/50 to-transparent pb-6 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-semibold">
                  Commercial Terms
                </CardTitle>
              </div>
              <CardDescription className="text-sm">
                Pricing, billing, and plan tier configuration for this account.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="discountPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          B2B Discount (%)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder="0.00"
                            {...field}
                            value={field.value ?? ""}
                            className="h-11 transition-colors focus:ring-2 focus:ring-primary/20"
                          />
                        </FormControl>
                        <FormDescription>
                          Percentage discount applied to B2B orders.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentTermsDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          Payment Terms (Days)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="e.g. 30"
                            {...field}
                            value={field.value ?? ""}
                            className="h-11 transition-colors focus:ring-2 focus:ring-primary/20"
                          />
                        </FormControl>
                        <FormDescription>
                          Number of days allowed for payment.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator className="my-4" />

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="isEnterprise"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-xl border border-border/50 p-4 bg-gradient-to-r from-slate-50/30 to-transparent hover:bg-slate-50/50 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-primary" />
                            <FormLabel className="text-sm font-medium">
                              Enterprise Plan
                            </FormLabel>
                          </div>
                          <FormDescription className="text-[13px]">
                            Enable enterprise SLA, custom branding, and premium
                            support for this account.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={!!field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-primary"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {isEnterprise && (
                    <div className="flex items-center justify-between rounded-xl border border-border/50 p-4 bg-gradient-to-r from-blue-50/30 to-transparent">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-500" />
                          <FormLabel className="text-sm font-medium">
                            Enterprise Benefits
                          </FormLabel>
                        </div>
                        <p className="text-[13px] text-muted-foreground">
                          ✓ Custom SLA &nbsp;•&nbsp; ✓ Priority Support
                          &nbsp;•&nbsp; ✓ White-label Options
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-blue-50/50 text-blue-600 border-blue-200"
                      >
                        Active
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contacts Card - Wider layout */}
          {!initialData && (
            <Card className="shadow-sm border-border/50">
              <CardHeader className="bg-gradient-to-r from-slate-50/50 to-transparent pb-6 border-b border-border/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg font-semibold">
                        Contacts
                      </CardTitle>
                    </div>
                    <CardDescription className="text-sm mt-1">
                      People associated with this business account.
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ name: "", email: "", phone: "" })}
                    className="h-9 px-4 text-[13px] font-medium hover:bg-primary/5 hover:text-primary transition-colors"
                  >
                    <Plus size={16} className="mr-1.5" /> Add Contact
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {fields.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-border/50 py-12 text-center bg-muted/10">
                    <Contact
                      size={32}
                      className="mx-auto mb-3 opacity-40 text-muted-foreground"
                    />
                    <p className="text-sm font-medium text-muted-foreground">
                      No contacts added yet
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add team members or key stakeholders for this account.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="group relative rounded-xl border border-border/50 bg-gradient-to-r from-slate-50/30 to-transparent p-5 hover:shadow-md transition-all duration-200"
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="absolute top-3 right-3 p-1.5 text-muted-foreground opacity-0 transition-all hover:text-destructive group-hover:opacity-100 hover:bg-destructive/10 rounded-full"
                              aria-label="Remove contact"
                            >
                              <Trash2 size={16} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Remove contact</TooltipContent>
                        </Tooltip>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="p-1.5 rounded-full bg-primary/10">
                              <Contact size={14} className="text-primary" />
                            </div>
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                              Contact #{index + 1}
                            </span>
                          </div>

                          <FormField
                            control={form.control}
                            name={`contacts.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs text-muted-foreground">
                                  Full Name
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="John Doe"
                                    {...field}
                                    className="h-9 text-[13px] transition-colors focus:ring-2 focus:ring-primary/20"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-3">
                            <FormField
                              control={form.control}
                              name={`contacts.${index}.email`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs text-muted-foreground">
                                    Email
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="john@company.com"
                                      {...field}
                                      className="h-9 text-[13px] transition-colors focus:ring-2 focus:ring-primary/20"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`contacts.${index}.phone`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs text-muted-foreground">
                                    Phone
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="+1 234 567 890"
                                      {...field}
                                      className="h-9 text-[13px] transition-colors focus:ring-2 focus:ring-primary/20"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Separator className="bg-gradient-to-r from-border via-border to-transparent" />

          {/* Actions - Wider and more professional */}
          <div className="flex items-center justify-end gap-4 pt-2 pb-4">
            <Button
              type="button"
              variant="outline"
              onClick={onSuccess}
              className="h-11 px-6 text-[14px] font-medium hover:bg-muted/50 transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="h-11 px-8 text-[14px] font-medium min-w-[180px] bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/60 transition-all shadow-sm hover:shadow-md"
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {initialData ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  {initialData ? (
                    <div className="flex items-center gap-2">
                      <FileText size={16} /> Update Company
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Plus size={16} /> Create Company
                    </div>
                  )}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
