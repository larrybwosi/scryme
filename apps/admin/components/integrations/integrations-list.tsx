"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, Plug, Loader2 } from "lucide-react"
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
import {
  deleteIntegrationDefinition,
} from "@/app/actions/integrations"
import {
  IntegrationDefinitionDialog,
  type IntegrationDefinitionRow,
} from "./integration-definition-dialog"
import Image from "next/image"


export function IntegrationsList({
  integrations,
}: {
  integrations: IntegrationDefinitionRow[]
}) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<IntegrationDefinitionRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<IntegrationDefinitionRow | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteIntegrationDefinition(deleteTarget.id)
      toast.success(`Integration ${deleteTarget.name} deleted`)
      setDeleteTarget(null)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete integration")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="size-4" aria-hidden="true" />
          Add integration
        </Button>
      </div>

      {integrations.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No integration definitions created yet. Add one to allow organizations to connect external services.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((item) => (
            <Card key={item.id} className="flex flex-col border-border bg-card">
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {item.logoUrl ? (
                    <Image src={item.logoUrl} alt={item.name} width={24} height={24} className="size-9 rounded border object-contain p-1" />
                  ) : (
                    <div className="flex size-9 items-center justify-center rounded-md bg-primary/10">
                      <Plug className="size-4 text-primary" aria-hidden="true" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-base font-semibold text-foreground">{item.name}</CardTitle>
                    <span className="font-mono text-xs text-muted-foreground">{item.slug}</span>
                  </div>
                </div>
                {item.isActive ? (
                  <Badge variant="secondary" className="text-emerald-600 bg-emerald-500/10">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Disabled
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-xs">
                    {item.category.replace("_", " ")}
                  </Badge>
                  <Badge variant="outline" className="text-xs font-mono">
                    {item.authType.replace("_", " ")}
                  </Badge>
                </div>
                {item.description ? (
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                ) : null}
                <div className="mt-auto flex justify-end gap-2 pt-2">
                  <Button variant="ghost" size="sm" className="gap-2" onClick={() => setEditingItem(item)}>
                    <Pencil className="size-3.5" aria-hidden="true" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(item)}
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

      <IntegrationDefinitionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <IntegrationDefinitionDialog
        integration={editingItem}
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name} definition?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the integration definition from the system. Organizations connected to this integration will be affected.
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
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
