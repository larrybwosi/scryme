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

import {
  initiateAdminMpesaPayment,
  checkAdminMpesaPaymentStatus,
  recordCustomPayment,
  type Tier,
} from "@/app/actions/billing"

export function RecordPaymentDialog({
  open,
  onOpenChange,
  organizations,
  tiers = [],
  defaultOrgId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizations: Organization[]
  tiers?: Tier[]
  defaultOrgId?: string
}) {
  const router = useRouter()
  const [paymentMode, setPaymentMode] = useState<"stk_push" | "manual">("stk_push")
  const [isPending, setIsPending] = useState(false)
  const [organizationId, setOrganizationId] = useState(defaultOrgId || "")
  const [amount, setAmount] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [reference, setReference] = useState("")
  const [tierSlug, setTierSlug] = useState<string>("none")
  const [durationMonths, setDurationMonths] = useState<string>("12")
  const [notes, setNotes] = useState("")

  // Polling state for STK Push
  const [pollingCheckoutId, setPollingCheckoutId] = useState<string | null>(null)
  const [pollStatusMessage, setPollStatusMessage] = useState<string | null>(null)

  function handleTierChange(selectedSlug: string) {
    setTierSlug(selectedSlug)
    if (selectedSlug !== "none") {
      const selected = tiers.find((t) => t.slug === selectedSlug)
      if (selected && selected.price !== undefined) {
        setAmount(String(selected.price))
      }
    }
  }

  async function handleStkPushSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!organizationId) {
      toast.error("Please select an organization")
      return
    }
    if (!phoneNumber) {
      toast.error("Please enter a phone number for M-Pesa STK push")
      return
    }

    setIsPending(true)
    setPollStatusMessage("Sending STK push prompt...")

    try {
      const result = await initiateAdminMpesaPayment({
        organizationId,
        phoneNumber,
        amount: Number(amount) || 0,
        tierSlug: tierSlug === "none" ? undefined : tierSlug,
        durationMonths: Number(durationMonths) || 12,
      })

      if (result.success && result.checkoutRequestId) {
        toast.info(result.message || "STK Push sent! Awaiting customer PIN entry...")
        setPollingCheckoutId(result.checkoutRequestId)
        startPolling(result.checkoutRequestId)
      } else {
        toast.error("Failed to initiate STK Push")
        setIsPending(false)
        setPollStatusMessage(null)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to initiate M-Pesa STK Push")
      setIsPending(false)
      setPollStatusMessage(null)
    }
  }

  async function startPolling(checkoutId: string) {
    let attempts = 0
    const maxAttempts = 15

    const interval = setInterval(async () => {
      attempts++
      setPollStatusMessage(`Verifying M-Pesa payment status (attempt ${attempts}/${maxAttempts})...`)

      try {
        const res = await checkAdminMpesaPaymentStatus(checkoutId)
        if (res.status === "SUCCESS") {
          clearInterval(interval)
          toast.success("M-Pesa payment verified! Organization subscription updated.")
          resetAndClose()
        } else if (res.status === "FAILED") {
          clearInterval(interval)
          toast.error("M-Pesa payment failed or was cancelled by user.")
          setIsPending(false)
          setPollingCheckoutId(null)
          setPollStatusMessage(null)
        }
      } catch (err) {
        console.error("Polling error", err)
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval)
        toast.warning("Verification timed out. You can check status later in Billing payments.")
        setIsPending(false)
        setPollingCheckoutId(null)
        setPollStatusMessage(null)
      }
    }, 4000)
  }

  async function handleManualSubmit(e: React.FormEvent) {
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
        durationMonths: Number(durationMonths) || 12,
        notes: notes || undefined,
      })
      toast.success("Payment verified and recorded successfully!")
      resetAndClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to record payment")
      setIsPending(false)
    }
  }

  function resetAndClose() {
    setIsPending(false)
    setPollingCheckoutId(null)
    setPollStatusMessage(null)
    setOrganizationId(defaultOrgId || "")
    setAmount("")
    setPhoneNumber("")
    setReference("")
    setTierSlug("none")
    setDurationMonths("12")
    setNotes("")
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>M-Pesa Organization Payment</DialogTitle>
          <DialogDescription>
            Process M-Pesa payments for organization subscriptions or record manual transaction receipts.
          </DialogDescription>
        </DialogHeader>

        {/* Payment mode selector tab */}
        <div className="flex border-b border-border">
          <button
            type="button"
            className={`flex-1 pb-2 text-center text-sm font-medium border-b-2 transition-colors ${
              paymentMode === "stk_push"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setPaymentMode("stk_push")}
            disabled={isPending}
          >
            M-Pesa STK Push
          </button>
          <button
            type="button"
            className={`flex-1 pb-2 text-center text-sm font-medium border-b-2 transition-colors ${
              paymentMode === "manual"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setPaymentMode("manual")}
            disabled={isPending}
          >
            Manual Receipt Code
          </button>
        </div>

        <form onSubmit={paymentMode === "stk_push" ? handleStkPushSubmit : handleManualSubmit}>
          <div className="flex flex-col gap-4 py-3">
            {!defaultOrgId && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="pay-org">Organization</Label>
                <Select value={organizationId} onValueChange={setOrganizationId} disabled={isPending}>
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
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="pay-tier">Select Plan Tier</Label>
                <Select value={tierSlug} onValueChange={handleTierChange} disabled={isPending}>
                  <SelectTrigger id="pay-tier">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Custom / No Tier Upgrade</SelectItem>
                    {tiers.map((t) => (
                      <SelectItem key={t.slug} value={t.slug}>
                        {t.name} (${t.price})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="pay-duration">Duration (Months)</Label>
                <Select value={durationMonths} onValueChange={setDurationMonths} disabled={isPending}>
                  <SelectTrigger id="pay-duration">
                    <SelectValue placeholder="12 Months" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Month</SelectItem>
                    <SelectItem value="3">3 Months</SelectItem>
                    <SelectItem value="6">6 Months</SelectItem>
                    <SelectItem value="12">12 Months (1 Year)</SelectItem>
                    <SelectItem value="24">24 Months (2 Years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                  disabled={isPending}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="pay-phone">M-Pesa Phone Number</Label>
                <Input
                  id="pay-phone"
                  required={paymentMode === "stk_push"}
                  placeholder="254700000000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isPending}
                />
              </div>
            </div>

            {paymentMode === "manual" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="pay-ref">M-Pesa Receipt Code / Reference</Label>
                <Input
                  id="pay-ref"
                  required
                  placeholder="e.g. QKH871239X"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  disabled={isPending}
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="pay-notes">Notes / Description</Label>
              <Textarea
                id="pay-notes"
                placeholder="Optional payment description..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                disabled={isPending}
              />
            </div>

            {pollStatusMessage && (
              <div className="flex items-center gap-2 rounded-md bg-muted p-3 text-xs text-foreground">
                <Loader2 className="size-4 animate-spin text-primary shrink-0" aria-hidden="true" />
                <span>{pollStatusMessage}</span>
              </div>
            )}
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isPending ||
                !organizationId ||
                !amount ||
                (paymentMode === "stk_push" && !phoneNumber) ||
                (paymentMode === "manual" && !reference)
              }
              className="gap-2"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              {paymentMode === "stk_push" ? "Send M-Pesa STK Push" : "Verify & Record Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
