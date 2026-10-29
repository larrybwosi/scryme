"use client";

import { useState, useTransition } from "react";
import {
  PLATFORM_MODULES,
  type EffectiveModuleResolution,
} from "@repo/shared/constants";
import {
  updateOrganizationModuleStatus,
  enableAllOrganizationModules,
  toggleOrganizationPaymentOverride,
} from "@/app/actions/organizations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Switch } from "@repo/ui/components/ui/switch";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Label } from "@repo/ui/components/ui/label";
import { toast } from "sonner";
import {
  RotateCcw,
  Lock,
  CheckCircle2,
  XCircle,
  Sparkles,
  ShieldCheck,
  CreditCard,
} from "lucide-react";

interface OrgModuleEditorProps {
  organizationId: string;
  initialModules: {
    orgOverrides: Record<string, boolean>;
    bypassPaymentCheck?: boolean;
    systemModules: Record<string, boolean>;
    effective: EffectiveModuleResolution[];
  };
}

export function OrgModuleEditor({
  organizationId,
  initialModules,
}: OrgModuleEditorProps) {
  const [data, setData] = useState(initialModules);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (moduleKey: string, nextState: boolean) => {
    startTransition(async () => {
      try {
        const updated = await updateOrganizationModuleStatus(
          organizationId,
          moduleKey,
          nextState,
        );
        setData(updated);
        toast.success(`Module ${moduleKey} updated`);
      } catch (err) {
        toast.error("Failed to update org module");
      }
    });
  };

  const handleReset = (moduleKey: string) => {
    startTransition(async () => {
      try {
        const updated = await updateOrganizationModuleStatus(
          organizationId,
          moduleKey,
          null,
        );
        setData(updated);
        toast.success(`Reset ${moduleKey} to default`);
      } catch (err) {
        toast.error("Failed to reset org module");
      }
    });
  };

  const handleEnableAll = () => {
    startTransition(async () => {
      try {
        const updated = await enableAllOrganizationModules(
          organizationId,
          true,
        );
        setData(updated);
        toast.success(
          "Enabled all platform features and modules for this organization!",
        );
      } catch (err) {
        toast.error("Failed to enable all modules");
      }
    });
  };

  const handlePaymentOverride = (checked: boolean) => {
    startTransition(async () => {
      try {
        const updated = await toggleOrganizationPaymentOverride(
          organizationId,
          checked,
        );
        setData(updated);
        toast.success(
          checked
            ? "Payment check override enabled! Organization can use all features without payment enforcement."
            : "Payment check override disabled.",
        );
      } catch (err) {
        toast.error("Failed to update payment override status");
      }
    });
  };

  const isAllEnabled = PLATFORM_MODULES.every((m) => {
    const eff = data.effective.find((e) => e.moduleKey === m.key);
    return eff ? eff.isEnabled : false;
  });

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold text-foreground">
              Organization Module & Feature Controls
            </CardTitle>
            {isAllEnabled && (
              <Badge
                variant="secondary"
                className="bg-emerald-500/10 text-emerald-600 gap-1 text-xs"
              >
                <ShieldCheck className="size-3" /> All Features Active
              </Badge>
            )}
          </div>
          <CardDescription className="mt-1 text-xs">
            Super admin management for individual platform feature provisioning,
            bulk module enablement, and payment check overrides.
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            size="sm"
            variant="default"
            className="gap-1.5 text-xs bg-primary hover:bg-primary/90"
            disabled={isPending || isAllEnabled}
            onClick={handleEnableAll}
          >
            <Sparkles className="size-3.5" />
            Enable All Features
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6 flex flex-col gap-6">
        {/* Payment Check Override Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 shrink-0">
              <CreditCard className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 font-medium text-sm text-foreground">
                Payment Exemption & Billing Override
                {data.bypassPaymentCheck && (
                  <Badge
                    variant="secondary"
                    className="bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px]"
                  >
                    Exempt Active
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enable this option to allow the organization to access all
                features without verifying subscription payment status or
                blocking on outstanding invoices.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Label
              htmlFor="payment-override-switch"
              className="text-xs font-medium cursor-pointer"
            >
              Bypass Payment Checks
            </Label>
            <Switch
              id="payment-override-switch"
              disabled={isPending}
              checked={data.bypassPaymentCheck ?? false}
              onCheckedChange={handlePaymentOverride}
            />
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {PLATFORM_MODULES.map((moduleDef) => {
            const isSystemDisabled =
              data.systemModules[moduleDef.key] === false;
            const hasOverride =
              data.orgOverrides && moduleDef.key in data.orgOverrides;

            const eff = data.effective.find(
              (e) => e.moduleKey === moduleDef.key,
            );
            const isEffectiveEnabled = eff ? eff.isEnabled : false;

            return (
              <div
                key={moduleDef.key}
                className={`flex flex-col justify-between rounded-lg border p-4 transition-colors ${
                  isSystemDisabled
                    ? "border-muted bg-muted/30 opacity-75"
                    : isEffectiveEnabled
                      ? "border-border bg-card"
                      : "border-destructive/30 bg-destructive/5"
                }`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground text-sm">
                        {moduleDef.name}
                      </span>
                    </div>
                    {hasOverride ? (
                      <Badge
                        variant="outline"
                        className="border-primary text-primary text-[10px]"
                      >
                        Custom Override
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">
                        Default
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {moduleDef.description}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <div className="flex items-center gap-1.5 text-xs">
                    {isSystemDisabled ? (
                      <span className="flex items-center gap-1 text-muted-foreground font-medium">
                        <Lock className="size-3.5" aria-hidden="true" />
                        Disabled System-Wide
                      </span>
                    ) : isEffectiveEnabled ? (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="size-3.5" aria-hidden="true" />
                        Active for Org
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-destructive font-medium">
                        <XCircle className="size-3.5" aria-hidden="true" />
                        Disabled for Org
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {hasOverride && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        title="Reset to default"
                        disabled={isPending}
                        onClick={() => handleReset(moduleDef.key)}
                      >
                        <RotateCcw
                          className="size-3.5 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </Button>
                    )}
                    <Switch
                      disabled={isPending || isSystemDisabled}
                      checked={isEffectiveEnabled && !isSystemDisabled}
                      onCheckedChange={(checked) =>
                        handleToggle(moduleDef.key, checked)
                      }
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
