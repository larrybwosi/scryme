"use client";

import { useState } from "react";
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
  getScrymeWorkspaceDetails,
  createScrymeWorkspaceChannel,
  addScrymeWorkspaceMember,
  removeScrymeWorkspaceMember,
} from "../actions/integrations";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Hash, Lock, Users, Plus, Trash2, Shield, UserPlus, RefreshCw, MessageSquare } from "lucide-react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

// Create a client
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

function IntegrationsPageContent() {
  const queryClient = useQueryClient();
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
  const [isScrymeProvisioning, setIsScrymeProvisioning] = useState(false);

  // Scryme Workspace Management Details
  const [scrymeTab, setScrymeTab] = useState<"overview" | "channels" | "members">("overview");
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
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Query for Scryme workspace details (only when Scryme is connected)
  const {
    data: scrymeDetails,
    isLoading: isLoadingScrymeDetails,
    refetch: refetchScrymeDetails,
  } = useQuery<any>({
    queryKey: ["scryme", "workspace", "details"],
    queryFn: getScrymeWorkspaceDetails,
    enabled: selectedIntegration?.id === "scryme" && Boolean((statuses as Record<string, any>)?.scryme?.connected),
    staleTime: 30 * 1000, // 30 seconds
  });

  // Mutation for provisioning Scryme
  const provisionMutation = useMutation({
    mutationFn: provisionScryme,
    onSuccess: (result) => {
      if (result.success) {
        toast.success(
          "Scryme Chat workspace successfully provisioned and channels created!"
        );
        setSelectedIntegration(null);
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

  // Mutation for creating a channel
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

  // Mutation for adding a member
  const addMemberMutation = useMutation({
    mutationFn: addScrymeWorkspaceMember,
    onSuccess: (res, variables) => {
      if (res.message) toast.info(res.message);
      else toast.success(`Granted ${variables.email} access to workspace`);
      setNewMemberEmail("");
      queryClient.invalidateQueries({ queryKey: ["scryme", "workspace", "details"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add member");
    },
  });

  // Mutation for removing a member
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
        const isProvisioned = (statuses as Record<string, any>)?.scryme?.connected;
        if (!isProvisioned) {
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
                  disabled={isScrymeProvisioning || provisionMutation.isPending}
                  onClick={handleScrymeProvision}>
                  {isScrymeProvisioning || provisionMutation.isPending
                    ? "Provisioning..."
                    : "Provision Automatically"}
                </Button>
              </div>
            </div>
          );
        }

        return (
          <div className="py-2 flex flex-col gap-4">
            {/* Tabs Bar */}
            <div className="flex border-b border-border">
              <button
                type="button"
                className={cn(
                  "px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5",
                  scrymeTab === "overview"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setScrymeTab("overview")}>
                <MessageSquare className="w-3.5 h-3.5" /> Overview
              </button>
              <button
                type="button"
                className={cn(
                  "px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5",
                  scrymeTab === "channels"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setScrymeTab("channels")}>
                <Hash className="w-3.5 h-3.5" /> Channels ({scrymeDetails?.channels?.length || 0})
              </button>
              <button
                type="button"
                className={cn(
                  "px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5",
                  scrymeTab === "members"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setScrymeTab("members")}>
                <Users className="w-3.5 h-3.5" /> Members Access ({scrymeDetails?.members?.length || 0})
              </button>
            </div>

            {/* Tab: Overview */}
            {scrymeTab === "overview" && (
              <div className="flex flex-col gap-3 pt-2">
                <div className="bg-muted/50 rounded-lg p-3 text-xs flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Workspace Slug:</span>
                    <Badge variant="outline" className="font-mono text-[11px]">
                      {(statuses as Record<string, any>)?.scryme?.config?.workspaceSlug || "org-workspace"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Integration Status:</span>
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">
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
                    <Label className="text-[11px]">Channel Name</Label>
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
                    <Plus className="w-3 h-3" /> Add
                  </Button>
                </form>

                <div className="max-h-48 overflow-y-auto flex flex-col gap-1.5 border border-border rounded-lg p-2 bg-muted/20">
                  {scrymeDetails?.channels?.length ? (
                    scrymeDetails.channels.map((ch: any) => (
                      <div key={ch.id || ch.slug} className="flex items-center justify-between p-2 rounded-md bg-card border border-border text-xs">
                        <div className="flex items-center gap-2">
                          {ch.type === "private" ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <Hash className="w-3.5 h-3.5 text-primary" />}
                          <span className="font-semibold text-foreground">{ch.name || ch.slug}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase font-mono">
                          {ch.type || "public"}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-xs text-muted-foreground">
                      No custom channels found.
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
                    <UserPlus className="w-3 h-3" /> Add
                  </Button>
                </form>

                <div className="max-h-48 overflow-y-auto flex flex-col gap-1.5 border border-border rounded-lg p-2 bg-muted/20">
                  {scrymeDetails?.members?.length ? (
                    scrymeDetails.members.map((m: any) => (
                      <div key={m.id || m.email} className="flex items-center justify-between p-2 rounded-md bg-card border border-border text-xs">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{m.name || m.email}</span>
                          <span className="text-[10px] text-muted-foreground">{m.email}</span>
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
          const isConnected = (statuses as Record<string, any>)?.[integration.id]?.connected;
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

export default function IntegrationsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <IntegrationsPageContent />
    </QueryClientProvider>
  );
}
