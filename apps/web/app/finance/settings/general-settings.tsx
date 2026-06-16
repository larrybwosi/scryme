"use client";

import { useState, useTransition } from "react";
import {
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Settings,
  DollarSign,
  Receipt,
  Truck,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Switch } from "@repo/ui/components/ui/switch";
import { Separator } from "@repo/ui/components/ui/separator";
import { cn } from "@repo/ui/lib/utils";
import { toast } from "sonner";
import { updateFinanceSettings } from "@/app/actions/finance-settings";

const schema = z.object({
  expenseApprovalRequired: z.boolean(),
  expenseApprovalThreshold: z.number().min(0),
  pettyCashAutoApproveThreshold: z.number().min(0),
  expenseReceiptRequired: z.boolean(),
  expenseReceiptThreshold: z.number().min(0),
  mileageRate: z.number().min(0),
});

export function GeneralSettings({ organization }: { organization: any }) {
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      expenseApprovalRequired: organization.expenseApprovalRequired || false,
      expenseApprovalThreshold: Number(
        organization.expenseApprovalThreshold || 0,
      ),
      pettyCashAutoApproveThreshold: Number(
        organization.pettyCashAutoApproveThreshold || 0,
      ),
      expenseReceiptRequired: organization.expenseReceiptRequired || false,
      expenseReceiptThreshold: Number(
        organization.expenseReceiptThreshold || 0,
      ),
      mileageRate: Number(organization.settings?.mileageRate || 0),
    },
  });

  const onSubmit = async (data: any) => {
    startTransition(async () => {
      try {
        await updateFinanceSettings(data);
        toast.success("Settings updated");
        form.reset(data);
      } catch (error) {
        toast.error("Failed to update settings");
      }
    });
  };

  const isDirty = form.formState.isDirty;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="h-full flex flex-col">
      <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
        <div>
          <h3 className="text-base font-bold text-zinc-900">
            General Finance Settings
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Configure global thresholds and policies
          </p>
        </div>
        <Button
          type="submit"
          disabled={isPending || !isDirty}
          size="sm"
          className="bg-[#34A853] hover:bg-[#2d9147]">
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="p-8 space-y-10 overflow-y-auto flex-1">
        {/* Approvals Section */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-tight">
              Expense Approvals
            </h4>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 bg-white">
              <div className="space-y-1">
                <Label className="text-sm font-semibold">
                  Require Approval
                </Label>
                <p className="text-xs text-zinc-500">
                  Enable mandatory approval workflow for all expenses
                </p>
              </div>
              <Switch
                checked={form.watch("expenseApprovalRequired")}
                onCheckedChange={val =>
                  form.setValue("expenseApprovalRequired", val, {
                    shouldDirty: true,
                  })
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-zinc-400">
                  Approval Threshold
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <Input
                    type="number"
                    {...form.register("expenseApprovalThreshold", {
                      valueAsNumber: true,
                    })}
                    className="pl-9 h-11"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-[11px] text-zinc-400 leading-tight">
                  Expenses above this amount will trigger the approval workflow
                  even if not explicitly required.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-zinc-400">
                  Petty Cash Auto-Approve
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <Input
                    type="number"
                    {...form.register("pettyCashAutoApproveThreshold", {
                      valueAsNumber: true,
                    })}
                    className="pl-9 h-11"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-[11px] text-zinc-400 leading-tight">
                  Petty cash transactions below this amount are automatically
                  approved.
                </p>
              </div>
            </div>
          </div>
        </section>

        <Separator className="bg-zinc-100" />

        {/* Compliance Section */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Receipt className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-tight">
              Compliance & Receipts
            </h4>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 bg-white">
              <div className="space-y-1">
                <Label className="text-sm font-semibold">
                  Mandatory Receipts
                </Label>
                <p className="text-xs text-zinc-500">
                  Require receipt attachment for all expense submissions
                </p>
              </div>
              <Switch
                checked={form.watch("expenseReceiptRequired")}
                onCheckedChange={val =>
                  form.setValue("expenseReceiptRequired", val, {
                    shouldDirty: true,
                  })
                }
              />
            </div>

            <div className="space-y-2 max-w-md">
              <Label className="text-xs font-bold uppercase text-zinc-400">
                Receipt Threshold
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  type="number"
                  {...form.register("expenseReceiptThreshold", {
                    valueAsNumber: true,
                  })}
                  className="pl-9 h-11"
                  placeholder="0.00"
                />
              </div>
              <p className="text-[11px] text-zinc-400 leading-tight">
                Mandatory receipts will only be enforced for expenses exceeding
                this value.
              </p>
            </div>
          </div>
        </section>

        <Separator className="bg-zinc-100" />

        {/* Reimbursements Section */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
              <Truck className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-tight">
              Reimbursements
            </h4>
          </div>

          <div className="space-y-2 max-w-md">
            <Label className="text-xs font-bold uppercase text-zinc-400">
              Mileage Rate (per km/mile)
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                type="number"
                {...form.register("mileageRate", { valueAsNumber: true })}
                className="pl-9 h-11"
                placeholder="0.00"
                step="0.01"
              />
            </div>
            <p className="text-[11px] text-zinc-400 leading-tight">
              Standard rate used to calculate reimbursement for business travel.
            </p>
          </div>
        </section>

        {isDirty && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-800 font-medium leading-tight">
              You have unsaved changes. Remember to save your configuration
              before switching tabs or leaving the page.
            </p>
          </div>
        )}
      </div>
    </form>
  );
}
