"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Plus, Pencil, Trash2, Plug, Loader2, Play, Settings } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@repo/ui/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Badge } from "@repo/ui/components/ui/badge"
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
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
  testIntegrationConnectionBySlug,
} from "@/app/actions/integrations"
import {
  IntegrationDefinitionDialog,
  type IntegrationDefinitionRow,
} from "./integration-definition-dialog"

export function IntegrationsList({
  integrations,
  isLoading,
}: {
  integrations: IntegrationDefinitionRow[]
  isLoading?: boolean
}) {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<IntegrationDefinitionRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<IntegrationDefinitionRow | null>(null)
  const [testingSlug, setTestingSlug] = useState<string | null>(null)

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteIntegrationDefinition(id),
    onSuccess: (_, id) => {
      const name = deleteTarget?.name || "Integration"
      toast.success(`${name} deleted`)
      setDeleteTarget(null)
      queryClient.invalidateQueries({ queryKey: ["integration-definitions"] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete integration")
    },
  })

  async function handleTestDefinition(slug: string) {
    setTestingSlug(slug)
    try {
      const res = await testIntegrationConnectionBySlug(slug)
      if (res.success) {
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to test integration definition")
    } finally {
      setTestingSlug(null)
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

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-9 bg-muted rounded-md" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
              <div className="h-12 bg-muted rounded w-full" />
            </Card>
          ))}
        </div>
      ) : integrations.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No integration definitions created yet. Add one to allow organizations to connect external services.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((item) => (
            <Card key={item.id} className="flex flex-col border-border bg-card transition-all hover:border-primary/40">
              <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
                <div className="flex items-center gap-3">
                  {item.logoUrl ? (
                    <Image src={item.logoUrl} alt={item.name} width={24} height={24} className="size-9 rounded border object-contain p-1" />
                  ) : (
                    <div className="flex size-9 items-center justify-center rounded-md bg-primary/10">
                      <Plug className="size-4 text-primary" aria-hidden="true" />
                    </div>
                  )}
                  <div>
                    <Link href={`/integrations/${item.slug}`} className="hover:underline">
                      <CardTitle className="text-base font-semibold text-foreground">{item.name}</CardTitle>
                    </Link>
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
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                ) : null}
                <div className="mt-auto flex items-center justify-between gap-2 pt-3 border-t border-border/60">
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-1.5 text-xs"
                    asChild
                  >
                    <Link href={`/integrations/${item.slug}`}>
                      <Settings className="size-3.5" />
                      Configure
                    </Link>
                  </Button>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-xs"
                      disabled={testingSlug === item.slug}
                      onClick={() => handleTestDefinition(item.slug)}
                    >
                      {testingSlug === item.slug ? (
                        <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                      ) : (
                        <Play className="size-3 text-emerald-500" aria-hidden="true" />
                      )}
                      Test
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => setEditingItem(item)} title="Edit Definition">
                      <Pencil className="size-3.5" aria-hidden="true" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(item)}
                      title="Delete Definition"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <IntegrationDefinitionDialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) queryClient.invalidateQueries({ queryKey: ["integration-definitions"] })
        }}
      />
      <IntegrationDefinitionDialog
        integration={editingItem}
        open={!!editingItem}
        onOpenChange={(open) => {
          if (!open) {
            setEditingItem(null)
            queryClient.invalidateQueries({ queryKey: ["integration-definitions"] })
          }
        }}
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
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
              }}
              disabled={deleteMutation.isPending}
              className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
