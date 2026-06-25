"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Textarea } from "@repo/ui/components/ui/textarea";
import {
  createUtilityAccount,
  recordUtilityBill,
} from "../../app/actions/finance";
import { toast } from "sonner";
import { UtilityType, PaymentMethod } from "@repo/db/client";
import { Loader2 } from "lucide-react";

const utilitySchema = z.object({
  name: z.string().min(2, "Account name is required"),
  provider: z.string().optional(),
  accountNumber: z.string().min(1, "Account number is required"),
  meterNumber: z.string().optional(),
  type: z.nativeEnum(UtilityType),
});

const billSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  billDate: z.string(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  description: z.string().min(2, "Description is required"),
  notes: z.string().optional(),
});

type UtilityFormValues = z.infer<typeof utilitySchema>;
type BillFormValues = z.infer<typeof billSchema>;

interface UtilityDialogProps {
  children: React.ReactNode;
  mode?: "CREATE" | "BILL";
  accountId?: string;
  accountName?: string;
}

export function UtilityDialog({
  children,
  mode = "CREATE",
  accountId,
  accountName,
}: UtilityDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const utilityForm = useForm<UtilityFormValues>({
    resolver: zodResolver(utilitySchema) as any,
    defaultValues: {
      name: "",
      provider: "",
      accountNumber: "",
      meterNumber: "",
      type: UtilityType.ELECTRICITY,
    },
  });

  const billForm = useForm<BillFormValues>({
    resolver: zodResolver(billSchema) as any,
    defaultValues: {
      amount: 0,
      billDate: new Date().toISOString().split("T")[0],
      paymentMethod: PaymentMethod.CASH,
      description: accountName ? `${accountName} Bill` : "",
      notes: "",
    },
  });

  async function onUtilitySubmit(values: UtilityFormValues) {
    startTransition(async () => {
      try {
        await createUtilityAccount(values);
        toast.success("Utility account created successfully");
        setOpen(false);
        utilityForm.reset();
      } catch (error: any) {
        toast.error(error.message || "Failed to create utility account");
      }
    });
  }

  async function onBillSubmit(values: BillFormValues) {
    if (!accountId) return;
    startTransition(async () => {
      try {
        await recordUtilityBill({
          ...values,
          utilityAccountId: accountId,
          billDate: new Date(values.billDate),
        });
        toast.success("Utility bill recorded successfully");
        setOpen(false);
        billForm.reset();
      } catch (error: any) {
        toast.error(error.message || "Failed to record utility bill");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "CREATE"
              ? "Add Utility Account"
              : `Record Bill: ${accountName}`}
          </DialogTitle>
        </DialogHeader>

        {mode === "CREATE" ? (
          <Form {...utilityForm}>
            <form
              onSubmit={utilityForm.handleSubmit(onUtilitySubmit)}
              className="space-y-4">
              <FormField
                control={utilityForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Main Office Electricity" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={utilityForm.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <FormControl>
                      <Input placeholder="Kenya Power" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={utilityForm.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account #</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={utilityForm.control}
                  name="meterNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meter # (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={utilityForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Utility Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(UtilityType).map(type => (
                          <SelectItem key={type} value={type}>
                            {type.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="submit"
                  className="w-full bg-[#34A853] hover:bg-[#2d9147]"
                  disabled={isPending}>
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Account
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <Form {...billForm}>
            <form
              onSubmit={billForm.handleSubmit(onBillSubmit)}
              className="space-y-4">
              <FormField
                control={billForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={billForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={billForm.control}
                  name="billDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bill Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={billForm.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(PaymentMethod).map(method => (
                          <SelectItem key={method} value={method}>
                            {method.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={billForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Optional notes..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="submit"
                  className="w-full bg-[#34A853] hover:bg-[#2d9147]"
                  disabled={isPending}>
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Record Bill
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
