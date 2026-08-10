"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@repo/ui/components/ui/dialog";
import {
  Plus,
  Shield,
  Trash2,
  Edit2,
  Lock,
  Loader2,
  Check,
  ChevronRight,
} from "lucide-react";
import {
  getOrgCustomRoles,
  createCustomRoleAction,
  updateCustomRoleAction,
  deleteCustomRoleAction,
} from "../../app/actions/staff";
import { toast } from "sonner";

const PERMISSION_GROUPS = [
  {
    name: "Catalog & Services",
    permissions: [
      { value: "catalog:product:read", label: "Read Products" },
      { value: "catalog:product:create", label: "Create Products" },
      { value: "catalog:product:update", label: "Update Products" },
      { value: "catalog:product:delete", label: "Delete Products" },
      { value: "services:read", label: "Read Services" },
      { value: "services:write", label: "Create/Update Services" },
      { value: "services:delete", label: "Delete Services" },
    ],
  },
  {
    name: "Inventory",
    permissions: [
      { value: "inventory:read", label: "Read Inventory Levels" },
      { value: "inventory:write", label: "Modify/Adjust Inventory" },
      { value: "inventory:manage", label: "Complete Assemblies & Advanced Adjustments" },
    ],
  },
  {
    name: "Customers & CRM",
    permissions: [
      { value: "customer:read", label: "Read Customers Profile" },
      { value: "customer:update", label: "Update Customers Profile" },
      { value: "customer:delete", label: "Delete/Deactivate Customers" },
    ],
  },
  {
    name: "POS & Sales",
    permissions: [
      { value: "pos:sale", label: "Process Sales & Orders" },
    ],
  },
  {
    name: "Finance & Accounting",
    permissions: [
      { value: "finance:read", label: "Read Expenses & Utilities" },
      { value: "finance:write", label: "Record Expenses" },
      { value: "expense:view", label: "View Petty Cash & Funds" },
      { value: "expense:manage", label: "Manage Petty Cash & Utilities" },
      { value: "accounting:manage", label: "Initialize Accounting" },
      { value: "accounting:report", label: "View P&L and Financial Reports" },
      { value: "invoice:view", label: "View Invoices & Templates" },
      { value: "invoice:manage", label: "Manage/Create Invoices" },
    ],
  },
  {
    name: "Stocking & Logistics",
    permissions: [
      { value: "stock:read", label: "Read Purchases & Transfers" },
      { value: "stock:write", label: "Manage Stock Transfers & Purchases" },
      { value: "partners:read", label: "Read Partners & Wallets" },
      { value: "partners:write", label: "Create/Adjust Partners & Wallets" },
    ],
  },
  {
    name: "Integrations & Webhooks",
    permissions: [
      { value: "integrations:strapi:create", label: "Create Strapi Connection" },
      { value: "integrations:strapi:read", label: "Read Strapi Settings & Logs" },
      { value: "integrations:strapi:update", label: "Update Strapi Connection" },
      { value: "integrations:strapi:delete", label: "Delete Strapi Connection" },
      { value: "integrations:strapi:sync", label: "Trigger Strapi Sync" },
      { value: "webhooks:read", label: "Read Webhooks" },
      { value: "webhooks:write", label: "Create/Delete Webhooks" },
    ],
  },
];

