"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Textarea } from "@repo/ui/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog"
import { recordCustomPayment, type Tier } from "@/app/actions/billing"

interface Organization {
  id: string
  name: string
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  organizations,
  tiers = [],
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizations: Organization[]
  tiers?: Tier[]
}) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [organizationId, setOrganizationId] = useState("")
  const [amount, setAmount] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [reference, setReference] = useState("")
  const [tierSlug, setTierSlug] = useState<string>("none")
  const [notes, setNotes] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!organizationId) {
      toast.error("Please select an organization")
      return
    }

    setIsPending(true)
    try {
      await recordCustomPayment({
        organizationId,
        amount: Number(amount) || 0,
        phoneNumber: phoneNumber || "254000000000",
        reference: reference || `REF-${Date.now()}`,
        tierSlug: tierSlug === "none" ? undefined : tierSlug,
        notes: notes || undefined,
      })
      toast.success("Payment recorded successfully")
      onOpenChange(false)
      // Reset form
      setOrganizationId("")
      setAmount("")
      setPhoneNumber("")
      setReference("")
      setTierSlug("none")
      setNotes("")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to record payment")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Record custom payment</DialogTitle>
            <DialogDescription>
              Record a payment received for an organization and optionally upgrade their plan tier.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="pay-org">Organization</Label>
              <Select value={organizationId} onValueChange={setOrganizationId}>
                <SelectTrigger id="pay-org">
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="pay-amount">Amount</Label>
                <Input
                  id="pay-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="100.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="pay-phone">Phone number</Label>
                <Input
                  id="pay-phone"
                  placeholder="254700000000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="pay-ref">Reference / Receipt</Label>
                <Input
                  id="pay-ref"
                  required
                  placeholder="PAY-123456"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="pay-tier">Assign tier (optional)</Label>
                <Select value={tierSlug} onValueChange={setTierSlug}>
                  <SelectTrigger id="pay-tier">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (keep current)</SelectItem>
                    {tiers.map((t) => (
                      <SelectItem key={t.slug} value={t.slug}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="pay-notes">Notes / Description</Label>
              <Textarea
                id="pay-notes"
                placeholder="Optional payment notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !organizationId || !amount || !reference} className="gap-2">
              {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              Record payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
