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
  Hash,
  Lock,
  Users,
  Plus,
  Trash2,
  Shield,
  UserPlus,
  RefreshCw,
  MessageSquare,
  Sliders,
  Bell,
  ShoppingCart,
  Package,
  Calendar,
  AlertTriangle,
  Save,
  Check,
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
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@repo/ui/components/ui/tabs";
import { Separator } from "@repo/ui/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@repo/ui/lib/utils";
import {
  getIntegrationsStatus,
  provisionScryme,
  getScrymeWorkspaceDetails,
  createScrymeWorkspaceChannel,
  addScrymeWorkspaceMember,
  removeScrymeWorkspaceMember,
  updateScrymeChannelMappings,
} from "../actions/integrations";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

const queryClient = new QueryClient();

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
    alwaysActive: true,
  },
  {
    id: "scryme",
    title: "Scryme Chat",
    description: "Enterprise workspace chat, channel mappings, and operational alerts.",
    icon: <Boxes className="w-8 h-8 text-purple-600 dark:text-purple-400" />,
    category: "Communication",
    isExternal: true,
  },
  {
    id: "huly",
    title: "Huly Platform",
    description:
      "Enterprise project management and team collaboration platform.",
    icon: <Layout className="w-8 h-8 text-blue-600 dark:text-blue-400" />,
    category: "Management",
    isExternal: true,
  },
  {
    id: "plane",
    title: "Plane PM",
    description: "Open-source project management to track issues and epics.",
    icon: <Globe className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />,
    category: "Management",
    isExternal: true,
  },
];

const MAPPABLE_OPERATIONS = [
  {
    key: "po_alerts",
    label: "Purchase Order Alerts",
    description: "Approval requests, receipt confirmations, and PO status updates.",
    icon: <Package className="w-4 h-4 text-purple-500" />,
    defaultChannel: "alerts",
  },
  {
    key: "stock_alerts",
    label: "Inventory & Low Stock",
    description: "Low stock threshold warnings, variance reports, and batch alerts.",
    icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    defaultChannel: "alerts",
  },
  {
    key: "sales_alerts",
    label: "Sales & POS Transactions",
    description: "High-value sale notifications, register closures, and refund logs.",
    icon: <ShoppingCart className="w-4 h-4 text-emerald-500" />,
    defaultChannel: "general",
  },
  {
    key: "crm_alerts",
    label: "CRM & Deal Triggers",
    description: "New customer signups, deal stage transitions, and pipeline alerts.",
    icon: <Users className="w-4 h-4 text-blue-500" />,
    defaultChannel: "general",
  },
  {
    key: "staff_alerts",
    label: "Staff Shifts & Scheduling",
    description: "Shift assignments, break logs, and attendance overviews.",
    icon: <Calendar className="w-4 h-4 text-indigo-500" />,
    defaultChannel: "announcements",
  },
  {
    key: "system_alerts",
    label: "System & Workflow Notifications",
    description: "Automation step executions, error reports, and system events.",
    icon: <Bell className="w-4 h-4 text-rose-500" />,
    defaultChannel: "announcements",
  },
];

