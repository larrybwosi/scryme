"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
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
} from "@repo/ui/components/ui/dialog"
import { setGlobalSetting } from "@/app/actions/settings"

export interface GlobalSettingRow {
  key: string
  value: string
  updatedAt: Date
}

export function GlobalSettingDialog({
  setting,
  open,
  onOpenChange,
}: {
  setting?: GlobalSettingRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const isEditing = !!setting
  const [isPending, setIsPending] = useState(false)
  const [key, setKey] = useState(setting?.key ?? "")
  const [value, setValue] = useState(setting?.value ?? "")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!key.trim()) return

    setIsPending(true)
    try {
      await setGlobalSetting(key.trim(), value)
      toast.success(`Setting "${key}" saved`)
      onOpenChange(false)
      if (!isEditing) {
        setKey("")
        setValue("")
      }
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save setting")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? `Edit Setting: ${setting?.key}` : "Add Global Setting"}</DialogTitle>
            <DialogDescription>
              System-wide key-value configuration setting.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="setting-key">Key</Label>
              <Input
                id="setting-key"
                required
                disabled={isEditing}
                placeholder="e.g. system:maintenance_mode"
                value={key}
                onChange={(e) => setKey(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="setting-value">Value (Text or JSON)</Label>
              <Textarea
                id="setting-value"
                placeholder="Enter setting value..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={5}
                className="font-mono text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !key.trim()} className="gap-2">
              {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              Save setting
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
