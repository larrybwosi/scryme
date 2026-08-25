"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { HardDrive, Loader2, Save, Ban, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/ui/card"
import { Badge } from "@repo/ui/components/ui/badge"
import { updateOrganizationStorageSettings } from "@/app/actions/organizations"

interface StorageControlProps {
  organizationId: string
  storage: {
    usedBytes: number
    usedMB: number
    usedGB: number
    fileCount: number
    limitMB: number | null
    isStorageDisabled: boolean
  }
}

export function StorageControl({ organizationId, storage }: StorageControlProps) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [limitMB, setLimitMB] = useState<string>(
    storage.limitMB != null ? String(storage.limitMB) : "",
  )

  const usedMB = storage.usedMB
  const limitMBVal = storage.limitMB
  const percentage =
    limitMBVal && limitMBVal > 0 ? Math.min(Math.round((usedMB / limitMBVal) * 100), 100) : 0

  const isOverLimit = limitMBVal != null && usedMB >= limitMBVal

  async function handleSaveLimit() {
    setIsPending(true)
    try {
      const parsed = limitMB.trim() === "" ? null : Number(limitMB)
      if (parsed !== null && (Number.isNaN(parsed) || parsed < 0)) {
        toast.error("Please enter a valid non-negative storage limit in MB")
        return
      }

      await updateOrganizationStorageSettings(organizationId, { limitMB: parsed })
      toast.success("Storage limit updated successfully")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update storage limit")
    } finally {
      setIsPending(false)
    }
  }

  async function handleToggleStorageAccess(disable: boolean) {
    setIsPending(true)
    try {
      await updateOrganizationStorageSettings(organizationId, { disableStorage: disable })
      toast.success(disable ? "Storage access disabled for organization" : "Storage access enabled")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update storage access")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="size-4 text-primary" aria-hidden="true" />
            <CardTitle className="text-base font-semibold text-foreground">
              RustFS Storage Usage & Access
            </CardTitle>
          </div>
          {storage.isStorageDisabled ? (
            <Badge variant="destructive" className="gap-1">
              <Ban className="size-3" /> Storage Disabled
            </Badge>
          ) : isOverLimit ? (
            <Badge variant="destructive" className="gap-1">
              Limit Exceeded
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1 text-muted-foreground">
              <CheckCircle2 className="size-3 text-emerald-500" /> Active
            </Badge>
          )}
        </div>
        <CardDescription>
          Monitor file upload storage usage from RustFS/attachments, configure quota limits, or block uploads.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-secondary/20 p-4">
          <div className="flex items-center justify-between text-sm font-medium">
            <span className="text-muted-foreground">Used Storage</span>
            <span className="text-foreground">
              {usedMB} MB ({storage.usedGB} GB) /{" "}
              {limitMBVal != null ? `${limitMBVal} MB` : "Unlimited"}
            </span>
          </div>
          {limitMBVal != null ? (
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full transition-all ${
                  percentage >= 90 ? "bg-destructive" : percentage >= 75 ? "bg-amber-500" : "bg-primary"
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          ) : null}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span>Total stored files: {storage.fileCount}</span>
            {limitMBVal != null ? <span>{percentage}% of limit used</span> : <span>No cap set</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="storage-limit-mb" className="text-xs text-muted-foreground">
              Storage Limit (MB)
            </Label>
            <div className="flex gap-2">
              <Input
                id="storage-limit-mb"
                type="number"
                min="0"
                placeholder="e.g. 5000 (leave empty for unlimited)"
                value={limitMB}
                onChange={(e) => setLimitMB(e.target.value)}
                disabled={isPending}
              />
              <Button size="sm" onClick={handleSaveLimit} disabled={isPending} className="gap-1.5 shrink-0">
                {isPending ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="size-3.5" aria-hidden="true" />
                )}
                Set Limit
              </Button>
            </div>
          </div>

          <div className="flex flex-col justify-end gap-1.5">
            <Label className="text-xs text-muted-foreground">Upload Access Control</Label>
            {storage.isStorageDisabled ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleStorageAccess(false)}
                disabled={isPending}
                className="gap-2 text-emerald-600 border-emerald-500/30 hover:bg-emerald-50 text-xs"
              >
                <CheckCircle2 className="size-3.5" /> Re-enable Storage Uploads
              </Button>
            ) : (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleToggleStorageAccess(true)}
                disabled={isPending}
                className="gap-2 text-xs"
              >
                <Ban className="size-3.5" /> Disable Storage Uploads
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
