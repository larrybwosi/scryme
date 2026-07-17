"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import {
  MoreVertical,
  Shield,
  Trash2,
  Ban,
  CheckCircle2,
  Smartphone,
  Monitor,
  MapPin,
  Clock,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import { Label } from "@repo/ui/components/ui/label";
import { Textarea } from "@repo/ui/components/ui/textarea";
import {
  updateDevicePermissions,
  revokeDevice,
  deleteDevice,
} from "@/app/actions/devices";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const PREDEFINED_PERMISSIONS = [
  { id: "*", label: "Super Admin (Full Access)" },

  // POS App Permissions
  { id: "pos:auth", label: "POS: Device Authentication & Realtime" },
  { id: "pos:location:read", label: "POS: Read Locations" },
  { id: "pos:product:read", label: "POS: View Products & Pricing" },
  { id: "pos:product:update", label: "POS: Manage Inventory Levels & Barcodes" },
  { id: "pos:sale:read", label: "POS: View Sales History & Transactions" },
  { id: "pos:sale:create", label: "POS: Process Sales & Orders" },
  { id: "pos:sale:update", label: "POS: Record Payments & Manage Deliveries" },
  { id: "pos:stock:manage", label: "POS: Create & Manage Stock Requests" },
  { id: "pos:petty-cash:create", label: "POS: Create Petty Cash Transactions" },
  { id: "pos:petty-cash:read", label: "POS: View Petty Cash Status & Logs" },
  { id: "pos:sync", label: "POS: Database Synchronization" },

  // Bakery App Permissions
  { id: "bakery:batch:view", label: "Bakery: View Batches & Deliveries" },
  { id: "bakery:batch:manage", label: "Bakery: Manage Batches, Partners & Deliveries" },
  { id: "bakery:recipe:view", label: "Bakery: View Recipes, Ingredients & Categories" },
  { id: "bakery:recipe:manage", label: "Bakery: Manage Recipes, Ingredients & Categories" },
  { id: "bakery:template:view", label: "Bakery: View Templates" },
  { id: "bakery:template:manage", label: "Bakery: Manage Templates" },
  { id: "bakery:settings:manage", label: "Bakery: Manage Settings, Bakers & Reports" },
];

