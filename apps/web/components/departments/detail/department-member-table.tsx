"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/ui/avatar";
import { Button } from "@repo/ui/components/ui/button";
import {
  MoreHorizontal,
  UserPlus,
  Trash2,
  ShieldCheck,
  CreditCard,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@repo/ui/components/ui/dropdown-menu";
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
import {
  removeDepartmentMember,
  updateDepartmentMember,
} from "../../../app/actions/department";
import { toast } from "sonner";
import { AddMemberToDeptDialog } from "./add-member-to-dept-dialog";

interface DepartmentMemberTableProps {
  departmentId: string;
  members: any[];
}

export function DepartmentMemberTable({
  departmentId,
  members,
}: DepartmentMemberTableProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<any>(null);

  const handleRemoveMember = (membership: any) => {
    setMemberToDelete(membership);
  };

  const confirmDeleteMember = async () => {
    if (!memberToDelete) return;

    setLoading(memberToDelete.id);
    const result = await removeDepartmentMember(memberToDelete.id);
    setLoading(null);

    if (result.success) {
      toast.success("Member removed from department");
      setMemberToDelete(null);
    } else {
      toast.error(result.error || "Failed to remove member");
    }
  };

  const handleTogglePermission = async (
    membershipId: string,
    field: "canApproveExpenses" | "canManageBudget",
    current: boolean,
  ) => {
    setLoading(`${membershipId}-${field}`);
    const result = await updateDepartmentMember(membershipId, {
      [field]: !current,
    });
    setLoading(null);

    if (result.success) {
      toast.success("Permission updated");
    } else {
      toast.error(result.error || "Failed to update permission");
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "HEAD":
        return (
          <Badge className="bg-blue-600 text-white border-none">Head</Badge>
        );
      case "MANAGER":
        return (
          <Badge className="bg-purple-600 text-white border-none">
            Manager
          </Badge>
        );
      case "MEMBER":
        return <Badge variant="secondary">Member</Badge>;
      case "VIEWER":
        return <Badge variant="outline">Viewer</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between bg-gray-50/30">
        <div>
          <h3 className="font-bold text-[#1D1D1F]">Department Members</h3>
          <p className="text-xs text-gray-500">
            Manage who has access to this department and their roles.
          </p>
        </div>
        <AddMemberToDeptDialog departmentId={departmentId}>
          <Button size="sm" className="gap-2 bg-[#1D1D1F] text-white">
            <UserPlus size={14} />
            <span>Add Member</span>
          </Button>
        </AddMemberToDeptDialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Expense Approval</TableHead>
            <TableHead>Budget Mgmt</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                No members in this department.
              </TableCell>
            </TableRow>
          ) : (
            members.map(membership => (
              <TableRow key={membership.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 border">
                      <AvatarImage src={membership.member.user.image} />
                      <AvatarFallback>
                        {membership.member.user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {membership.member.user.name}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {membership.member.user.email}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getRoleBadge(membership.role)}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-2 h-7 ${membership.canApproveExpenses ? "text-green-600 bg-green-50" : "text-gray-400"}`}
                    onClick={() =>
                      handleTogglePermission(
                        membership.id,
                        "canApproveExpenses",
                        membership.canApproveExpenses,
                      )
                    }
                    disabled={
                      loading === `${membership.id}-canApproveExpenses`
                    }>
                    <ShieldCheck size={14} />
                    <span className="text-[11px]">
                      {membership.canApproveExpenses ? "Enabled" : "Disabled"}
                    </span>
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-2 h-7 ${membership.canManageBudget ? "text-blue-600 bg-blue-50" : "text-gray-400"}`}
                    onClick={() =>
                      handleTogglePermission(
                        membership.id,
                        "canManageBudget",
                        membership.canManageBudget,
                      )
                    }
                    disabled={loading === `${membership.id}-canManageBudget`}>
                    <CreditCard size={14} />
                    <span className="text-[11px]">
                      {membership.canManageBudget ? "Enabled" : "Disabled"}
                    </span>
                  </Button>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label="More actions">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent>More actions</TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="flex items-center gap-2">
                        <ShieldCheck size={14} />
                        <span>Change Role</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="flex items-center gap-2 text-red-600"
                        onClick={() => handleRemoveMember(membership)}
                        disabled={loading === membership.id}>
                        <Trash2 size={14} />
                        <span>Remove Member</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <AlertDialog
        open={!!memberToDelete}
        onOpenChange={open => !open && setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove{" "}
              <strong>{memberToDelete?.member?.user?.name}</strong> from the
              department. They will lose all department-specific permissions.
              This action can be undone by adding them back.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading === memberToDelete?.id}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={e => {
                e.preventDefault();
                confirmDeleteMember();
              }}
              disabled={loading === memberToDelete?.id}>
              {loading === memberToDelete?.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Member"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