export function RolesManager() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogClassOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  });

  const fetchRoles = async () => {
    setLoading(true);
    const result = await getOrgCustomRoles();
    if (result.success && result.data) {
      setRoles(result.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleOpenCreate = () => {
    setEditingRole(null);
    setForm({
      name: "",
      description: "",
      permissions: [],
    });
    setDialogClassOpen(true);
  };

  const handleOpenEdit = (role: any) => {
    setEditingRole(role);
    setForm({
      name: role.name,
      description: role.description || "",
      permissions: role.permissions || [],
    });
    setDialogClassOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this custom role?")) return;
    const result = await deleteCustomRoleAction(id);
    if (result.success) {
      toast.success("Custom role deleted successfully");
      fetchRoles();
    } else {
      toast.error(result.error || "Failed to delete role");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Please enter a role name");
      return;
    }

    setLoading(true);
    let result;
    if (editingRole) {
      result = await updateCustomRoleAction(editingRole.id, form);
    } else {
      result = await createCustomRoleAction(form);
    }

    if (result.success) {
      toast.success(
        editingRole
          ? "Custom role updated successfully"
          : "Custom role created successfully"
      );
      setDialogClassOpen(false);
      fetchRoles();
    } else {
      toast.error(result.error || "Operation failed");
    }
    setLoading(false);
  };

  const togglePermission = (val: string) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(val)
        ? prev.permissions.filter(p => p !== val)
        : [...prev.permissions, val],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Custom Roles & Scopes</h2>
          <p className="text-sm text-muted-foreground">
            Define highly customized roles and assign fine-grained permissions/scopes for staff and API clients.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus size={16} />
          <span>Create Custom Role</span>
        </Button>
      </div>

      {loading && roles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary mb-4" size={32} />
          <p className="text-sm text-muted-foreground">Loading custom roles...</p>
        </div>
      ) : roles.length === 0 ? (
        <Card className="border-2 border-dashed bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
              <Shield size={24} />
            </div>
            <h3 className="text-lg font-bold text-foreground">No Custom Roles Found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-6">
              You haven&apos;t created any custom roles for this organization yet. Create one to assign customized permissions to members.
            </p>
            <Button onClick={handleOpenCreate} className="gap-2">
              <Plus size={16} />
              <span>Create Your First Role</span>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map(role => (
            <Card key={role.id} className="bg-card shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Shield size={18} className="text-primary" />
                    <CardTitle className="text-base font-bold">{role.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => handleOpenEdit(role)}
                      aria-label="Edit role">
                      <Edit2 size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(role.id)}
                      aria-label="Delete role">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
                {role.description && (
                  <CardDescription className="text-xs line-clamp-2 mt-1">
                    {role.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0 pb-4">
                <div className="border-t border-muted/50 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Permissions:</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {role.permissions?.length || 0} scopes
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-16 overflow-y-hidden">
                    {role.permissions && role.permissions.length > 0 ? (
                      role.permissions.slice(0, 4).map((perm: string) => (
                        <Badge key={perm} variant="outline" className="text-[10px] truncate max-w-[120px]">
                          {perm}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No scopes assigned</span>
                    )}
                    {role.permissions && role.permissions.length > 4 && (
                      <Badge variant="outline" className="text-[10px] bg-muted">
                        +{role.permissions.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogClassOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="text-primary" size={20} />
              {editingRole ? "Edit Custom Role" : "Create Custom Role"}
            </DialogTitle>
            <DialogDescription>
              Provide a descriptive name and configure the fine-grained access scopes for this role.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roleName">Role Name</Label>
                <Input
                  id="roleName"
                  placeholder="e.g. Content Manager"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roleDesc">Description</Label>
                <Input
                  id="roleDesc"
                  placeholder="Summarize the purpose of this role"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <Label className="text-sm font-bold flex items-center gap-1.5">
                  <Lock size={14} className="text-muted-foreground" />
                  Configure Scopes / Permissions
                </Label>
                <span className="text-xs text-muted-foreground font-semibold">
                  {form.permissions.length} selected
                </span>
              </div>

              <div className="space-y-6">
                {PERMISSION_GROUPS.map(group => (
                  <div key={group.name} className="space-y-2">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <ChevronRight size={12} />
                      {group.name}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-3">
                      {group.permissions.map(perm => (
                        <div
                          key={perm.value}
                          className="flex items-start space-x-2.5 p-2 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors"
                          onClick={() => togglePermission(perm.value)}>
                          <Checkbox
                            checked={form.permissions.includes(perm.value)}
                            onCheckedChange={() => togglePermission(perm.value)}
                          />
                          <div className="flex-1 -mt-0.5">
                            <Label className="text-xs font-semibold cursor-pointer block">
                              {perm.label}
                            </Label>
                            <span className="text-[10px] text-muted-foreground font-mono block">
                              {perm.value}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogClassOpen(false)}
                disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading && <Loader2 size={14} className="animate-spin" />}
                {editingRole ? "Save Changes" : "Create Role"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}