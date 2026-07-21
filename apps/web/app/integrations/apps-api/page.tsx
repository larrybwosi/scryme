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
  Globe,
  Lock,
  MoreVertical,
  Check,
  Terminal,
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

function AppsApiContent() {
  const searchParams = useSearchParams();
  const initialTab =
    searchParams.get("tab") === "v2"
      ? "devices"
      : searchParams.get("tab") || "v3";
  const [activeTab, setActiveTab] = useState(initialTab);

  // V3 Clients State
  const [v3Clients, setV3Clients] = useState<any[]>([]);
  const [newClientName, setNewClientName] = useState("");
  const [showV3Dialog, setShowV3Dialog] = useState(false);
  const [v3Result, setV3Result] = useState<any>(null);
  const [editingV3Client, setEditingV3Client] = useState<any>(null);

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
      const [v3, wh, tokens, regs, locs] = await Promise.all([
        getV3ApiClientsAction(),
        getWebhookSubscriptionsAction(),
        getDeviceSetupTokensAction(),
        getDeviceRegistryAction(),
        getLocations(),
      ]);
      setV3Clients(v3);
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
      toast.success("V3 client created");
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
      toast.success("Device provisioned");
    } catch (error) {
      toast.error("Failed to provision device");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const tabs = [
    { id: "v3", label: "API Clients", icon: Key },
    { id: "webhooks", label: "Webhooks", icon: Webhook },
    { id: "devices", label: "Devices", icon: Monitor },
  ];

  const availableEvents = [
    "order.created",
    "order.updated",
    "inventory.low",
    "customer.created",
  ];

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: "Integrations", href: "/integrations" },
          { label: "Developer Tools" },
        ]}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border-b border-slate-200/70 pb-6">
        <PageHeader
          title="Developer Tools"
          subtitle="Manage API credentials, webhooks, and hardware provisioning for your organization."
          icon={<Terminal className="w-6 h-6 text-slate-700" />}
        />
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all",
                activeTab === tab.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50",
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
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                API Clients
              </h2>
              <p className="text-[13px] text-slate-500">
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
                <Button className="bg-slate-900 hover:bg-slate-800 gap-1.5 h-9 px-4 text-xs font-semibold rounded-lg shadow-sm">
                  <Plus size={16} />
                  New client
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-110 rounded-xl">
                <DialogHeader>
                  <DialogTitle className="text-base font-bold tracking-tight">
                    Create API client
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Create a new OAuth2 client for accessing the platform API.
                  </DialogDescription>
                </DialogHeader>
                {!v3Result ? (
                  <div className="grid gap-4 py-3">
                    <div className="grid gap-1.5">
                      <Label
                        htmlFor="client-name"
                        className="text-xs font-semibold text-slate-600">
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
                  </div>
                ) : (
                  <div className="space-y-3 py-3">
                    <div className="p-3 bg-amber-50 text-amber-800 rounded-lg text-xs border border-amber-200/80 font-medium">
                      Copy the client secret now — it will not be shown again.
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        Client ID
                      </Label>
                      <div className="flex gap-2">
                        <code className="flex-1 bg-slate-50 p-2.5 rounded-lg text-xs break-all border border-slate-200 font-mono text-slate-700">
                          {v3Result.clientId}
                        </code>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-lg"
                          onClick={() => copyToClipboard(v3Result.clientId)}>
                          <Copy size={13} />
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        Client secret
                      </Label>
                      <div className="flex gap-2">
                        <code className="flex-1 bg-slate-50 p-2.5 rounded-lg text-xs break-all border border-slate-200 font-mono text-slate-700">
                          {v3Result.clientSecret}
                        </code>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-lg"
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
                    <Button
                      onClick={handleCreateV3}
                      disabled={!newClientName}
                      className="bg-slate-900 hover:bg-slate-800 text-xs rounded-lg">
                      Create client
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setShowV3Dialog(false);
                        setV3Result(null);
                      }}
                      className="bg-slate-900 hover:bg-slate-800 text-xs rounded-lg">
                      I&#39ve saved the secret
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {v3Clients.length === 0 ? (
              <div className="bg-white p-14 rounded-xl border border-dashed border-slate-200 flex flex-col items-center text-center">
                <div className="p-3 bg-slate-50 rounded-lg mb-3 border border-slate-100">
                  <Key className="w-7 h-7 text-slate-400" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1 tracking-tight">
                  No API clients yet
                </h3>
                <p className="text-[13px] text-slate-500 max-w-sm">
                  Create your first OAuth2 client to start building custom
                  integrations with the platform API.
                </p>
              </div>
            ) : (
              v3Clients.map(client => (
                <div
                  key={client.id}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)] hover:border-slate-300 transition-all group">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-slate-900 rounded-lg text-white">
                          <Code2 size={15} />
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 tracking-tight">
                          {client.name}
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider">
                            Client ID
                          </span>
                          <code className="bg-slate-50 px-1.5 py-0.5 rounded text-xs border border-slate-200 font-mono text-slate-600">
                            {client.clientId}
                          </code>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider">
                            Status
                          </span>
                          <Badge
                            variant={
                              client.isActive ? "default" : "destructive"
                            }
                            className={cn(
                              "cursor-pointer px-2 py-0.5 border-none text-[10px] font-bold",
                              client.isActive
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "bg-rose-50 text-rose-700 hover:bg-rose-100",
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
                        className="h-8 w-8 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                        onClick={() => setEditingV3Client(client)}
                        title="Settings">
                        <Settings2 size={16} />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100">
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
                            onClick={() =>
                              deleteV3ApiClientAction(client.id).then(loadData)
                            }>
                            <Trash2 size={12} className="mr-2" />
                            Delete client
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Scopes & permissions
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {client.scopes.map((s: string) => (
                          <Badge
                            key={s}
                            variant="secondary"
                            className="bg-slate-100 text-slate-600 border-none font-semibold px-2 py-0.5 text-[10px] rounded-md">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        CORS allowed origins
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {client.corsOrigins.length > 0 ? (
                          client.corsOrigins.map((o: string) => (
                            <Badge
                              key={o}
                              variant="outline"
                              className="font-mono text-[10px] bg-slate-50/50 border-slate-200 text-slate-600 rounded-md">
                              {o}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">
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
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Hardware & devices
              </h2>
              <p className="text-[13px] text-slate-500">
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
                <Button className="bg-slate-900 hover:bg-slate-800 gap-1.5 h-9 px-4 text-xs font-semibold rounded-lg shadow-sm">
                  <Plus size={16} />
                  Provision device
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-130 rounded-xl">
                <DialogHeader>
                  <DialogTitle className="text-base font-bold tracking-tight">
                    Provision device
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Generate a setup token to provision a new POS device.
                  </DialogDescription>
                </DialogHeader>
                {!deviceTokenResult ? (
                  <div className="grid gap-4 py-3">
                    <div className="grid gap-1.5">
                      <Label
                        htmlFor="device-name"
                        className="text-xs font-semibold text-slate-600">
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
                          className="text-xs font-semibold text-slate-600">
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
                          className="text-xs font-semibold text-slate-600">
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
                      <Label className="text-xs font-semibold text-slate-600">
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
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Permissions
                      </Label>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100 max-h-48 overflow-y-auto">
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
                              className="text-[9px] font-bold uppercase tracking-tight text-slate-600 cursor-pointer">
                              {perm.replace(":", " ")}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 py-3">
                    <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-xs border border-emerald-200/80 font-semibold text-center">
                      Setup token generated
                    </div>

                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <QRCodeSVG
                          value={deviceTokenResult.rawToken}
                          size={160}
                          level="H"
                          includeMargin={false}
                        />
                      </div>

                      <div className="w-full space-y-2">
                        <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100 relative group">
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                            Provisioning token
                          </div>
                          <div className="text-xl font-mono font-bold tracking-[0.15em] text-slate-900 break-all px-2">
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

                    <p className="text-[10px] text-center text-slate-400 italic">
                      Scan the QR code on your device or enter the token
                      manually to provision. Valid for 24 hours.
                    </p>
                  </div>
                )}
                <DialogFooter>
                  {!deviceTokenResult ? (
                    <Button
                      onClick={handleProvisionDevice}
                      disabled={!newDevice.deviceName}
                      className="bg-slate-900 hover:bg-slate-800 w-full text-xs rounded-lg">
                      Generate token
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setShowDeviceDialog(false);
                        setDeviceTokenResult(null);
                      }}
                      className="bg-slate-900 hover:bg-slate-800 w-full text-xs rounded-lg">
                      Done
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {registries.length === 0 &&
              deviceTokens.filter(t => !t.usedAt && !t.revokedAt).length ===
                0 && (
                <div className="bg-white h-[200px] rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-6">
                  <div className="p-3 bg-slate-50 rounded-lg mb-2 border border-slate-100">
                    <Cpu className="w-7 h-7 text-slate-300" />
                  </div>
                  <p className="text-[13px] text-slate-500 font-medium max-w-xs">
                    No hardware devices connected to this organization yet.
                  </p>
                </div>
              )}

            {deviceTokens
              .filter(t => !t.usedAt && !t.revokedAt)
              .map(token => (
                <div
                  key={token.id}
                  className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/70 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                      <Lock size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">
                        Pending setup: {token.deviceName}
                      </div>
                      <div className="text-[10px] text-amber-700/80 mt-0.5 font-semibold">
                        EXPIRES: {new Date(token.expiresAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-amber-700 hover:bg-amber-100 h-8 w-8 rounded-lg"
                    onClick={() => copyToClipboard(token.rawToken)}>
                    <Copy size={14} />
                  </Button>
                </div>
              ))}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {registries.map(reg => (
                <div
                  key={reg.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)] hover:border-slate-300 transition-all flex justify-between items-center group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                      <Monitor size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">
                        {reg.deviceName}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <span className="font-semibold text-[9px] uppercase tracking-wider">
                          {reg.deviceType}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
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
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500",
                      )}>
                      {reg.status}
                    </Badge>
                    <div className="text-[9px] text-slate-400 mt-1 font-bold uppercase tracking-tighter flex items-center justify-end gap-1">
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
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Webhook subscriptions
              </h2>
              <p className="text-[13px] text-slate-500">
                Receive real-time notifications when events happen in your
                organization.
              </p>
            </div>
            <Dialog
              open={showWebhookDialog}
              onOpenChange={setShowWebhookDialog}>
              <DialogTrigger asChild>
                <Button className="bg-slate-900 hover:bg-slate-800 gap-1.5 h-9 px-4 text-xs font-semibold rounded-lg shadow-sm">
                  <Plus size={16} />
                  Add webhook
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-125 rounded-xl">
                <DialogHeader>
                  <DialogTitle className="text-base font-bold tracking-tight">
                    Add webhook subscription
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Configure a new endpoint to receive real-time notifications.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-3">
                  <div className="grid gap-1.5">
                    <Label
                      htmlFor="webhook-name"
                      className="text-xs font-semibold text-slate-600">
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
                      className="text-xs font-semibold text-slate-600">
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
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Events to subscribe
                    </Label>
                    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
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
                            className="text-xs font-semibold text-slate-600 uppercase cursor-pointer">
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
                    onClick={handleCreateWebhook}
                    disabled={!newWebhook.url || newWebhook.events.length === 0}
                    className="bg-slate-900 hover:bg-slate-800 h-9 text-xs rounded-lg">
                    Create subscription
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {webhooks.length === 0 ? (
            <div className="bg-white p-14 rounded-xl border border-dashed border-slate-200 flex flex-col items-center text-center">
              <div className="p-3 bg-slate-50 rounded-lg mb-3 border border-slate-100">
                <Webhook className="w-7 h-7 text-slate-400" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1 tracking-tight">
                No webhooks configured
              </h3>
              <p className="text-[13px] text-slate-500 max-w-sm">
                Listen to real-time events from the API and trigger external
                workflows in your own stack.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {webhooks.map(wh => (
                <div
                  key={wh.id}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex justify-between items-center group hover:border-slate-300 hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)] transition-all">
                  <div className="space-y-3">
                    <div>
                      <div className="font-bold text-sm text-slate-900 tracking-tight">
                        {wh.name || "Untitled webhook"}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <Globe size={12} className="text-slate-400" />
                        <code className="bg-slate-50 px-1 py-0.2 rounded border border-slate-200 font-mono text-xs text-slate-600">
                          {wh.url}
                        </code>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {wh.events.map((e: string) => (
                        <Badge
                          key={e}
                          variant="secondary"
                          className="bg-slate-100 text-slate-600 border-none font-bold text-[9px] uppercase px-2 py-0.5 rounded-md">
                          {e}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-destructive hover:bg-destructive/5 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 rounded-lg"
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
        <SheetContent className="sm:max-w-md">
          <SheetHeader className="pb-6">
            <SheetTitle className="text-lg font-bold tracking-tight">
              Client advanced settings
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-500">
              Modify security settings and permissions for{" "}
              <strong className="text-slate-700">
                {editingV3Client?.name}
              </strong>
              .
            </SheetDescription>
          </SheetHeader>
          {editingV3Client && (
            <div className="py-4 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Scopes & permissions
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
                            "cursor-pointer py-1.5 px-3 h-auto text-[10px] font-bold transition-all border-none rounded-lg",
                            isSelected
                              ? "bg-slate-900 text-white shadow-sm"
                              : "bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200",
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
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
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
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Comma-separated list of browser origins allowed to make
                    authenticated requests.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="space-y-0.5">
                  <div className="font-bold text-xs text-slate-900">
                    Active status
                  </div>
                  <div className="text-[9px] text-slate-400 uppercase font-bold tracking-tight">
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
              className="flex-1 h-10 text-xs rounded-lg"
              onClick={() => setEditingV3Client(null)}>
              Cancel
            </Button>
            <Button
              className="flex-1 h-10 text-xs bg-slate-900 hover:bg-slate-800 rounded-lg"
              onClick={handleUpdateV3}>
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
    <div className="p-6 max-w-350 mx-auto min-h-screen bg-[#F8F9FB]">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-[50vh]">
            <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        }>
        <AppsApiContent />
      </Suspense>
    </div>
  );
}
