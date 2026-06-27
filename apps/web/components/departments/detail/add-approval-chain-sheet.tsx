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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { createDepartmentApprovalChain } from "../../../app/actions/department";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowDown } from "lucide-react";

interface AddApprovalChainSheetProps {
  departmentId: string;
  members: any[];
  children: React.ReactNode;
}

export function AddApprovalChainSheet({
  departmentId,
  members,
  children,
}: AddApprovalChainSheetProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<{ approverId: string }[]>([
    { approverId: "" },
  ]);
  const router = useRouter();

  const handleAddStep = () => {
    setSteps([...steps, { approverId: "" }]);
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleStepChange = (index: number, approverId: string) => {
    const newSteps = [...steps];
    newSteps[index].approverId = approverId;
    setSteps(newSteps);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validSteps = steps.filter(s => s.approverId !== "");
    if (validSteps.length === 0) {
      toast.error("Please add at least one approval step");
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      departmentId,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      minAmount: formData.get("minAmount")
        ? Number(formData.get("minAmount"))
        : undefined,
      maxAmount: formData.get("maxAmount")
        ? Number(formData.get("maxAmount"))
        : undefined,
      priority: Number(formData.get("priority") || 0),
      steps: validSteps.map((s, i) => ({
        approverId: s.approverId,
        stepOrder: i + 1,
      })),
    };

    const result = await createDepartmentApprovalChain(data);

    setLoading(false);
    if (result.success) {
      toast.success("Approval chain created successfully");
      setOpen(false);
      setSteps([{ approverId: "" }]);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to create approval chain");
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="sm:max-w-[550px] overflow-y-auto">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <SheetHeader>
            <SheetTitle>New Approval Chain</SheetTitle>
            <SheetDescription>
              Create a sequence of approvers for department purchases.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 py-6 space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Chain Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g. High Value Purchases"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="Optional description"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div className="space-y-2">
                <Label htmlFor="minAmount">Min Amount (KES)</Label>
                <Input
                  id="minAmount"
                  name="minAmount"
                  type="number"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxAmount">Max Amount (KES)</Label>
                <Input
                  id="maxAmount"
                  name="maxAmount"
                  type="number"
                  placeholder="No limit"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-base font-bold">Approval Steps</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddStep}
                  className="gap-1 h-8">
                  <Plus size={14} /> Add Step
                </Button>
              </div>

              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div key={index} className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold shrink-0">
                        {index + 1}
                      </div>
                      <Select
                        value={step.approverId}
                        onValueChange={val => handleStepChange(index, val)}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select approver..." />
                        </SelectTrigger>
                        <SelectContent>
                          {members.map(m => (
                            <SelectItem key={m.id} value={m.memberId}>
                              {m.member.user.name} ({m.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveStep(index)}
                        disabled={steps.length === 1}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                    {index < steps.length - 1 && (
                      <ArrowDown size={14} className="text-gray-300" />
                    )}
                  </div>
                ))}
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
              {loading ? "Creating..." : "Create Chain"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
