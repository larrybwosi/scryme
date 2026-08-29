"use client";

import { useState, useEffect } from "react";
import {
  Boxes,
  Zap,
  Layout,
  Terminal,
  CheckCircle2,
  Settings,
  ChevronRight,
  Globe,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { Breadcrumbs } from "../../components/breadcrumbs";
import { PageHeader } from "../../components/page-header";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@repo/ui/components/ui/dialog";
import { Separator } from "@repo/ui/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@repo/ui/lib/utils";
import {
  getIntegrationsStatus,
  provisionScryme,
} from "../actions/integrations";

const INTEGRATIONS = [
  {
    id: "developer-tools",
    title: "Developer Tools",
    description:
      "API Clients, Webhooks, and Device provisioning for developers.",
    icon: <Terminal className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />,
    href: "/integrations/apps-api",
    category: "Infrastructure",
    isExternal: false,
  },
  {
    id: "huly",
    title: "Huly",
    description:
      "Enterprise project management and team collaboration platform.",
    icon: <Layout className="w-8 h-8 text-blue-600 dark:text-blue-400" />,
    category: "Management",
    isExternal: true,
  },
  {
    id: "plane",
    title: "Plane",
    description: "Open-source project management to track issues and epics.",
    icon: <Globe className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />,
    category: "Management",
    isExternal: true,
  },
  {
    id: "scryme",
    title: "Scryme",
    description: "Advanced analytics and reporting for enterprise operations.",
    icon: <Boxes className="w-8 h-8 text-purple-600 dark:text-purple-400" />,
    category: "Analytics",
    isExternal: true,
  },
];

export default function IntegrationsPage() {
  const [statuses, setStatuses] = useState<Record<string, any>>({});
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScrymeProvisioning, setIsScrymeProvisioning] = useState(false);

  useEffect(() => {
    loadStatuses();
  }, []);

  const loadStatuses = async () => {
    setIsLoading(true);
    try {
      const data = await getIntegrationsStatus();
      setStatuses(data);
    } catch (error) {
      toast.error("Failed to load integration statuses");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenConfig = (integration: any) => {
    if (!integration.isExternal) return;
    setSelectedIntegration(integration);
  };

  const handleScrymeProvision = async () => {
    setIsScrymeProvisioning(true);
    try {
      const result = await provisionScryme();
      if (result.success) {
        toast.success(
          "Scryme Chat workspace successfully provisioned and channels created!",
        );
        setSelectedIntegration(null);
        loadStatuses();
      }
    } catch (error: any) {
      toast.error(
        error.message ||
          "Failed to provision Scryme Chat workspace automatically.",
      );
    } finally {
      setIsScrymeProvisioning(false);
    }
  };

  const renderDialogBody = () => {
    if (!selectedIntegration) return null;

    switch (selectedIntegration.id) {
      case "huly":
        return (
          <div className="py-4">
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-300 text-sm mb-1">
                Connect Huly
              </h4>
              <p className="text-blue-700 dark:text-blue-400/80 text-xs">
                Huly integration setup is managed by your workspace
                administrator. Reach out to your admin team to enable this
                connection.
              </p>
            </div>
          </div>
        );
      case "plane":
        return (
          <div className="py-4">
            <div className="bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-900 rounded-xl p-4">
              <h4 className="font-semibold text-cyan-900 dark:text-cyan-300 text-sm mb-1">
                Connect Plane
              </h4>
              <p className="text-cyan-700 dark:text-cyan-400/80 text-xs">
                Plane integration setup is managed by your workspace
                administrator. Reach out to your admin team to enable this
                connection.
              </p>
            </div>
          </div>
        );
      case "scryme":
        return (
          <div className="py-4">
            <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 rounded-xl p-4">
              <h4 className="font-semibold text-purple-900 dark:text-purple-300 text-sm mb-1">
                One-Click Automatic Provisioning
              </h4>
              <p className="text-purple-700 dark:text-purple-400/80 text-xs mb-3">
                Let Scryme automatically spin up a dedicated Chat workspace and
                configure default channels (Announcements, Alerts, General) for
                your organization.
              </p>
              <Button
                type="button"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white h-10 text-xs font-semibold"
                disabled={isScrymeProvisioning}
                onClick={handleScrymeProvision}>
                {isScrymeProvisioning
                  ? "Provisioning..."
                  : "Provision Automatically"}
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-350 mx-auto min-h-screen bg-background">
      <Breadcrumbs
        items={[
          { label: "Settings", href: "/settings" },
          { label: "Integrations" },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-10 mt-6">
        <PageHeader
          title="Integrations Marketplace"
          subtitle="Connect your favorite tools and automate your enterprise operations."
          icon={<Boxes className="w-8 h-8 text-primary" />}
        />
        <div className="bg-card px-4 py-2 rounded-lg border border-border flex items-center gap-4 shadow-sm w-fit">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">
              Status
            </span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold text-foreground">
                All Systems Operational
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
        {INTEGRATIONS.map(integration => {
          const isConnected = statuses[integration.id]?.connected;
          const statusLabel = isConnected ? "Connected" : "Not Configured";

          const content = (
            <div
              onClick={() => handleOpenConfig(integration)}
              className={cn(
                "group relative bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-sm transition-all hover:shadow-xl hover:border-primary/20 cursor-pointer flex flex-col h-full",
              )}>
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-muted rounded-2xl group-hover:bg-primary/5 transition-colors">
                  {integration.icon}
                </div>
                {integration.isExternal ? (
                  <Badge
                    variant="outline"
                    className={cn(
                      "px-3 py-1 text-[10px] font-bold uppercase tracking-wider border-none",
                      isConnected
                        ? "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400"
                        : "bg-muted text-muted-foreground",
                    )}>
                    {isConnected ? (
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3" /> {statusLabel}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Settings className="w-3 h-3" /> {statusLabel}
                      </span>
                    )}
                  </Badge>
                ) : (
                  <ArrowUpRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                )}
              </div>

              <div className="mb-8">
                <div className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-1.5">
                  {integration.category}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                  {integration.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {integration.description}
                </p>
              </div>

              <div className="mt-auto flex items-center justify-between pt-6 border-t border-border">
                <span className="text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                  {integration.isExternal ? "Manage Integration" : "View Tools"}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          );

          if (!integration.isExternal && integration.href) {
            return (
              <Link
                key={integration.id}
                href={integration.href}
                className="block h-full">
                {content}
              </Link>
            );
          }

          return <div key={integration.id}>{content}</div>;
        })}
      </div>

      <Dialog
        open={!!selectedIntegration}
        onOpenChange={open => !open && setSelectedIntegration(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="p-4 bg-muted rounded-2xl w-fit mb-4">
              {selectedIntegration?.icon}
            </div>
            <DialogTitle className="text-2xl font-bold">
              {selectedIntegration?.title} Configuration
            </DialogTitle>
            <DialogDescription>
              Configure the connection settings for {selectedIntegration?.title}
              . These settings are used to authenticate and sync data with your
              workspace.
            </DialogDescription>
          </DialogHeader>

          <Separator />

          {renderDialogBody()}

          <DialogFooter className="mt-4 gap-3">
            <Button
              variant="outline"
              className="flex-1 h-12"
              onClick={() => setSelectedIntegration(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
