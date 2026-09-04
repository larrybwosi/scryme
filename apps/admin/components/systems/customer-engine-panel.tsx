"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Users,
  Building2,
  Tag,
  RefreshCw,
  Plus,
  Trash2,
  Download,
  CheckCircle2,
  XCircle,
  Loader2,
  FolderTree,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Badge } from "@repo/ui/components/ui/badge"
import {
  triggerSegmentRecalculation,
  addTagToSystemCustomers,
  removeTagFromSystemCustomers,
  bulkUpdateCustomersStatus,
  bulkExportCustomers,
} from "@/app/actions/systems"

export function CustomerEnginePanel({ metrics }: { metrics: any }) {
  const router = useRouter()
  const [newTag, setNewTag] = useState("")
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [isSyncingSegments, setIsSyncingSegments] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isBulkStatusUpdating, setIsBulkStatusUpdating] = useState(false)

  async function handleAddTag(e: React.FormEvent) {
    e.preventDefault()
    if (!newTag.trim()) return
    setIsAddingTag(true)
    try {
      const res = await addTagToSystemCustomers(newTag.trim())
      toast.success(`Tag "${res.tag}" added to ${res.count} customers`)
      setNewTag("")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to add tag")
    } finally {
      setIsAddingTag(false)
    }
  }

  async function handleRemoveTag(tag: string) {
    try {
      const res = await removeTagFromSystemCustomers(tag)
      toast.success(`Tag "${res.tag}" removed from ${res.count} customers`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to remove tag")
    }
  }

  async function handleSyncSegments() {
    setIsSyncingSegments(true)
    try {
      const res = await triggerSegmentRecalculation()
      toast.success(res.message)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to recalculate segments")
    } finally {
      setIsSyncingSegments(false)
    }
  }

  async function handleBulkStatus(isActive: boolean) {
    setIsBulkStatusUpdating(true)
    try {
      const res = await bulkUpdateCustomersStatus(isActive)
      toast.success(`Updated ${res.count} customer accounts to ${isActive ? "Active" : "Inactive"}`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed bulk status update")
    } finally {
      setIsBulkStatusUpdating(false)
    }
  }

  async function handleExport() {
    setIsExporting(true)
    try {
      const data = await bulkExportCustomers()
      const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2))
      const downloadAnchor = document.createElement("a")
      downloadAnchor.setAttribute("href", jsonStr)
      downloadAnchor.setAttribute("download", `customer_export_${new Date().toISOString().slice(0, 10)}.json`)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
      toast.success("Exported customer records successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to export customers")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Total Customer Profiles</span>
              <span className="text-2xl font-semibold tabular-nums text-foreground">{metrics.totalCustomers}</span>
              <span className="text-[11px] text-emerald-600 font-medium">{metrics.activeCustomers} Active Profiles</span>
            </div>
            <div className="flex size-9 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
              <Users className="size-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Business Accounts (B2B)</span>
              <span className="text-2xl font-semibold tabular-nums text-foreground">{metrics.totalBusinessAccounts}</span>
              <span className="text-[11px] text-muted-foreground">Enterprise Accounts</span>
            </div>
            <div className="flex size-9 items-center justify-center rounded-md bg-blue-500/10 text-blue-600">
              <Building2 className="size-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Customer Segments</span>
              <span className="text-2xl font-semibold tabular-nums text-foreground">{metrics.totalSegments}</span>
              <span className="text-[11px] text-purple-600 font-medium">Rule-based Groups</span>
            </div>
            <div className="flex size-9 items-center justify-center rounded-md bg-purple-500/10 text-purple-600">
              <FolderTree className="size-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">System Tags</span>
              <span className="text-2xl font-semibold tabular-nums text-foreground">{metrics.allTags?.length || 0}</span>
              <span className="text-[11px] text-muted-foreground">Custom Attributes</span>
            </div>
            <div className="flex size-9 items-center justify-center rounded-md bg-amber-500/10 text-amber-600">
              <Tag className="size-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segment Recalculation & System Tag Management Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Tag className="size-4 text-emerald-600" /> System-wide Customer Tags
            </CardTitle>
            <CardDescription>Apply or remove customer tags across all organizations.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <form onSubmit={handleAddTag} className="flex gap-2 items-end">
              <div className="flex-1 flex flex-col gap-1">
                <Label htmlFor="tag-input" className="text-xs">Add Tag to All Customers</Label>
                <Input
                  id="tag-input"
                  placeholder="e.g. VIP-2025"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={isAddingTag} className="gap-1.5">
                {isAddingTag ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                Add Tag
              </Button>
            </form>

            <div className="flex flex-wrap gap-2 pt-2">
              {metrics.allTags?.length === 0 ? (
                <span className="text-xs text-muted-foreground">No customer tags found.</span>
              ) : (
                metrics.allTags?.map((item: any) => (
                  <Badge key={item.tag} variant="secondary" className="gap-1.5 py-1 px-2.5 text-xs">
                    <span>{item.tag}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">({item.count})</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(item.tag)}
                      className="ml-1 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <RefreshCw className="size-4 text-purple-600" /> Segment Recalculation & Bulk Actions
            </CardTitle>
            <CardDescription>Synchronize rule-based audience segments and perform bulk customer operations.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">Sync All Customer Segments</span>
                <span className="text-xs text-muted-foreground">Recalculate dynamic segment rules platform-wide.</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={isSyncingSegments}
                onClick={handleSyncSegments}
                className="gap-2"
              >
                {isSyncingSegments ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4 text-purple-500" />}
                Recalculate Segments
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">Bulk Customer Export</span>
                <span className="text-xs text-muted-foreground">Download system customer profile records.</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isExporting}
                  onClick={handleExport}
                  className="gap-2"
                >
                  {isExporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                  Export JSON
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Segments Table */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Platform Customer Segments</CardTitle>
          <CardDescription>Rule-based segments configured by organizations.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="p-3">Segment Name</th>
                  <th className="p-3">Organization</th>
                  <th className="p-3">Campaigns Linked</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {metrics.segments?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-muted-foreground">
                      No customer segments defined.
                    </td>
                  </tr>
                ) : (
                  metrics.segments?.map((seg: any) => (
                    <tr key={seg.id} className="hover:bg-muted/20">
                      <td className="p-3 font-semibold text-foreground">{seg.name}</td>
                      <td className="p-3 text-muted-foreground">{seg.organization?.name || "Global"}</td>
                      <td className="p-3 tabular-nums">{seg._count?.campaigns || 0}</td>
                      <td className="p-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 text-xs text-purple-600"
                          onClick={() => handleSyncSegments()}
                        >
                          <RefreshCw className="size-3" />
                          Sync Segment
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
