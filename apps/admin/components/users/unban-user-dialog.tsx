"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@repo/ui/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/ui/alert-dialog"
import { unbanUser } from "@/app/actions/users"

export function UnbanUserDialog({
  user,
  open,
  onOpenChange,
}: {
  user: { id: string; name: string | null; email: string } | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  async function handleUnban() {
    if (!user) return

    setIsPending(true)
    try {
      await unbanUser(user.id)
      toast.success(`User ${user.name || user.email} has been unbanned`)
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to unban user")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unban {user?.name || user?.email}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will reactivate the user account and restore their organization memberships.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleUnban()
            }}
            disabled={isPending}
            className="gap-2"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Unban user
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
