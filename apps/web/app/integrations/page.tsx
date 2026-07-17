"use client";

import { useState, useEffect } from "react";
import {
  Boxes,
  Zap,
  Shield,
  Layout,
  Terminal,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Settings,
  ChevronRight,
  Globe,
  Key,
  Webhook,
  Monitor,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { Breadcrumbs } from "../../components/breadcrumbs";
import { PageHeader } from "../../components/page-header";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@repo/ui/components/ui/sheet";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Separator } from "@repo/ui/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@repo/ui/lib/utils";
import {
  getIntegrationsStatus,
  updateWindmillConfig,
  provisionWindmill,
  updateHulyConfig,
  updateZitadelConfig,
  updatePlaneConfig,
  updateScrymeConfig,
  provisionScryme,
} from "../actions/integrations";

const INTEGRATIONS = [
  {
    id: "developer-tools",
    title: "Developer Tools",
    description: "API Clients, Webhooks, and Device provisioning for developers.",
    icon: <Terminal className="w-8 h-8 text-indigo-600" />,
    href: "/integrations/apps-api",
    category: "Infrastructure",
    isExternal: false,
  },
  {
    id: "windmill",
    title: "Windmill",
    description: "Headless automation engine for complex workflows and scripts.",
    icon: <Zap className="w-8 h-8 text-yellow-500" />,
    category: "Automation",
    isExternal: true,
  },
  {
    id: "huly",
    title: "Huly",
    description: "Enterprise project management and team collaboration platform.",
    icon: <Layout className="w-8 h-8 text-blue-600" />,
    category: "Management",
    isExternal: true,
  },
  {
    id: "zitadel",
    title: "Zitadel",
    description: "Identity management and authentication for your applications.",
    icon: <Shield className="w-8 h-8 text-orange-500" />,
    category: "Security",
    isExternal: true,
  },
  {
    id: "plane",
    title: "Plane",
    description: "Open-source project management to track issues and epics.",
    icon: <Globe className="w-8 h-8 text-cyan-600" />,
    category: "Management",
    isExternal: true,
  },
  {
    id: "scryme",
    title: "Scryme",
    description: "Advanced analytics and reporting for enterprise operations.",
    icon: <Boxes className="w-8 h-8 text-purple-600" />,
    category: "Analytics",
    isExternal: true,
  },
];

export default function IntegrationsPage() {
  const [statuses, setStatuses] = useState<Record<string, any>>({});
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [isScrymeProvisioning, setIsScrymeProvisioning] = useState(false);
  const [configValues, setConfigValues] = useState<Record<string, any>>({});

  useEffect(() => {
    loadStatuses();
  }, []);

  const handleProvision = async () => {
    setIsProvisioning(true);
    try {
      const result = await provisionWindmill();
      if (result.success) {
        toast.success("Windmill workspace successfully provisioned and templates deployed!");
        setSelectedIntegration(null);
        loadStatuses();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to provision Windmill workspace automatically.");
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleScrymeProvision = async () => {
    setIsScrymeProvisioning(true);
    try {
      const result = await provisionScryme();
      if (result.success) {
        toast.success("Scryme Chat workspace successfully provisioned and channels created!");
        setSelectedIntegration(null);
        loadStatuses();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to provision Scryme Chat workspace automatically.");
    } finally {
      setIsScrymeProvisioning(false);
    }
  };

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
    const config = statuses[integration.id]?.config || {};
    setConfigValues(config);
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      switch (selectedIntegration.id) {
        case "windmill":
          await updateWindmillConfig(configValues as any);
          break;
        case "huly":
          await updateHulyConfig(configValues as any);
          break;
        case "zitadel":
          await updateZitadelConfig(configValues as any);
          break;
        case "plane":
          await updatePlaneConfig(configValues as any);
          break;
        case "scryme":
          await updateScrymeConfig(configValues as any);
          break;
      }
      toast.success(`${selectedIntegration.title} configuration updated`);
      setSelectedIntegration(null);
      loadStatuses();
    } catch (error) {
      toast.error("Failed to update configuration");
    } finally {
      setIsSaving(false);
    }
  };

  const renderConfigForm = () => {
    if (!selectedIntegration) return null;

    switch (selectedIntegration.id) {
      case "windmill":
        return (
          <div className="space-y-4 py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <h4 className="font-semibold text-amber-900 text-sm mb-1">One-Click Automatic Provisioning</h4>
              <p className="text-amber-700 text-xs mb-3">
                Let Dealio automatically spin up a dedicated Windmill tenant workspace and deploy all automation templates for your organization using global credentials.
              </p>
              <Button
                type="button"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white h-10 text-xs font-semibold"
                disabled={isProvisioning}
                onClick={handleProvision}
              >
                {isProvisioning ? "Provisioning..." : "Provision Automatically"}
              </Button>
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase font-medium">Or Configure Manually</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <div className="space-y-2">
              <Label>Windmill Base URL</Label>
              <Input
                value={configValues.windmillBaseUrl || ""}
                onChange={(e) => setConfigValues({ ...configValues, windmillBaseUrl: e.target.value })}
                placeholder="https://windmill.internal"
              />
            </div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                value={configValues.windmillApiKey || ""}
                onChange={(e) => setConfigValues({ ...configValues, windmillApiKey: e.target.value })}
                placeholder="••••••••••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label>Webhook Secret</Label>
              <Input
                type="password"
                value={configValues.webhookSecret || ""}
                onChange={(e) => setConfigValues({ ...configValues, webhookSecret: e.target.value })}
                placeholder="Optional"
              />
            </div>
          </div>
        );
      case "huly":
        return (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Workspace Slug</Label>
              <Input
                value={configValues.workspaceSlug || ""}
                onChange={(e) => setConfigValues({ ...configValues, workspaceSlug: e.target.value })}
                placeholder="my-workspace"
              />
            </div>
            <div className="space-y-2">
              <Label>Workspace URL</Label>
              <Input
                value={configValues.workspaceUrl || ""}
                onChange={(e) => setConfigValues({ ...configValues, workspaceUrl: e.target.value })}
                placeholder="https://huly.app"
              />
            </div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                value={configValues.apiKey || ""}
                onChange={(e) => setConfigValues({ ...configValues, apiKey: e.target.value })}
                placeholder="••••••••••••••••"
              />
            </div>
          </div>
        );
      case "zitadel":
        return (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Zitadel Org ID</Label>
              <Input
                value={configValues.zitadelOrgId || ""}
                onChange={(e) => setConfigValues({ ...configValues, zitadelOrgId: e.target.value })}
                placeholder="123456789"
              />
            </div>
            <div className="space-y-2">
              <Label>Project ID</Label>
              <Input
                value={configValues.zitadelProjectId || ""}
                onChange={(e) => setConfigValues({ ...configValues, zitadelProjectId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>App ID (OIDC)</Label>
              <Input
                value={configValues.zitadelAppId || ""}
                onChange={(e) => setConfigValues({ ...configValues, zitadelAppId: e.target.value })}
              />
            </div>
          </div>
        );
      case "plane":
        return (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Workspace ID</Label>
              <Input
                value={configValues.workspaceId || ""}
                onChange={(e) =>
                  setConfigValues({ ...configValues, workspaceId: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Workspace Slug</Label>
              <Input
                value={configValues.workspaceSlug || ""}
                onChange={(e) =>
                  setConfigValues({ ...configValues, workspaceSlug: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Access Token</Label>
              <Input
                type="password"
                value={configValues.accessToken || ""}
                onChange={(e) =>
                  setConfigValues({ ...configValues, accessToken: e.target.value })
                }
                placeholder="••••••••••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label>Refresh Token</Label>
              <Input
                type="password"
                value={configValues.refreshToken || ""}
                onChange={(e) =>
                  setConfigValues({ ...configValues, refreshToken: e.target.value })
                }
                placeholder="••••••••••••••••"
              />
            </div>
          </div>
        );
      case "scryme":
        return (
          <div className="space-y-4 py-4">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
              <h4 className="font-semibold text-purple-900 text-sm mb-1">One-Click Automatic Provisioning</h4>
              <p className="text-purple-700 text-xs mb-3">
                Let Scryme automatically spin up a dedicated Chat workspace and configure default channels (Announcements, Alerts, General) for your organization.
              </p>
              <Button
                type="button"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white h-10 text-xs font-semibold"
                disabled={isScrymeProvisioning}
                onClick={handleScrymeProvision}
              >
                {isScrymeProvisioning ? "Provisioning..." : "Provision Automatically"}
              </Button>
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase font-medium">Or Configure Manually</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <div className="space-y-2">
              <Label>Workspace ID</Label>
              <Input
                value={configValues.workspaceId || ""}
                onChange={(e) =>
                  setConfigValues({ ...configValues, workspaceId: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Workspace Slug</Label>
              <Input
                value={configValues.workspaceSlug || ""}
                onChange={(e) =>
                  setConfigValues({ ...configValues, workspaceSlug: e.target.value })
                }
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen bg-[#F9FAFB]">
      <Breadcrumbs
        items={[
          { label: "Settings", href: "/settings" },
          { label: "Integrations" },
        ]}
      />

      <div className="flex justify-between items-end mb-10 mt-6">
        <PageHeader
          title="Integrations Marketplace"
          subtitle="Connect your favorite tools and automate your enterprise operations."
          icon={<Boxes className="w-8 h-8 text-primary" />}
        />
        <div className="bg-white px-4 py-2 rounded-lg border border-gray-100 flex items-center gap-4 shadow-sm">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Status</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold text-gray-700">All Systems Operational</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {INTEGRATIONS.map((integration) => {
          const isConnected = statuses[integration.id]?.connected;
          const statusLabel = isConnected ? "Connected" : "Not Configured";

          const content = (
            <div
              onClick={() => handleOpenConfig(integration)}
              className={cn(
                "group relative bg-white rounded-2xl border border-gray-100 p-8 shadow-sm transition-all hover:shadow-xl hover:border-primary/20 cursor-pointer flex flex-col h-full",
                !integration.isExternal && "hover:border-indigo-200"
              )}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-primary/5 transition-colors">
                  {integration.icon}
                </div>
                {integration.isExternal ? (
                  <Badge
                    variant="outline"
                    className={cn(
                      "px-3 py-1 text-[10px] font-bold uppercase tracking-wider border-none",
                      isConnected
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-50 text-gray-400"
                    )}
                  >
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
                  <ArrowUpRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-600 transition-colors" />
                )}
              </div>

              <div className="mb-8">
                <div className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-1.5">
                  {integration.category}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">
                  {integration.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {integration.description}
                </p>
              </div>

              <div className="mt-auto flex items-center justify-between pt-6 border-t border-gray-50">
                <span className="text-xs font-semibold text-gray-400 group-hover:text-primary transition-colors">
                  {integration.isExternal ? "Manage Integration" : "View Tools"}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          );

          if (!integration.isExternal && integration.href) {
            return (
              <Link key={integration.id} href={integration.href} className="block h-full">
                {content}
              </Link>
            );
          }

          return <div key={integration.id}>{content}</div>;
        })}
      </div>

      <Sheet open={!!selectedIntegration} onOpenChange={(open) => !open && setSelectedIntegration(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader className="pb-8">
            <div className="p-4 bg-gray-50 rounded-2xl w-fit mb-4">
              {selectedIntegration?.icon}
            </div>
            <SheetTitle className="text-2xl font-bold">{selectedIntegration?.title} Configuration</SheetTitle>
            <SheetDescription>
              Configure the connection settings for {selectedIntegration?.title}.
              These settings are used to authenticate and sync data with your workspace.
            </SheetDescription>
          </SheetHeader>

          <Separator />

          {renderConfigForm()}

          <SheetFooter className="mt-10 gap-3">
            <Button variant="outline" className="flex-1 h-12" onClick={() => setSelectedIntegration(null)}>
              Cancel
            </Button>
            <Button className="flex-1 h-12 gap-2" onClick={handleSaveConfig} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Configuration"}
              <CheckCircle2 className="w-4 h-4" />
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
