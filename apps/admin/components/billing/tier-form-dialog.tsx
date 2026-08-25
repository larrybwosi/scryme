"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Check } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { Badge } from "@repo/ui/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog"
import { defineTier, type Tier } from "@/app/actions/billing"

const PREDEFINED_FEATURES = [
  "Unlimited products",
  "Priority support",
  "Custom branding",
  "API Access",
  "Multi-location management",
  "Advanced analytics",
  "Automated backups",
  "24/7 Support",
  "Dedicated Account Manager",
]

const PREDEFINED_LIMIT_KEYS = [
  { key: "maxUsers", label: "Max Users", placeholder: "e.g. 5 (-1 for unlimited)" },
  { key: "maxProducts", label: "Max Products", placeholder: "e.g. 500" },
  { key: "maxLocations", label: "Max Locations", placeholder: "e.g. 2" },
  { key: "maxStorageGB", label: "Max Storage (GB)", placeholder: "e.g. 50" },
  { key: "maxOrdersPerMonth", label: "Max Orders / Mo", placeholder: "e.g. 1000" },
]

function limitsToObj(limits?: Record<string, any>): Record<string, string> {
  if (!limits) return {}
  const res: Record<string, string> = {}
  for (const [k, v] of Object.entries(limits)) {
    res[k] = String(v)
  }
  return res
}

