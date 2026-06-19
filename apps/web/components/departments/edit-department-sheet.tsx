"use client";

import React, { useState, useEffect } from "react";
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
import { updateDepartment } from "../../app/actions/department";
import { getStaffMembers } from "../../app/actions/staff";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ImageUpload } from "../image-upload";

interface EditDepartmentSheetProps {
  department: any;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditDepartmentSheet({
  department,
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}: EditDepartmentSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [images, setImages] = useState<string[]>(department.image ? [department.image] : []);
  const [banners, setBanners] = useState<string[]>(department.banner ? [department.banner] : []);
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
      image: images[0] || null,
      banner: banners[0] || null,
    };

    const result = await updateDepartment(department.id, data);

    setLoading(false);
    if (result.success) {
      toast.success("Department updated successfully");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update department");
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <SheetHeader>
            <SheetTitle>Edit Department</SheetTitle>
            <SheetDescription>
              Update department information and branding.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 py-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Department Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={department.name}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={department.description}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="headId">Department Head</Label>
              <Select name="headId" defaultValue={department.headId || ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a head (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Head Assigned</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Department Logo</Label>
                <ImageUpload
                  value={images}
                  onChange={setImages}
                  maxImages={1}
                />
              </div>
              <div className="space-y-2">
                <Label>Department Banner</Label>
                <ImageUpload
                  value={banners}
                  onChange={setBanners}
                  maxImages={1}
                />
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
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
