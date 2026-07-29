"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  customerSchema,
  type CustomerFormValues,
} from "../../../lib/validations";
import {
  createCustomer,
  updateCustomer,
  getLocations,
} from "../../actions/customers";
import useSWR from "swr";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Textarea } from "@repo/ui/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@repo/ui/components/ui/card";
import { Separator } from "@repo/ui/components/ui/separator";
import { Badge } from "@repo/ui/components/ui/badge";
import { User, Building2, Settings2, Truck, Tag as TagIcon, X } from "lucide-react";

interface CustomerFormProps {
  initialData?: CustomerFormValues & { id: string };
  onSuccess: () => void;
  type?: "B2C" | "CONTACT";
}

export function CustomerForm({
  initialData,
  onSuccess,
  type = "B2C",
}: CustomerFormProps) {
  const { data: locations = [] } = useSWR(["locations-for-select"], () =>
    getLocations(),
  );

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      company: initialData?.company || "",
      customerType: initialData?.customerType || type,
      taxId: initialData?.taxId || "",
      isActive:
        initialData?.isActive !== undefined ? initialData.isActive : true,
      deliveryNotes: initialData?.deliveryNotes || "",
      customId: initialData?.customId || "",
      creationType: initialData?.creationType || "MEMBER_CREATED",
      defaultLocationId: initialData?.defaultLocationId || "",
      tags: initialData?.tags || [],
    },
  });

  const isActive = form.watch("isActive");
  const [tagInputValue, setTagInputValue] = React.useState("");

  const onSubmit = async (values: CustomerFormValues) => {
    try {
      const payload = {
        ...values,
        businessAccountId: initialData?.businessAccountId,
        customerType: initialData?.customerType || type,
        isActive: values.isActive ?? initialData?.isActive ?? true,
      };
      if (initialData?.id) {
        await updateCustomer(initialData.id, payload);
      } else {
        await createCustomer(payload);
      }
      onSuccess();
    } catch (error) {
      console.error("Failed to save customer", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {initialData ? "Edit Customer" : "New Customer"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {initialData
                ? "Update customer profile and account settings."
                : "Create a new customer record for this organization."}
            </p>
          </div>
          <Badge
            variant={isActive ? "default" : "secondary"}
            className="shrink-0"
          >
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        <Separator />

        {/* Identity */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <User className="h-4 w-4 text-muted-foreground" />
              Identity
            </CardTitle>
            <CardDescription>
              Primary contact details for this customer.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="company"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Inc" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tags"
              render={({ field }: { field: any }) => {
                const tags = field.value || [];

                const addTag = () => {
                  const trimmed = tagInputValue.trim();
                  if (trimmed && !tags.includes(trimmed)) {
                    field.onChange([...tags, trimmed]);
                  }
                  setTagInputValue("");
                };

                const removeTag = (tagToRemove: string) => {
                  field.onChange(tags.filter((t: string) => t !== tagToRemove));
                };

                return (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="flex items-center gap-1.5">
                      <TagIcon size={14} className="text-muted-foreground" />
                      Customer Tags
                    </FormLabel>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g. VIP, Loyalty, Wholesale (Press Enter or comma)"
                          value={tagInputValue}
                          onChange={(e) => setTagInputValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === ",") {
                              e.preventDefault();
                              addTag();
                            }
                          }}
                        />
                        <Button type="button" variant="outline" onClick={addTag}>
                          Add Tag
                        </Button>
                      </div>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 p-2 bg-muted/30 rounded-lg border border-border">
                          {tags.map((tag: string) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
                                aria-label={`Remove tag ${tag}`}
                              >
                                <X size={12} />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <FormDescription>
                      Categorize and group customers with reusable tags.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </CardContent>
        </Card>

        {/* Classification */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Classification & Compliance
            </CardTitle>
            <CardDescription>
              Internal identifiers and tax registration for reporting.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="customId"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Custom Customer ID / Code</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. CUST-5001" {...field} />
                  </FormControl>
                  <FormDescription>
                    Leave blank to auto-generate.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="taxId"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Tax ID (PIN)</FormLabel>
                  <FormControl>
                    <Input placeholder="KRA PIN" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="creationType"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Acquisition Channel</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select channel" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="MEMBER_CREATED">
                        Member Created
                      </SelectItem>
                      <SelectItem value="SELF_REGISTERED">
                        Self Registered
                      </SelectItem>
                      <SelectItem value="IMPORTED">Imported</SelectItem>
                      <SelectItem value="API_CREATED">API Created</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={(val) => field.onChange(val === "true")}
                    value={field.value ? "true" : "false"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Operations */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Truck className="h-4 w-4 text-muted-foreground" />
              Fulfillment
            </CardTitle>
            <CardDescription>
              Branch assignment and delivery preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="defaultLocationId"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Default Branch</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select default branch" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No default branch</SelectItem>
                      {locations.map((loc: any) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deliveryNotes"
              render={({ field }: { field: any }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Delivery Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Specific instructions for delivery..."
                      className="min-h-[96px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Separator />

        <div className="flex items-center justify-end gap-3 pb-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="min-w-[140px]"
          >
            {form.formState.isSubmitting
              ? "Saving..."
              : initialData
                ? "Update Customer"
                : "Create Customer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
