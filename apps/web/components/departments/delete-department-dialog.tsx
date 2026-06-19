"use client";

import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/ui/alert-dialog";
import { deleteDepartment } from "../../app/actions/department";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DeleteDepartmentDialogProps {
  departmentId: string;
  departmentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectToList?: boolean;
}

export function DeleteDepartmentDialog({
  departmentId,
  departmentName,
  open,
  onOpenChange,
  redirectToList = false
}: DeleteDepartmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    const result = await deleteDepartment(departmentId);
    setLoading(false);

    if (result.success) {
      toast.success("Department deleted successfully");
      onOpenChange(false);
      if (redirectToList) {
        router.push("/staff/departments");
      } else {
        router.refresh();
      }
    } else {
      toast.error(result.error || "Failed to delete department");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the <strong>{departmentName}</strong> department.
            All memberships and department-specific data will be removed.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? "Deleting..." : "Delete Department"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
