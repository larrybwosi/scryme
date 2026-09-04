"use client"

import { useState } from "react"
import { Loader2, MessageSquare, Shield, Check, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@repo/ui/components/ui/dialog"
import { syncUserScrymeChatAccess } from "@/app/actions/users"
import type { UserRow } from "./users-table"

interface ManageScrymeAccessDialogProps {
  user: UserRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ManageScrymeAccessDialog({
  user,
  open,
  onOpenChange,
}: ManageScrymeAccessDialogProps) {
  const [workspaceSlug, setWorkspaceSlug] = useState("system-admins")
  const [role, setRole] = useState<"admin" | "member">("member")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!user) return null

  async function handleAction(action: "grant" | "revoke") {
    if (!user) return
    setIsSubmitting(true)
    try {
      const res = await syncUserScrymeChatAccess({
        userId: user.id,
        workspaceSlug,
        action,
        role,
      })
      toast.success(res.message)
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update Scryme Chat access")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 mb-2">
            <MessageSquare className="size-5" />
          </div>
          <DialogTitle>Manage Scryme Chat Workspace Access</DialogTitle>
          <DialogDescription>
            Grant or revoke workspace membership and permission access for <strong className="text-foreground">{user.name || user.email}</strong> across Scryme Chat workspaces.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="target-workspace">Target Workspace Slug</Label>
            <Input
              id="target-workspace"
              value={workspaceSlug}
              onChange={(e) => setWorkspaceSlug(e.target.value.toLowerCase().trim())}
              placeholder="e.g. system-admins or org-acme"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="workspace-role">Workspace Role</Label>
            <select
              id="workspace-role"
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "member")}
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="member">Member (Read & Send Messages)</option>
              <option value="admin">Workspace Admin (Manage Channels & Permissions)</option>
            </select>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="destructive"
              disabled={isSubmitting}
              onClick={() => handleAction("revoke")}
              className="gap-1.5 text-xs"
            >
              {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
              Revoke Access
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleAction("grant")}
              className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
              Grant Access
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
