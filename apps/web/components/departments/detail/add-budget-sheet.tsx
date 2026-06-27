"use client";

import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@repo/ui/components/ui/sheet";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import { createDepartmentBudget } from "../../../app/actions/department";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AddBudgetSheetProps {
  departmentId: string;
  children: React.ReactNode;
}

export function AddBudgetSheet({
  departmentId,
  children,
}: AddBudgetSheetProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      departmentId,
      name: formData.get("name") as string,
      amount: Number(formData.get("amount")),
      periodStart: new Date(formData.get("periodStart") as string),
      periodEnd: new Date(formData.get("periodEnd") as string),
      description: formData.get("description") as string,
      fiscalYear: Number(formData.get("fiscalYear")),
      makeActive: formData.get("makeActive") === "on",
    };

    const result = await createDepartmentBudget(data);

    setLoading(false);
    if (result.success) {
      toast.success("Budget created successfully");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to create budget");
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <SheetHeader>
            <SheetTitle>Create Department Budget</SheetTitle>
            <SheetDescription>
              Set a new financial allocation for this department.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 py-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Budget Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. Q4 Operations, FY2024 Marketing"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Total Amount (KES)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="periodStart">Start Date</Label>
                <Input
                  id="periodStart"
                  name="periodStart"
                  type="date"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="periodEnd">End Date</Label>
                <Input id="periodEnd" name="periodEnd" type="date" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fiscalYear">Fiscal Year</Label>
              <Input
                id="fiscalYear"
                name="fiscalYear"
                type="number"
                defaultValue={new Date().getFullYear()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Details about this budget allocation"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox id="makeActive" name="makeActive" defaultChecked />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="makeActive"
                  className="text-sm font-medium cursor-pointer">
                  Set as currently active budget
                </Label>
                <p className="text-[11px] text-gray-500">
                  This will mark this budget as the primary allocation for this
                  department.
                </p>
              </div>
            </div>
          </div>

          <SheetFooter className="pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#1D1D1F] text-white hover:bg-[#1D1D1F]/90">
              {loading ? "Creating..." : "Create Budget"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
