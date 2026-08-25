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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog"
import { defineTier, type Tier } from "@/app/actions/billing"

function limitsToText(limits?: Record<string, any>) {
  if (!limits) return ""
  return Object.entries(limits)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n")
}

function textToLimits(text: string) {
  const limits: Record<string, any> = {}
  for (const line of text.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || !trimmed.includes("=")) continue
    const [key, ...rest] = trimmed.split("=")
    const value = rest.join("=").trim()
    const numeric = Number(value)
    limits[key.trim()] = Number.isNaN(numeric) ? value : numeric
  }
  return limits
}

export function TierFormDialog({
  open,
  onOpenChange,
  tier,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tier?: Tier
}) {
  const router = useRouter()
  const isEditing = !!tier
  const [isPending, setIsPending] = useState(false)
  const [name, setName] = useState(tier?.name ?? "")
  const [slug, setSlug] = useState(tier?.slug ?? "")
  const [price, setPrice] = useState(tier?.price?.toString() ?? "0")
  const [description, setDescription] = useState(tier?.description ?? "")
  const [featuresText, setFeaturesText] = useState((tier?.features ?? []).join("\n"))
  const [limitsText, setLimitsText] = useState(limitsToText(tier?.limits))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsPending(true)
    try {
      await defineTier({
        slug,
        name,
        price: Number(price) || 0,
        description: description || undefined,
        features: featuresText
          .split("\n")
          .map((f) => f.trim())
          .filter(Boolean),
        limits: textToLimits(limitsText),
      })
      toast.success(`${name} tier saved`)
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save tier")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? `Edit ${tier?.name}` : "Create tier"}</DialogTitle>
            <DialogDescription>
              Define pricing, limits, and features for this plan tier.
            </DialogDescription>
          </DialogHeader>

          <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="tier-name">Name</Label>
                <Input id="tier-name" value={name} required onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="tier-slug">Slug</Label>
                <Input
                  id="tier-slug"
                  value={slug}
                  required
                  disabled={isEditing}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tier-price">Monthly price (USD)</Label>
              <Input
                id="tier-price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tier-description">Description</Label>
              <Textarea
                id="tier-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tier-features">Features (one per line)</Label>
              <Textarea
                id="tier-features"
                value={featuresText}
                onChange={(e) => setFeaturesText(e.target.value)}
                rows={3}
                placeholder={"Unlimited products\nPriority support"}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tier-limits">Limits (key=value, one per line)</Label>
              <Textarea
                id="tier-limits"
                value={limitsText}
                onChange={(e) => setLimitsText(e.target.value)}
                rows={3}
                placeholder={"maxUsers=5\nmaxProducts=100"}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name || !slug} className="gap-2">
              {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              Save tier
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
