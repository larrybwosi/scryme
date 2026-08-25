"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@repo/ui/components/ui/button"
import { Label } from "@repo/ui/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Input } from "@repo/ui/components/ui/input"
import { updateOrganizationSubscription, type Tier } from "@/app/actions/billing"

interface SubscriptionEditorProps {
  organizationId: string
  subscription: {
    tierSlug: string
    dodoCustomerId: string | null
    dodoSubscriptionId: string | null
    dodoCurrentPeriodEnd: Date | null
  }
  tiers: Tier[]
}

export function SubscriptionEditor({ organizationId, subscription, tiers }: SubscriptionEditorProps) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [tierSlug, setTierSlug] = useState(subscription.tierSlug)
  const [periodEnd, setPeriodEnd] = useState(
    subscription.dodoCurrentPeriodEnd
      ? new Date(subscription.dodoCurrentPeriodEnd).toISOString().slice(0, 10)
      : "",
  )

  const availableTiers = tiers.some((t) => t.slug === "free")
    ? tiers
    : [{ slug: "free", name: "Free", price: 0 }, ...tiers]

  async function handleSave() {
    setIsPending(true)
    try {
      await updateOrganizationSubscription(organizationId, {
        tierSlug,
        dodoCustomerId: subscription.dodoCustomerId || undefined,
        dodoSubscriptionId: subscription.dodoSubscriptionId || undefined,
        dodoCurrentPeriodEnd: periodEnd ? new Date(periodEnd).toISOString() : undefined,
      })
      toast.success("Subscription updated")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update subscription")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">Subscription</CardTitle>
        <CardDescription>Manually assign a plan tier and renewal date for this organization.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tier-select">Plan tier</Label>
          <Select value={tierSlug} onValueChange={setTierSlug}>
            <SelectTrigger id="tier-select">
              <SelectValue placeholder="Select tier" />
            </SelectTrigger>
            <SelectContent>
              {availableTiers.map((tier) => (
                <SelectItem key={tier.slug} value={tier.slug}>
                  {tier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="period-end">Current period ends</Label>
          <Input
            id="period-end"
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
          />
        </div>
        {subscription.dodoSubscriptionId ? (
          <p className="text-xs text-muted-foreground">
            Provider subscription ID: {subscription.dodoSubscriptionId}
          </p>
        ) : null}
        <div className="flex justify-end pt-1">
          <Button size="sm" onClick={handleSave} disabled={isPending} className="gap-2">
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="size-3.5" aria-hidden="true" />
            )}
            Save subscription
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
