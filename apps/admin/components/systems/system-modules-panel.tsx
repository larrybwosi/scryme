"use client";

import { useState, useTransition } from "react";
import {
  PLATFORM_MODULES,
} from "@repo/shared/constants";
import { updateSystemModuleStatus } from "@/app/actions/systems";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Switch } from "@repo/ui/components/ui/switch";
import { Badge } from "@repo/ui/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/ui/alert";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

interface SystemModulesPanelProps {
  initialSystemModules: Record<string, boolean>;
}

export function SystemModulesPanel({ initialSystemModules }: SystemModulesPanelProps) {
  const [systemModules, setSystemModules] =
    useState<Record<string, boolean>>(initialSystemModules);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (moduleKey: string, currentEnabled: boolean) => {
    const nextState = !currentEnabled;
    setSystemModules((prev) => ({ ...prev, [moduleKey]: nextState }));

    startTransition(async () => {
      try {
        await updateSystemModuleStatus(moduleKey, nextState);
      } catch (err) {
        // Rollback on error
        setSystemModules((prev) => ({ ...prev, [moduleKey]: currentEnabled }));
      }
    });
  };

  const disabledCount = PLATFORM_MODULES.filter(
    (m) => systemModules[m.key] === false,
  ).length;

  return (
    <div className="flex flex-col gap-6">
      {disabledCount > 0 && (
        <Alert variant="destructive">
          <ShieldAlert className="size-4" aria-hidden="true" />
          <AlertTitle>Master Kills Active ({disabledCount} Modules Disabled)</AlertTitle>
          <AlertDescription>
            Modules disabled system-wide are completely inaccessible across all organizations,
            overriding any organization-level custom pricing or feature flags.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>System-Wide Platform Modules</CardTitle>
          <CardDescription>
            Enable or disable platform features globally across the entire system. Disabling a module here turns it off for all tenants.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PLATFORM_MODULES.map((moduleDef) => {
              const isEnabled = systemModules[moduleDef.key] !== false;

              return (
                <div
                  key={moduleDef.key}
                  className={`flex flex-col justify-between rounded-lg border p-4 transition-colors ${
                    isEnabled
                      ? "border-border bg-card"
                      : "border-destructive/40 bg-destructive/5"
                  }`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">
                          {moduleDef.name}
                        </span>
                      </div>
                      <Badge
                        variant={isEnabled ? "secondary" : "destructive"}
                        className="capitalize"
                      >
                        {moduleDef.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {moduleDef.description}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      {isEnabled ? (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="size-3.5" aria-hidden="true" />
                          Globally Enabled
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-destructive">
                          <AlertTriangle className="size-3.5" aria-hidden="true" />
                          Globally Disabled
                        </span>
                      )}
                    </div>
                    <Switch
                      disabled={isPending}
                      checked={isEnabled}
                      onCheckedChange={() => handleToggle(moduleDef.key, isEnabled)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
