"use client";

import { useState } from "react";
import { KeyRound, MessageSquare, ShieldAlert, UserCheck, UserX } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { BanUserDialog } from "./ban-user-dialog";
import { UnbanUserDialog } from "./unban-user-dialog";
import { ManageScrymeAccessDialog } from "./manage-scryme-access-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";
import { UserRow } from "./users-table";

interface UserDetailsActionsProps {
  user: UserRow;
}

export function UserDetailsActions({ user }: UserDetailsActionsProps) {
  const [banTarget, setBanTarget] = useState<UserRow | null>(null);
  const [unbanTarget, setUnbanTarget] = useState<UserRow | null>(null);
  const [scrymeAccessTarget, setScrymeAccessTarget] = useState<UserRow | null>(null);
  const [resetPasswordTarget, setResetPasswordTarget] = useState<UserRow | null>(null);

  const isBanned = user.banned ?? false;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-500/10 border-amber-200"
          onClick={() => setResetPasswordTarget(user)}
        >
          <KeyRound className="size-3.5" aria-hidden="true" />
          Reset Password
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-500/10 border-blue-200"
          onClick={() => setScrymeAccessTarget(user)}
        >
          <MessageSquare className="size-3.5" aria-hidden="true" />
          Scryme Chat Access
        </Button>

        {isBanned ? (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 border-emerald-200"
            onClick={() => setUnbanTarget(user)}
          >
            <UserCheck className="size-3.5" aria-hidden="true" />
            Unban User
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
            onClick={() => setBanTarget(user)}
          >
            <UserX className="size-3.5" aria-hidden="true" />
            Ban User
          </Button>
        )}
      </div>

      <ResetPasswordDialog
        user={resetPasswordTarget}
        open={!!resetPasswordTarget}
        onOpenChange={(open) => !open && setResetPasswordTarget(null)}
      />
      <BanUserDialog
        user={banTarget}
        open={!!banTarget}
        onOpenChange={(open) => !open && setBanTarget(null)}
      />
      <UnbanUserDialog
        user={unbanTarget}
        open={!!unbanTarget}
        onOpenChange={(open) => !open && setUnbanTarget(null)}
      />
      <ManageScrymeAccessDialog
        user={scrymeAccessTarget}
        open={!!scrymeAccessTarget}
        onOpenChange={(open) => !open && setScrymeAccessTarget(null)}
      />
    </>
  );
}