function IntegrationsPageContent() {
  const queryClient = useQueryClient();
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"active" | "available">("active");
  const [isScrymeProvisioning, setIsScrymeProvisioning] = useState(false);

  // Scryme Workspace Details & State
  const [scrymeTab, setScrymeTab] = useState<"mappings" | "channels" | "members" | "overview">("mappings");
  const [channelMappings, setChannelMappings] = useState<Record<string, string>>({});
  const [isSavingMappings, setIsSavingMappings] = useState(false);

  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelType, setNewChannelType] = useState<"public" | "private">("public");
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);

  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"admin" | "member">("member");
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Query for integration statuses
  const {
    data: statuses = {} as any,
    isLoading: isLoadingStatuses,
    refetch: refetchStatuses,
  } = useQuery<any>({
    queryKey: ["integrations", "statuses"],
    queryFn: getIntegrationsStatus,
    staleTime: 5 * 60 * 1000,
  });

  // Query for Scryme workspace details
  const {
    data: scrymeDetails,
    isLoading: isLoadingScrymeDetails,
    refetch: refetchScrymeDetails,
  } = useQuery<any>({
    queryKey: ["scryme", "workspace", "details"],
    queryFn: getScrymeWorkspaceDetails,
    enabled: selectedIntegration?.id === "scryme" && Boolean((statuses as Record<string, any>)?.scryme?.connected),
    staleTime: 30 * 1000,
  });

  // Keep local channel mappings in sync with fetched data
  useEffect(() => {
    if (scrymeDetails?.channelMappings) {
      setChannelMappings(scrymeDetails.channelMappings);
    }
  }, [scrymeDetails?.channelMappings]);

  // Provisioning Scryme
  const provisionMutation = useMutation({
    mutationFn: provisionScryme,
    onSuccess: (result) => {
      if (result.success) {
        toast.success(
          "Scryme Chat workspace successfully provisioned and default channels created!"
        );
        queryClient.invalidateQueries({ queryKey: ["integrations", "statuses"] });
        queryClient.invalidateQueries({ queryKey: ["scryme", "workspace", "details"] });
      }
    },
    onError: (error: any) => {
      toast.error(
        error.message ||
          "Failed to provision Scryme Chat workspace automatically."
      );
    },
  });

  // Update Scryme Channel Mappings
  const updateMappingsMutation = useMutation({
    mutationFn: updateScrymeChannelMappings,
    onSuccess: (res) => {
      toast.success("Channel mappings updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["integrations", "statuses"] });
      queryClient.invalidateQueries({ queryKey: ["scryme", "workspace", "details"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update channel mappings");
    },
  });

  // Create Channel
  const createChannelMutation = useMutation({
    mutationFn: createScrymeWorkspaceChannel,
    onSuccess: (res, variables) => {
      if (res.message) toast.info(res.message);
      else toast.success(`Channel #${variables.name} created!`);
      setNewChannelName("");
      queryClient.invalidateQueries({ queryKey: ["scryme", "workspace", "details"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create channel");
    },
  });

  // Add Member
  const addMemberMutation = useMutation({
    mutationFn: addScrymeWorkspaceMember,
    onSuccess: (res, variables) => {
      if (res.message) toast.info(res.message);
      else toast.success(`Granted ${variables.email} workspace access`);
      setNewMemberEmail("");
      queryClient.invalidateQueries({ queryKey: ["scryme", "workspace", "details"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add member");
    },
  });

  // Remove Member
  const removeMemberMutation = useMutation({
    mutationFn: removeScrymeWorkspaceMember,
    onSuccess: (res) => {
      if (res.message) toast.info(res.message);
      else toast.success("Removed member access");
      queryClient.invalidateQueries({ queryKey: ["scryme", "workspace", "details"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove member");
    },
  });

  const handleOpenConfig = (integration: any) => {
    if (!integration.isExternal) return;
    setSelectedIntegration(integration);
  };

  const handleScrymeProvision = async () => {
    setIsScrymeProvisioning(true);
    await provisionMutation.mutateAsync();
    setIsScrymeProvisioning(false);
  };

  const handleSaveMappings = async () => {
    setIsSavingMappings(true);
    await updateMappingsMutation.mutateAsync(channelMappings);
    setIsSavingMappings(false);
  };

  // Filter Active vs Available integrations
  const activeIntegrations = INTEGRATIONS.filter((item) => {
    if (item.alwaysActive) return true;
    return Boolean((statuses as Record<string, any>)?.[item.id]?.connected);
  });

  const availableIntegrations = INTEGRATIONS.filter((item) => {
    if (item.alwaysActive) return false;
    return !Boolean((statuses as Record<string, any>)?.[item.id]?.connected);
  });

  const renderSheetBody = () => {
    if (!selectedIntegration) return null;

    switch (selectedIntegration.id) {
      case "huly":
        return (
          <div className="py-4">
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl p-4 space-y-2">
              <h4 className="font-semibold text-blue-900 dark:text-blue-300 text-sm">
                Connect Huly Platform
              </h4>
              <p className="text-blue-700 dark:text-blue-400/80 text-xs leading-relaxed">
                Huly integration setup is managed by your workspace administrator. Reach out to your admin team or configure Huly credentials in the System Admin portal to enable this connection.
              </p>
            </div>
          </div>
        );
      case "plane":
        return (
          <div className="py-4">
            <div className="bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-900 rounded-xl p-4 space-y-2">
              <h4 className="font-semibold text-cyan-900 dark:text-cyan-300 text-sm">
                Connect Plane PM
              </h4>
              <p className="text-cyan-700 dark:text-cyan-400/80 text-xs leading-relaxed">
                Plane PM integration setup is managed by your workspace administrator. Reach out to your admin team or configure Plane OAuth/API tokens in the System Admin portal to enable this connection.
              </p>
            </div>
          </div>
        );
      case "scryme":
        const isProvisioned = (statuses as Record<string, any>)?.scryme?.connected;
        if (!isProvisioned) {
          return (
            <div className="py-4 space-y-4">
              <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-purple-900 dark:text-purple-300">
                  <Zap className="w-5 h-5 text-purple-600" />
                  <h4 className="font-bold text-sm">One-Click Automatic Provisioning</h4>
                </div>
                <p className="text-purple-700 dark:text-purple-400/80 text-xs leading-relaxed">
                  Let Scryme automatically spin up a dedicated Chat workspace and configure default channels (Announcements, Alerts, General) for your organization.
                </p>
                <Button
                  type="button"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white h-10 text-xs font-semibold shadow-sm"
                  disabled={isScrymeProvisioning || provisionMutation.isPending}
                  onClick={handleScrymeProvision}>
                  {isScrymeProvisioning || provisionMutation.isPending
                    ? "Provisioning Workspace..."
                    : "Provision Workspace Automatically"}
                </Button>
              </div>
            </div>
          );
        }

        const channelsList = scrymeDetails?.channels || [
          { id: "ch_announcements", slug: "announcements", name: "Announcements", type: "public" },
          { id: "ch_alerts", slug: "alerts", name: "Alerts", type: "public" },
          { id: "ch_general", slug: "general", name: "General", type: "public" },
        ];

        return (
          <div className="flex flex-col gap-4 py-2">
            {/* Sheet Sub-Tabs */}
            <div className="flex border-b border-border gap-1 overflow-x-auto pb-1">
              <button
                type="button"
                className={cn(
                  "px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap",
                  scrymeTab === "mappings"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setScrymeTab("mappings")}>
                <Sliders className="w-3.5 h-3.5" /> Channel Mappings
              </button>
              <button
                type="button"
                className={cn(
                  "px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap",
                  scrymeTab === "channels"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setScrymeTab("channels")}>
                <Hash className="w-3.5 h-3.5" /> Channels ({channelsList.length})
              </button>
              <button
                type="button"
                className={cn(
                  "px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap",
                  scrymeTab === "members"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setScrymeTab("members")}>
                <Users className="w-3.5 h-3.5" /> Members ({scrymeDetails?.members?.length || 0})
              </button>
              <button
                type="button"
                className={cn(
                  "px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap",
                  scrymeTab === "overview"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setScrymeTab("overview")}>
                <MessageSquare className="w-3.5 h-3.5" /> Overview
              </button>
            </div>

            {/* Tab: Channel Mappings */}
            {scrymeTab === "mappings" && (
              <div className="flex flex-col gap-4 pt-2">
                <div className="bg-muted/40 p-3 rounded-lg border border-border text-xs text-muted-foreground leading-relaxed">
                  Map system operations and alerts directly to target Scryme Chat channels. Automated triggers will automatically post to your selected channel.
                </div>

                <div className="flex flex-col gap-3 max-h-[55vh] overflow-y-auto pr-1">
                  {MAPPABLE_OPERATIONS.map((op) => {
                    const currentChannelSlug =
                      channelMappings[op.key] || op.defaultChannel;

                    return (
                      <div
                        key={op.key}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card shadow-2xs">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-muted/60 mt-0.5">
                            {op.icon}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-foreground">
                              {op.label}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {op.description}
                            </div>
                          </div>
                        </div>

                        <div className="w-full sm:w-44 shrink-0">
                          <select
                            value={currentChannelSlug}
                            onChange={(e) =>
                              setChannelMappings((prev) => ({
                                ...prev,
                                [op.key]: e.target.value,
                              }))
                            }
                            className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                            {channelsList.map((ch: any) => (
                              <option key={ch.id || ch.slug} value={ch.slug}>
                                #{ch.name || ch.slug}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <Button
                    type="button"
                    onClick={handleSaveMappings}
                    disabled={isSavingMappings || updateMappingsMutation.isPending}
                    className="w-full gap-2 h-9 text-xs font-semibold">
                    <Save className="w-3.5 h-3.5" />
                    {isSavingMappings || updateMappingsMutation.isPending
                      ? "Saving Mappings..."
                      : "Save Channel Mappings"}
                  </Button>
                </div>
              </div>
            )}

            {/* Tab: Channels */}
            {scrymeTab === "channels" && (
              <div className="flex flex-col gap-4 pt-2">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newChannelName.trim()) return;
                    setIsCreatingChannel(true);
                    await createChannelMutation.mutateAsync({
                      name: newChannelName.trim(),
                      type: newChannelType,
                    });
                    setIsCreatingChannel(false);
                  }}
                  className="flex gap-2 items-end">
                  <div className="flex-1 flex flex-col gap-1">
                    <Label className="text-[11px]">New Channel Name</Label>
                    <Input
                      placeholder="e.g. logistics"
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1 w-28">
                    <Label className="text-[11px]">Type</Label>
                    <select
                      value={newChannelType}
                      onChange={(e) => setNewChannelType(e.target.value as any)}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs">
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 gap-1 text-xs"
                    disabled={isCreatingChannel || createChannelMutation.isPending}>
                    <Plus className="w-3 h-3" /> Create
                  </Button>
                </form>

                <div className="max-h-60 overflow-y-auto flex flex-col gap-1.5 border border-border rounded-lg p-2 bg-muted/20">
                  {channelsList.length ? (
                    channelsList.map((ch: any) => (
                      <div
                        key={ch.id || ch.slug}
                        className="flex items-center justify-between p-2.5 rounded-md bg-card border border-border text-xs">
                        <div className="flex items-center gap-2">
                          {ch.type === "private" ? (
                            <Lock className="w-3.5 h-3.5 text-amber-500" />
                          ) : (
                            <Hash className="w-3.5 h-3.5 text-primary" />
                          )}
                          <span className="font-semibold text-foreground">
                            #{ch.name || ch.slug}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase font-mono">
                          {ch.type || "public"}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-xs text-muted-foreground">
                      No channels found.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Members */}
            {scrymeTab === "members" && (
              <div className="flex flex-col gap-4 pt-2">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newMemberEmail.trim()) return;
                    setIsAddingMember(true);
                    await addMemberMutation.mutateAsync({
                      email: newMemberEmail.trim(),
                      role: newMemberRole,
                    });
                    setIsAddingMember(false);
                  }}
                  className="flex gap-2 items-end">
                  <div className="flex-1 flex flex-col gap-1">
                    <Label className="text-[11px]">Member Email</Label>
                    <Input
                      placeholder="colleague@company.com"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1 w-24">
                    <Label className="text-[11px]">Role</Label>
                    <select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value as any)}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs">
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 gap-1 text-xs"
                    disabled={isAddingMember || addMemberMutation.isPending}>
                    <UserPlus className="w-3 h-3" /> Grant
                  </Button>
                </form>

                <div className="max-h-60 overflow-y-auto flex flex-col gap-1.5 border border-border rounded-lg p-2 bg-muted/20">
                  {scrymeDetails?.members?.length ? (
                    scrymeDetails.members.map((m: any) => (
                      <div
                        key={m.id || m.email}
                        className="flex items-center justify-between p-2.5 rounded-md bg-card border border-border text-xs">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">
                            {m.name || m.email}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {m.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] uppercase font-mono">
                            {m.role || "member"}
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:bg-destructive/10"
                            onClick={async () => {
                              await removeMemberMutation.mutateAsync(m.id || m.email);
                            }}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-xs text-muted-foreground">
                      No members configured.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Overview */}
            {scrymeTab === "overview" && (
              <div className="flex flex-col gap-3 pt-2">
                <div className="bg-muted/50 rounded-lg p-3 text-xs flex flex-col gap-2 border border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Workspace Slug:</span>
                    <Badge variant="outline" className="font-mono text-[11px]">
                      {(statuses as Record<string, any>)?.scryme?.config?.workspaceSlug || "org-workspace"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Integration Status:</span>
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 font-semibold">
                      Active Workspace
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-muted-foreground">Re-sync workspace data</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs"
                    disabled={isLoadingScrymeDetails}
                    onClick={() => refetchScrymeDetails()}>
                    <RefreshCw className={cn("w-3 h-3", isLoadingScrymeDetails && "animate-spin")} />
                    Sync
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const renderIntegrationCard = (integration: typeof INTEGRATIONS[0]) => {
    const isConnected = integration.alwaysActive || Boolean((statuses as Record<string, any>)?.[integration.id]?.connected);
    const statusLabel = isConnected ? "Connected" : "Available";

    const content = (
      <div
        onClick={() => handleOpenConfig(integration)}
        className={cn(
          "group relative bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-2xs transition-all hover:shadow-xl hover:border-primary/20 cursor-pointer flex flex-col h-full",
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
                  <Plus className="w-3 h-3" /> {statusLabel}
                </span>
              )}
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider border-none bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3" /> Connected
              </span>
            </Badge>
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
            {integration.isExternal
              ? isConnected
                ? "Customize & Manage"
                : "Configure Integration"
              : "Access Developer Tools"}
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all" />
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
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-350 mx-auto min-h-screen bg-background">
      <Breadcrumbs
        items={[
          { label: "Settings", href: "/settings" },
          { label: "Integrations" },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8 mt-6">
        <PageHeader
          title="Integrations & Apps"
          subtitle="Connect enterprise messaging, project management, developer tools, and operational webhooks."
          icon={<Boxes className="w-8 h-8 text-primary" />}
        />
        <div className="bg-card px-4 py-2 rounded-lg border border-border flex items-center gap-4 shadow-2xs w-fit">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">
              Status
            </span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-foreground">
                All Systems Operational
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Active / Available Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "active" | "available")}
        className="w-full space-y-6">
        <TabsList className="bg-muted p-1 rounded-xl">
          <TabsTrigger value="active" className="text-xs font-semibold px-4 py-2 gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Active Integrations
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4 font-mono">
              {activeIntegrations.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="available" className="text-xs font-semibold px-4 py-2 gap-2">
            <Plus className="w-3.5 h-3.5 text-muted-foreground" />
            Available Apps
            <Badge variant="outline" className="ml-1 text-[10px] px-1.5 py-0 h-4 font-mono">
              {availableIntegrations.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="focus-visible:outline-none">
          {activeIntegrations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
              {activeIntegrations.map((integration) => renderIntegrationCard(integration))}
            </div>
          ) : (
            <div className="p-12 text-center bg-card rounded-2xl border border-border space-y-3">
              <Boxes className="w-10 h-10 text-muted-foreground mx-auto" />
              <h3 className="text-base font-bold text-foreground">No active integrations</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Select the Available Apps tab to connect Scryme Chat, Huly, Plane, or other external services.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="available" className="focus-visible:outline-none">
          {availableIntegrations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
              {availableIntegrations.map((integration) => renderIntegrationCard(integration))}
            </div>
          ) : (
            <div className="p-12 text-center bg-card rounded-2xl border border-border space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-foreground">All integrations connected!</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                You have connected all available integrations to your workspace.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Integration Customization Sheet */}
      <Sheet
        open={!!selectedIntegration}
        onOpenChange={(open) => !open && setSelectedIntegration(null)}>
        <SheetContent side="right" className="sm:max-w-md lg:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-4 border-b border-border">
            <div className="p-3 bg-muted rounded-xl w-fit mb-2">
              {selectedIntegration?.icon}
            </div>
            <SheetTitle className="text-xl font-bold">
              {selectedIntegration?.title} Settings
            </SheetTitle>
            <SheetDescription className="text-xs">
              Customize settings, channel mappings, and permissions for {selectedIntegration?.title}.
            </SheetDescription>
          </SheetHeader>

          <div className="py-2">{renderSheetBody()}</div>

          <SheetFooter className="mt-auto pt-4 border-t border-border">
            <Button
              variant="outline"
              className="w-full h-10 text-xs font-semibold"
              onClick={() => setSelectedIntegration(null)}>
              Done
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <IntegrationsPageContent />
    </QueryClientProvider>
  );
}
