"use client";

import React, { useState } from "react";
import { Plus, Layers, Edit, Trash2, MoreVertical, Loader2 } from "lucide-react";
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
import { ZoneDialog } from "./zone-dialog";
import { deleteZone } from "../../app/actions/locations";
import { toast } from "sonner";

interface ZoneListProps {
  locationId: string;
  zones: any[];
}

export function ZoneList({ locationId, zones }: ZoneListProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<any>(null);

  async function onDelete() {
    if (!zoneToDelete) return;

    setIsDeleting(true);
    try {
      await deleteZone(zoneToDelete.id);
      toast.success("Zone deleted successfully");
      setZoneToDelete(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Layers size={18} className="text-orange-600" />
          Storage Zones
        </h3>
        <ZoneDialog locationId={locationId}>
          <Button size="sm" variant="outline" className="gap-2">
            <Plus size={14} />
            Add Zone
          </Button>
        </ZoneDialog>
      </div>

      <div className="space-y-3">
        {zones.length === 0 ? (
          <div className="p-8 border rounded-xl bg-white text-center text-muted-foreground">
            No storage zones defined.
          </div>
        ) : (
          zones.map((zone: any) => (
            <div
              key={zone.id}
              className="p-4 rounded-xl border bg-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                  <Layers size={20} />
                </div>
                <div>
                  <div className="font-semibold">{zone.name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">
                    {zone.description || "No description"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs font-medium">
                    {zone._count.storageUnits} Units
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Capacity: {zone.capacity || "∞"} {zone.capacityUnit}
                  </div>
                </div>
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Actions for ${zone.name}`}>
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Actions</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end">
                    <ZoneDialog locationId={locationId} zone={zone}>
                      <DropdownMenuItem onSelect={e => e.preventDefault()}>
                        <Edit className="mr-2 h-4 w-4" /> Edit Zone
                      </DropdownMenuItem>
                    </ZoneDialog>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => setZoneToDelete(zone)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Zone
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </div>

      <AlertDialog
        open={!!zoneToDelete}
        onOpenChange={open => !open && !isDeleting && setZoneToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the zone <strong>{zoneToDelete?.name}</strong>.
              This action cannot be undone and will fail if the zone contains storage units.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={e => {
                e.preventDefault();
                onDelete();
              }}
              disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Zone"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
