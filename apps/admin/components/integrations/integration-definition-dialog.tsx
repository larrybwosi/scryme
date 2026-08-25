"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { Switch } from "@repo/ui/components/ui/switch"
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
import {
  createIntegrationDefinition,
  updateIntegrationDefinition,
} from "@/app/actions/integrations"

export type IntegrationCategory =
  | "E_COMMERCE"
  | "ACCOUNTING"
  | "MARKETING"
  | "PAYMENT_GATEWAY"
  | "CRM"
  | "COMMUNICATION"
  | "OTHER"

export type AuthType = "API_KEY" | "OAUTH2" | "OTHER"

export interface IntegrationDefinitionRow {
  id: string
  name: string
  slug: string
  description: string | null
  logoUrl: string | null
  category: IntegrationCategory
  authType: AuthType
  isActive: boolean
}

const CATEGORIES: IntegrationCategory[] = [
  "E_COMMERCE",
  "ACCOUNTING",
  "MARKETING",
  "PAYMENT_GATEWAY",
  "CRM",
  "COMMUNICATION",
  "OTHER",
]

const AUTH_TYPES: AuthType[] = [
  "API_KEY",
  "OAUTH2",
  "OTHER",
]

export function IntegrationDefinitionDialog({
  integration,
  open,
  onOpenChange,
}: {
  integration?: IntegrationDefinitionRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const isEditing = !!integration
  const [isPending, setIsPending] = useState(false)
  const [name, setName] = useState(integration?.name ?? "")
  const [slug, setSlug] = useState(integration?.slug ?? "")
  const [description, setDescription] = useState(integration?.description ?? "")
  const [logoUrl, setLogoUrl] = useState(integration?.logoUrl ?? "")
  const [category, setCategory] = useState<IntegrationCategory>(
    integration?.category ?? "OTHER"
  )
  const [authType, setAuthType] = useState<AuthType>(
    integration?.authType ?? "API_KEY"
  )
  const [isActive, setIsActive] = useState(integration?.isActive ?? true)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsPending(true)
    try {
      if (isEditing && integration) {
        await updateIntegrationDefinition(integration.id, {
          name,
          slug,
          description: description || undefined,
          logoUrl: logoUrl || undefined,
          category: category as any,
          authType: authType as any,
          isActive,
        })
        toast.success(`Integration "${name}" updated`)
      } else {
        await createIntegrationDefinition({
          name,
          slug,
          description: description || undefined,
          logoUrl: logoUrl || undefined,
          category: category as any,
          authType: authType as any,
          isActive,
        })
        toast.success(`Integration "${name}" created`)
      }
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save integration")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? `Edit ${integration?.name}` : "Add Integration Definition"}
            </DialogTitle>
            <DialogDescription>
              Define an integration available for organizations to connect.
            </DialogDescription>
          </DialogHeader>

          <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="integ-name">Name</Label>
                <Input
                  id="integ-name"
                  required
                  placeholder="e.g. Shopify"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (!isEditing) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
                    }
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="integ-slug">Slug</Label>
                <Input
                  id="integ-slug"
                  required
                  placeholder="e.g. shopify"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="integ-category">Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as IntegrationCategory)}>
                  <SelectTrigger id="integ-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="integ-authtype">Authentication Type</Label>
                <Select value={authType} onValueChange={(v) => setAuthType(v as AuthType)}>
                  <SelectTrigger id="integ-authtype">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUTH_TYPES.map((at) => (
                      <SelectItem key={at} value={at}>
                        {at.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="integ-logourl">Logo URL (optional)</Label>
              <Input
                id="integ-logourl"
                placeholder="https://example.com/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="integ-desc">Description</Label>
              <Textarea
                id="integ-desc"
                placeholder="Brief description of the integration capabilities..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">Enable Integration</span>
                <span className="text-xs text-muted-foreground">
                  Allow organizations to select and connect to this service.
                </span>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name || !slug} className="gap-2">
              {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              Save integration
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
