"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Workflow,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Sliders,
  Power,
  Loader2,
  RotateCcw,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Badge } from "@repo/ui/components/ui/badge"
import {
  toggleWorkflowActiveStatus,
  clearFailedWorkflowInstances,
  setWorkflowRateLimit,
  triggerWorkflowSimulationRun,
} from "@/app/actions/systems"

export function WorkflowEnginePanel({ metrics }: { metrics: any }) {
  const router = useRouter()
  const [rateLimitInput, setRateLimitInput] = useState(metrics.rateLimitPerMin || 100)
  const [isUpdatingRateLimit, setIsUpdatingRateLimit] = useState(false)
  const [isClearingFailed, setIsClearingFailed] = useState(false)
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null)

  async function handleToggleStatus(id: string, currentStatus: boolean) {
    setLoadingActionId(`toggle-${id}`)
    try {
      await toggleWorkflowActiveStatus(id, !currentStatus)
      toast.success(`Workflow ${!currentStatus ? "activated" : "deactivated"}`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to toggle workflow status")
    } finally {
      setLoadingActionId(null)
    }
  }

  async function handleSimulateRun(id: string) {
    setLoadingActionId(`sim-${id}`)
    try {
      const res = await triggerWorkflowSimulationRun(id)
      toast.success(`Simulation run executed successfully (Instance ID: ${res.instanceId.slice(0, 8)})`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to execute simulation run")
    } finally {
      setLoadingActionId(null)
    }
  }

  async function handleClearFailedQueue() {
    setIsClearingFailed(true)
    try {
      const res = await clearFailedWorkflowInstances()
      toast.success(`Cleared ${res.count} failed workflow instances from queue`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to clear queue")
    } finally {
      setIsClearingFailed(false)
    }
  }

  async function handleUpdateRateLimit(e: React.FormEvent) {
    e.preventDefault()
    setIsUpdatingRateLimit(true)
    try {
      await setWorkflowRateLimit(Number(rateLimitInput))
      toast.success(`System workflow rate limit set to ${rateLimitInput} runs/min`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to update rate limit")
    } finally {
      setIsUpdatingRateLimit(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Metric Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Total Workflows</span>
              <span className="text-2xl font-semibold tabular-nums text-foreground">{metrics.totalWorkflows}</span>
              <span className="text-[11px] text-emerald-600 font-medium">{metrics.activeWorkflows} Active</span>
            </div>
            <div className="flex size-9 items-center justify-center rounded-md bg-purple-500/10 text-purple-600">
              <Workflow className="size-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Running Instances</span>
              <span className="text-2xl font-semibold tabular-nums text-foreground">{metrics.runningInstances}</span>
              <span className="text-[11px] text-muted-foreground">{metrics.totalInstances} Total Runs</span>
            </div>
            <div className="flex size-9 items-center justify-center rounded-md bg-blue-500/10 text-blue-600">
              <Clock className="size-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Completed Runs</span>
              <span className="text-2xl font-semibold tabular-nums text-foreground">{metrics.completedInstances}</span>
              <span className="text-[11px] text-emerald-600 font-medium">Successful Execution</span>
            </div>
            <div className="flex size-9 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="size-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Failed Runs Queue</span>
              <span className="text-2xl font-semibold tabular-nums text-foreground">{metrics.failedInstances}</span>
              <span className="text-[11px] text-destructive font-medium">Action Required</span>
            </div>
            <div className="flex size-9 items-center justify-center rounded-md bg-destructive/10 text-destructive">
              <XCircle className="size-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rate Limits & Queue Control Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Sliders className="size-4 text-primary" /> Execution Rate Limiting
            </CardTitle>
            <CardDescription>Limit maximum workflow trigger runs per minute system-wide.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateRateLimit} className="flex gap-3 items-end">
              <div className="flex-1 flex flex-col gap-2">
                <Label htmlFor="rate-limit">Max Executions / Minute</Label>
                <Input
                  id="rate-limit"
                  type="number"
                  min="1"
                  max="10000"
                  value={rateLimitInput}
                  onChange={(e) => setRateLimitInput(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={isUpdatingRateLimit} className="gap-2">
                {isUpdatingRateLimit ? <Loader2 className="size-4 animate-spin" /> : null}
                Save Limits
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <RotateCcw className="size-4 text-amber-500" /> Failed Execution Queue
            </CardTitle>
            <CardDescription>Clear or retry failed instances stuck in error state.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">{metrics.failedInstances} Failed Execution Jobs</span>
              <span className="text-xs text-muted-foreground">Clearing queue resets error instances.</span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              disabled={isClearingFailed || metrics.failedInstances === 0}
              onClick={handleClearFailedQueue}
              className="gap-2"
            >
              {isClearingFailed ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Clear Failed Queue
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Workflows Management Table */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">System Campaign Workflows</CardTitle>
          <CardDescription>Manage active states, trigger manual simulations, and monitor organization workflows.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="p-3">Workflow Name</th>
                  <th className="p-3">Organization</th>
                  <th className="p-3">Executions</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {metrics.recentWorkflows?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                      No workflows found.
                    </td>
                  </tr>
                ) : (
                  metrics.recentWorkflows.map((wf: any) => (
                    <tr key={wf.id} className="hover:bg-muted/20">
                      <td className="p-3 font-semibold text-foreground">{wf.name}</td>
                      <td className="p-3 text-muted-foreground">{wf.organization?.name || "Global"}</td>
                      <td className="p-3 tabular-nums">{wf._count?.instances || 0}</td>
                      <td className="p-3">
                        {wf.isActive ? (
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Inactive
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 text-xs"
                            disabled={loadingActionId === `sim-${wf.id}`}
                            onClick={() => handleSimulateRun(wf.id)}
                          >
                            {loadingActionId === `sim-${wf.id}` ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Play className="size-3 text-purple-500" />
                            )}
                            Simulate Run
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-xs"
                            disabled={loadingActionId === `toggle-${wf.id}`}
                            onClick={() => handleToggleStatus(wf.id, wf.isActive)}
                          >
                            {loadingActionId === `toggle-${wf.id}` ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Power className={`size-3 ${wf.isActive ? "text-destructive" : "text-emerald-500"}`} />
                            )}
                            {wf.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
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
