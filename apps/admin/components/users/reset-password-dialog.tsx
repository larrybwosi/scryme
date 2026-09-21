"use client"

import { useState, useTransition } from "react"
import { KeyRound, Mail, Copy, Check, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs"
import { resetUserPassword } from "@/app/actions/users"
import type { UserRow } from "./users-table"

interface ResetPasswordDialogProps {
  user: UserRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function generateRandomPassword(length = 14) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
  let pass = ""
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return pass
}

export function ResetPasswordDialog({ user, open, onOpenChange }: ResetPasswordDialogProps) {
  const [mode, setMode] = useState<"email" | "manual">("email")
  const [newPassword, setNewPassword] = useState("")
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (!user) return null

  const handleGeneratePassword = () => {
    setNewPassword(generateRandomPassword())
  }

  const handleCopyPassword = () => {
    if (!newPassword) return
    navigator.clipboard.writeText(newPassword)
    setCopied(true)
    toast.success("Password copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSendResetEmail = () => {
    startTransition(async () => {
      try {
        const res = await resetUserPassword(user.id, { sendEmail: true })
        toast.success(res.message)
        onOpenChange(false)
      } catch (err: any) {
        toast.error(err.message || "Failed to send reset password email")
      }
    })
  }

  const handleSetManualPassword = () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long")
      return
    }

    startTransition(async () => {
      try {
        const res = await resetUserPassword(user.id, { newPassword })
        toast.success(res.message)
        setNewPassword("")
        onOpenChange(false)
      } catch (err: any) {
        toast.error(err.message || "Failed to reset password")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <KeyRound className="size-5 text-primary" />
            Reset User Password
          </DialogTitle>
          <DialogDescription>
            Reset the password for <strong className="text-foreground">{user.name || user.email}</strong> ({user.email}).
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email" value={mode} onValueChange={(val) => setMode(val as "email" | "manual")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email" className="gap-1.5 text-xs">
              <Mail className="size-3.5" />
              Send Reset Link
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-1.5 text-xs">
              <KeyRound className="size-3.5" />
              Set New Password
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4 pt-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              An email containing password reset instructions will be dispatched to <strong>{user.email}</strong>.
            </p>
            <DialogFooter className="pt-2">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={isPending} onClick={handleSendResetEmail} className="gap-2">
                <Mail className="size-4" />
                {isPending ? "Sending Email..." : "Send Reset Link"}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4 pt-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">New Password</label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                  onClick={handleGeneratePassword}
                >
                  <RefreshCw className="size-3" />
                  Generate
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Enter new password (min. 8 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="font-mono text-xs"
                />
                {newPassword && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 size-9"
                    onClick={handleCopyPassword}
                    title="Copy Password"
                  >
                    {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                  </Button>
                )}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={isPending || !newPassword} onClick={handleSetManualPassword} className="gap-2">
                <KeyRound className="size-4" />
                {isPending ? "Saving..." : "Set Password"}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
