"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@repo/ui/components/ui/switch";
import { Label } from "@repo/ui/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { togglePaymentTracking } from "@/app/actions/settings";

interface PaymentTrackingSwitcherProps {
  initialEnabled: boolean;
}

export function PaymentTrackingSwitcher({
  initialEnabled,
}: PaymentTrackingSwitcherProps) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleToggle(checked: boolean) {
    setIsUpdating(true);
    try {
      await togglePaymentTracking(checked);
      setEnabled(checked);
      toast.success(
        checked
          ? "Global payment and trial tracking enabled"
          : "Global payment and trial tracking disabled (bypassed for all organizations)",
      );
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update payment tracking status",
      );
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            {enabled ? (
              <ShieldCheck className="size-5 text-emerald-500" aria-hidden="true" />
            ) : (
              <ShieldAlert className="size-5 text-amber-500" aria-hidden="true" />
            )}
            <CardTitle className="text-lg font-semibold">
              Global Payment & Trial Tracking
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isUpdating && (
              <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />
            )}
            <Switch
              id="payment-tracking-switch"
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={isUpdating}
            />
          </div>
        </div>
        <CardDescription className="text-sm">
          Control payment and trial expiration enforcement across all tenant organizations platform-wide.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md bg-secondary/50 p-3.5 text-xs leading-relaxed text-muted-foreground">
          {enabled ? (
            <p>
              <strong className="text-foreground font-medium">Tracking Enabled:</strong> Organizations with expired subscriptions or finished free trials will be soft-blocked from mutating operations until billing is resolved (unless an individual organization has a payment bypass override).
            </p>
          ) : (
            <p className="text-amber-600 dark:text-amber-400">
              <strong className="font-medium">Tracking Disabled:</strong> All payment and trial expiration checks are bypassed globally. All organizations will have unrestricted access regardless of subscription status or trial end date.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
