"use client";

import React from "react";
import { Plus, Box, Edit, Trash2, MoreVertical, Loader2 } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";
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
import { UnitDialog } from "./unit-dialog";
import { deleteUnit } from "../../app/actions/locations";
import { toast } from "sonner";

interface UnitListProps {
  locationId: string;
  zones: any[];
  units: any[];
}

export function UnitList({ locationId, zones, units }: UnitListProps) {
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  async function onDelete() {
    if (!deletingId) return;

    setIsDeleting(true);
    try {
      await deleteUnit(deletingId);
      toast.success("Unit deleted successfully");
      setDeletingId(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Standalone Storage Units</h3>
          <p className="text-sm text-muted-foreground">
            Units not assigned to a specific zone.
          </p>
        </div>
        <UnitDialog locationId={locationId} zones={zones}>
          <Button size="sm" variant="outline" className="gap-2">
            <Plus size={14} />
            Add Unit
          </Button>
        </UnitDialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {units.length === 0 ? (
          <div className="col-span-2 p-8 border rounded-xl bg-white text-center text-muted-foreground">
            No standalone storage units.
          </div>
        ) : (
          units.map((unit: any) => (
            <div
              key={unit.id}
              className="p-4 rounded-xl border bg-white flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-50 border flex items-center justify-center text-gray-400">
                  <Box size={18} />
                </div>
                <div>
                  <div className="font-medium text-sm">{unit.name}</div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">
                    {unit.unitType}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <UnitDialog
                      locationId={locationId}
                      zones={zones}
                      unit={unit}
                      variant="ghost"
                      size="icon"
                      className="transition-opacity"
                      aria-label={`Edit ${unit.name}`}>
                      <Edit size={14} />
                    </UnitDialog>
                  </TooltipTrigger>
                  <TooltipContent>Edit Unit</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="transition-opacity text-red-600 hover:text-red-700"
                      onClick={() => setDeletingId(unit.id)}
                      aria-label={`Delete ${unit.name}`}>
                      <Trash2 size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete Unit</TooltipContent>
                </Tooltip>
              </div>
            </div>
          ))
        )}
      </div>

      <AlertDialog
        open={!!deletingId}
        onOpenChange={open => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this unit? This will fail if it
              contains stock.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={e => {
                e.preventDefault();
                onDelete();
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700">
              {isDeleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
