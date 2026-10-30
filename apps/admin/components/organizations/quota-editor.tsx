"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw, Save, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@repo/ui/components/ui/card";
import {
  setQuotaOverrides,
  syncTierDefaultsToOrganizationQuota,
} from "@/app/actions/organizations";

interface QuotaEditorProps {
  organizationId: string;
  quota: {
    tierSlug: string;
    baseLimits: Record<string, any>;
    overrides: Record<string, any>;
    effectiveLimits: Record<string, any>;
  };
}

const COMMON_QUOTA_KEYS = [
  "maxUsers",
  "maxProducts",
  "maxLocations",
  "maxStorageGB",
  "maxOrdersPerMonth",
  "maxApiRequestsPerDay",
  "maxWebhookSubscriptions",
  "maxWorkflowEngineDefinitions",
  "maxCustomDomains",
];

export function QuotaEditor({ organizationId, quota }: QuotaEditorProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, string>>(
    Object.fromEntries(
      Object.entries(quota.overrides).map(([k, v]) => [k, String(v)]),
    ),
  );

  const limitKeys = Array.from(
    new Set([
      ...COMMON_QUOTA_KEYS,
      ...Object.keys(quota.baseLimits),
      ...Object.keys(quota.overrides),
    ]),
  );

  function updateValue(key: string, value: string) {
    setOverrides((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setIsPending(true);
    try {
      const parsed: Record<string, any> = {};
      for (const [key, value] of Object.entries(overrides)) {
        if (value === "") continue;
        const numeric = Number(value);
        parsed[key] = Number.isNaN(numeric) ? value : numeric;
      }
      await setQuotaOverrides(organizationId, parsed);
      toast.success("Quota overrides saved");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save quota overrides",
      );
    } finally {
      setIsPending(false);
    }
  }

  async function handleReset() {
    setIsPending(true);
    try {
      await setQuotaOverrides(organizationId, {});
      setOverrides({});
      toast.success("Quota overrides cleared");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to clear quota overrides",
      );
    } finally {
      setIsPending(false);
    }
  }

  async function handleSyncTier() {
    setIsPending(true);
    try {
      const updatedQuota =
        await syncTierDefaultsToOrganizationQuota(organizationId);
      setOverrides(
        Object.fromEntries(
          Object.entries(updatedQuota.overrides).map(([k, v]) => [
            k,
            String(v),
          ]),
        ),
      );
      toast.success(`Synced limits from ${quota.tierSlug} tier`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to sync tier limits",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">
          Quota Overrides & Allocations
        </CardTitle>
        <CardDescription>
          Base limits come from the {quota.tierSlug} tier. Override any limit
          specifically for this organization.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          {limitKeys.map((key) => (
            <div key={key} className="flex flex-col gap-1.5">
              <Label
                htmlFor={`quota-${key}`}
                className="text-xs capitalize text-muted-foreground"
              >
                {key.replace(/([A-Z])/g, " $1")}
              </Label>
              <Input
                id={`quota-${key}`}
                value={overrides[key] ?? ""}
                onChange={(e) => updateValue(key, e.target.value)}
                placeholder={String(quota.baseLimits[key] ?? "unset")}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncTier}
            disabled={isPending}
            className="gap-2"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            Sync Tier Defaults
          </Button>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={isPending}
              className="gap-2"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Reset Overrides
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isPending}
              className="gap-2"
            >
              {isPending ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="size-3.5" aria-hidden="true" />
              )}
              Save Overrides
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
