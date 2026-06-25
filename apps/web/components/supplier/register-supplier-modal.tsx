"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/ui/dialog";
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
import { Plus } from "lucide-react";
import { registerSupplier } from "../../app/actions/supplier";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";

const supplierSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(2, "Code must be at least 2 characters"),
  contactName: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  type: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

export function RegisterSupplierModal() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      code: "",
      contactName: "",
      email: "",
      phone: "",
      address: "",
      type: "manufacturer",
    },
  });

  async function onSubmit(values: SupplierFormValues) {
    setIsSubmitting(true);
    try {
      await registerSupplier(values);
      setOpen(false);
      form.reset();
      router.refresh();
      toast.success("Supplier registered successfully");
    } catch (error) {
      toast.error("Failed to register supplier");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl h-10 px-6 gap-2 bg-primary hover:bg-primary/90 shadow-sm transition-all border-none">
          <Plus size={18} />
          <span className="font-bold">Register Supplier</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#1D1D1F]">
            Register Supplier
          </DialogTitle>
          <DialogDescription>
            Add a new supplier to your organization network.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                      Supplier Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Acme Inc"
                        {...field}
                        className="h-11 rounded-xl bg-gray-50/50 border-gray-200"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                      Supplier Code
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ACM-001"
                        {...field}
                        className="h-11 rounded-xl bg-gray-50/50 border-gray-200 font-mono"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                      Contact Person
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        {...field}
                        className="h-11 rounded-xl bg-gray-50/50 border-gray-200"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                      Supplier Type
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-xl bg-gray-50/50 border-gray-200">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="manufacturer">
                          Manufacturer
                        </SelectItem>
                        <SelectItem value="distributor">Distributor</SelectItem>
                        <SelectItem value="wholesaler">Wholesaler</SelectItem>
                        <SelectItem value="service_provider">
                          Service Provider
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="john@acme.com"
                        {...field}
                        className="h-11 rounded-xl bg-gray-50/50 border-gray-200"
                      />
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
                    <FormLabel className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                      Phone
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+254..."
                        {...field}
                        className="h-11 rounded-xl bg-gray-50/50 border-gray-200"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    Office Address
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="123 Industrial Area, Nairobi"
                      {...field}
                      className="h-11 rounded-xl bg-gray-50/50 border-gray-200"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="rounded-xl h-11 px-6">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl h-11 px-10 font-bold">
                {isSubmitting ? "Registering..." : "Register Supplier"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
