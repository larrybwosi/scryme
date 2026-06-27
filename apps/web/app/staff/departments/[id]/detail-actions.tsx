"use client";

import React, { useState } from "react";
import { Button } from "@repo/ui/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { EditDepartmentSheet } from "../../../../components/departments/edit-department-sheet";
import { DeleteDepartmentDialog } from "../../../../components/departments/delete-department-dialog";

interface DetailActionsProps {
  department: any;
}

export function DetailActions({ department }: DetailActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="flex items-center gap-3">
      <EditDepartmentSheet
        department={department}
        open={editOpen}
        onOpenChange={setEditOpen}>
        <Button
          variant="secondary"
          size="sm"
          className="gap-2 bg-white/10 hover:bg-white/20 border-none text-white backdrop-blur-md">
          <Edit size={16} />
          <span>Edit</span>
        </Button>
      </EditDepartmentSheet>

      <Button
        variant="destructive"
        size="sm"
        className="gap-2 bg-red-500/80 hover:bg-red-500 border-none text-white backdrop-blur-md"
        onClick={() => setDeleteOpen(true)}>
        <Trash2 size={16} />
        <span>Delete</span>
      </Button>

      <DeleteDepartmentDialog
        departmentId={department.id}
        departmentName={department.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        redirectToList={true}
      />
    </div>
  );
}
