"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Key,
  Webhook,
  Monitor,
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  Shield,
  Zap,
  Globe,
  Lock,
  MoreVertical,
  Check,
  QrCode,
  Terminal,
  Download,
  Code2,
  Cpu,
  History,
  Settings2,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Breadcrumbs } from "../../../components/breadcrumbs";
import { PageHeader } from "../../../components/page-header";
import { cn } from "@repo/ui/lib/utils";
import {
  getDeviceRegistryAction,
  getDeviceSetupTokensAction,
  getV2ApiKeysAction,
  getV3ApiClientsAction,
  getWebhookSubscriptionsAction,
  createDeviceSetupTokenAction,
  createV2ApiKeyAction,
  createV3ApiClientAction,
  createWebhookSubscriptionAction,
  deleteV2ApiKeyAction,
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

function AppsApiContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "v3";
  const [activeTab, setActiveTab] = useState(initialTab);

  // V3 Clients State
  const [v3Clients, setV3Clients] = useState<any[]>([]);
  const [newClientName, setNewClientName] = useState("");
  const [showV3Dialog, setShowV3Dialog] = useState(false);
  const [v3Result, setV3Result] = useState<any>(null);
  const [editingV3Client, setEditingV3Client] = useState<any>(null);

  // V2 Keys State
  const [v2Keys, setV2Keys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [showV2Dialog, setShowV2Dialog] = useState(false);
  const [v2Result, setV2Result] = useState<any>(null);

  // Webhooks State
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [showWebhookDialog, setShowWebhookDialog] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    name: "",
    url: "",
    events: [] as string[],
  });

  // Device Tokens State
  const [deviceTokens, setDeviceTokens] = useState<any[]>([]);
  const [registries, setRegistries] = useState<any[]>([]);
  const [showDeviceDialog, setShowDeviceDialog] = useState(false);
  const [newDevice, setNewDevice] = useState({
    deviceName: "",
    deviceType: "POS_TERMINAL" as any,
    locationId: "default",
    permissions: [] as string[],
    environment: "LIVE" as "LIVE" | "TEST",
  });
  const [deviceTokenResult, setDeviceTokenResult] = useState<any>(null);
  const [locations, setLocations] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [v3, v2, wh, tokens, regs, locs] = await Promise.all([
        getV3ApiClientsAction(),
        getV2ApiKeysAction(),
        getWebhookSubscriptionsAction(),
        getDeviceSetupTokensAction(),
        getDeviceRegistryAction(),
        getLocations(),
      ]);
      setV3Clients(v3);
      setV2Keys(v2);
      setWebhooks(wh);
      setDeviceTokens(tokens);
      setRegistries(regs);
      setLocations(locs);
      setNewDevice(prev => {
        if (locs.length > 0 && prev.locationId === "default") {
          return { ...prev, locationId: locs[0].id };
        }
        return prev;
      });
    } catch (error) {
      console.error("Failed to load data", error);
      toast.error("Failed to load integration data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [activeTab, loadData]);

  const handleCreateV3 = async () => {
    try {
      const res = await createV3ApiClientAction({ name: newClientName });
      setV3Result(res);
      setNewClientName("");
      loadData();
      toast.success("V3 Client created successfully");
    } catch (error) {
      toast.error("Failed to create V3 client");
    }
  };

  const handleUpdateV3 = async () => {
    if (!editingV3Client) return;
    try {
      await updateV3ApiClientAction(editingV3Client.id, {
        scopes: editingV3Client.scopes,
        corsOrigins: editingV3Client.corsOrigins,
        isActive: editingV3Client.isActive,
      });
      setEditingV3Client(null);
      loadData();
      toast.success("Client settings updated");
    } catch (error) {
      toast.error("Failed to update client settings");
    }
  };

  const handleCreateWebhook = async () => {
    try {
      await createWebhookSubscriptionAction(newWebhook);
      setShowWebhookDialog(false);
      setNewWebhook({ name: "", url: "", events: [] });
      loadData();
      toast.success("Webhook subscription added");
    } catch (error) {
      toast.error("Failed to add webhook subscription");
    }
  };

  const handleProvisionDevice = async () => {
    try {
      const res = await createDeviceSetupTokenAction(newDevice);
      setDeviceTokenResult(res);
      loadData();
      toast.success("Device provisioned successfully");
    } catch (error) {
      toast.error("Failed to provision device");
    }
  };

  const handleCreateV2 = async () => {
    try {
      const res = await createV2ApiKeyAction({ name: newKeyName });
      setV2Result(res);
      setNewKeyName("");
      loadData();
      toast.success("V2 API Key created");
    } catch (error) {
      toast.error("Failed to create V2 API key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const tabs = [
    { id: "v3", label: "V3 API Clients", icon: Key },
    { id: "webhooks", label: "Webhooks", icon: Webhook },
    { id: "v2", label: "V2 & Devices", icon: Monitor },
  ];

  const availableEvents = [
    "order.created",
    "order.updated",
    "inventory.low",
    "customer.created",
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Integrations", href: "/integrations" },
          { label: "Developer Tools" },
        ]}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-5">
        <PageHeader
          title="Developer Tools"
          subtitle="Manage your API credentials, webhooks, and device provisioning."
          icon={<Terminal className="w-6 h-6 text-indigo-600" />}
        />
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all",
                activeTab === tab.id
                  ? "bg-indigo-50 text-indigo-600 font-bold"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50",
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
            <div className="space-y-0.5">
              <h2 className="text-lg font-bold text-gray-900">V3 API Clients</h2>
              <p className="text-xs text-gray-500">Modern OAuth2 clients for building robust integrations.</p>
            </div>
            <Dialog
              open={showV3Dialog}
              onOpenChange={open => {
                setShowV3Dialog(open);
                if (!open) setV3Result(null);
              }}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 gap-1.5 h-9 px-4 text-xs font-semibold rounded-md shadow-sm">
                  <Plus size={16} />
                  Create Client
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] rounded-lg">
                <DialogHeader>
                  <DialogTitle className="text-base font-bold">Create V3 Client</DialogTitle>
                  <DialogDescription className="text-xs">
                    Create a new OAuth2 client for accessing our V3 API.
                  </DialogDescription>
                </DialogHeader>
                {!v3Result ? (
                  <div className="grid gap-4 py-3">
                    <div className="grid gap-1.5">
                      <Label htmlFor="client-name" className="text-xs">Client Name</Label>
                      <Input
                        id="client-name"
                        value={newClientName}
                        onChange={e => setNewClientName(e.target.value)}
                        placeholder="e.g., My Mobile App"
                        className="h-10 text-sm rounded-md"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 py-3">
                    <div className="p-2.5 bg-amber-50 text-amber-700 rounded-md text-xs border border-amber-200 font-medium">
                      Important: Copy your Client Secret now. It will never be
                      shown again.
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                        Client ID
                      </Label>
                      <div className="flex gap-2">
                        <code className="flex-1 bg-gray-50 p-2.5 rounded-md text-xs break-all border font-mono">
                          {v3Result.clientId}
                        </code>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-md"
                          onClick={() => copyToClipboard(v3Result.clientId)}>
                          <Copy size={13} />
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                        Client Secret
                      </Label>
                      <div className="flex gap-2">
                        <code className="flex-1 bg-gray-50 p-2.5 rounded-md text-xs break-all border font-mono">
                          {v3Result.clientSecret}
                        </code>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-md"
                          onClick={() =>
                            copyToClipboard(v3Result.clientSecret)
                          }>
                          <Copy size={13} />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                <DialogFooter className="gap-2 sm:gap-0">
                  {!v3Result ? (
                    <Button onClick={handleCreateV3} disabled={!newClientName} className="bg-indigo-600 hover:bg-indigo-700 text-xs rounded-md">
                      Create Client
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setShowV3Dialog(false);
                        setV3Result(null);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-xs rounded-md"
                    >
                      I have saved the secret
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {v3Clients.length === 0 ? (
              <div className="bg-white p-12 rounded-lg border border-dashed flex flex-col items-center text-center shadow-sm">
                <div className="p-3 bg-indigo-50 rounded-md mb-3">
                  <Key className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">No API Clients</h3>
                <p className="text-xs text-gray-500 max-w-sm mb-6">Create your first OAuth2 client to start building custom integrations with our V3 API.</p>
              </div>
            ) : (
              v3Clients.map(client => (
                <div
                  key={client.id}
                  className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-50 rounded-md text-indigo-600">
                          <Code2 size={16} />
                        </div>
                        <h3 className="font-bold text-sm text-gray-900">{client.name}</h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        <span className="flex items-center gap-1.5 text-gray-500">
                          <span className="font-semibold text-gray-400 text-[10px] uppercase">Client ID</span>
                          <code className="bg-gray-50 px-1.5 py-0.5 rounded text-xs border font-mono">
                            {client.clientId}
                          </code>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="font-semibold text-gray-400 text-[10px] uppercase">Status</span>
                          <Badge
                            variant={client.isActive ? "default" : "destructive"}
                            className={cn(
                              "cursor-pointer px-2 py-0.5 border-none text-[10px]",
                              client.isActive
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "",
                            )}
                            onClick={() =>
                              updateV3ApiClientAction(client.id, {
                                isActive: !client.isActive,
                              }).then(loadData)
                            }>
                            {client.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md"
                        onClick={() => setEditingV3Client(client)}
                        title="Settings">
                        <Settings2 size={16} />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-md">
                          <DropdownMenuItem
                            className="py-1.5 text-xs rounded-sm"
                            onClick={async () => {
                              const secret = await regenerateV3ClientSecretAction(
                                client.id,
                              );
                              copyToClipboard(secret);
                              toast.info(
                                "New secret copied to clipboard. It will not be shown again.",
                              );
                            }}>
                            <RefreshCw size={12} className="mr-2" />
                            Regenerate Secret
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive py-1.5 text-xs rounded-sm"
                            onClick={() =>
                              deleteV3ApiClientAction(client.id).then(loadData)
                            }>
                            <Trash2 size={12} className="mr-2" />
                            Delete Client
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                        Scopes & Permissions
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {client.scopes.map((s: string) => (
                          <Badge
                            key={s}
                            variant="secondary"
                            className="bg-gray-100 text-gray-600 border-none font-medium px-2 py-0.5 text-[10px] rounded-md">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                        CORS Allowed Origins
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {client.corsOrigins.length > 0 ? (
                          client.corsOrigins.map((o: string) => (
                            <Badge
                              key={o}
                              variant="outline"
                              className="font-mono text-[10px] bg-gray-50/50 rounded-md">
                              {o}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">
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

      {activeTab === "v2" && (
        <div className="space-y-8">
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <h2 className="text-lg font-bold text-gray-900">V2 API Keys</h2>
                <p className="text-xs text-gray-500">Legacy API keys for specialized integrations and POS access.</p>
              </div>
              <Dialog
                open={showV2Dialog}
                onOpenChange={open => {
                  setShowV2Dialog(open);
                  if (!open) setV2Result(null);
                }}>
                <DialogTrigger asChild>
                  <Button className="bg-indigo-600 hover:bg-indigo-700 gap-1.5 h-9 px-4 text-xs font-semibold rounded-md">
                    <Plus size={16} />
                    Create Key
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-lg">
                  <DialogHeader>
                    <DialogTitle className="text-base font-bold">Create V2 API Key</DialogTitle>
                    <DialogDescription className="text-xs">
                      Generate a legacy V2 API key for specialized integrations.
                    </DialogDescription>
                  </DialogHeader>
                  {!v2Result ? (
                    <div className="grid gap-4 py-3">
                      <div className="grid gap-1.5">
                        <Label htmlFor="key-name" className="text-xs">Key Name</Label>
                        <Input
                          id="key-name"
                          value={newKeyName}
                          onChange={e => setNewKeyName(e.target.value)}
                          placeholder="e.g., Development Key"
                          className="h-10 text-sm rounded-md"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 py-3">
                      <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-md text-xs border border-emerald-200 font-medium">
                        Key created successfully.
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                          Full API Key
                        </Label>
                        <div className="flex gap-2">
                          <code className="flex-1 bg-gray-50 p-2.5 rounded-md text-xs break-all border font-mono">
                            {v2Result.fullKey}
                          </code>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 rounded-md"
                            onClick={() => copyToClipboard(v2Result.fullKey)}>
                            <Copy size={13} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  <DialogFooter className="gap-2 sm:gap-0">
                    {!v2Result ? (
                      <Button onClick={handleCreateV2} disabled={!newKeyName} className="bg-indigo-600 hover:bg-indigo-700 text-xs rounded-md">
                        Create Key
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          setShowV2Dialog(false);
                          setV2Result(null);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-xs rounded-md"
                      >
                        Done
                      </Button>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {v2Keys.length === 0 && (
                <div className="col-span-full bg-white p-8 rounded-lg border border-dashed flex flex-col items-center text-center shadow-sm">
                  <p className="text-gray-400 text-xs font-medium">No V2 API keys found.</p>
                </div>
              )}
              {v2Keys.map(key => (
                <div
                  key={key.id}
                  className="bg-white p-4 rounded-lg border border-gray-200 flex justify-between items-center shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Key size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-gray-900">{key.name}</span>
                        <Badge variant="outline" className="text-[9px] px-1.5 h-4.5 font-bold uppercase tracking-tight bg-gray-50 border-gray-200 text-gray-600">
                          {key.environment}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Prefix:{" "}
                        <code className="bg-gray-50 px-1 py-0.2 rounded border text-[10px] font-mono">
                          {key.keyPrefix}
                        </code>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-destructive hover:bg-destructive/5 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 rounded-md"
                    onClick={() => deleteV2ApiKeyAction(key.id).then(loadData)}>
                    <Trash2 size={15} />
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <h2 className="text-lg font-bold text-gray-900">Hardware & Devices</h2>
                <p className="text-xs text-gray-500">Provision and manage POS terminals and kiosks.</p>
              </div>
              <Dialog
                open={showDeviceDialog}
                onOpenChange={open => {
                  setShowDeviceDialog(open);
                  if (!open) setDeviceTokenResult(null);
                }}>
                <DialogTrigger asChild>
                  <Button className="bg-indigo-600 hover:bg-indigo-700 gap-1.5 h-9 px-4 text-xs font-semibold rounded-md shadow-sm">
                    <Plus size={16} />
                    Provision Device
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] rounded-lg">
                  <DialogHeader>
                    <DialogTitle className="text-base font-bold">Provision Device</DialogTitle>
                    <DialogDescription className="text-xs">
                      Generate a setup token to provision a new POS device.
                    </DialogDescription>
                  </DialogHeader>
                  {!deviceTokenResult ? (
                    <div className="grid gap-4 py-3">
                      <div className="grid gap-1.5">
                        <Label htmlFor="device-name" className="text-xs">Device Name</Label>
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
                          className="h-10 text-sm rounded-md"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                          <Label htmlFor="device-type" className="text-xs">Device Type</Label>
                          <Select
                            value={newDevice.deviceType}
                            onValueChange={val => {
                              const deviceType = val as any;
                              const permissions =
                                deviceType === "BAKERY_TERMINAL"
                                  ? ["bakery:production", "bakery:recipes"]
                                  : [
                                      "pos:transactions",
                                      "pos:orders",
                                      "pos:inventory",
                                    ];

                              setNewDevice({
                                ...newDevice,
                                deviceType,
                                permissions,
                              });
                            }}>
                            <SelectTrigger id="device-type" className="h-10 text-sm rounded-md">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent className="rounded-md">
                              <SelectItem value="POS_TERMINAL">POS Terminal</SelectItem>
                              <SelectItem value="MOBILE_POS">Mobile POS</SelectItem>
                              <SelectItem value="KIOSK">Kiosk</SelectItem>
                              <SelectItem value="TABLET">Tablet</SelectItem>
                              <SelectItem value="BAKERY_TERMINAL">Bakery Terminal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="location-id" className="text-xs">Location</Label>
                          <Select
                            value={newDevice.locationId}
                            onValueChange={val =>
                              setNewDevice({ ...newDevice, locationId: val })
                            }>
                            <SelectTrigger id="location-id" className="h-10 text-sm rounded-md">
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent className="rounded-md">
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
                        <Label className="text-xs">Environment</Label>
                        <Select
                          value={newDevice.environment}
                          onValueChange={val =>
                            setNewDevice({
                              ...newDevice,
                              environment: val as any,
                            })
                          }>
                          <SelectTrigger className="h-10 text-sm rounded-md">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-md">
                            <SelectItem value="LIVE">Production (Live)</SelectItem>
                            <SelectItem value="TEST">Sandbox (Test)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-gray-400">Permissions</Label>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-3 bg-gray-50 rounded-md border border-gray-100">
                          {[
                            "pos:transactions",
                            "pos:orders",
                            "pos:inventory",
                            "pos:customers",
                            "bakery:production",
                            "bakery:recipes",
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
                                className="text-[9px] font-bold uppercase text-gray-600 cursor-pointer">
                                {perm.replace(":", " ")}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 py-3">
                      <div className="p-3 bg-emerald-50 text-emerald-700 rounded-md text-xs border border-emerald-100 font-semibold text-center">
                        Setup token generated successfully.
                      </div>

                      <div className="flex flex-col items-center gap-4">
                        <div className="bg-white p-4 rounded-lg border-2 border-indigo-50 shadow-md">
                          <QRCodeSVG
                            value={deviceTokenResult.rawToken}
                            size={160}
                            level="H"
                            includeMargin={false}
                          />
                        </div>

                        <div className="w-full space-y-2">
                          <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-100 relative group">
                            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                              Provisioning Token
                            </div>
                            <div className="text-xl font-mono font-bold tracking-[0.15em] text-indigo-600 break-all px-2">
                              {deviceTokenResult.rawToken}
                            </div>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="mt-3 w-full gap-1.5 h-8 font-bold text-xs rounded-md"
                              onClick={() =>
                                copyToClipboard(deviceTokenResult.rawToken)
                              }>
                              <Copy size={12} /> Copy Token
                            </Button>
                          </div>
                        </div>
                      </div>

                      <p className="text-[10px] text-center text-gray-400 italic">
                        Scan the QR code on your mobile device or enter the
                        token manually to provision. Valid for 24 hours.
                      </p>
                    </div>
                  )}
                  <DialogFooter>
                    {!deviceTokenResult ? (
                      <Button
                        onClick={handleProvisionDevice}
                        disabled={!newDevice.deviceName}
                        className="bg-indigo-600 hover:bg-indigo-700 w-full text-xs rounded-md"
                      >
                        Generate Token
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          setShowDeviceDialog(false);
                          setDeviceTokenResult(null);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 w-full text-xs rounded-md"
                      >
                        Done
                      </Button>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {registries.length === 0 &&
                deviceTokens.filter(t => !t.usedAt && !t.revokedAt).length === 0 && (
                  <div className="bg-white h-[200px] rounded-lg border border-dashed flex flex-col items-center justify-center text-center p-6 shadow-sm">
                    <div className="p-3 bg-gray-50 rounded-md mb-2">
                      <Cpu className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-xs text-gray-500 font-medium max-w-xs">
                      No hardware devices connected to this organization yet.
                    </p>
                  </div>
                )}

              {deviceTokens
                .filter(t => !t.usedAt && !t.revokedAt)
                .map(token => (
                  <div
                    key={token.id}
                    className="bg-amber-50/50 p-4 rounded-lg border border-amber-100 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-amber-100 flex items-center justify-center text-amber-600">
                        <Lock size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-gray-900">
                          Pending Setup: {token.deviceName}
                        </div>
                        <div className="text-[10px] text-amber-600/70 mt-0.5 font-semibold">
                          EXPIRES: {new Date(token.expiresAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-amber-600 hover:bg-amber-100 h-8 w-8 rounded-md"
                      onClick={() => copyToClipboard(token.rawToken)}>
                      <Copy size={14} />
                    </Button>
                  </div>
                ))}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {registries.map(reg => (
                  <div
                    key={reg.id}
                    className="bg-white p-4 rounded-lg border border-gray-150 flex justify-between items-center shadow-sm group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        <Monitor size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-gray-900">{reg.deviceName}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5">
                          <span className="font-semibold text-[9px] uppercase tracking-wider">{reg.deviceType}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300" />
                          <span>{reg.location?.name || "Main Location"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={reg.status === "ACTIVE" ? "default" : "secondary"}
                        className={cn(
                          "px-2 py-0.2 border-none text-[9px]",
                          reg.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-50 text-gray-500"
                        )}>
                        {reg.status}
                      </Badge>
                      <div className="text-[9px] text-gray-400 mt-1 font-bold uppercase tracking-tighter flex items-center justify-end gap-1">
                        <History size={10} />
                        {reg.lastSeenAt
                          ? new Date(reg.lastSeenAt).toLocaleString()
                          : "Never Seen"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === "webhooks" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <h2 className="text-lg font-bold text-gray-900">Webhook Subscriptions</h2>
              <p className="text-xs text-gray-500">Receive real-time notifications when events happen in your organization.</p>
            </div>
            <Dialog
              open={showWebhookDialog}
              onOpenChange={setShowWebhookDialog}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 gap-1.5 h-9 px-4 text-xs font-semibold rounded-md shadow-sm">
                  <Plus size={16} />
                  Add Webhook
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] rounded-lg">
                <DialogHeader>
                  <DialogTitle className="text-base font-bold">Add Webhook Subscription</DialogTitle>
                  <DialogDescription className="text-xs">
                    Configure a new endpoint to receive real-time notifications.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="webhook-name" className="text-xs">Friendly Name</Label>
                    <Input
                      id="webhook-name"
                      value={newWebhook.name}
                      onChange={e =>
                        setNewWebhook({ ...newWebhook, name: e.target.value })
                      }
                      placeholder="My Production Webhook"
                      className="h-10 text-sm rounded-md"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="webhook-url" className="text-xs">Payload URL</Label>
                    <Input
                      id="webhook-url"
                      value={newWebhook.url}
                      onChange={e =>
                        setNewWebhook({ ...newWebhook, url: e.target.value })
                      }
                      placeholder="https://api.myapp.com/webhooks"
                      className="h-10 text-sm rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-gray-400">Events to Subscribe</Label>
                    <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-md border border-gray-100">
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
                            className="text-xs font-semibold text-gray-600 uppercase cursor-pointer">
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
                    className="h-9 text-xs rounded-md"
                    onClick={() => setShowWebhookDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateWebhook}
                    disabled={!newWebhook.url || newWebhook.events.length === 0}
                    className="bg-indigo-600 hover:bg-indigo-700 h-9 text-xs rounded-md"
                  >
                    Create Subscription
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {webhooks.length === 0 ? (
            <div className="bg-white p-12 rounded-lg border border-dashed flex flex-col items-center text-center shadow-sm">
              <div className="p-3 bg-indigo-50 rounded-md mb-3">
                <Webhook className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">No Webhooks</h3>
              <p className="text-xs text-gray-500 max-w-sm">Listen to real-time events from our API and trigger external workflows in your own stack.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {webhooks.map(wh => (
                <div
                  key={wh.id}
                  className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex justify-between items-center group hover:border-indigo-100 transition-all">
                  <div className="space-y-3">
                    <div>
                      <div className="font-bold text-sm text-gray-900">
                        {wh.name || "Untitled Webhook"}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                        <Globe size={12} className="text-indigo-400" />
                        <code className="bg-gray-50 px-1 py-0.2 rounded border font-mono text-xs text-gray-700">{wh.url}</code>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {wh.events.map((e: string) => (
                        <Badge
                          key={e}
                          variant="secondary"
                          className="bg-indigo-50 text-indigo-600 border-none font-bold text-[9px] uppercase px-2 py-0.5 rounded-md">
                          {e}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-destructive hover:bg-destructive/5 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 rounded-md"
                    onClick={() =>
                      deleteWebhookSubscriptionAction(wh.id).then(loadData)
                    }>
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- SHEET --- */}
      <Sheet
        open={!!editingV3Client}
        onOpenChange={open => !open && setEditingV3Client(null)}>
        <SheetContent className="sm:max-w-md rounded-l-lg">
          <SheetHeader className="pb-6">
            <SheetTitle className="text-lg font-bold">Client Advanced Settings</SheetTitle>
            <SheetDescription className="text-xs">
              Modify security settings and permissions for{" "}
              <strong>{editingV3Client?.name}</strong>.
            </SheetDescription>
          </SheetHeader>
          {editingV3Client && (
            <div className="py-4 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Scopes & Permissions
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {["read", "write", "admin", "inventory", "orders"].map(
                    scope => {
                      const isSelected = editingV3Client.scopes.includes(scope);
                      return (
                        <Badge
                          key={scope}
                          variant={isSelected ? "default" : "outline"}
                          className={cn(
                            "cursor-pointer py-1.5 px-3 h-auto text-[10px] font-bold transition-all border-none rounded-md",
                            isSelected ? "bg-indigo-600 text-white shadow-sm" : "bg-gray-50 text-gray-500 hover:bg-gray-100",
                          )}
                          onClick={() => {
                            const scopes = isSelected
                              ? editingV3Client.scopes.filter(
                                  (s: string) => s !== scope,
                                )
                              : [...editingV3Client.scopes, scope];
                            setEditingV3Client({ ...editingV3Client, scopes });
                          }}>
                          {scope.toUpperCase()}
                          {isSelected && <Check size={10} className="ml-1" />}
                        </Badge>
                      );
                    },
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  CORS Origins
                </Label>
                <div className="space-y-2">
                  <Input
                    placeholder="e.g. https://myapp.com, http://localhost:3000"
                    value={editingV3Client.corsOrigins.join(", ")}
                    className="h-10 text-sm rounded-md"
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
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    Comma-separated list of browser origins allowed to make authenticated requests.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="space-y-0.5">
                  <div className="font-bold text-xs text-gray-900">Active Status</div>
                  <div className="text-[9px] text-gray-400 uppercase font-bold tracking-tight">
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
                />
              </div>
            </div>
          )}
          <SheetFooter className="mt-8 gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="flex-1 h-10 text-xs rounded-md"
              onClick={() => setEditingV3Client(null)}>
              Cancel
            </Button>
            <Button className="flex-1 h-10 text-xs bg-indigo-600 hover:bg-indigo-700 rounded-md" onClick={handleUpdateV3}>
              Save Changes
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function AppsApiPage() {
  return (
    <div className="p-6 max-w-[1400px] mx-auto min-h-screen bg-[#F9FAFB]">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-[50vh]">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        }>
        <AppsApiContent />
      </Suspense>
    </div>
  );
}
