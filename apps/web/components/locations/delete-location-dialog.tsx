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
import { deleteLocation } from "../../app/actions/locations";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface DeleteLocationDialogProps {
  locationId: string;
  locationName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteLocationDialog({
  locationId,
  locationName,
  open,
  onOpenChange,
}: DeleteLocationDialogProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteLocation(locationId);
      toast.success("Location deleted successfully");
      onOpenChange(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete location");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the <strong>{locationName}</strong>{" "}
            location. This action cannot be undone and will fail if there are
            existing sub-locations or stock.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={e => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Location"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
