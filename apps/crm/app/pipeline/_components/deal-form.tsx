"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@repo/ui/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/ui/form";
import { Input } from "@repo/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { createDeal } from "../../actions/deals";
import { getCustomers } from "../../actions/customers";
import { getCompanies } from "../../actions/companies";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const dealFormSchema = z.object({
  name: z.string().min(1, "Deal name is required"),
  amount: z.string().transform((v) => Number(v) || 0),
  stage: z.string().min(1, "Stage is required"),
  expectedCloseDate: z.string().optional(),
  probability: z
    .string()
    .optional()
    .transform((v) => Number(v) || 0),
  description: z.string().optional(),
  associatedCustomerId: z.string().optional().nullable(),
  associatedCompanyId: z.string().optional().nullable(),
});

type DealFormValues = z.infer<typeof dealFormSchema>;

interface DealFormProps {
  onSuccess: () => void;
  initialData?: any;
}

const STAGES = [
  { id: "discovery", title: "Discovery" },
  { id: "qualification", title: "Qualification" },
  { id: "proposal", title: "Proposal" },
  { id: "negotiation", title: "Negotiation" },
  { id: "closed_won", title: "Closed Won" },
  { id: "closed_lost", title: "Closed Lost" },
];

export function DealForm({ onSuccess, initialData }: DealFormProps) {
  const [loading, setLoading] = useState(false);

  // Fetching data using SWR hooks
  const { data: customers = [], isLoading: loadingCustomers } = useSWR(
    "fetch/customers",
    getCustomers,
  );
  const { data: companies = [], isLoading: loadingCompanies } = useSWR(
    "fetch/companies",
    getCompanies,
  );

  // Combine loading states for the UI selects
  const loadingOptions = loadingCustomers || loadingCompanies;

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      name: initialData?.data?.name || "",
      amount: initialData?.data?.amount || 0,
      stage: initialData?.data?.stage || "discovery",
      expectedCloseDate: initialData?.data?.expectedCloseDate || "",
      probability: initialData?.data?.probability || 0,
      description: initialData?.data?.description || "",
      associatedCustomerId: initialData?.associatedCustomerId || null,
      associatedCompanyId: initialData?.associatedCompanyId || null,
    },
  });

  async function onSubmit(values: DealFormValues) {
    setLoading(true);
    try {
      const result = await createDeal(values);
      if (result.success) {
        toast.success(initialData ? "Deal updated" : "Deal created");
        onSuccess();
      } else {
        toast.error(result.error || "Failed to save deal");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deal Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Q4 Software License" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="probability"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Probability (%)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="50" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="stage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stage</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a stage" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {STAGES.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.title}
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
          name="expectedCloseDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expected Close Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="associatedCompanyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Associated Company</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingOptions ? "Loading..." : "Select a company"
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {companies.map((company) => (
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

        <FormField
          control={form.control}
          name="associatedCustomerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Associated Contact</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingOptions ? "Loading..." : "Select a contact"
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Additional details..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Update Deal" : "Create Deal"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
