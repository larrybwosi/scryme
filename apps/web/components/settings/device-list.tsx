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
  Clock
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
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import { Label } from "@repo/ui/components/ui/label";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { updateDevicePermissions, revokeDevice, deleteDevice } from "@/app/actions/devices";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const PREDEFINED_PERMISSIONS = [
  { id: "*", label: "Super Admin (Full Access)" },
  { id: "pos:sales:create", label: "Create POS Sales" },
  { id: "pos:sales:view", label: "View POS Sales" },
  { id: "pos:inventory:view", label: "View POS Inventory" },
  { id: "pos:petty-cash:create", label: "Create Petty Cash Transactions" },
  { id: "bakery:batch:create", label: "Create Bakery Batches" },
  { id: "bakery:recipe:view", label: "View Bakery Recipes" },
  { id: "bakery:inventory:view", label: "View Bakery Inventory" },
];

export function DeviceList({ devices }: { devices: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [jsonPermissions, setJsonPermissions] = useState("");
  const [isJsonMode, setIsJsonMode] = useState(false);

  const handleEditPermissions = (device: any) => {
    setSelectedDevice(device);
    setPermissions(device.apiKey.permissions || []);
    setJsonPermissions(JSON.stringify(device.apiKey.permissions || [], null, 2));
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

        await updateDevicePermissions(selectedDevice.apiKeyId, finalPermissions);
        toast.success("Permissions updated successfully");
        setIsPermissionsOpen(false);
      } catch (error) {
        toast.error("Failed to update permissions");
        console.error(error);
      }
    });
  };

  const handleRevoke = (deviceId: string) => {
    if (!confirm("Are you sure you want to revoke this device's access?")) return;
    startTransition(async () => {
      try {
        await revokeDevice(deviceId);
        toast.success("Device access revoked");
      } catch (error) {
        toast.error("Failed to revoke device access");
      }
    });
  };

  const handleDelete = (deviceId: string) => {
    if (!confirm("Are you sure you want to delete this device registry?")) return;
    startTransition(async () => {
      try {
        await deleteDevice(deviceId);
        toast.success("Device deleted");
      } catch (error) {
        toast.error("Failed to delete device");
      }
    });
  };

  const togglePermission = (id: string) => {
    setPermissions(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
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
            {devices.map((device) => (
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
                      <div className="font-medium text-slate-900">{device.deviceName}</div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider">{device.deviceType.replace("_", " ")}</div>
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
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 gap-1">
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
                        ? format(new Date(device.apiKey.lastUsedAt), "MMM d, h:mm a")
                        : "Never"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleEditPermissions(device)}>
                        <Shield className="mr-2 h-4 w-4" />
                        Edit Permissions
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-amber-600"
                        onClick={() => handleRevoke(device.id)}
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Revoke Access
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDelete(device.id)}
                      >
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
                <TableCell colSpan={5} className="h-24 text-center text-slate-500">
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
              Configure what actions <strong>{selectedDevice?.deviceName}</strong> is authorized to perform.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center">
              <Label>Permissions Mode</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsJsonMode(!isJsonMode)}
              >
                {isJsonMode ? "Switch to List View" : "Switch to JSON Editor"}
              </Button>
            </div>

            {isJsonMode ? (
              <div className="space-y-2">
                <Textarea
                  value={jsonPermissions}
                  onChange={(e) => setJsonPermissions(e.target.value)}
                  className="font-mono text-sm h-64"
                />
                <p className="text-xs text-slate-500">Enter a valid JSON string array of permissions.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
                {PREDEFINED_PERMISSIONS.map((perm) => (
                  <div key={perm.id} className="flex items-start space-x-3 space-y-0 border p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => togglePermission(perm.id)}>
                    <Checkbox
                      id={perm.id}
                      checked={permissions.includes(perm.id)}
                      onCheckedChange={() => togglePermission(perm.id)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={perm.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {perm.label}
                      </label>
                      <code className="text-[10px] text-slate-500 bg-slate-100 px-1 rounded">{perm.id}</code>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPermissionsOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePermissions} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
