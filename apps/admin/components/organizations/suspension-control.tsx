"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Ban, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@repo/ui/components/ui/button"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { Label } from "@repo/ui/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/components/ui/alert-dialog"
import { suspendOrganization, reactivateOrganization } from "@/app/actions/organizations"

export function SuspensionControl({
  organizationId,
  isSuspended,
  suspensionReason,
}: {
  organizationId: string
  isSuspended: boolean
  suspensionReason: string | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [reason, setReason] = useState("")

  async function handleSuspend() {
    setIsPending(true)
    try {
      await suspendOrganization(organizationId, reason || undefined)
      toast.success("Organization suspended")
      setOpen(false)
      setReason("")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to suspend organization")
    } finally {
      setIsPending(false)
    }
  }

  async function handleReactivate() {
    setIsPending(true)
    try {
      await reactivateOrganization(organizationId)
      toast.success("Organization reactivated")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reactivate organization")
    } finally {
      setIsPending(false)
    }
  }

  if (isSuspended) {
    return (
      <div className="flex flex-col items-end gap-2">
        <Button onClick={handleReactivate} disabled={isPending} variant="outline" className="gap-2">
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="size-4" aria-hidden="true" />
          )}
          Reactivate
        </Button>
        {suspensionReason ? (
          <p className="max-w-64 text-right text-xs text-muted-foreground">{suspensionReason}</p>
        ) : null}
      </div>
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="gap-2">
          <Ban className="size-4" aria-hidden="true" />
          Suspend
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Suspend this organization?</AlertDialogTitle>
          <AlertDialogDescription>
            Members will immediately lose access to the CRM and storefront until the organization is
            reactivated.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2 py-2">
          <Label htmlFor="suspend-reason">Reason (optional)</Label>
          <Textarea
            id="suspend-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Overdue invoice, policy violation"
            rows={3}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleSuspend()
            }}
            disabled={isPending}
            className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Suspend organization
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
