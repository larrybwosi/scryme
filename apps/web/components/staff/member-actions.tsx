"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@repo/ui/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/ui/sheet";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Badge } from "@repo/ui/components/ui/badge";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import {
  MoreHorizontal,
  Ban,
  ShieldCheck,
  History,
  Shield,
  Trash2,
  XCircle,
  CheckCircle2,
  Monitor,
  User,
  Eye,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import {
  blockMember,
  unblockMember,
  getMemberSessions,
  revokeSession,
  getOrgCustomRoles,
  updateMemberCustomRoles,
} from "../../app/actions/staff";
import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";

interface MemberActionsProps {
  member: {
    id: string;
    membershipStatus: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
    customRoles: { id: string; name: string }[];
  };
}

export function MemberActions({ member }: MemberActionsProps) {
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [isSessionsSheetOpen, setIsSessionsSheetOpen] = useState(false);
  const [isRolesSheetOpen, setIsRolesSheetOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionToken, setActiveSessionToken] = useState<string | null>(
    null,
  );
  const [customRoles, setCustomRoles] = useState<any[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    member.customRoles.map(r => r.id),
  );

  const handleBlock = async () => {
    if (!blockReason) {
      toast.error("Please provide a reason for blocking");
      return;
    }
    setLoading(true);
    const result = await blockMember(member.id, blockReason);
    if (result.success) {
      toast.success("Member blocked successfully");
      setIsBlockDialogOpen(false);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  const handleUnblock = async () => {
    setLoading(true);
    const result = await unblockMember(member.id);
    if (result.success) {
      toast.success("Member unblocked successfully");
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  const fetchSessions = useCallback(async () => {
    const result = await getMemberSessions(member.user.id);
    if (result.success && result.data) {
      setSessions(result.data);
      // Try to get current session token from cookie
      const cookies = document.cookie.split(";");
      const sessionCookie = cookies.find(c =>
        c.trim().startsWith("better-auth.session_token="),
      );
      if (sessionCookie) {
        setActiveSessionToken(sessionCookie.split("=")[1]);
      }
    }
  }, [member.user.id]);

  const fetchRoles = useCallback(async () => {
    const result = await getOrgCustomRoles();
    if (result.success && result.data) {
      setCustomRoles(result.data);
    }
  }, []);

  const handleRevokeSession = async (token: string) => {
    const result = await revokeSession(token);
    if (result.success) {
      toast.success("Session revoked");
      fetchSessions();
    }
  };

  const handleUpdateRoles = async () => {
    setLoading(true);
    const result = await updateMemberCustomRoles(member.id, selectedRoles);
    if (result.success) {
      toast.success("Custom roles updated");
      setIsRolesSheetOpen(false);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isSessionsSheetOpen) fetchSessions();
  }, [isSessionsSheetOpen, fetchSessions]);

  useEffect(() => {
    if (isRolesSheetOpen) fetchRoles();
  }, [isRolesSheetOpen, fetchRoles]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-50">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`/staff/${member.id}`} className="flex items-center">
              <Eye size={14} className="mr-2" />
              View Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsRolesSheetOpen(true)}>
            <Shield size={14} className="mr-2" />
            Manage Custom Roles
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsSessionsSheetOpen(true)}>
            <History size={14} className="mr-2" />
            Manage Sessions
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {member.membershipStatus === "SUSPENDED" ? (
            <DropdownMenuItem
              className="text-green-600 focus:text-green-600"
              onClick={handleUnblock}
              disabled={loading}>
              <ShieldCheck size={14} className="mr-2" />
              Unblock Member
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => setIsBlockDialogOpen(true)}>
              <Ban size={14} className="mr-2" />
              Block Member
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Block Dialog */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to block{" "}
              <strong>{member.user.name || member.user.email}</strong>? They
              will not be able to access the organization until unblocked.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="reason">Reason for blocking</Label>
            <Input
              id="reason"
              placeholder="e.g. Unauthorized action detected"
              value={blockReason}
              onChange={e => setBlockReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBlockDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlock}
              disabled={loading}>
              {loading ? "Blocking..." : "Block Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sessions Sheet */}
      <Sheet open={isSessionsSheetOpen} onOpenChange={setIsSessionsSheetOpen}>
        <SheetContent className="sm:max-w-135">
          <SheetHeader>
            <SheetTitle>User Sessions</SheetTitle>
            <SheetDescription>
              Manage active login sessions for{" "}
              {member.user.name || member.user.email}.
            </SheetDescription>
          </SheetHeader>
          <div className="py-6 space-y-4">
            {sessions.length === 0 ? (
              <p className="text-center text-gray-500 py-10">
                No active sessions found.
              </p>
            ) : (
              sessions.map(session => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-xl bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white border flex items-center justify-center text-gray-500">
                      <Monitor size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold flex items-center gap-2">
                        {session.userAgent || "Unknown Device"}
                        {session.token === activeSessionToken && (
                          <Badge variant="secondary" className="text-[10px]">
                            Current
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        IP: {session.ipAddress || "Unknown"} • Last active:{" "}
                        {format(new Date(session.updatedAt), "MMM d, HH:mm")}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleRevokeSession(session.token)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Roles Sheet */}
      <Sheet open={isRolesSheetOpen} onOpenChange={setIsRolesSheetOpen}>
        <SheetContent className="sm:max-w-[450px]">
          <SheetHeader>
            <SheetTitle>Custom Roles</SheetTitle>
            <SheetDescription>
              Assign custom roles to {member.user.name || member.user.email} to
              grant specific permissions.
            </SheetDescription>
          </SheetHeader>
          <div className="py-6 space-y-4">
            {customRoles.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed rounded-xl">
                <Shield size={24} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  No custom roles defined for this organization.
                </p>
                <Button variant="link" className="text-[#34A853]">
                  Create one now
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {customRoles.map(role => (
                  <div
                    key={role.id}
                    className="flex items-center space-x-3 p-3 border rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedRoles(prev =>
                        prev.includes(role.id)
                          ? prev.filter(id => id !== role.id)
                          : [...prev, role.id],
                      );
                    }}>
                    <Checkbox
                      checked={selectedRoles.includes(role.id)}
                      onCheckedChange={checked => {
                        setSelectedRoles(prev =>
                          checked
                            ? [...prev, role.id]
                            : prev.filter(id => id !== role.id),
                        );
                      }}
                    />
                    <div className="flex-1">
                      <Label className="font-semibold cursor-pointer">
                        {role.name}
                      </Label>
                      {role.description && (
                        <p className="text-xs text-gray-500">
                          {role.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t">
            <Button
              className="w-full"
              onClick={handleUpdateRoles}
              disabled={loading || customRoles.length === 0}>
              {loading ? "Updating..." : "Save Custom Roles"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
