"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@repo/ui/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Badge } from "@repo/ui/components/ui/badge"
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
import { deleteTier, type Tier } from "@/app/actions/billing"
import { TierFormDialog } from "./tier-form-dialog"

export function TiersPanel({ tiers }: { tiers: Tier[] }) {
  const router = useRouter()
  const [editingTier, setEditingTier] = useState<Tier | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Tier | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteTier(deleteTarget.slug)
      toast.success(`${deleteTarget.name} tier deleted`)
      setDeleteTarget(null)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete tier")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" aria-hidden="true" />
          New tier
        </Button>
      </div>

      {tiers.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No tiers configured yet. Create your first plan tier to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier) => (
            <Card key={tier.slug} className="flex flex-col border-border bg-card">
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">{tier.name}</CardTitle>
                  <p className="mt-1 text-2xl font-semibold text-foreground">
                    ${tier.price}
                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </p>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  {tier.slug}
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                {tier.description ? (
                  <p className="text-sm text-muted-foreground">{tier.description}</p>
                ) : null}
                {tier.features && tier.features.length > 0 ? (
                  <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-auto flex justify-end gap-2 pt-2">
                  <Button variant="ghost" size="sm" className="gap-2" onClick={() => setEditingTier(tier)}>
                    <Pencil className="size-3.5" aria-hidden="true" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(tier)}
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TierFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editingTier ? (
        <TierFormDialog
          open={!!editingTier}
          onOpenChange={(open) => !open && setEditingTier(null)}
          tier={editingTier}
        />
      ) : null}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name} tier?</AlertDialogTitle>
            <AlertDialogDescription>
              Organizations currently on this tier will keep their subscription record, but the tier
              definition will no longer be available to assign.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
              className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              Delete tier
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
