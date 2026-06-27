"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  customerSchema,
  type CustomerFormValues,
} from "../../../lib/validations";
import { createCustomer, updateCustomer } from "../../actions/customers";
import { useOrg } from "../../../components/org-context";
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
  const { organizationId } = useOrg();
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: initialData || {
      name: "",
      email: "",
      phone: "",
      company: "",
      customerType: type,
      taxId: "",
      isActive: true,
      deliveryNotes: "",
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
      console.error("Failed to save customer", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
        {/* For B2C individuals, the type is fixed as B2C to maintain view consistency */}
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
        <div className="pt-4 flex justify-end gap-3">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {initialData ? "Update" : "Create"} Customer
          </Button>
        </div>
      </form>
    </Form>
  );
}