export function DeviceList({ devices }: { devices: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [jsonPermissions, setJsonPermissions] = useState("");
  const [isJsonMode, setIsJsonMode] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState<{
    device: any;
    type: "revoke" | "delete";
  } | null>(null);

  const handleEditPermissions = (device: any) => {
    setSelectedDevice(device);
    setPermissions(device.apiKey.permissions || []);
    setJsonPermissions(
      JSON.stringify(device.apiKey.permissions || [], null, 2),
    );
    setIsPermissionsOpen(true);
  };

  const handleSavePermissions = () => {
    startTransition(async () => {
      try {
        let finalPermissions;
        if (isJsonMode) {
          try {
            finalPermissions = JSON.parse(jsonPermissions);
            if (!Array.isArray(finalPermissions)) {
              throw new Error("Permissions must be an array of strings");
            }
          } catch (e) {
            toast.error("Invalid JSON format in permissions editor");
            return;
          }
        } else {
          finalPermissions = permissions;
        }

        await updateDevicePermissions(
          selectedDevice.apiKeyId,
          finalPermissions,
        );
        toast.success("Permissions updated successfully");
        setIsPermissionsOpen(false);
      } catch (error) {
        toast.error("Failed to update permissions");
        console.error(error);
      }
    });
  };

  const handleRevoke = (device: any) => {
    setConfirmationAction({ device, type: "revoke" });
  };

  const handleDelete = (device: any) => {
    setConfirmationAction({ device, type: "delete" });
  };

  const onConfirmAction = () => {
    if (!confirmationAction) return;
    const { device, type } = confirmationAction;

    startTransition(async () => {
      try {
        if (type === "revoke") {
          await revokeDevice(device.id);
          toast.success("Device access revoked");
        } else {
          await deleteDevice(device.id);
          toast.success("Device deleted");
        }
        setConfirmationAction(null);
      } catch (error) {
        toast.error(`Failed to ${type} device`);
      }
    });
  };

  const togglePermission = (id: string) => {
    setPermissions(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id],
    );
  };

  return (
    <>
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.map(device => (
              <TableRow key={device.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      {device.deviceType === "POS_TERMINAL" ? (
                        <Monitor className="w-4 h-4 text-slate-600" />
                      ) : (
                        <Smartphone className="w-4 h-4 text-slate-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">
                        {device.deviceName}
                      </div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider">
                        {device.deviceType.replace("_", " ")}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-sm">{device.location.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {device.status === "ACTIVE" ? (
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Active
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-slate-50 text-slate-600 border-slate-200 gap-1">
                      <Ban className="w-3 h-3" />
                      Inactive
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-sm">
                      {device.apiKey.lastUsedAt
                        ? format(
                            new Date(device.apiKey.lastUsedAt),
                            "MMM d, h:mm a",
                          )
                        : "Never"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            aria-label="More actions">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent>More actions</TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => handleEditPermissions(device)}>
                        <Shield className="mr-2 h-4 w-4" />
                        Edit Permissions
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-amber-600"
                        onClick={() => handleRevoke(device)}>
                        <Ban className="mr-2 h-4 w-4" />
                        Revoke Access
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDelete(device)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Device
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {devices.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-slate-500">
                  No devices registered yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isPermissionsOpen} onOpenChange={setIsPermissionsOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Device Permissions</DialogTitle>
            <DialogDescription>
              Configure what actions{" "}
              <strong>{selectedDevice?.deviceName}</strong> is authorized to
              perform.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center">
              <Label>Permissions Mode</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsJsonMode(!isJsonMode)}>
                {isJsonMode ? "Switch to List View" : "Switch to JSON Editor"}
              </Button>
            </div>

            {isJsonMode ? (
              <div className="space-y-2">
                <Textarea
                  value={jsonPermissions}
                  onChange={e => setJsonPermissions(e.target.value)}
                  className="font-mono text-sm h-64"
                />
                <p className="text-xs text-slate-500">
                  Enter a valid JSON string array of permissions.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
                {PREDEFINED_PERMISSIONS.map(perm => (
                  <div
                    key={perm.id}
                    className="flex items-start space-x-3 space-y-0 border p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => togglePermission(perm.id)}>
                    <Checkbox
                      id={perm.id}
                      checked={permissions.includes(perm.id)}
                      onCheckedChange={() => togglePermission(perm.id)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={perm.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                        {perm.label}
                      </label>
                      <code className="text-[10px] text-slate-500 bg-slate-100 px-1 rounded">
                        {perm.id}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPermissionsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePermissions} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!confirmationAction}
        onOpenChange={open => !open && setConfirmationAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmationAction?.type === "revoke"
                ? "Revoke Device Access"
                : "Delete Device Registry"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmationAction?.type === "revoke" ? (
                <>
                  Are you sure you want to revoke access for{" "}
                  <strong>{confirmationAction?.device?.deviceName}</strong>? The
                  device will be logged out immediately.
                </>
              ) : (
                <>
                  Are you sure you want to delete the registry for{" "}
                  <strong>{confirmationAction?.device?.deviceName}</strong>? This
                  will remove all associated data and access keys.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={e => {
                e.preventDefault();
                onConfirmAction();
              }}
              disabled={isPending}
              className={
                confirmationAction?.type === "delete"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-amber-600 hover:bg-amber-700 text-white"
              }>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {confirmationAction?.type === "revoke"
                    ? "Revoking..."
                    : "Deleting..."}
                </>
              ) : confirmationAction?.type === "revoke" ? (
                "Revoke Access"
              ) : (
                "Delete Device"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
