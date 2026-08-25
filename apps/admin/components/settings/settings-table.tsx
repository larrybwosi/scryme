"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table"
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
import { deleteGlobalSetting } from "@/app/actions/settings"
import { GlobalSettingDialog, type GlobalSettingRow } from "./global-setting-dialog"

export function SettingsTable({ settings }: { settings: GlobalSettingRow[] }) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<GlobalSettingRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<GlobalSettingRow | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filteredSettings = settings.filter((s) => {
    const q = search.toLowerCase()
    return s.key.toLowerCase().includes(q) || s.value.toLowerCase().includes(q)
  })

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteGlobalSetting(deleteTarget.key)
      toast.success(`Setting "${deleteTarget.key}" deleted`)
      setDeleteTarget(null)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete setting")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Search settings..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="size-4" aria-hidden="true" />
          Add setting
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSettings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                  No settings found matching search filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredSettings.map((item) => (
                <TableRow key={item.key}>
                  <TableCell className="font-mono text-sm font-semibold text-foreground">
                    {item.key}
                  </TableCell>
                  <TableCell className="max-w-md">
                    <pre className="truncate font-mono text-xs text-muted-foreground bg-secondary/50 p-1.5 rounded">
                      {item.value}
                    </pre>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(item.updatedAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setEditingItem(item)}
                      >
                        <Pencil className="size-3.5" aria-hidden="true" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(item)}
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <GlobalSettingDialog open={createOpen} onOpenChange={setCreateOpen} />
      <GlobalSettingDialog
        setting={editingItem}
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete setting "{deleteTarget?.key}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this setting? Features relying on this global key may fall back to default behavior.
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
