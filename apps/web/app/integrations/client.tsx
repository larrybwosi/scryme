"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Boxes,
  Bot,
  Zap,
  Layout,
  Terminal,
  CheckCircle2,
  ChevronRight,
  Globe,
  Hash,
  Lock,
  Users,
  Plus,
  Trash2,
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
  Search,
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
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { toast } from "sonner";
import { cn } from "@repo/ui/lib/utils";
import {
  getIntegrationsStatus,
  provisionScryme,
  getScrymeWorkspaceDetails,
  createScrymeWorkspaceChannel,
  updateScrymeWorkspaceChannel,
  addScrymeWorkspaceMember,
  removeScrymeWorkspaceMember,
  updateScrymeChannelMappings,
} from "../actions/integrations";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

const queryClient = new QueryClient();

/* -------------------------------------------------------------------------- */
/*  Data                                                                      */
/* -------------------------------------------------------------------------- */

const ScrymeIntegrationIcon = () => (
  <div className="w-5 h-5 rounded-md bg-emerald-600 flex items-center justify-center shrink-0">
    <span className="text-white font-black text-[11px] leading-none">S</span>
  </div>
);

type Integration = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tone: string; // tile background / ring colour
  category: string;
  isExternal: boolean;
  alwaysActive?: boolean;
  href?: string;
  actionLabel?: string;
};

