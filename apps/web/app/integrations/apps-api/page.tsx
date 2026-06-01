"use client";

import { useState, useEffect, Suspense } from "react";
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
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import { Switch } from "@repo/ui/components/ui/switch";

function AppsApiContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "v3";
  const [activeTab, setActiveTab] = useState(initialTab);

  // V3 Clients State
  const [v3Clients, setV3Clients] = useState<any[]>([]);
  const [newClientName, setNewClientName] = useState("");
  const [showV3Modal, setShowV3Modal] = useState(false);
  const [v3Result, setV3Result] = useState<any>(null);
  const [editingV3Client, setEditingV3Client] = useState<any>(null);

  // V2 Keys State
  const [v2Keys, setV2Keys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [showV2Modal, setShowV2Modal] = useState(false);
  const [v2Result, setV2Result] = useState<any>(null);

  // Webhooks State
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    name: "",
    url: "",
    events: [] as string[],
  });

  // Device Tokens State
  const [deviceTokens, setDeviceTokens] = useState<any[]>([]);
  const [registries, setRegistries] = useState<any[]>([]);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [newDevice, setNewDevice] = useState({
    deviceName: "",
    deviceType: "POS_TERMINAL" as any,
    locationId: "",
  });
  const [deviceTokenResult, setDeviceTokenResult] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      const [v3, v2, wh, tokens, regs] = await Promise.all([
        getV3ApiClientsAction(),
        getV2ApiKeysAction(),
        getWebhookSubscriptionsAction(),
        getDeviceSetupTokensAction(),
        getDeviceRegistryAction(),
      ]);
      setV3Clients(v3);
      setV2Keys(v2);
      setWebhooks(wh);
      setDeviceTokens(tokens);
      setRegistries(regs);
    } catch (error) {
      console.error("Failed to load data", error);
    }
  };

  const handleCreateV3 = async () => {
    const res = await createV3ApiClientAction({ name: newClientName });
    setV3Result(res);
    setNewClientName("");
    loadData();
  };

  const handleUpdateV3 = async () => {
    if (!editingV3Client) return;
    await updateV3ApiClientAction(editingV3Client.id, {
      scopes: editingV3Client.scopes,
      corsOrigins: editingV3Client.corsOrigins,
      isActive: editingV3Client.isActive,
    });
    setEditingV3Client(null);
    loadData();
  };

  const handleCreateWebhook = async () => {
    await createWebhookSubscriptionAction(newWebhook);
    setShowWebhookModal(false);
    setNewWebhook({ name: "", url: "", events: [] });
    loadData();
  };

  const handleProvisionDevice = async () => {
    const res = await createDeviceSetupTokenAction(newDevice);
    setDeviceTokenResult(res);
    loadData();
  };

  const handleCreateV2 = async () => {
    const res = await createV2ApiKeyAction({ name: newKeyName });
    setV2Result(res);
    setNewKeyName("");
    loadData();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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

      <div className="flex gap-4 border-b mt-8 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "v3" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">V3 API Clients</h2>
            <Button
              onClick={() => setShowV3Modal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus size={18} className="mr-2" />
              Create Client
            </Button>
          </div>

          <div className="grid gap-4">
            {v3Clients.map((client) => (
              <div
                key={client.id}
                className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{client.name}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>
                        Client ID:{" "}
                        <code className="bg-gray-50 px-1 rounded">
                          {client.clientId}
                        </code>
                      </span>
                      <span className="flex items-center gap-1">
                        Status:
                        <button
                          onClick={() =>
                            updateV3ApiClientAction(client.id, {
                              isActive: !client.isActive,
                            }).then(loadData)
                          }
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                            client.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700",
                          )}
                        >
                          {client.isActive ? "Active" : "Inactive"}
                        </button>
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingV3Client(client)}
                      className="text-gray-400 hover:text-blue-600"
                      title="Advanced Settings"
                    >
                      <Zap size={18} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={async () => {
                        const secret = await regenerateV3ClientSecretAction(
                          client.id,
                        );
                        alert(
                          `New Secret: ${secret}\nPLEASE COPY THIS NOW, IT WILL NOT BE SHOWN AGAIN.`,
                        );
                      }}
                      className="text-gray-400 hover:text-blue-600"
                      title="Regenerate Secret"
                    >
                      <RefreshCw size={18} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        deleteV3ApiClientAction(client.id).then(loadData)
                      }
                      className="text-gray-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex gap-6 text-xs">
                  <div>
                    <span className="text-gray-400 font-bold uppercase block mb-1">
                      Scopes
                    </span>
                    <div className="flex gap-1">
                      {client.scopes.map((s: string) => (
                        <span
                          key={s}
                          className="bg-gray-100 px-2 py-0.5 rounded"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold uppercase block mb-1">
                      CORS Origins
                    </span>
                    <div className="flex gap-1">
                      {client.corsOrigins.length > 0 ? (
                        client.corsOrigins.map((o: string) => (
                          <span
                            key={o}
                            className="bg-gray-100 px-2 py-0.5 rounded"
                          >
                            {o}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-300 italic">None</span>
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
              <Button
                onClick={() => setShowV2Modal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus size={18} className="mr-2" />
                Create Key
              </Button>
            </div>
            <div className="grid gap-4">
              {v2Keys.map((key) => (
                <div
                  key={key.id}
                  className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold">{key.name}</span>
                    <span className="ml-3 text-[10px] bg-gray-100 px-2 py-0.5 rounded uppercase">
                      {key.environment}
                    </span>
                    <div className="text-xs text-gray-400 mt-1">
                      Prefix: {key.keyPrefix}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteV2ApiKeyAction(key.id).then(loadData)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Device Provisioning (POS)</h2>
              <Button
                onClick={() => {
                  setShowDeviceModal(true);
                  setDeviceTokenResult(null);
                  setNewDevice({
                    deviceName: "",
                    deviceType: "POS_TERMINAL",
                    locationId: "default",
                  });
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus size={18} className="mr-2" />
                Provision Device
              </Button>
            </div>
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mb-6">
              <h3 className="font-bold text-blue-800 mb-2">How it works</h3>
              <p className="text-sm text-blue-700">
                Generate a setup token to provision a new POS device. The token
                is valid for 24 hours and can only be used once.
              </p>
            </div>
            <div className="grid gap-4">
              {registries.length === 0 && deviceTokens.length === 0 && (
                <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-center">
                  <Monitor className="w-12 h-12 text-gray-300 mb-4" />
                  <p className="text-gray-500">No devices provisioned yet.</p>
                </div>
              )}
              {deviceTokens
                .filter((t) => !t.usedAt && !t.revokedAt)
                .map((token) => (
                  <div
                    key={token.id}
                    className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex justify-between items-center"
                  >
                    <div className="flex items-center gap-4">
                      <Lock className="text-yellow-600" />
                      <div>
                        <div className="font-bold text-yellow-900">
                          Pending Setup: {token.deviceName}
                        </div>
                        <div className="text-xs text-yellow-700">
                          Expires: {new Date(token.expiresAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          copyToClipboard(token.rawToken);
                          alert("Token copied!");
                        }}
                        className="text-yellow-700 hover:bg-yellow-100"
                      >
                        <Copy size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              {registries.map((reg) => (
                <div
                  key={reg.id}
                  className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <Monitor className="text-gray-400" />
                    <div>
                      <div className="font-bold">{reg.deviceName}</div>
                      <div className="text-xs text-gray-400">
                        {reg.deviceType} •{" "}
                        {reg.location?.name || "Main Location"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded-full inline-block",
                        reg.status === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700",
                      )}
                    >
                      {reg.status}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">
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
            <Button
              onClick={() => setShowWebhookModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus size={18} className="mr-2" />
              Add Webhook
            </Button>
          </div>
          {webhooks.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-12 text-center border border-dashed">
              <Webhook className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900">
                No webhooks configured
              </h3>
              <p className="text-gray-500 mt-2">
                Listen to real-time events from our API.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {webhooks.map((wh) => (
                <div
                  key={wh.id}
                  className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center"
                >
                  <div>
                    <div className="font-bold">{wh.name || wh.url}</div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Globe size={12} /> {wh.url}
                    </div>
                    <div className="flex gap-1 mt-3">
                      {wh.events.map((e: string) => (
                        <span
                          key={e}
                          className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium"
                        >
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      deleteWebhookSubscriptionAction(wh.id).then(loadData)
                    }
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- MODALS --- */}

      {/* V3 Client Advanced Settings Modal */}
      <Dialog open={!!editingV3Client} onOpenChange={(open) => !open && setEditingV3Client(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Client Settings</DialogTitle>
            <DialogDescription>{editingV3Client?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
              <div>
                <Label className="text-sm font-bold uppercase tracking-tight mb-2 block">
                  Scopes
                </Label>
                <div className="flex flex-wrap gap-2">
                  {["read", "write", "admin", "inventory", "orders"].map(
                    (scope) => (
                      <Button
                        key={scope}
                        variant={editingV3Client?.scopes.includes(scope) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const scopes = editingV3Client.scopes.includes(scope)
                            ? editingV3Client.scopes.filter(
                                (s: string) => s !== scope,
                              )
                            : [...editingV3Client.scopes, scope];
                          setEditingV3Client({ ...editingV3Client, scopes });
                        }}
                        className="rounded-full h-7 px-3 text-xs"
                      >
                        {scope}
                      </Button>
                    ),
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-bold uppercase tracking-tight mb-2 block">
                  CORS Origins
                </Label>
                <Input
                  placeholder="https://myapp.com, http://localhost:3000"
                  value={editingV3Client?.corsOrigins.join(", ")}
                  onChange={(e) =>
                    setEditingV3Client({
                      ...editingV3Client,
                      corsOrigins: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="rounded-xl"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Comma-separated list of allowed origins.
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <div className="font-bold text-sm">Active Status</div>
                  <div className="text-[10px] text-gray-500">
                    Enable or disable all access for this client.
                  </div>
                </div>
                <Switch
                   checked={editingV3Client?.isActive}
                   onCheckedChange={(checked) => setEditingV3Client({ ...editingV3Client, isActive: checked })}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
               <Button variant="outline" onClick={() => setEditingV3Client(null)} className="flex-1 rounded-xl">Cancel</Button>
               <Button onClick={handleUpdateV3} className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl">Save Changes</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Webhook Modal */}
      <Dialog open={showWebhookModal} onOpenChange={setShowWebhookModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>Add Webhook</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>Friendly Name</Label>
                <Input
                  value={newWebhook.name}
                  onChange={(e) =>
                    setNewWebhook({ ...newWebhook, name: e.target.value })
                  }
                  className="rounded-xl"
                  placeholder="My Production Webhook"
                />
              </div>
              <div className="grid gap-2">
                <Label>Payload URL</Label>
                <Input
                  value={newWebhook.url}
                  onChange={(e) =>
                    setNewWebhook({ ...newWebhook, url: e.target.value })
                  }
                  className="rounded-xl"
                  placeholder="https://api.myapp.com/webhooks"
                />
              </div>
              <div>
                <Label className="mb-2 block">Events to Subscribe</Label>
                <div className="grid grid-cols-2 gap-2">
                  {availableEvents.map((ev) => (
                    <Label
                      key={ev}
                      className="flex items-center gap-2 text-xs cursor-pointer bg-gray-50 p-2 rounded-lg hover:bg-gray-100"
                    >
                      <Checkbox
                        checked={newWebhook.events.includes(ev)}
                        onCheckedChange={(checked) => {
                          const events = checked
                            ? [...newWebhook.events, ev]
                            : newWebhook.events.filter((e) => e !== ev);
                          setNewWebhook({ ...newWebhook, events });
                        }}
                      />
                      {ev}
                    </Label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowWebhookModal(false)} className="flex-1 rounded-xl">Cancel</Button>
              <Button onClick={handleCreateWebhook} className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl">Add Webhook</Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>

      {/* Device Provisioning Modal */}
      <Dialog open={showDeviceModal} onOpenChange={setShowDeviceModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>Provision Device</DialogTitle>
            </DialogHeader>
            {!deviceTokenResult ? (
              <div className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label>Device Name</Label>
                  <Input
                    value={newDevice.deviceName}
                    onChange={(e) =>
                      setNewDevice({ ...newDevice, deviceName: e.target.value })
                    }
                    className="rounded-xl"
                    placeholder="Front Desk Terminal"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Device Type</Label>
                  <Select
                    value={newDevice.deviceType}
                    onValueChange={(value) =>
                      setNewDevice({
                        ...newDevice,
                        deviceType: value as any,
                      })
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="POS_TERMINAL">POS Terminal</SelectItem>
                        <SelectItem value="MOBILE_POS">Mobile POS</SelectItem>
                        <SelectItem value="KIOSK">Self-Service Kiosk</SelectItem>
                        <SelectItem value="TABLET">Service Tablet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter className="gap-2 pt-4">
                   <Button variant="outline" onClick={() => setShowDeviceModal(false)} className="flex-1 rounded-xl">Cancel</Button>
                   <Button onClick={handleProvisionDevice} className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl">Generate Token</Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-6 py-4">
                <div className="p-4 bg-green-50 text-green-800 rounded-lg text-sm border border-green-200">
                  Setup token generated successfully.
                </div>
                <div className="text-center p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">
                    Setup Token
                  </div>
                  <div className="text-2xl font-mono tracking-widest text-blue-600 break-all">
                    {deviceTokenResult.rawToken}
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => copyToClipboard(deviceTokenResult.rawToken)}
                    className="mt-4 text-blue-600 font-bold text-sm h-auto p-0 hover:bg-transparent"
                  >
                    <Copy size={14} className="mr-2" /> Copy Token
                  </Button>
                </div>
                <p className="text-[10px] text-center text-gray-400">
                  Enter this token on the device within 24 hours.
                </p>
                <Button
                  onClick={() => setShowDeviceModal(false)}
                  className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold h-12"
                >
                  Done
                </Button>
              </div>
            )}
          </DialogContent>
      </Dialog>

      {/* V3 Creation Modal */}
      <Dialog open={showV3Modal} onOpenChange={setShowV3Modal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>Create V3 Client</DialogTitle>
            </DialogHeader>
            {!v3Result ? (
              <div className="py-4 space-y-4">
                <div className="grid gap-2">
                  <Label>Client Name</Label>
                  <Input
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="rounded-xl"
                    placeholder="e.g., My Mobile App"
                  />
                </div>
                <DialogFooter className="gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowV3Modal(false)} className="flex-1 rounded-xl">Cancel</Button>
                  <Button onClick={handleCreateV3} className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl">Create</Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-200">
                  <strong>Important:</strong> Copy your Client Secret now. It
                  will never be shown again.
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-bold text-gray-400 uppercase">
                    Client ID
                  </Label>
                  <div className="flex gap-2">
                    <code className="flex-1 bg-gray-50 p-2 rounded text-sm overflow-x-auto">
                      {v3Result.clientId}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(v3Result.clientId)}
                    >
                      <Copy size={14} />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-bold text-gray-400 uppercase">
                    Client Secret
                  </Label>
                  <div className="flex gap-2">
                    <code className="flex-1 bg-gray-50 p-2 rounded text-sm overflow-x-auto">
                      {v3Result.clientSecret}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(v3Result.clientSecret)}
                    >
                      <Copy size={14} />
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setShowV3Modal(false);
                    setV3Result(null);
                  }}
                  className="w-full bg-gray-900 text-white rounded-xl mt-4 h-12"
                >
                  Done
                </Button>
              </div>
            )}
          </DialogContent>
      </Dialog>

      {/* V2 Key Modal */}
      <Dialog open={showV2Modal} onOpenChange={setShowV2Modal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>Create V2 API Key</DialogTitle>
            </DialogHeader>
            {!v2Result ? (
              <div className="py-4 space-y-4">
                <div className="grid gap-2">
                  <Label>Key Name</Label>
                  <Input
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="rounded-xl"
                    placeholder="e.g., Development Key"
                  />
                </div>
                <DialogFooter className="gap-2 pt-4">
                   <Button variant="outline" onClick={() => setShowV2Modal(false)} className="flex-1 rounded-xl">Cancel</Button>
                   <Button onClick={handleCreateV2} className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl">Create</Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="p-4 bg-green-50 text-green-800 rounded-lg text-sm border border-green-200">
                  Key created successfully.
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-bold text-gray-400 uppercase">
                    Full API Key
                  </Label>
                  <div className="flex gap-2">
                    <code className="flex-1 bg-gray-50 p-2 rounded text-sm break-all">
                      {v2Result.fullKey}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(v2Result.fullKey)}
                      className="shrink-0"
                    >
                      <Copy size={14} />
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setShowV2Modal(false);
                    setV2Result(null);
                  }}
                  className="w-full bg-gray-900 text-white rounded-xl mt-4 h-12"
                >
                  Done
                </Button>
              </div>
            )}
          </DialogContent>
      </Dialog>
    </>
  );
}

export default function AppsApiPage() {
  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <Suspense fallback={<div>Loading...</div>}>
        <AppsApiContent />
      </Suspense>
    </div>
  );
}
