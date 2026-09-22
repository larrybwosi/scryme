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
import { toast } from "sonner";
import { deleteSupplier } from "../../app/actions/supplier";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface DeleteSupplierModalProps {
  supplierId: string;
  supplierName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteSupplierModal({
  supplierId,
  supplierName,
  isOpen,
  onOpenChange,
}: DeleteSupplierModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteSupplier(supplierId);
      toast.success("Supplier deleted successfully");
      router.push("/inventory/supplier");
    } catch (error) {
      toast.error(
        "Failed to delete supplier. Ensure they have no active products or purchases.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-xl border border-border bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            This action cannot be undone. This will permanently delete{" "}
            <strong>{supplierName}</strong> and all associated data from our
            servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} className="rounded-lg">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={e => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg">
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Supplier"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
