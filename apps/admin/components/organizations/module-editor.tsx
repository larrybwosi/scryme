"use client";

import { useState, useTransition } from "react";
import {
  PLATFORM_MODULES,
  type EffectiveModuleResolution,
} from "@repo/shared/constants";
import { updateOrganizationModuleStatus } from "@/app/actions/organizations";
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
import { RotateCcw, Lock, CheckCircle2, XCircle } from "lucide-react";

interface OrgModuleEditorProps {
  organizationId: string;
  initialModules: {
    orgOverrides: Record<string, boolean>;
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
      } catch (err) {
        console.error("Failed to update org module", err);
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
      } catch (err) {
        console.error("Failed to reset org module", err);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Module Controls</CardTitle>
        <CardDescription>
          Customize active platform modules individually for this organization. Allows tailored custom pricing and modular feature provisioning.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {PLATFORM_MODULES.map((moduleDef) => {
            const isSystemDisabled = data.systemModules[moduleDef.key] === false;
            const hasOverride =
              data.orgOverrides && moduleDef.key in data.orgOverrides;

            const eff = data.effective.find((e) => e.moduleKey === moduleDef.key);
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
                      <Badge variant="outline" className="border-primary text-primary text-[10px]">
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
                        <RotateCcw className="size-3.5 text-muted-foreground" aria-hidden="true" />
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
