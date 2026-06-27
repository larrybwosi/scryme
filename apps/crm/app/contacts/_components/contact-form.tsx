"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  customerSchema,
  type CustomerFormValues,
} from "../../../lib/validations";
import { createCustomer, updateCustomer } from "../../actions/customers";
import { getCompanies } from "../../actions/companies";
import { useOrg } from "../../../components/org-context";
import useSWR from "swr";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { Loader2 } from "lucide-react";

interface ContactFormProps {
  initialData?: CustomerFormValues & { id: string };
  onSuccess: () => void;
  businessAccountId?: string;
}

export function ContactForm({
  initialData,
  onSuccess,
  businessAccountId,
}: ContactFormProps) {
  const { organizationId } = useOrg();

  const { data: companies = [] } = useSWR(
    organizationId ? ["companies-list", organizationId] : null,
    () => getCompanies(organizationId),
  );

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: initialData || {
      name: "",
      email: "",
      phone: "",
      company: "",
      businessAccountId: businessAccountId || "",
      customerType: "B2B",
      isActive: true,
    },
  });

  const onSubmit = async (values: CustomerFormValues) => {
    try {
      if (initialData) {
        await updateCustomer(initialData.id, values);
      } else {
        await createCustomer(values, organizationId);
      }
      onSuccess();
    } catch (error) {
      console.error("Failed to save contact", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Full Name <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="Jane Smith" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="jane@company.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
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
          name="businessAccountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value || undefined}
                value={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {companies.map((company: any) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="pt-4 flex justify-end gap-3">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {initialData ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>{initialData ? "Update" : "Create"} Contact</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
