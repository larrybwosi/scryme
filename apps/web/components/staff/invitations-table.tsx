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
import { Button } from "@repo/ui/components/ui/button";
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
import { format } from "date-fns";
import { Copy, Check, Trash2, Loader2, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { revokeOrgInvitation } from "../../app/actions/invitations";

interface Invitation {
  id: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string | Date;
  inviter: {
    name: string | null;
    email: string;
  };
}

export function InvitationsTable({ data }: { data: Invitation[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [invitationToRevoke, setInvitationToRevoke] = useState<Invitation | null>(null);

  const handleCopyLink = async (invitation: Invitation) => {
    const link = `${window.location.origin}/invite/${invitation.token}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(invitation.id);
      toast.success("Invitation link copied!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const handleRevoke = async () => {
    if (!invitationToRevoke) return;

    setRevokingId(invitationToRevoke.id);
    try {
      const res = await revokeOrgInvitation(invitationToRevoke.id);
      if (res.success) {
        toast.success("Invitation revoked successfully");
        setInvitationToRevoke(null);
      } else {
        toast.error(res.error || "Failed to revoke invitation");
      }
    } catch (error) {
      toast.error("An error occurred while revoking the invitation");
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow>
            <TableHead className="w-[300px]">Recipient Email</TableHead>
            <TableHead>Target Role</TableHead>
            <TableHead>Invited By</TableHead>
            <TableHead>Expires On</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center py-10 text-gray-500">
                No pending invitations found.
              </TableCell>
            </TableRow>
          ) : (
            data.map(invitation => (
              <TableRow
                key={invitation.id}
                className="group hover:bg-gray-50/50 transition-colors">
                <TableCell className="font-semibold text-sm text-[#1D1D1F]">
                  {invitation.email}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="font-medium bg-gray-50 capitalize">
                    {invitation.role.toLowerCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {invitation.inviter.name || invitation.inviter.email}
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {format(new Date(invitation.expiresAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-zinc-600 hover:text-zinc-900 h-8"
                          onClick={() => handleCopyLink(invitation)}
                          aria-label="Copy invitation link"
                        >
                          {copiedId === invitation.id ? (
                            <>
                              <Check size={14} className="text-emerald-600" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              <span>Copy Link</span>
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy invitation link</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                          disabled={revokingId === invitation.id}
                          onClick={() => setInvitationToRevoke(invitation)}
                          aria-label="Revoke invitation"
                        >
                          {revokingId === invitation.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Revoke invitation</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <AlertDialog
        open={!!invitationToRevoke}
        onOpenChange={(open) => !open && setInvitationToRevoke(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke the invitation for{" "}
              <strong>{invitationToRevoke?.email}</strong>? This action cannot be
              undone and the recipient will no longer be able to use the link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!revokingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleRevoke();
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!!revokingId}
            >
              {revokingId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Revoking...
                </>
              ) : (
                "Revoke Invitation"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
