"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, RotateCcw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  saveDefaultQuotaAllocations,
  type DefaultQuotaAllocations,
} from "@/app/actions/billing";

export function DefaultQuotasPanel({
  initialAllocations,
}: {
  initialAllocations: DefaultQuotaAllocations;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [allocations, setAllocations] =
    useState<DefaultQuotaAllocations>(initialAllocations);

  function handleChange(key: keyof DefaultQuotaAllocations, value: string) {
    const num = Number(value);
    setAllocations((prev) => ({
      ...prev,
      [key]: Number.isNaN(num) ? prev[key] : num,
    }));
  }

  async function handleSave() {
    setIsPending(true);
    try {
      await saveDefaultQuotaAllocations(allocations);
      toast.success("Default quota allocations saved successfully");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save default quotas",
      );
    } finally {
      setIsPending(false);
    }
  }

  function handleReset() {
    setAllocations({
      maxUsers: 5,
      maxProducts: 500,
      maxLocations: 2,
      maxStorageGB: 10,
      maxOrdersPerMonth: 1000,
      maxApiRequestsPerDay: 10000,
      maxWebhookSubscriptions: 5,
      maxWorkflowEngineDefinitions: 10,
      maxCustomDomains: 1,
    });
    toast.info(
      "Reset to recommended platform defaults (click Save to persist)",
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <ShieldAlert className="size-4 text-primary" />
          Platform Default Quota Allocations
        </CardTitle>
        <CardDescription>
          These defaults serve as fallback quota limits for unassigned
          organizations or standard baseline tier provisions. Use -1 for
          unlimited.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="q-users">Max Members / Users</Label>
            <Input
              id="q-users"
              type="number"
              value={allocations.maxUsers}
              onChange={(e) => handleChange("maxUsers", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="q-products">Max Products</Label>
            <Input
              id="q-products"
              type="number"
              value={allocations.maxProducts}
              onChange={(e) => handleChange("maxProducts", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="q-locations">Max Locations / Outlets</Label>
            <Input
              id="q-locations"
              type="number"
              value={allocations.maxLocations}
              onChange={(e) => handleChange("maxLocations", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="q-storage">Storage Limit (GB)</Label>
            <Input
              id="q-storage"
              type="number"
              value={allocations.maxStorageGB}
              onChange={(e) => handleChange("maxStorageGB", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="q-orders">Max Sales Orders / Month</Label>
            <Input
              id="q-orders"
              type="number"
              value={allocations.maxOrdersPerMonth}
              onChange={(e) =>
                handleChange("maxOrdersPerMonth", e.target.value)
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="q-api">Max API Requests / Day</Label>
            <Input
              id="q-api"
              type="number"
              value={allocations.maxApiRequestsPerDay}
              onChange={(e) =>
                handleChange("maxApiRequestsPerDay", e.target.value)
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="q-webhooks">Max Webhook Subscriptions</Label>
            <Input
              id="q-webhooks"
              type="number"
              value={allocations.maxWebhookSubscriptions}
              onChange={(e) =>
                handleChange("maxWebhookSubscriptions", e.target.value)
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="q-workflows">Max Workflow Definitions</Label>
            <Input
              id="q-workflows"
              type="number"
              value={allocations.maxWorkflowEngineDefinitions}
              onChange={(e) =>
                handleChange("maxWorkflowEngineDefinitions", e.target.value)
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="q-domains">Max Custom Domains</Label>
            <Input
              id="q-domains"
              type="number"
              value={allocations.maxCustomDomains}
              onChange={(e) => handleChange("maxCustomDomains", e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="size-3.5" />
            Reset Defaults
          </Button>
          <Button onClick={handleSave} disabled={isPending} className="gap-2">
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Save Default Allocations
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