const INTEGRATIONS: Integration[] = [
  {
    id: "mcp",
    title: "Model Context Protocol",
    description:
      "Connect Claude Desktop, Cursor, or custom AI agents to your live workspace data.",
    icon: <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
    tone: "bg-indigo-500/10",
    href: "/integrations/mcp",
    category: "AI & Automation",
    isExternal: false,
    alwaysActive: true,
    actionLabel: "Open",
  },
  {
    id: "developer-tools",
    title: "Developer Tools",
    description: "API clients, webhooks, and device provisioning for developers.",
    icon: <Terminal className="w-5 h-5 text-slate-600 dark:text-slate-300" />,
    tone: "bg-slate-500/10",
    href: "/integrations/apps-api",
    category: "Infrastructure",
    isExternal: false,
    alwaysActive: true,
    actionLabel: "Open",
  },
  {
    id: "scryme",
    title: "Scryme Chat",
    description:
      "Workspace chat, channel mappings, and operational alerts for your team.",
    icon: <ScrymeIntegrationIcon />,
    tone: "bg-emerald-500/10",
    category: "Communication",
    isExternal: true,
  },
  {
    id: "huly",
    title: "Huly Platform",
    description: "Project management and team collaboration platform.",
    icon: <Layout className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
    tone: "bg-blue-500/10",
    category: "Management",
    isExternal: true,
  },
  {
    id: "plane",
    title: "Plane PM",
    description: "Open-source project management to track issues and epics.",
    icon: <Globe className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
    tone: "bg-cyan-500/10",
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
    description: "Low stock warnings, variance reports, and batch alerts.",
    icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    defaultChannel: "alerts",
  },
  {
    key: "sales_alerts",
    label: "Sales & POS Transactions",
    description: "High-value sales, register closures, and refund logs.",
    icon: <ShoppingCart className="w-4 h-4 text-emerald-500" />,
    defaultChannel: "general",
  },
  {
    key: "crm_alerts",
    label: "CRM & Deal Triggers",
    description: "New customer signups, deal stage changes, and pipeline alerts.",
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

const SCRYME_TABS = [
  { id: "mappings", label: "Mappings", icon: Sliders },
  { id: "channels", label: "Channels", icon: Hash },
  { id: "members", label: "Members", icon: Users },
  { id: "overview", label: "Overview", icon: MessageSquare },
] as const;

type ScrymeTab = (typeof SCRYME_TABS)[number]["id"];

const selectClass =
  "h-8 rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary";

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

function IntegrationsPageContent() {
  const qc = useQueryClient();
  const [selectedIntegration, setSelectedIntegration] =
    useState<Integration | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "available">("active");
  const [search, setSearch] = useState("");

  // Scryme state
  const [scrymeTab, setScrymeTab] = useState<ScrymeTab>("mappings");
  const [channelMappings, setChannelMappings] = useState<Record<string, string>>({});

  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelType, setNewChannelType] = useState<"public" | "private">("public");

  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [editChannelName, setEditChannelName] = useState("");
  const [editChannelType, setEditChannelType] = useState<"public" | "private">("public");
  const [editAllowedUserIds, setEditAllowedUserIds] = useState<string[]>([]);

  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"admin" | "member">("member");

  /* ------------------------------- Queries -------------------------------- */

  const { data: statuses = {} as any, isLoading: isLoadingStatuses } =
    useQuery<any>({
      queryKey: ["integrations", "statuses"],
      queryFn: getIntegrationsStatus,
      staleTime: 5 * 60 * 1000,
    });

  const isConnectedFn = (item: Integration) =>
    Boolean(item.alwaysActive) ||
    Boolean((statuses as Record<string, any>)?.[item.id]?.connected);

  const scrymeConnected = Boolean(
    (statuses as Record<string, any>)?.scryme?.connected,
  );

  const {
    data: scrymeDetails,
    isLoading: isLoadingScrymeDetails,
    refetch: refetchScrymeDetails,
  } = useQuery<any>({
    queryKey: ["scryme", "workspace", "details"],
    queryFn: getScrymeWorkspaceDetails,
    enabled: selectedIntegration?.id === "scryme" && scrymeConnected,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (scrymeDetails?.channelMappings) {
      setChannelMappings(scrymeDetails.channelMappings);
    }
  }, [scrymeDetails?.channelMappings]);

  /* ------------------------------ Mutations ------------------------------- */

  const invalidateScryme = () =>
    qc.invalidateQueries({ queryKey: ["scryme", "workspace", "details"] });

  const provisionMutation = useMutation({
    mutationFn: provisionScryme,
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Scryme Chat workspace provisioned with default channels.");
        qc.invalidateQueries({ queryKey: ["integrations", "statuses"] });
        invalidateScryme();
      }
    },
    onError: (error: any) =>
      toast.error(error.message || "Failed to provision Scryme Chat workspace."),
  });

  const updateMappingsMutation = useMutation({
    mutationFn: updateScrymeChannelMappings,
    onSuccess: () => {
      toast.success("Channel mappings saved.");
      qc.invalidateQueries({ queryKey: ["integrations", "statuses"] });
      invalidateScryme();
    },
    onError: (error: any) =>
      toast.error(error.message || "Failed to update channel mappings"),
  });

  const createChannelMutation = useMutation({
    mutationFn: createScrymeWorkspaceChannel,
    onSuccess: (res, variables) => {
      if (res.message) toast.info(res.message);
      else toast.success(`Channel #${variables.name} created.`);
      setNewChannelName("");
      invalidateScryme();
    },
    onError: (error: any) => toast.error(error.message || "Failed to create channel"),
  });

  const updateChannelMutation = useMutation({
    mutationFn: updateScrymeWorkspaceChannel,
    onSuccess: (res, variables) => {
      if (res.message) toast.info(res.message);
      else toast.success(`Channel #${variables.name} updated.`);
      setEditingChannelId(null);
      invalidateScryme();
    },
    onError: (error: any) => toast.error(error.message || "Failed to update channel"),
  });

  const addMemberMutation = useMutation({
    mutationFn: addScrymeWorkspaceMember,
    onSuccess: (res, variables) => {
      if (res.message) toast.info(res.message);
      else toast.success(`Granted ${variables.email} workspace access.`);
      setNewMemberEmail("");
      invalidateScryme();
    },
    onError: (error: any) => toast.error(error.message || "Failed to add member"),
  });

  const removeMemberMutation = useMutation({
    mutationFn: removeScrymeWorkspaceMember,
    onSuccess: (res) => {
      if (res.message) toast.info(res.message);
      else toast.success("Member access removed.");
      invalidateScryme();
    },
    onError: (error: any) => toast.error(error.message || "Failed to remove member"),
  });

  /* ------------------------------- Derived -------------------------------- */

  const matchesSearch = (item: Integration) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  };

  const activeIntegrations = useMemo(
    () => INTEGRATIONS.filter((i) => isConnectedFn(i)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [statuses],
  );
  const availableIntegrations = useMemo(
    () => INTEGRATIONS.filter((i) => !isConnectedFn(i)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [statuses],
  );

  const visibleActive = activeIntegrations.filter(matchesSearch);
  const visibleAvailable = availableIntegrations.filter(matchesSearch);

  /* ------------------------------ Handlers -------------------------------- */

  const handleOpenConfig = (integration: Integration) => {
    if (!integration.isExternal) return;
    setScrymeTab("mappings");
    setEditingChannelId(null);
    setSelectedIntegration(integration);
  };

  /* ---------------------------- Scryme panel ------------------------------ */

  const renderScrymePanel = () => {
    if (!scrymeConnected) {
      return (
        <div className="py-4">
          <div className="rounded-lg border border-border bg-muted/30 p-5 space-y-3">
            <div className="flex items-center gap-2 text-foreground">
              <Zap className="w-4 h-4 text-emerald-600" />
              <h4 className="font-semibold text-sm">One-click provisioning</h4>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Automatically create a dedicated Chat workspace with default
              channels (announcements, alerts, general) for your organization.
            </p>
            <Button
              type="button"
              className="w-full h-9 text-xs font-semibold"
              disabled={provisionMutation.isPending}
              onClick={() => provisionMutation.mutate()}>
              {provisionMutation.isPending
                ? "Provisioning workspace..."
                : "Provision workspace"}
            </Button>
          </div>
        </div>
      );
    }

    const channelsList: any[] = scrymeDetails?.channels || [
      { id: "ch_announcements", slug: "announcements", name: "announcements", type: "public" },
      { id: "ch_alerts", slug: "alerts", name: "alerts", type: "public" },
      { id: "ch_general", slug: "general", name: "general", type: "public" },
    ];
    const memberList: any[] = scrymeDetails?.members || [];

    const counts: Partial<Record<ScrymeTab, number>> = {
      channels: channelsList.length,
      members: memberList.length,
    };

    return (
      <div className="flex flex-col gap-4 py-2">
        {/* Sub-tabs */}
        <div
          role="tablist"
          className="flex border-b border-border gap-1 overflow-x-auto">
          {SCRYME_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={scrymeTab === id}
              onClick={() => setScrymeTab(id)}
              className={cn(
                "px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 whitespace-nowrap",
                scrymeTab === id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}>
              <Icon className="w-3.5 h-3.5" />
              {label}
              {counts[id] !== undefined && (
                <span className="text-[10px] font-mono text-muted-foreground">
                  {counts[id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Mappings */}
        {scrymeTab === "mappings" && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Choose where each type of automated alert is posted.
            </p>

            <div className="flex flex-col gap-2 max-h-[52vh] overflow-y-auto pr-1">
              {MAPPABLE_OPERATIONS.map((op) => {
                const current = channelMappings[op.key] || op.defaultChannel;
                return (
                  <div
                    key={op.key}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-border bg-card">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-1.5 rounded-md bg-muted/60 shrink-0">
                        {op.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground truncate">
                          {op.label}
                        </div>
                        <div className="text-[11px] text-muted-foreground line-clamp-1">
                          {op.description}
                        </div>
                      </div>
                    </div>
                    <select
                      aria-label={`Channel for ${op.label}`}
                      value={current}
                      onChange={(e) =>
                        setChannelMappings((prev) => ({
                          ...prev,
                          [op.key]: e.target.value,
                        }))
                      }
                      className={cn(selectClass, "w-36 shrink-0")}>
                      {channelsList.map((ch) => (
                        <option key={ch.id || ch.slug} value={ch.slug}>
                          #{ch.name || ch.slug}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>

            <Button
              type="button"
              onClick={() => updateMappingsMutation.mutate(channelMappings)}
              disabled={updateMappingsMutation.isPending}
              className="w-full gap-2 h-9 text-xs font-semibold">
              <Save className="w-3.5 h-3.5" />
              {updateMappingsMutation.isPending ? "Saving..." : "Save mappings"}
            </Button>
          </div>
        )}

        {/* Channels */}
        {scrymeTab === "channels" && (
          <div className="flex flex-col gap-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newChannelName.trim()) return;
                createChannelMutation.mutate({
                  name: newChannelName.trim(),
                  type: newChannelType,
                });
              }}
              className="flex gap-2 items-end">
              <div className="flex-1 flex flex-col gap-1">
                <Label className="text-[11px]">New channel</Label>
                <Input
                  placeholder="e.g. logistics"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="flex flex-col gap-1 w-24">
                <Label className="text-[11px]">Type</Label>
                <select
                  value={newChannelType}
                  onChange={(e) => setNewChannelType(e.target.value as any)}
                  className={selectClass}>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <Button
                type="submit"
                size="sm"
                className="h-8 gap-1 text-xs"
                disabled={
                  !newChannelName.trim() || createChannelMutation.isPending
                }>
                <Plus className="w-3 h-3" /> Create
              </Button>
            </form>

            <div className="max-h-[48vh] overflow-y-auto flex flex-col gap-1.5">
              {channelsList.length ? (
                channelsList.map((ch) => {
                  const chId = ch.id || ch.slug;
                  const isEditing = editingChannelId === chId;
                  return (
                    <div
                      key={chId}
                      className="flex flex-col gap-2 px-3 py-2 rounded-lg bg-card border border-border text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          {ch.type === "private" ? (
                            <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          ) : (
                            <Hash className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          )}
                          <span className="font-semibold text-foreground truncate">
                            {ch.name || ch.slug}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase font-mono">
                            {ch.type || "public"}
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[11px]"
                            onClick={() => {
                              if (isEditing) {
                                setEditingChannelId(null);
                              } else {
                                setEditingChannelId(chId);
                                setEditChannelName(ch.name || ch.slug);
                                setEditChannelType(ch.type || "public");
                                setEditAllowedUserIds(
                                  ch.allowedUserIds || ch.allowedUsers || [],
                                );
                              }
                            }}>
                            {isEditing ? "Cancel" : "Edit"}
                          </Button>
                        </div>
                      </div>

                      {isEditing && (
                        <div className="flex flex-col gap-3 pt-2 border-t border-border">
                          <div className="flex gap-2">
                            <div className="flex-1 flex flex-col gap-1">
                              <Label className="text-[10px]">Channel name</Label>
                              <Input
                                value={editChannelName}
                                onChange={(e) => setEditChannelName(e.target.value)}
                                className="h-7 text-xs"
                              />
                            </div>
                            <div className="w-24 flex flex-col gap-1">
                              <Label className="text-[10px]">Visibility</Label>
                              <select
                                value={editChannelType}
                                onChange={(e) =>
                                  setEditChannelType(e.target.value as any)
                                }
                                className={cn(selectClass, "h-7")}>
                                <option value="public">Public</option>
                                <option value="private">Private</option>
                              </select>
                            </div>
                          </div>

                          {editChannelType === "private" && (
                            <div className="flex flex-col gap-1.5">
                              <Label className="text-[10px] text-muted-foreground">
                                Members with access
                              </Label>
                              <div className="max-h-36 overflow-y-auto flex flex-col gap-0.5 border border-border rounded-md p-1.5 bg-muted/30">
                                {memberList.length ? (
                                  memberList.map((m) => {
                                    const userId = m.id || m.userId;
                                    const checked = editAllowedUserIds.includes(userId);
                                    return (
                                      <label
                                        key={userId || m.email}
                                        className="flex items-center justify-between p-1 rounded hover:bg-muted cursor-pointer text-[11px]">
                                        <span className="truncate pr-2 font-medium">
                                          {m.name || m.email}
                                        </span>
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={(e) =>
                                            setEditAllowedUserIds(
                                              e.target.checked
                                                ? [...editAllowedUserIds, userId]
                                                : editAllowedUserIds.filter(
                                                    (id) => id !== userId,
                                                  ),
                                            )
                                          }
                                          className="rounded border-input h-3.5 w-3.5"
                                        />
                                      </label>
                                    );
                                  })
                                ) : (
                                  <div className="text-center py-2 text-[10px] text-muted-foreground">
                                    No members available to assign.
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <Button
                            type="button"
                            size="sm"
                            className="h-7 text-xs font-semibold self-end"
                            disabled={
                              !editChannelName.trim() ||
                              updateChannelMutation.isPending
                            }
                            onClick={() =>
                              updateChannelMutation.mutate({
                                channelId: chId,
                                name: editChannelName.trim(),
                                type: editChannelType,
                                allowedUserIds: editAllowedUserIds,
                              })
                            }>
                            Save channel
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  No channels found.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Members */}
        {scrymeTab === "members" && (
          <div className="flex flex-col gap-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newMemberEmail.trim()) return;
                addMemberMutation.mutate({
                  email: newMemberEmail.trim(),
                  role: newMemberRole,
                });
              }}
              className="flex gap-2 items-end">
              <div className="flex-1 flex flex-col gap-1">
                <Label className="text-[11px]">Member email</Label>
                <Input
                  type="email"
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
                  className={selectClass}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <Button
                type="submit"
                size="sm"
                className="h-8 gap-1 text-xs"
                disabled={!newMemberEmail.trim() || addMemberMutation.isPending}>
                <UserPlus className="w-3 h-3" /> Grant
              </Button>
            </form>

            <div className="max-h-[48vh] overflow-y-auto flex flex-col gap-1.5">
              {memberList.length ? (
                memberList.map((m) => (
                  <div
                    key={m.id || m.email}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-card border border-border text-xs">
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-foreground truncate">
                        {m.name || m.email}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate">
                        {m.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase font-mono">
                        {m.role || "member"}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${m.name || m.email}`}
                        className="h-6 w-6 text-destructive hover:bg-destructive/10"
                        disabled={removeMemberMutation.isPending}
                        onClick={() => removeMemberMutation.mutate(m.id || m.email)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  No members configured.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Overview */}
        {scrymeTab === "overview" && (
          <div className="flex flex-col gap-3">
            <div className="rounded-lg border border-border divide-y divide-border text-xs">
              <div className="flex justify-between items-center px-3 py-2.5">
                <span className="text-muted-foreground">Workspace slug</span>
                <Badge variant="outline" className="font-mono text-[11px]">
                  {(statuses as Record<string, any>)?.scryme?.config?.workspaceSlug ||
                    "org-workspace"}
                </Badge>
              </div>
              <div className="flex justify-between items-center px-3 py-2.5">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant="secondary"
                  className="bg-emerald-500/10 text-emerald-600 font-semibold">
                  Active
                </Badge>
              </div>
              <div className="flex justify-between items-center px-3 py-1.5">
                <span className="text-muted-foreground">Re-sync workspace data</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs"
                  disabled={isLoadingScrymeDetails}
                  onClick={() => refetchScrymeDetails()}>
                  <RefreshCw
                    className={cn("w-3 h-3", isLoadingScrymeDetails && "animate-spin")}
                  />
                  Sync
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSheetBody = () => {
    if (!selectedIntegration) return null;

    if (selectedIntegration.id === "scryme") return renderScrymePanel();

    if (selectedIntegration.id === "huly" || selectedIntegration.id === "plane") {
      return (
        <div className="py-4">
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1.5">
            <h4 className="font-semibold text-foreground text-sm">
              Connect {selectedIntegration.title}
            </h4>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Setup is managed by your workspace administrator. Contact your
              admin team or add the credentials in the System Admin portal to
              enable this connection.
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  /* ------------------------------- Cards ---------------------------------- */

  const renderIntegrationCard = (integration: Integration) => {
    const connected = isConnectedFn(integration);

    const body = (
      <>
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
            integration.tone,
          )}>
          {integration.icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {integration.title}
            </h3>
            <span className="hidden sm:inline text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {integration.category}
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {integration.description}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Badge
            variant="outline"
            className={cn(
              "px-2 py-0.5 text-[10px] font-semibold border-none gap-1",
              connected
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "bg-muted text-muted-foreground",
            )}>
            {connected ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <Plus className="w-3 h-3" />
            )}
            {connected ? "Connected" : "Available"}
          </Badge>
          <span className="hidden md:inline text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
            {integration.actionLabel ?? (connected ? "Manage" : "Set up")}
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </div>
      </>
    );

    const cardClass =
      "group flex items-center gap-4 w-full text-left bg-card rounded-xl border border-border px-4 py-3 min-h-[72px] transition-colors hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

    if (!integration.isExternal && integration.href) {
      return (
        <Link key={integration.id} href={integration.href} className={cardClass}>
          {body}
        </Link>
      );
    }

    return (
      <button
        key={integration.id}
        type="button"
        onClick={() => handleOpenConfig(integration)}
        className={cardClass}>
        {body}
      </button>
    );
  };

  const renderGrid = (items: Integration[], emptyTitle: string, emptyText: string) => {
    if (isLoadingStatuses) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[72px] rounded-xl border border-border bg-muted/40 animate-pulse"
            />
          ))}
        </div>
      );
    }

    if (!items.length) {
      return (
        <div className="py-12 text-center bg-card rounded-xl border border-dashed border-border space-y-2">
          <Boxes className="w-8 h-8 text-muted-foreground mx-auto" />
          <h3 className="text-sm font-semibold text-foreground">{emptyTitle}</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {emptyText}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {items.map(renderIntegrationCard)}
      </div>
    );
  };

  /* ------------------------------- Render --------------------------------- */

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-350 mx-auto min-h-screen bg-background">
      <Breadcrumbs
        items={[
          { label: "Settings", href: "/settings" },
          { label: "Integrations" },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-6 mt-6">
        <PageHeader
          title="Integrations & Apps"
          subtitle="Connect messaging, project management, developer tools, and operational webhooks."
          icon={<Boxes className="w-8 h-8 text-primary" />}
        />
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card w-fit">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-medium text-foreground">
            All systems operational
          </span>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "active" | "available")}
        className="w-full space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <TabsList className="bg-muted p-1 rounded-lg w-fit">
            <TabsTrigger value="active" className="text-xs font-medium px-3 py-1.5 gap-2">
              Active
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-4 font-mono">
                {activeIntegrations.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="available"
              className="text-xs font-medium px-3 py-1.5 gap-2">
              Available
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-4 font-mono">
                {availableIntegrations.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search integrations"
              aria-label="Search integrations"
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>

        <TabsContent value="active" className="focus-visible:outline-none">
          {renderGrid(
            visibleActive,
            search ? "No matching integrations" : "No active integrations",
            search
              ? "Try a different search term."
              : "Open the Available tab to connect Scryme Chat, Huly, Plane, or other services.",
          )}
        </TabsContent>

        <TabsContent value="available" className="focus-visible:outline-none">
          {renderGrid(
            visibleAvailable,
            search ? "No matching integrations" : "All integrations connected",
            search
              ? "Try a different search term."
              : "Every available integration is connected to your workspace.",
          )}
        </TabsContent>
      </Tabs>

      {/* Configuration sheet */}
      <Sheet
        open={!!selectedIntegration}
        onOpenChange={(open) => !open && setSelectedIntegration(null)}>
        <SheetContent side="right" className="sm:max-w-md lg:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                  selectedIntegration?.tone,
                )}>
                {selectedIntegration?.icon}
              </div>
              <div className="min-w-0">
                <SheetTitle className="text-base font-semibold">
                  {selectedIntegration?.title}
                </SheetTitle>
                <SheetDescription className="text-xs">
                  {selectedIntegration?.category} · Manage settings and permissions
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="px-4 py-2">{renderSheetBody()}</div>

          <SheetFooter className="mt-auto pt-4 border-t border-border">
            <Button
              variant="outline"
              className="w-full h-9 text-xs font-semibold"
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