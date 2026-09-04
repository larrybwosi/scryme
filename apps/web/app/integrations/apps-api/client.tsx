"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Key,
  Webhook,
  Monitor,
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  Globe,
  Lock,
  MoreVertical,
  Terminal,
  Code2,
  Cpu,
  History,
  Settings2,
  Loader2,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Breadcrumbs } from "../../../components/breadcrumbs";
import { PageHeader } from "../../../components/page-header";
import { cn } from "@repo/ui/lib/utils";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  getDeviceRegistryAction,
  getDeviceSetupTokensAction,
  getV3ApiClientsAction,
  getWebhookSubscriptionsAction,
  createDeviceSetupTokenAction,
  createV3ApiClientAction,
  createWebhookSubscriptionAction,
  deleteV3ApiClientAction,
  deleteWebhookSubscriptionAction,
  regenerateV3ClientSecretAction,
  updateV3ApiClientAction,
} from "../../actions/api-management";
import { getLocations } from "../../actions/locations";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@repo/ui/components/ui/sheet";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Badge } from "@repo/ui/components/ui/badge";
import { Switch } from "@repo/ui/components/ui/switch";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";

const queryClient = new QueryClient();

const SCOPE_CATEGORIES = [
  {
    name: "General",
    scopes: [
      { value: "read", label: "Read", description: "Generic read-only access" },
      { value: "write", label: "Write", description: "Generic write access" },
      { value: "admin", label: "Admin", description: "Full administrative access" },
      { value: "customer", label: "Customer / SPA", description: "Storefront SPA access" },
    ],
  },
  {
    name: "Catalog & Products",
    scopes: [
      { value: "catalog:product:read", label: "Read Products", description: "Read physical catalog products" },
      { value: "catalog:product:create", label: "Create Products", description: "Create new catalog products" },
      { value: "catalog:product:update", label: "Update Products", description: "Update product details & CMS custom fields" },
    ],
  },
  {
    name: "Services",
    scopes: [
      { value: "services:read", label: "Read Services", description: "Read services & durations" },
      { value: "services:write", label: "Write Services", description: "Create and update services" },
      { value: "services:manage", label: "Manage Services", description: "Full service management" },
    ],
  },
  {
    name: "Orders & Sales",
    scopes: [
      { value: "order:read", label: "Read Orders", description: "Read customer orders & sales" },
      { value: "order:create", label: "Create Orders", description: "Create new orders" },
      { value: "order:write", label: "Update Orders", description: "Modify existing orders" },
      { value: "pos:sale", label: "POS Sales", description: "Register sales on POS" },
    ],
  },
  {
    name: "Inventory & Stocking",
    scopes: [
      { value: "inventory:read", label: "Read Inventory", description: "Read stock levels & reorder points" },
      { value: "inventory:write", label: "Write Inventory", description: "Adjust stock levels & locations" },
      { value: "inventory:manage", label: "Manage Inventory", description: "Full inventory management" },
      { value: "stock:read", label: "Read Stock", description: "Read stocking records" },
      { value: "stock:write", label: "Write Stock", description: "Modify stocking & suppliers" },
      { value: "partners:read", label: "Read Partners", description: "Read supplier partners" },
      { value: "partners:write", label: "Write Partners", description: "Create and modify supplier partners" },
    ],
  },
  {
    name: "Finance & Accounting",
    scopes: [
      { value: "finance:read", label: "Read Finance", description: "Read financial transaction histories" },
      { value: "finance:write", label: "Write Finance", description: "Log financial transactions" },
      { value: "expense:view", label: "View Expenses", description: "View expenses and petty cash logs" },
      { value: "expense:manage", label: "Manage Expenses", description: "Approve or log expense transactions" },
      { value: "accounting:manage", label: "Manage Accounting", description: "Manage ledger accounts" },
      { value: "accounting:report", label: "Accounting Reports", description: "Generate tax and ledger reports" },
      { value: "invoice:view", label: "View Invoices", description: "View customer & B2B invoices" },
      { value: "invoice:manage", label: "Manage Invoices", description: "Create and issue invoices" },
    ],
  },
  {
    name: "Customer & CRM",
    scopes: [
      { value: "customer:read", label: "Read Customers", description: "Read customer CRM data" },
      { value: "customer:update", label: "Update Customers", description: "Modify customer information" },
      { value: "customer:delete", label: "Delete Customers", description: "Remove customer records" },
    ],
  },
  {
    name: "POS & Location",
    scopes: [
      { value: "pos:auth", label: "POS Authentication", description: "Authenticate hardware POS devices" },
      { value: "pos:location:read", label: "Read Locations", description: "Access active organization locations" },
    ],
  },
  {
    name: "Webhooks & Integrations",
    scopes: [
      { value: "webhooks:read", label: "Read Webhooks", description: "View active webhook URLs" },
      { value: "webhooks:write", label: "Write Webhooks", description: "Create and update webhooks" },
      { value: "integrations:strapi:create", label: "Create Strapi", description: "Create Strapi integration" },
      { value: "integrations:strapi:read", label: "Read Strapi", description: "Read Strapi details" },
      { value: "integrations:strapi:update", label: "Update Strapi", description: "Modify Strapi settings" },
      { value: "integrations:strapi:delete", label: "Delete Strapi", description: "Remove Strapi integration" },
      { value: "integrations:strapi:sync", label: "Sync Strapi", description: "Trigger Strapi sync tasks" },
    ],
  },
  {
    name: "Bakery",
    scopes: [
      { value: "bakery:batch:view", label: "View Batches", description: "View bakery production batches" },
      { value: "bakery:batch:manage", label: "Manage Batches", description: "Manage bakery production batches" },
      { value: "bakery:recipe:view", label: "View Recipes", description: "Read baking recipes" },
      { value: "bakery:recipe:manage", label: "Manage Recipes", description: "Create and update baking recipes" },
      { value: "bakery:template:view", label: "View Templates", description: "Read recipe template structures" },
      { value: "bakery:template:manage", label: "Manage Templates", description: "Create and update templates" },
      { value: "bakery:settings:manage", label: "Manage Bakery Settings", description: "Update global baking preferences" },
    ],
  },
];

