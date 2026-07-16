"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@repo/ui/components/ui/dialog";
import { Button } from "@repo/ui/components/ui/button";
import { Label } from "@repo/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import {
  addDepartmentMember,
  getMembersForAssignment,
} from "../../../app/actions/department";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/ui/avatar";

interface AddMemberToDeptDialogProps {
  departmentId: string;
  children: React.ReactNode;
}

export function AddMemberToDeptDialog({
  departmentId,
  children,
}: AddMemberToDeptDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableMembers, setAvailableMembers] = useState<any[]>([]);
  const router = useRouter();

  const handleOpenChange = async (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setLoading(true);
      const result = await getMembersForAssignment(departmentId);
      setLoading(false);
      if (result.success) {
        setAvailableMembers(result.data || []);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      departmentId,
      memberId: formData.get("memberId") as string,
      role: formData.get("role") as any,
      canApproveExpenses: formData.get("canApproveExpenses") === "on",
      canManageBudget: formData.get("canManageBudget") === "on",
    };

    if (!data.memberId) {
      toast.error("Please select a member");
      setLoading(false);
      return;
    }

    const result = await addDepartmentMember(data);

    setLoading(false);
    if (result.success) {
      toast.success("Member added to department");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to add member");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-125">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Member to Department</DialogTitle>
            <DialogDescription>
              Assign an existing staff member to this department and set their
              role.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="memberId">Select Staff Member</Label>
              <Select name="memberId">
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select a member..." />
                </SelectTrigger>
                <SelectContent>
                  {availableMembers.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={m.user.image} />
                          <AvatarFallback>
                            {m.user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{m.user.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                  {availableMembers.length === 0 && !loading && (
                    <div className="p-2 text-center text-sm text-gray-500">
                      No members available to add
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Department Role</Label>
              <Select name="role" defaultValue="MEMBER">
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="HEAD">Head</SelectItem>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 pt-4">
              <h4 className="text-sm font-semibold border-b pb-2">
                Enterprise Permissions
              </h4>

              <div className="flex items-center space-x-2">
                <Checkbox id="canApproveExpenses" name="canApproveExpenses" />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="canApproveExpenses"
                    className="text-sm font-medium cursor-pointer">
                    Can Approve Expenses
                  </Label>
                  <p className="text-[11px] text-gray-500">
                    Allows member to review and approve department expenses.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="canManageBudget" name="canManageBudget" />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="canManageBudget"
                    className="text-sm font-medium cursor-pointer">
                    Can Manage Budget
                  </Label>
                  <p className="text-[11px] text-gray-500">
                    Allows member to create and modify department budgets.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || availableMembers.length === 0}
              className="bg-[#1D1D1F] text-white hover:bg-[#1D1D1F]/90">
              {loading ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
