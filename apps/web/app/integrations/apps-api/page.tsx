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
    { id: "v2", label: "V2 (Legacy & POS)", icon: Monitor },
  ];

  const availableEvents = [
    "order.created",
    "order.updated",
    "inventory.low",
    "customer.created",
  ];

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Integrations", href: "/integrations" },
          { label: "Apps & API" },
        ]}
      />

      <PageHeader
        title="Apps & API Management"
        subtitle="Manage your API credentials and integrations."
        icon={<Shield className="w-7 h-7" />}
      />

      <div className="flex gap-4 border-b mt-8 mb-6 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
            )}>
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "v3" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">V3 API Clients</h2>
            <Dialog
              open={showV3Dialog}
              onOpenChange={open => {
                setShowV3Dialog(open);
                if (!open) setV3Result(null);
              }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus size={18} />
                  Create Client
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create V3 Client</DialogTitle>
                  <DialogDescription>
                    Create a new OAuth2 client for accessing our V3 API.
                  </DialogDescription>
                </DialogHeader>
                {!v3Result ? (
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="client-name">Client Name</Label>
                      <Input
                        id="client-name"
                        value={newClientName}
                        onChange={e => setNewClientName(e.target.value)}
                        placeholder="e.g., My Mobile App"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    <div className="p-3 bg-status-warning/10 text-status-warning rounded-lg text-xs border border-status-warning/20 font-medium">
                      Important: Copy your Client Secret now. It will never be
                      shown again.
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                        Client ID
                      </Label>
                      <div className="flex gap-2">
                        <code className="flex-1 bg-muted p-2 rounded text-xs break-all">
                          {v3Result.clientId}
                        </code>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(v3Result.clientId)}>
                          <Copy size={14} />
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                        Client Secret
                      </Label>
                      <div className="flex gap-2">
                        <code className="flex-1 bg-muted p-2 rounded text-xs break-all">
                          {v3Result.clientSecret}
                        </code>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            copyToClipboard(v3Result.clientSecret)
                          }>
                          <Copy size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  {!v3Result ? (
                    <Button onClick={handleCreateV3} disabled={!newClientName}>
                      Create
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setShowV3Dialog(false);
                        setV3Result(null);
                      }}>
                      Done
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {v3Clients.map(client => (
              <div
                key={client.id}
                className="bg-card p-6 rounded-xl border shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg">{client.name}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Key size={14} />
                        Client ID:{" "}
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                          {client.clientId}
                        </code>
                      </span>
                      <span className="flex items-center gap-2">
                        Status:
                        <Badge
                          variant={client.isActive ? "default" : "destructive"}
                          className={cn(
                            "cursor-pointer",
                            client.isActive
                              ? "bg-status-success/10 text-status-success hover:bg-status-success/20 border-status-success/20"
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
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingV3Client(client)}
                      title="Advanced Settings">
                      <Zap size={18} className="text-primary" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical size={18} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={async () => {
                            const secret = await regenerateV3ClientSecretAction(
                              client.id,
                            );
                            copyToClipboard(secret);
                            toast.info(
                              "New secret copied to clipboard. It will not be shown again.",
                            );
                          }}>
                          <RefreshCw size={14} className="mr-2" />
                          Regenerate Secret
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() =>
                            deleteV3ApiClientAction(client.id).then(loadData)
                          }>
                          <Trash2 size={14} className="mr-2" />
                          Delete Client
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t flex flex-wrap gap-8">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                      Scopes
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {client.scopes.map((s: string) => (
                        <Badge
                          key={s}
                          variant="secondary"
                          className="font-medium">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                      CORS Origins
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {client.corsOrigins.length > 0 ? (
                        client.corsOrigins.map((o: string) => (
                          <Badge
                            key={o}
                            variant="outline"
                            className="font-mono text-[10px]">
                            {o}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          None configured
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "v2" && (
        <div className="space-y-8">
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">V2 API Keys</h2>
              <Dialog
                open={showV2Dialog}
                onOpenChange={open => {
                  setShowV2Dialog(open);
                  if (!open) setV2Result(null);
                }}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus size={18} />
                    Create Key
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create V2 API Key</DialogTitle>
                    <DialogDescription>
                      Generate a legacy V2 API key for specialized integrations.
                    </DialogDescription>
                  </DialogHeader>
                  {!v2Result ? (
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="key-name">Key Name</Label>
                        <Input
                          id="key-name"
                          value={newKeyName}
                          onChange={e => setNewKeyName(e.target.value)}
                          placeholder="e.g., Development Key"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 py-4">
                      <div className="p-3 bg-status-success/10 text-status-success rounded-lg text-xs border border-status-success/20 font-medium">
                        Key created successfully.
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                          Full API Key
                        </Label>
                        <div className="flex gap-2">
                          <code className="flex-1 bg-muted p-2 rounded text-xs break-all">
                            {v2Result.fullKey}
                          </code>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => copyToClipboard(v2Result.fullKey)}>
                            <Copy size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    {!v2Result ? (
                      <Button onClick={handleCreateV2} disabled={!newKeyName}>
                        Create
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          setShowV2Dialog(false);
                          setV2Result(null);
                        }}>
                        Done
                      </Button>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid gap-4">
              {v2Keys.map(key => (
                <div
                  key={key.id}
                  className="bg-card p-4 rounded-xl border flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Key size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{key.name}</span>
                        <Badge variant="outline" className="text-[10px] h-4">
                          {key.environment}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Prefix:{" "}
                        <code className="bg-muted px-1 rounded">
                          {key.keyPrefix}
                        </code>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => deleteV2ApiKeyAction(key.id).then(loadData)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Device Provisioning (POS)</h2>
              <Dialog
                open={showDeviceDialog}
                onOpenChange={open => {
                  setShowDeviceDialog(open);
                  if (!open) setDeviceTokenResult(null);
                }}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus size={18} />
                    Provision Device
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Provision Device</DialogTitle>
                    <DialogDescription>
                      Generate a setup token to provision a new POS device.
                    </DialogDescription>
                  </DialogHeader>
                  {!deviceTokenResult ? (
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="device-name">Device Name</Label>
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
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="device-type">Device Type</Label>
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
                          <SelectTrigger id="device-type">
                            <SelectValue placeholder="Select device type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="POS_TERMINAL">
                              POS Terminal
                            </SelectItem>
                            <SelectItem value="MOBILE_POS">
                              Mobile POS
                            </SelectItem>
                            <SelectItem value="KIOSK">
                              Self-Service Kiosk
                            </SelectItem>
                            <SelectItem value="TABLET">
                              Service Tablet
                            </SelectItem>
                            <SelectItem value="BAKERY_TERMINAL">
                              Bakery Terminal
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="location-id">Location</Label>
                        <Select
                          value={newDevice.locationId}
                          onValueChange={val =>
                            setNewDevice({ ...newDevice, locationId: val })
                          }>
                          <SelectTrigger id="location-id">
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            {locations.map(loc => (
                              <SelectItem key={loc.id} value={loc.id}>
                                {loc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label className="text-sm font-semibold">
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
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LIVE">
                              Production (Live)
                            </SelectItem>
                            <SelectItem value="TEST">Sandbox (Test)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-3">
                        <Label className="text-sm font-semibold">
                          Pre-assigned Permissions
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
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
                                className="text-[10px] font-bold uppercase text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {perm.replace(":", " ")}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6 py-4">
                      <div className="p-3 bg-status-success/10 text-status-success rounded-lg text-xs border border-status-success/20 font-medium text-center">
                        Setup token generated successfully. Valid for 24 hours.
                      </div>

                      <div className="flex flex-col items-center gap-6">
                        <div className="bg-white p-4 rounded-xl border-2 border-primary/20 shadow-sm">
                          <QRCodeSVG
                            value={deviceTokenResult.rawToken}
                            size={180}
                            level="H"
                            includeMargin={false}
                          />
                        </div>

                        <div className="w-full space-y-4">
                          <div className="text-center p-4 bg-muted rounded-xl border border-border relative group">
                            <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                              Provisioning Token
                            </div>
                            <div className="text-lg font-mono font-bold tracking-widest text-primary break-all px-4">
                              {deviceTokenResult.rawToken}
                            </div>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="mt-4 w-full gap-2"
                              onClick={() =>
                                copyToClipboard(deviceTokenResult.rawToken)
                              }>
                              <Copy size={14} /> Copy Token
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full gap-2 text-xs h-9"
                              onClick={() =>
                                copyToClipboard(
                                  `curl -X POST "${process.env.NEXT_PUBLIC_API_URL}/v2/devices/provision" -H "Content-Type: application/json" -d '{"setupToken":"${deviceTokenResult.rawToken}"}'`,
                                )
                              }>
                              <Terminal size={14} /> Copy cURL Command
                            </Button>
                          </div>
                        </div>
                      </div>

                      <p className="text-[10px] text-center text-muted-foreground italic">
                        Scan the QR code on your mobile device or enter the
                        token manually to provision.
                      </p>
                    </div>
                  )}
                  <DialogFooter>
                    {!deviceTokenResult ? (
                      <Button
                        onClick={handleProvisionDevice}
                        disabled={!newDevice.deviceName}>
                        Generate Token
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          setShowDeviceDialog(false);
                          setDeviceTokenResult(null);
                        }}>
                        Done
                      </Button>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="bg-primary/5 p-6 rounded-xl border border-primary/10 mb-6 flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Monitor size={20} />
              </div>
              <div>
                <h3 className="font-bold text-primary mb-1">How it works</h3>
                <p className="text-sm text-primary/80">
                  Generate a setup token to provision a new POS device. The
                  token is valid for 24 hours and can only be used once.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {registries.length === 0 &&
                deviceTokens.filter(t => !t.usedAt && !t.revokedAt).length ===
                  0 && (
                  <div className="bg-card p-12 rounded-xl border border-dashed flex flex-col items-center justify-center text-center">
                    <Monitor className="w-12 h-12 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground font-medium">
                      No devices provisioned yet.
                    </p>
                  </div>
                )}
              {deviceTokens
                .filter(t => !t.usedAt && !t.revokedAt)
                .map(token => (
                  <div
                    key={token.id}
                    className="bg-status-warning/5 p-4 rounded-xl border border-status-warning/20 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-status-warning/10 flex items-center justify-center text-status-warning">
                        <Lock size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-foreground">
                          Pending Setup: {token.deviceName}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Expires: {new Date(token.expiresAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-status-warning hover:bg-status-warning/10"
                      onClick={() => copyToClipboard(token.rawToken)}>
                      <Copy size={16} />
                    </Button>
                  </div>
                ))}
              {registries.map(reg => (
                <div
                  key={reg.id}
                  className="bg-card p-4 rounded-xl border flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <Monitor size={20} />
                    </div>
                    <div>
                      <div className="font-bold">{reg.deviceName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                        <span>{reg.deviceType}</span>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span>{reg.location?.name || "Main Location"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        reg.status === "ACTIVE" ? "default" : "secondary"
                      }
                      className={
                        reg.status === "ACTIVE"
                          ? "bg-status-success/10 text-status-success border-status-success/20"
                          : ""
                      }>
                      {reg.status}
                    </Badge>
                    <div className="text-[10px] text-muted-foreground mt-1.5 font-medium uppercase tracking-tighter">
                      Last seen:{" "}
                      {reg.lastSeenAt
                        ? new Date(reg.lastSeenAt).toLocaleString()
                        : "Never"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeTab === "webhooks" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Webhook Subscriptions</h2>
            <Dialog
              open={showWebhookDialog}
              onOpenChange={setShowWebhookDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus size={18} />
                  Add Webhook
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                  <DialogTitle>Add Webhook Subscription</DialogTitle>
                  <DialogDescription>
                    Configure a new endpoint to receive real-time notifications.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-5 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="webhook-name">Friendly Name</Label>
                    <Input
                      id="webhook-name"
                      value={newWebhook.name}
                      onChange={e =>
                        setNewWebhook({ ...newWebhook, name: e.target.value })
                      }
                      placeholder="My Production Webhook"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="webhook-url">Payload URL</Label>
                    <Input
                      id="webhook-url"
                      value={newWebhook.url}
                      onChange={e =>
                        setNewWebhook({ ...newWebhook, url: e.target.value })
                      }
                      placeholder="https://api.myapp.com/webhooks"
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label className="text-sm font-semibold">
                      Events to Subscribe
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
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
                            className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {ev}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowWebhookDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateWebhook}
                    disabled={
                      !newWebhook.url || newWebhook.events.length === 0
                    }>
                    Add Webhook
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          {webhooks.length === 0 ? (
            <div className="bg-muted/30 rounded-xl p-12 text-center border border-dashed">
              <Webhook className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold">No webhooks configured</h3>
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                Listen to real-time events from our API and trigger external
                workflows.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {webhooks.map(wh => (
                <div
                  key={wh.id}
                  className="bg-card p-6 rounded-xl border shadow-sm flex justify-between items-center">
                  <div className="space-y-3">
                    <div>
                      <div className="font-bold text-lg">
                        {wh.name || "Untitled Webhook"}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                        <Globe size={14} className="text-primary" /> {wh.url}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {wh.events.map((e: string) => (
                        <Badge
                          key={e}
                          variant="secondary"
                          className="bg-primary/5 text-primary border-primary/10 font-medium">
                          {e}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() =>
                      deleteWebhookSubscriptionAction(wh.id).then(loadData)
                    }>
                    <Trash2 size={18} />
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
          <SheetHeader>
            <SheetTitle>Client Settings</SheetTitle>
            <SheetDescription>
              Modify advanced settings and permissions for{" "}
              {editingV3Client?.name}.
            </SheetDescription>
          </SheetHeader>
          {editingV3Client && (
            <div className="py-6 space-y-8">
              <div className="space-y-4">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Scopes & Permissions
                </Label>
                <div className="flex flex-wrap gap-2">
                  {["read", "write", "admin", "inventory", "orders"].map(
                    scope => {
                      const isSelected = editingV3Client.scopes.includes(scope);
                      return (
                        <Badge
                          key={scope}
                          variant={isSelected ? "default" : "outline"}
                          className={cn(
                            "cursor-pointer py-1.5 px-3 h-auto text-xs transition-all",
                            isSelected ? "bg-primary" : "hover:bg-muted",
                          )}
                          onClick={() => {
                            const scopes = isSelected
                              ? editingV3Client.scopes.filter(
                                  (s: string) => s !== scope,
                                )
                              : [...editingV3Client.scopes, scope];
                            setEditingV3Client({ ...editingV3Client, scopes });
                          }}>
                          {scope}
                          {isSelected && <Check size={12} className="ml-1.5" />}
                        </Badge>
                      );
                    },
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  CORS Origins
                </Label>
                <div className="space-y-2">
                  <Input
                    placeholder="e.g. https://myapp.com, http://localhost:3000"
                    value={editingV3Client.corsOrigins.join(", ")}
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
                  <p className="text-[10px] text-muted-foreground">
                    Enter a comma-separated list of allowed origins.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
                <div className="space-y-0.5">
                  <div className="font-bold text-sm">Active Status</div>
                  <div className="text-[10px] text-muted-foreground">
                    Enable or disable all access for this client.
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
          <SheetFooter className="mt-8">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setEditingV3Client(null)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleUpdateV3}>
              Save Changes
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default function AppsApiPage() {
  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-[50vh]">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        }>
        <AppsApiContent />
      </Suspense>
    </div>
  );
}
