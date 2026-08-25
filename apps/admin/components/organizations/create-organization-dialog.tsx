"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2 } from "lucide-react"
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
  DialogTrigger,
} from "@repo/ui/components/ui/dialog"
import { createOrganization } from "@/app/actions/organizations"

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function CreateOrganizationDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsPending(true)
    try {
      const org = await createOrganization({ name, slug, description: description || undefined })
      toast.success(`${org.name} was created`)
      setOpen(false)
      setName("")
      setSlug("")
      setDescription("")
      setSlugTouched(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create organization")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="size-4" aria-hidden="true" />
          New organization
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create organization</DialogTitle>
            <DialogDescription>
              Provision a new organization directly. It starts on the free tier with default settings.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="org-name">Name</Label>
              <Input
                id="org-name"
                value={name}
                required
                onChange={(e) => {
                  setName(e.target.value)
                  if (!slugTouched) setSlug(slugify(e.target.value))
                }}
                placeholder="Acme Retail"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="org-slug">Slug</Label>
              <Input
                id="org-slug"
                value={slug}
                required
                onChange={(e) => {
                  setSlugTouched(true)
                  setSlug(slugify(e.target.value))
                }}
                placeholder="acme-retail"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="org-description">Description (optional)</Label>
              <Textarea
                id="org-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Internal notes about this organization"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name || !slug} className="gap-2">
              {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              Create organization
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
