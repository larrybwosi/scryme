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
import { createDepartment, getDepartments } from "../../app/actions/department";
import { getStaffMembers } from "../../app/actions/staff";
import { getInventoryLocations } from "../../app/actions/finance";
import { getCostCenters } from "../../app/actions/finance-settings";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AddDepartmentDialogProps {
  children: React.ReactNode;
}

export function AddDepartmentDialog({ children }: AddDepartmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [parentDepartments, setParentDepartments] = useState<any[]>([]);
  const router = useRouter();

  const handleOpenChange = async (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      const [membersResult, locationsResult, costCentersResult, departmentsResult] = await Promise.all([
        getStaffMembers(),
        getInventoryLocations(),
        getCostCenters(),
        getDepartments(),
      ]);

      if (membersResult.success) setMembers(membersResult.data || []);
      setLocations(locationsResult || []);
      setCostCenters(costCentersResult || []);
      if (departmentsResult.success) setParentDepartments(departmentsResult.data || []);
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
      parentId: formData.get("parentId") as string,
      locationId: formData.get("locationId") as string,
      costCenterId: formData.get("costCenterId") as string,
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-4">
          <DialogHeader>
            <DialogTitle>Create New Department</DialogTitle>
            <DialogDescription>
              Define a new department and assign a department head.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-4">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="headId">Department Head</Label>
                <Select name="headId">
                  <SelectTrigger>
                    <SelectValue placeholder="Select head" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Head Assigned</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex flex-col">
                          <span className="font-medium text-left">{member.user.name}</span>
                          <span className="text-[10px] text-muted-foreground text-left">{member.user.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentId">Parent Department</Label>
                <Select name="parentId">
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Top Level)</SelectItem>
                    {parentDepartments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="locationId">Linked Location</Label>
                <Select name="locationId">
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="costCenterId">Cost Center</Label>
                <Select name="costCenterId">
                  <SelectTrigger>
                    <SelectValue placeholder="Select cost center" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {costCenters.map((cc) => (
                      <SelectItem key={cc.id} value={cc.id}>
                        {cc.code} - {cc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t gap-2">
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
