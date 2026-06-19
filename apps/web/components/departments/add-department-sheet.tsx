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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { createDepartment } from "../../app/actions/department";
import { getStaffMembers } from "../../app/actions/staff";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AddDepartmentSheetProps {
  children: React.ReactNode;
}

export function AddDepartmentSheet({ children }: AddDepartmentSheetProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const router = useRouter();

  const handleOpenChange = async (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && members.length === 0) {
      const result = await getStaffMembers();
      if (result.success) {
        setMembers(result.data || []);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      headId: formData.get("headId") as string,
    };

    const result = await createDepartment(data);

    setLoading(false);
    if (result.success) {
      toast.success("Department created successfully");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to create department");
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <SheetHeader>
            <SheetTitle>Create New Department</SheetTitle>
            <SheetDescription>
              Define a new department and assign a department head.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 py-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Department Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. Engineering, Sales, Human Resources"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Briefly describe the department's responsibilities"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="headId">Department Head</Label>
              <Select name="headId">
                <SelectTrigger>
                  <SelectValue placeholder="Select a head (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Head Assigned</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.user.name} ({member.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-gray-500">
                The head will be automatically added as a department member.
              </p>
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
              {loading ? "Creating..." : "Create Department"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