function V3ClientSkeleton() {
  return (
    <div className="bg-card p-5 rounded-xl border border-border shadow-sm animate-pulse space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2.5 flex-1">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-muted rounded-lg" />
            <div className="h-4 bg-muted rounded w-1/4" />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-3 bg-muted rounded w-1/3" />
            <div className="h-3 bg-muted rounded w-16" />
          </div>
        </div>
      </div>
      <div className="pt-4 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="h-3 bg-muted rounded w-24 mb-2" />
          <div className="flex flex-wrap gap-1.5">
            <div className="h-5 bg-muted rounded w-12" />
            <div className="h-5 bg-muted rounded w-14" />
            <div className="h-5 bg-muted rounded w-10" />
          </div>
        </div>
        <div>
          <div className="h-3 bg-muted rounded w-32 mb-2" />
          <div className="flex flex-wrap gap-1.5">
            <div className="h-5 bg-muted rounded w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AppsApiContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "v3";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Queries with TanStack Query
  const { data: v3Clients = [], isLoading: isLoadingV3Clients } = useQuery<any[]>({
    queryKey: ["v3-clients"],
    queryFn: getV3ApiClientsAction,
    staleTime: 60 * 1000,
  });

  const { data: webhooks = [], isLoading: isLoadingWebhooks } = useQuery<any[]>({
    queryKey: ["webhooks"],
    queryFn: getWebhookSubscriptionsAction,
    staleTime: 60 * 1000,
  });

  const { data: deviceTokens = [], isLoading: isLoadingDeviceTokens } = useQuery<any[]>({
    queryKey: ["device-tokens"],
    queryFn: getDeviceSetupTokensAction,
    staleTime: 60 * 1000,
  });

  const { data: registries = [], isLoading: isLoadingRegistries } = useQuery<any[]>({
    queryKey: ["registries"],
    queryFn: getDeviceRegistryAction,
    staleTime: 60 * 1000,
  });

  const { data: locations = [], isLoading: isLoadingLocations } = useQuery<any[]>({
    queryKey: ["locations"],
    queryFn: getLocations,
    staleTime: 5 * 60 * 1000,
  });

  // Local Form States
  const [newClientName, setNewClientName] = useState("");
  const [newClientScopes, setNewClientScopes] = useState<string[]>(["read", "write"]);
  const [newClientCors, setNewClientCors] = useState("");
  const [showV3Dialog, setShowV3Dialog] = useState(false);
  const [v3Result, setV3Result] = useState<any>(null);
  const [editingV3Client, setEditingV3Client] = useState<any>(null);

  const [showWebhookDialog, setShowWebhookDialog] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    name: "",
    url: "",
    events: [] as string[],
  });

  const [showDeviceDialog, setShowDeviceDialog] = useState(false);
  const [newDevice, setNewDevice] = useState({
    deviceName: "",
    deviceType: "POS_TERMINAL" as any,
    locationId: "default",
    permissions: [] as string[],
    environment: "LIVE" as "LIVE" | "TEST",
  });
  const [deviceTokenResult, setDeviceTokenResult] = useState<any>(null);

  useEffect(() => {
    if (locations.length > 0 && newDevice.locationId === "default") {
      setNewDevice(prev => ({ ...prev, locationId: locations[0].id }));
    }
  }, [locations]);

  // Mutations
  const createV3Mutation = useMutation({
    mutationFn: createV3ApiClientAction,
    onSuccess: (res) => {
      setV3Result(res);
      setNewClientName("");
      setNewClientScopes(["read", "write"]);
      setNewClientCors("");
      queryClient.invalidateQueries({ queryKey: ["v3-clients"] });
      toast.success("V3 client created");
    },
    onError: () => toast.error("Failed to create V3 client"),
  });

  const updateV3Mutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateV3ApiClientAction(id, payload),
    onSuccess: () => {
      setEditingV3Client(null);
      queryClient.invalidateQueries({ queryKey: ["v3-clients"] });
      toast.success("Client settings updated");
    },
    onError: () => toast.error("Failed to update client settings"),
  });

  const deleteV3Mutation = useMutation({
    mutationFn: deleteV3ApiClientAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["v3-clients"] });
      toast.success("Client deleted");
    },
    onError: () => toast.error("Failed to delete client"),
  });

  const createWebhookMutation = useMutation({
    mutationFn: createWebhookSubscriptionAction,
    onSuccess: () => {
      setShowWebhookDialog(false);
      setNewWebhook({ name: "", url: "", events: [] });
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      toast.success("Webhook subscription added");
    },
    onError: () => toast.error("Failed to add webhook subscription"),
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: deleteWebhookSubscriptionAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      toast.success("Webhook subscription deleted");
    },
    onError: () => toast.error("Failed to delete webhook subscription"),
  });

  const provisionDeviceMutation = useMutation({
    mutationFn: createDeviceSetupTokenAction,
    onSuccess: (res) => {
      setDeviceTokenResult(res);
      queryClient.invalidateQueries({ queryKey: ["device-tokens"] });
      queryClient.invalidateQueries({ queryKey: ["registries"] });
      toast.success("Device provisioned");
    },
    onError: () => toast.error("Failed to provision device"),
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const tabs = [
    { id: "v3", label: "API Clients", icon: Key },
    { id: "webhooks", label: "Webhooks", icon: Webhook },
    { id: "devices", label: "Devices", icon: Monitor },
    { id: "storefront", label: "Storefront / SPA", icon: Globe },
  ];

  const availableEvents = [
    "order.created",
    "order.updated",
    "inventory.low",
    "customer.created",
  ];

  const [storefrontEnabled, setStorefrontEnabled] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState("default");
  const [allowedOrigins, setAllowedOrigins] = useState(
    "https://store.scryme.tech",
  );

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: "Integrations", href: "/integrations" },
          { label: "Developer Tools" },
        ]}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border-b border-border pb-6">
        <PageHeader
          title="Developer Tools"
          subtitle="Manage API credentials, webhooks, and hardware provisioning for your organization."
          icon={<Terminal className="w-6 h-6 text-foreground" />}
        />
        <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 shadow-sm">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-1",
                activeTab === tab.id
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}>
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "v3" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-foreground tracking-tight">
                API Clients
              </h2>
              <p className="text-[13px] text-muted-foreground">
                OAuth2 clients for building integrations against the platform
                API.
              </p>
            </div>
            <Dialog
              open={showV3Dialog}
              onOpenChange={open => {
                setShowV3Dialog(open);
                if (!open) setV3Result(null);
              }}>
              <DialogTrigger asChild>
                <Button className="gap-1.5 h-9 px-4 text-xs font-semibold rounded-lg shadow-sm">
                  <Plus size={16} />
                  New client
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto rounded-xl">
                <DialogHeader>
                  <DialogTitle className="text-base font-bold tracking-tight">
                    Create API client
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Create a new OAuth2 client for accessing the platform API.
                  </DialogDescription>
                </DialogHeader>
                {!v3Result ? (
                  <div className="grid gap-4 py-3">
                    <div className="grid gap-1.5">
                      <Label
                        htmlFor="client-name"
                        className="text-xs font-semibold">
                        Client name
                      </Label>
                      <Input
                        id="client-name"
                        value={newClientName}
                        onChange={e => setNewClientName(e.target.value)}
                        placeholder="e.g., My Mobile App"
                        className="h-10 text-sm rounded-lg"
                      />
                    </div>

                    <div className="grid gap-1.5">
                      <Label htmlFor="client-cors" className="text-xs font-semibold">
                        CORS allowed origins
                      </Label>
                      <Input
                        id="client-cors"
                        value={newClientCors}
                        onChange={e => setNewClientCors(e.target.value)}
                        placeholder="e.g. https://myapp.com, http://localhost:3000"
                        className="h-10 text-sm rounded-lg"
                      />
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Comma-separated list of browser origins allowed to make authenticated requests.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">
                        Scopes & permissions
                      </Label>
                      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 border border-border rounded-xl p-4 bg-muted/40">
                        {SCOPE_CATEGORIES.map(category => (
                          <div key={category.name} className="space-y-2">
                            <h4 className="text-[11px] font-bold text-foreground border-b border-border/60 pb-1 mt-2 first:mt-0">
                              {category.name}
                            </h4>
                            <div className="space-y-2.5">
                              {category.scopes.map(scope => {
                                const isSelected = newClientScopes.includes(scope.value);
                                return (
                                  <div key={scope.value} className="flex items-start space-x-2.5 group">
                                    <Checkbox
                                      id={`new-scope-${scope.value}`}
                                      checked={isSelected}
                                      onCheckedChange={checked => {
                                        const scopes = checked
                                          ? [...newClientScopes, scope.value]
                                          : newClientScopes.filter((s: string) => s !== scope.value);
                                        setNewClientScopes(scopes);
                                      }}
                                    />
                                    <div className="grid gap-0.5 leading-none">
                                      <label
                                        htmlFor={`new-scope-${scope.value}`}
                                        className="text-xs font-semibold text-foreground cursor-pointer select-none"
                                      >
                                        {scope.label}
                                      </label>
                                      <span className="text-[10px] text-muted-foreground">
                                        {scope.description}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 py-3">
                    <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-xs border border-destructive/20 font-medium">
                      Copy the client secret now &mdash; it will not be shown
                      again.
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                        Client ID
                      </Label>
                      <div className="flex gap-2">
                        <code className="flex-1 bg-muted p-2.5 rounded-lg text-xs break-all border border-border font-mono text-foreground">
                          {v3Result.clientId}
                        </code>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-lg focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-1"
                          onClick={() => copyToClipboard(v3Result.clientId)}
                          aria-label="Copy client ID"
                          title="Copy client ID">
                          <Copy size={13} />
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                        Client secret
                      </Label>
                      <div className="flex gap-2">
                        <code className="flex-1 bg-muted p-2.5 rounded-lg text-xs break-all border border-border font-mono text-foreground">
                          {v3Result.clientSecret}
                        </code>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-lg focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-1"
                          onClick={() =>
                            copyToClipboard(v3Result.clientSecret)
                          }
                          aria-label="Copy client secret"
                          title="Copy client secret">
                          <Copy size={13} />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                <DialogFooter className="gap-2 sm:gap-0">
                  {!v3Result ? (
                    <Button
                      onClick={() => createV3Mutation.mutate({
                        name: newClientName,
                        scopes: newClientScopes,
                        corsOrigins: newClientCors ? newClientCors.split(",").map(s => s.trim()).filter(Boolean) : [],
                      })}
                      disabled={!newClientName || createV3Mutation.isPending}
                      className="text-xs rounded-lg gap-1.5">
                      {createV3Mutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Create client
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setShowV3Dialog(false);
                        setV3Result(null);
                      }}
                      className="text-xs rounded-lg">
                      I&apos;ve saved the secret
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {isLoadingV3Clients ? (
              <>
                <V3ClientSkeleton />
                <V3ClientSkeleton />
                <V3ClientSkeleton />
              </>
            ) : v3Clients.length === 0 ? (
              <div className="bg-card p-14 rounded-xl border border-dashed border-border flex flex-col items-center text-center">
                <div className="p-3 bg-muted rounded-lg mb-3 border border-border">
                  <Key className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-1 tracking-tight">
                  No API clients yet
                </h3>
                <p className="text-[13px] text-muted-foreground max-w-sm">
                  Create your first OAuth2 client to start building custom
                  integrations with the platform API.
                </p>
              </div>
            ) : (
              v3Clients.map(client => (
                <div
                  key={client.id}
                  className="bg-card p-5 rounded-xl border border-border shadow-sm hover:shadow-md hover:border-accent transition-all group">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-foreground rounded-lg text-background">
                          <Code2 size={15} />
                        </div>
                        <h3 className="font-bold text-sm text-foreground tracking-tight">
                          {client.name}
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <span className="font-semibold text-[10px] uppercase tracking-wider">
                            Client ID
                          </span>
                          <code className="bg-muted px-1.5 py-0.5 rounded text-xs border border-border font-mono">
                            {client.clientId}
                          </code>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">
                            Status
                          </span>
                          <Badge
                            variant={
                              client.isActive ? "default" : "destructive"
                            }
                            className={cn(
                              "cursor-pointer px-2 py-0.5 border-none text-[10px] font-bold",
                              client.isActive
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400",
                            )}
                            onClick={() =>
                              updateV3Mutation.mutate({
                                id: client.id,
                                payload: { isActive: !client.isActive },
                              })
                            }>
                            {client.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-1"
                        onClick={() => setEditingV3Client(client)}
                        aria-label="Edit advanced settings"
                        title="Edit advanced settings">
                        <Settings2 size={16} />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-1"
                            aria-label="More actions"
                            title="More actions">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-lg">
                          <DropdownMenuItem
                            className="py-1.5 text-xs rounded-md"
                            onClick={async () => {
                              const secret =
                                await regenerateV3ClientSecretAction(client.id);
                              copyToClipboard(secret);
                              toast.info(
                                "New secret copied to clipboard. It will not be shown again.",
                              );
                            }}>
                            <RefreshCw size={12} className="mr-2" />
                            Regenerate secret
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive py-1.5 text-xs rounded-md"
                            onClick={() => deleteV3Mutation.mutate(client.id)}>
                            <Trash2 size={12} className="mr-2" />
                            Delete client
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                        Scopes & permissions
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {client.scopes.map((s: string) => (
                          <Badge
                            key={s}
                            variant="secondary"
                            className="bg-muted text-muted-foreground border-none font-semibold px-2 py-0.5 text-[10px] rounded-md">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                        CORS allowed origins
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {client.corsOrigins.length > 0 ? (
                          client.corsOrigins.map((o: string) => (
                            <Badge
                              key={o}
                              variant="outline"
                              className="font-mono text-[10px] bg-muted/50 border-border text-muted-foreground rounded-md">
                              {o}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            No origins configured
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "devices" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-foreground tracking-tight">
                Hardware & devices
              </h2>
              <p className="text-[13px] text-muted-foreground">
                Provision and manage POS terminals, kiosks, and tablets across
                your locations.
              </p>
            </div>
            <Dialog
              open={showDeviceDialog}
              onOpenChange={open => {
                setShowDeviceDialog(open);
                if (!open) setDeviceTokenResult(null);
              }}>
              <DialogTrigger asChild>
                <Button className="gap-1.5 h-9 px-4 text-xs font-semibold rounded-lg shadow-sm">
                  <Plus size={16} />
                  Provision device
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-130 rounded-xl">
                <DialogHeader>
                  <DialogTitle className="text-base font-bold tracking-tight">
                    Provision device
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Generate a setup token to provision a new POS device.
                  </DialogDescription>
                </DialogHeader>
                {!deviceTokenResult ? (
                  <div className="grid gap-4 py-3">
                    <div className="grid gap-1.5">
                      <Label
                        htmlFor="device-name"
                        className="text-xs font-semibold">
                        Device name
                      </Label>
                      <Input
                        id="device-name"
                        value={newDevice.deviceName}
                        onChange={e =>
                          setNewDevice({
                            ...newDevice,
                            deviceName: e.target.value,
                          })
                        }
                        placeholder="Front Desk Terminal"
                        className="h-10 text-sm rounded-lg"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1.5">
                        <Label
                          htmlFor="device-type"
                          className="text-xs font-semibold">
                          Device type
                        </Label>
                        <Select
                          value={newDevice.deviceType}
                          onValueChange={val => {
                            const deviceType = val as any;
                            const permissions =
                              deviceType === "BAKERY_TERMINAL"
                                ? [
                                    "bakery:batch:view",
                                    "bakery:batch:manage",
                                    "bakery:recipe:view",
                                    "bakery:recipe:manage",
                                    "bakery:template:view",
                                    "bakery:template:manage",
                                  ]
                                : [
                                    "pos:auth",
                                    "pos:location:read",
                                    "pos:product:read",
                                    "pos:product:update",
                                    "pos:sale:read",
                                    "pos:sale:create",
                                    "pos:sale:update",
                                    "pos:stock:manage",
                                    "pos:sync",
                                  ];

                            setNewDevice({
                              ...newDevice,
                              deviceType,
                              permissions,
                            });
                          }}>
                          <SelectTrigger
                            id="device-type"
                            className="h-10 text-sm rounded-lg">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg">
                            <SelectItem value="POS_TERMINAL">
                              POS Terminal
                            </SelectItem>
                            <SelectItem value="MOBILE_POS">
                              Mobile POS
                            </SelectItem>
                            <SelectItem value="KIOSK">Kiosk</SelectItem>
                            <SelectItem value="TABLET">Tablet</SelectItem>
                            <SelectItem value="BAKERY_TERMINAL">
                              Bakery Terminal
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1.5">
                        <Label
                          htmlFor="location-id"
                          className="text-xs font-semibold">
                          Location
                        </Label>
                        <Select
                          value={newDevice.locationId}
                          onValueChange={val =>
                            setNewDevice({ ...newDevice, locationId: val })
                          }>
                          <SelectTrigger
                            id="location-id"
                            className="h-10 text-sm rounded-lg">
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg">
                            {locations.map(loc => (
                              <SelectItem key={loc.id} value={loc.id}>
                                {loc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-1.5">
                      <Label className="text-xs font-semibold">
                        Environment
                      </Label>
                      <Select
                        value={newDevice.environment}
                        onValueChange={val =>
                          setNewDevice({
                            ...newDevice,
                            environment: val as any,
                          })
                        }>
                        <SelectTrigger className="h-10 text-sm rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                          <SelectItem value="LIVE">
                            Production (Live)
                          </SelectItem>
                          <SelectItem value="TEST">Sandbox (Test)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Permissions
                      </Label>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-4 bg-muted rounded-xl border border-border max-h-48 overflow-y-auto">
                        {[
                          "pos:auth",
                          "pos:location:read",
                          "pos:product:read",
                          "pos:product:update",
                          "pos:sale:read",
                          "pos:sale:create",
                          "pos:sale:update",
                          "pos:stock:manage",
                          "pos:petty-cash:create",
                          "pos:petty-cash:read",
                          "pos:sync",
                          "bakery:batch:view",
                          "bakery:batch:manage",
                          "bakery:recipe:view",
                          "bakery:recipe:manage",
                          "bakery:template:view",
                          "bakery:template:manage",
                          "bakery:settings:manage",
                        ].map(perm => (
                          <div
                            key={perm}
                            className="flex items-center space-x-2">
                            <Checkbox
                              id={`perm-${perm}`}
                              checked={newDevice.permissions.includes(perm)}
                              onCheckedChange={checked => {
                                const permissions = checked
                                  ? [...newDevice.permissions, perm]
                                  : newDevice.permissions.filter(
                                      p => p !== perm,
                                    );
                                setNewDevice({ ...newDevice, permissions });
                              }}
                            />
                            <label
                              htmlFor={`perm-${perm}`}
                              className="text-[9px] font-bold uppercase tracking-tight text-foreground cursor-pointer">
                              {perm.replace(":", " ")}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 py-3">
                    <div className="p-3 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs border border-emerald-500/20 font-semibold text-center">
                      Setup token generated
                    </div>

                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                        <QRCodeSVG
                          value={JSON.stringify({
                            type: "POS_PROVISION",
                            token: deviceTokenResult.rawToken,
                          })}
                          size={160}
                          level="H"
                          includeMargin={false}
                          bgColor="transparent"
                          fgColor="currentColor"
                        />
                      </div>

                      <div className="w-full space-y-2">
                        <div className="text-center p-4 bg-muted rounded-xl border border-border relative group">
                          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                            Provisioning token
                          </div>
                          <div className="text-xl font-mono font-bold tracking-[0.15em] text-foreground break-all px-2">
                            {deviceTokenResult.rawToken}
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="mt-3 w-full gap-1.5 h-8 font-bold text-xs rounded-lg"
                            onClick={() =>
                              copyToClipboard(deviceTokenResult.rawToken)
                            }>
                            <Copy size={12} /> Copy token
                          </Button>
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-center text-muted-foreground italic">
                      Scan the QR code on your device or enter the token
                      manually to provision. Valid for 24 hours.
                    </p>
                  </div>
                )}
                <DialogFooter>
                  {!deviceTokenResult ? (
                    <Button
                      onClick={() => provisionDeviceMutation.mutate(newDevice)}
                      disabled={!newDevice.deviceName || provisionDeviceMutation.isPending}
                      className="w-full text-xs rounded-lg gap-1.5">
                      {provisionDeviceMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Generate token
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setShowDeviceDialog(false);
                        setDeviceTokenResult(null);
                      }}
                      className="w-full text-xs rounded-lg">
                      Done
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {(isLoadingDeviceTokens || isLoadingRegistries) ? (
              <div className="space-y-3">
                <V3ClientSkeleton />
                <V3ClientSkeleton />
              </div>
            ) : registries.length === 0 &&
              deviceTokens.filter(t => !t.usedAt && !t.revokedAt).length === 0 ? (
                <div className="bg-card h-50 rounded-xl border border-dashed border-border flex flex-col items-center justify-center text-center p-6">
                  <div className="p-3 bg-muted rounded-lg mb-2 border border-border">
                    <Cpu className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <p className="text-[13px] text-muted-foreground font-medium max-w-xs">
                    No hardware devices connected to this organization yet.
                  </p>
                </div>
              ) : null}

            {deviceTokens
              .filter(t => !t.usedAt && !t.revokedAt)
              .map(token => (
                <div
                  key={token.id}
                  className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <Lock size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-foreground">
                        Pending setup: {token.deviceName}
                      </div>
                      <div className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-0.5 font-semibold">
                        EXPIRES: {new Date(token.expiresAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 h-8 w-8 rounded-lg focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-1"
                    onClick={() => copyToClipboard(token.rawToken)}
                    aria-label="Copy pending setup token"
                    title="Copy pending setup token">
                    <Copy size={14} />
                  </Button>
                </div>
              ))}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {registries.map(reg => (
                <div
                  key={reg.id}
                  className="bg-card p-4 rounded-xl border border-border shadow-sm hover:shadow-md hover:border-accent transition-all flex justify-between items-center group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-foreground group-hover:text-background transition-colors">
                      <Monitor size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-foreground">
                        {reg.deviceName}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <span className="font-semibold text-[9px] uppercase tracking-wider">
                          {reg.deviceType}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                        <span>{reg.location?.name || "Main Location"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        reg.status === "ACTIVE" ? "default" : "secondary"
                      }
                      className={cn(
                        "px-2 py-0.2 border-none text-[9px] font-bold",
                        reg.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground",
                      )}>
                      {reg.status}
                    </Badge>
                    <div className="text-[9px] text-muted-foreground mt-1 font-bold uppercase tracking-tighter flex items-center justify-end gap-1">
                      <History size={10} />
                      {reg.lastSeenAt
                        ? new Date(reg.lastSeenAt).toLocaleString()
                        : "Never seen"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "webhooks" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-foreground tracking-tight">
                Webhook subscriptions
              </h2>
              <p className="text-[13px] text-muted-foreground">
                Receive real-time notifications when events happen in your
                organization.
              </p>
            </div>
            <Dialog
              open={showWebhookDialog}
              onOpenChange={setShowWebhookDialog}>
              <DialogTrigger asChild>
                <Button className="gap-1.5 h-9 px-4 text-xs font-semibold rounded-lg shadow-sm">
                  <Plus size={16} />
                  Add webhook
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-125 rounded-xl">
                <DialogHeader>
                  <DialogTitle className="text-base font-bold tracking-tight">
                    Add webhook subscription
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Configure a new endpoint to receive real-time notifications.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-3">
                  <div className="grid gap-1.5">
                    <Label
                      htmlFor="webhook-name"
                      className="text-xs font-semibold">
                      Friendly name
                    </Label>
                    <Input
                      id="webhook-name"
                      value={newWebhook.name}
                      onChange={e =>
                        setNewWebhook({ ...newWebhook, name: e.target.value })
                      }
                      placeholder="My Production Webhook"
                      className="h-10 text-sm rounded-lg"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label
                      htmlFor="webhook-url"
                      className="text-xs font-semibold">
                      Payload URL
                    </Label>
                    <Input
                      id="webhook-url"
                      value={newWebhook.url}
                      onChange={e =>
                        setNewWebhook({ ...newWebhook, url: e.target.value })
                      }
                      placeholder="https://api.myapp.com/webhooks"
                      className="h-10 text-sm rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Events to subscribe
                    </Label>
                    <div className="grid grid-cols-2 gap-3 p-3 bg-muted rounded-lg border border-border">
                      {availableEvents.map(ev => (
                        <div key={ev} className="flex items-center space-x-2">
                          <Checkbox
                            id={`event-${ev}`}
                            checked={newWebhook.events.includes(ev)}
                            onCheckedChange={checked => {
                              const events = checked
                                ? [...newWebhook.events, ev]
                                : newWebhook.events.filter(e => e !== ev);
                              setNewWebhook({ ...newWebhook, events });
                            }}
                          />
                          <label
                            htmlFor={`event-${ev}`}
                            className="text-xs font-semibold text-foreground uppercase cursor-pointer">
                            {ev.replace(".", " ")}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    variant="outline"
                    className="h-9 text-xs rounded-lg"
                    onClick={() => setShowWebhookDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => createWebhookMutation.mutate(newWebhook)}
                    disabled={!newWebhook.url || newWebhook.events.length === 0 || createWebhookMutation.isPending}
                    className="h-9 text-xs rounded-lg gap-1.5">
                    {createWebhookMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Create subscription
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {isLoadingWebhooks ? (
            <div className="space-y-3">
              <V3ClientSkeleton />
              <V3ClientSkeleton />
            </div>
          ) : webhooks.length === 0 ? (
            <div className="bg-card p-14 rounded-xl border border-dashed border-border flex flex-col items-center text-center">
              <div className="p-3 bg-muted rounded-lg mb-3 border border-border">
                <Webhook className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1 tracking-tight">
                No webhooks configured
              </h3>
              <p className="text-[13px] text-muted-foreground max-w-sm">
                Listen to real-time events from the API and trigger external
                workflows in your own stack.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {webhooks.map(wh => (
                <div
                  key={wh.id}
                  className="bg-card p-5 rounded-xl border border-border shadow-sm flex justify-between items-center group hover:border-accent hover:shadow-md transition-all">
                  <div className="space-y-3">
                    <div>
                      <div className="font-bold text-sm text-foreground tracking-tight">
                        {wh.name || "Untitled webhook"}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <Globe size={12} className="text-muted-foreground" />
                        <code className="bg-muted px-1 py-0.2 rounded border border-border font-mono text-xs text-foreground">
                          {wh.url}
                        </code>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {wh.events.map((e: string) => (
                        <Badge
                          key={e}
                          variant="secondary"
                          className="bg-muted text-muted-foreground border-none font-bold text-[9px] uppercase px-2 py-0.5 rounded-md">
                          {e}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-destructive/60 focus-visible:ring-offset-1 transition-opacity h-8 w-8 rounded-lg"
                    onClick={() => deleteWebhookMutation.mutate(wh.id)}
                    aria-label="Delete webhook"
                    title="Delete webhook">
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "storefront" && (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-foreground tracking-tight">
                Storefront & SPA Integration
              </h2>
              <p className="text-[13px] text-muted-foreground">
                Connect external client web storefronts, booking systems, or
                custom hybrid applications.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Settings Card */}
              <div className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Connection Settings
                </h3>

                <div className="flex items-center justify-between p-4 bg-muted rounded-xl border border-border">
                  <div className="space-y-0.5">
                    <div className="font-bold text-sm text-foreground">
                      Enable Client Storefront API
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Allow public SPA clients to communicate with your V3 APIs.
                    </div>
                  </div>
                  <Switch
                    checked={storefrontEnabled}
                    onCheckedChange={setStorefrontEnabled}
                    aria-label="Enable Client Storefront API"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">
                      Default Inventory Location
                    </Label>
                    <Select
                      value={selectedLocation}
                      onValueChange={setSelectedLocation}>
                      <SelectTrigger className="h-10 text-sm rounded-lg">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg">
                        {locations.map(loc => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">
                      Allowed Origin CORS
                    </Label>
                    <Input
                      value={allowedOrigins}
                      onChange={e => setAllowedOrigins(e.target.value)}
                      placeholder="e.g. https://mystore.com"
                      className="h-10 text-sm rounded-lg"
                    />
                  </div>
                </div>

                <Button
                  onClick={() =>
                    toast.success("Storefront settings updated successfully!")
                  }
                  className="text-xs font-semibold h-9 rounded-lg">
                  Save Storefront Settings
                </Button>
              </div>

              {/* Developer Integration Code Card */}
              <div className="bg-card border shadow-lg p-6 rounded-xl space-y-4 font-mono text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    Quick-Start Setup Code
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground h-7 px-2 font-sans font-bold text-[10px]"
                    onClick={() => {
                      copyToClipboard(
                        `import { getSDK } from "@repo/sdk";\n\nconst scryme = getSDK({\n  baseURL: "https://api.scryme.tech/api/v3"\n});\n\n// 1. Fetch available timeslots\nconst slots = await scryme.services.getServiceAvailability("scryme-hq", "srv_123", "2026-10-15");\n\n// 2. Perform checkout with both items and bookings\nawait scryme.b2b.createOrder("scryme-hq", {\n  locationId: "loc_nairobi_001",\n  items: [{ variantId: "var_01", quantity: 2 }],\n  services: [{\n    serviceId: "srv_123",\n    scheduledStartTime: "2026-10-15T10:00:00Z"\n  }]\n});`,
                      );
                    }}>
                    <Copy size={11} className="mr-1" /> Copy Code
                  </Button>
                </div>
                <div className="bg-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed max-h-72">
                  <pre className="text-emerald-600 dark:text-emerald-400">{`// Setup Scryme SPA client
import { getSDK } from "@repo/sdk";

const scryme = getSDK({
  baseURL: "https://api.scryme.tech/api/v3"
});

// 1. Query dynamic slots for any booking service
const { availableSlots } = await scryme.services.getServiceAvailability(
  "scryme-hq",
  "srv_styling_id",
  "2026-10-15"
);

// 2. Add both physical items and booking details to cart
await scryme.cart.addItem("scryme-hq", {
  serviceId: "srv_styling_id",
  quantity: 1,
  bookingDetails: {
    scheduledStartTime: "2026-10-15T10:00:00Z",
    staffIds: ["member_barista_01"]
  }
});

// 3. Complete unified checkout (Physical items + Booking Services)
const order = await scryme.b2b.createOrder("scryme-hq", {
  locationId: "${selectedLocation !== "default" ? selectedLocation : "loc_nairobi_001"}",
  items: [{ variantId: "var_shampoo_01", quantity: 2 }],
  services: [{
    serviceId: "srv_styling_id",
    scheduledStartTime: "2026-10-15T10:00:00Z",
    staffIds: ["member_barista_01"]
  }]
});`}</pre>
                </div>
              </div>
            </div>

            {/* Sidebar Overview */}
            <div className="space-y-6">
              <div className="bg-card p-5 rounded-xl border border-border shadow-sm space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Storefront Status
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      API Connection
                    </span>
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-none font-bold text-[9px] uppercase">
                      Operational
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      CORS Restrictions
                    </span>
                    <span className="font-semibold text-foreground">
                      {storefrontEnabled ? "Active" : "Disabled"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Hybrid Orders</span>
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-none font-bold text-[9px] uppercase">
                      Supported
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 p-5 rounded-xl border border-primary/20 space-y-2">
                <h4 className="text-xs font-bold text-foreground tracking-tight flex items-center gap-1.5">
                  <Key size={14} />
                  SPA Authentication Key
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Storefront websites connect securely to Scryme using OAuth V3
                  API Clients. Generate a client with scope{" "}
                  <code className="bg-muted px-1 rounded text-[11px] font-mono text-foreground">
                    customer
                  </code>{" "}
                  and register the client-side SPA origin for smooth
                  cross-origin lookups.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SHEET --- */}
      <Sheet
        open={!!editingV3Client}
        onOpenChange={open => !open && setEditingV3Client(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader className="pb-6">
            <SheetTitle className="text-lg font-bold tracking-tight">
              Client advanced settings
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Modify security settings and permissions for{" "}
              <strong className="text-foreground">
                {editingV3Client?.name}
              </strong>
              .
            </SheetDescription>
          </SheetHeader>
          {editingV3Client && (
            <div className="py-4 space-y-6 max-h-[75vh] overflow-y-auto pr-1">
              <div className="grid gap-1.5">
                <Label
                  htmlFor="edit-client-name"
                  className="text-xs font-semibold">
                  Client name
                </Label>
                <Input
                  id="edit-client-name"
                  value={editingV3Client.name}
                  onChange={e =>
                    setEditingV3Client({
                      ...editingV3Client,
                      name: e.target.value,
                    })
                  }
                  placeholder="e.g., My Mobile App"
                  className="h-10 text-sm rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">
                  Scopes & permissions
                </Label>
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 border border-border rounded-xl p-4 bg-muted/40">
                  {SCOPE_CATEGORIES.map(category => (
                    <div key={category.name} className="space-y-2">
                      <h4 className="text-[11px] font-bold text-foreground border-b border-border/60 pb-1 mt-2 first:mt-0">
                        {category.name}
                      </h4>
                      <div className="space-y-2.5">
                        {category.scopes.map(scope => {
                          const isSelected = editingV3Client.scopes.includes(scope.value);
                          return (
                            <div key={scope.value} className="flex items-start space-x-2.5 group">
                              <Checkbox
                                id={`edit-scope-${scope.value}`}
                                checked={isSelected}
                                onCheckedChange={checked => {
                                  const scopes = checked
                                    ? [...editingV3Client.scopes, scope.value]
                                    : editingV3Client.scopes.filter((s: string) => s !== scope.value);
                                  setEditingV3Client({ ...editingV3Client, scopes });
                                }}
                              />
                              <div className="grid gap-0.5 leading-none">
                                <label
                                  htmlFor={`edit-scope-${scope.value}`}
                                  className="text-xs font-semibold text-foreground cursor-pointer select-none"
                                >
                                  {scope.label}
                                </label>
                                <span className="text-[10px] text-muted-foreground">
                                  {scope.description}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">
                  CORS origins
                </Label>
                <div className="space-y-2">
                  <Input
                    placeholder="e.g. https://myapp.com, http://localhost:3000"
                    value={editingV3Client.corsOrigins.join(", ")}
                    className="h-10 text-sm rounded-lg"
                    onChange={e =>
                      setEditingV3Client({
                        ...editingV3Client,
                        corsOrigins: e.target.value
                          .split(",")
                          .map(s => s.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Comma-separated list of browser origins allowed to make
                    authenticated requests.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-xl border border-border">
                <div className="space-y-0.5">
                  <div className="font-bold text-xs text-foreground">
                    Active status
                  </div>
                  <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight">
                    Access control toggle
                  </div>
                </div>
                <Switch
                  checked={editingV3Client.isActive}
                  onCheckedChange={checked =>
                    setEditingV3Client({
                      ...editingV3Client,
                      isActive: checked,
                    })
                  }
                  aria-label="Active status"
                />
              </div>
            </div>
          )}
          <SheetFooter className="mt-8 gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="flex-1 h-10 text-xs rounded-lg"
              onClick={() => setEditingV3Client(null)}>
              Cancel
            </Button>
            <Button
              className="flex-1 h-10 text-xs rounded-lg gap-1.5"
              disabled={updateV3Mutation.isPending}
              onClick={() => updateV3Mutation.mutate({
                id: editingV3Client.id,
                payload: {
                  name: editingV3Client.name,
                  scopes: editingV3Client.scopes,
                  corsOrigins: editingV3Client.corsOrigins,
                  isActive: editingV3Client.isActive,
                },
              })}>
              {updateV3Mutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save changes
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function AppsApiPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="p-6 max-w-350 mx-auto min-h-screen bg-background">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-[50vh]">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          }>
          <AppsApiContent />
        </Suspense>
      </div>
    </QueryClientProvider>
  );
}