function textToLimits(text: string, predefined: Record<string, string>) {
  const limits: Record<string, any> = {}

  // Parse custom text
  for (const line of text.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || !trimmed.includes("=")) continue
    const [key, ...rest] = trimmed.split("=")
    const value = rest.join("=").trim()
    const numeric = Number(value)
    limits[key.trim()] = Number.isNaN(numeric) ? value : numeric
  }

  // Merge predefined inputs
  for (const [key, val] of Object.entries(predefined)) {
    const trimmedVal = val.trim()
    if (trimmedVal !== "") {
      const numeric = Number(trimmedVal)
      limits[key] = Number.isNaN(numeric) ? trimmedVal : numeric
    }
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
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [price, setPrice] = useState("0")
  const [description, setDescription] = useState("")
  const [featuresList, setFeaturesList] = useState<string[]>([])
  const [customFeatureInput, setCustomFeatureInput] = useState("")
  const [predefinedLimits, setPredefinedLimits] = useState<Record<string, string>>({})
  const [customLimitsText, setCustomLimitsText] = useState("")

  useEffect(() => {
    if (open) {
      setName(tier?.name ?? "")
      setSlug(tier?.slug ?? "")
      setPrice(tier?.price?.toString() ?? "0")
      setDescription(tier?.description ?? "")
      setFeaturesList(tier?.features ?? [])

      const limitsObj = limitsToObj(tier?.limits)
      const predefined: Record<string, string> = {}
      const customLines: string[] = []

      const predefinedKeys = PREDEFINED_LIMIT_KEYS.map((item) => item.key)

      for (const [k, v] of Object.entries(limitsObj)) {
        if (predefinedKeys.includes(k)) {
          predefined[k] = v
        } else {
          customLines.push(`${k}=${v}`)
        }
      }

      setPredefinedLimits(predefined)
      setCustomLimitsText(customLines.join("\n"))
    }
  }, [open, tier])

  function toggleFeature(feature: string) {
    if (featuresList.includes(feature)) {
      setFeaturesList(featuresList.filter((f) => f !== feature))
    } else {
      setFeaturesList([...featuresList, feature])
    }
  }

  function addCustomFeature() {
    const trimmed = customFeatureInput.trim()
    if (trimmed && !featuresList.includes(trimmed)) {
      setFeaturesList([...featuresList, trimmed])
      setCustomFeatureInput("")
    }
  }

  function removeFeature(feature: string) {
    setFeaturesList(featuresList.filter((f) => f !== feature))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsPending(true)
    try {
      await defineTier({
        slug,
        name,
        price: Number(price) || 0,
        description: description || undefined,
        features: featuresList,
        limits: textToLimits(customLimitsText, predefinedLimits),
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
      <DialogContent className="sm:max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? `Edit ${tier?.name}` : "Create tier"}</DialogTitle>
            <DialogDescription>
              Define pricing, limits, and features for this plan tier.
            </DialogDescription>
          </DialogHeader>

          <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto py-4 pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="tier-name">Name</Label>
                <Input
                  id="tier-name"
                  value={name}
                  required
                  placeholder="e.g. Pro Plan"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="tier-slug">Slug</Label>
                <Input
                  id="tier-slug"
                  value={slug}
                  required
                  disabled={isEditing}
                  placeholder="e.g. pro"
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
                placeholder="Brief summary of who this tier is for..."
              />
            </div>

            {/* Features Section */}
            <div className="flex flex-col gap-3 rounded-lg border border-border p-3 bg-muted/20">
              <Label className="font-semibold text-foreground">Tier Features</Label>

              {/* Predefined Features Quick Select */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-muted-foreground">Select pre-defined common features:</span>
                <div className="flex flex-wrap gap-1.5">
                  {PREDEFINED_FEATURES.map((feat) => {
                    const selected = featuresList.includes(feat)
                    return (
                      <Badge
                        key={feat}
                        variant={selected ? "default" : "outline"}
                        className="cursor-pointer select-none transition-colors hover:bg-primary/90 hover:text-primary-foreground"
                        onClick={() => toggleFeature(feat)}
                      >
                        {selected ? <Check className="mr-1 size-3" /> : <Plus className="mr-1 size-3" />}
                        {feat}
                      </Badge>
                    )
                  })}
                </div>
              </div>

              {/* Active Selected Features */}
              {featuresList.length > 0 && (
                <div className="flex flex-col gap-1.5 pt-1">
                  <span className="text-xs text-muted-foreground">Active features ({featuresList.length}):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {featuresList.map((feat) => (
                      <Badge
                        key={feat}
                        variant="secondary"
                        className="gap-1.5 font-normal text-xs"
                      >
                        {feat}
                        <button
                          type="button"
                          className="hover:text-destructive text-muted-foreground ml-1"
                          onClick={() => removeFeature(feat)}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Custom Feature Input */}
              <div className="flex items-center gap-2 pt-1">
                <Input
                  value={customFeatureInput}
                  placeholder="Add custom feature item..."
                  className="h-8 text-sm"
                  onChange={(e) => setCustomFeatureInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addCustomFeature()
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={addCustomFeature}>
                  Add
                </Button>
              </div>
            </div>

            {/* Limits Section */}
            <div className="flex flex-col gap-3 rounded-lg border border-border p-3 bg-muted/20">
              <Label className="font-semibold text-foreground">Tier Limits & Quotas</Label>

              <span className="text-xs text-muted-foreground">Pre-defined common system limits:</span>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {PREDEFINED_LIMIT_KEYS.map((item) => (
                  <div key={item.key} className="flex flex-col gap-1">
                    <Label htmlFor={`limit-${item.key}`} className="text-xs font-medium text-muted-foreground">
                      {item.label} <code className="text-[10px] text-muted-foreground font-mono">({item.key})</code>
                    </Label>
                    <Input
                      id={`limit-${item.key}`}
                      value={predefinedLimits[item.key] ?? ""}
                      placeholder={item.placeholder}
                      className="h-8 text-sm"
                      onChange={(e) =>
                        setPredefinedLimits({
                          ...predefinedLimits,
                          [item.key]: e.target.value,
                        })
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-1.5 pt-2">
                <Label htmlFor="tier-custom-limits" className="text-xs font-medium text-muted-foreground">
                  Additional Custom Limits (key=value, one per line)
                </Label>
                <Textarea
                  id="tier-custom-limits"
                  value={customLimitsText}
                  onChange={(e) => setCustomLimitsText(e.target.value)}
                  rows={2}
                  className="font-mono text-xs"
                  placeholder={"maxApiRequestsPerDay=50000\nmaxCustomDomains=2"}
                />
              </div>
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
