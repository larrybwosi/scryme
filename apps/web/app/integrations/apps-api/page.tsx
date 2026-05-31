'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
} from 'lucide-react';
import { Breadcrumbs } from '../../../components/breadcrumbs';
import { PageHeader } from '../../../components/page-header';
import { cn } from '@repo/ui/lib/utils';
import * as actions from '../../actions/api-management';

function AppsApiContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'v3';
  const [activeTab, setActiveTab] = useState(initialTab);

  // V3 Clients State
  const [v3Clients, setV3Clients] = useState<any[]>([]);
  const [newClientName, setNewClientName] = useState('');
  const [showV3Modal, setShowV3Modal] = useState(false);
  const [v3Result, setV3Result] = useState<any>(null);
  const [editingV3Client, setEditingV3Client] = useState<any>(null);

  // V2 Keys State
  const [v2Keys, setV2Keys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [showV2Modal, setShowV2Modal] = useState(false);
  const [v2Result, setV2Result] = useState<any>(null);

  // Webhooks State
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [newWebhook, setNewWebhook] = useState({ name: '', url: '', events: [] as string[] });

  // Device Tokens State
  const [deviceTokens, setDeviceTokens] = useState<any[]>([]);
  const [registries, setRegistries] = useState<any[]>([]);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [newDevice, setNewDevice] = useState({ deviceName: '', deviceType: 'POS_TERMINAL' as any, locationId: '' });
  const [deviceTokenResult, setDeviceTokenResult] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      const [v3, v2, wh, tokens, regs] = await Promise.all([
        actions.getV3ApiClientsAction(),
        actions.getV2ApiKeysAction(),
        actions.getWebhookSubscriptionsAction(),
        actions.getDeviceSetupTokensAction(),
        actions.getDeviceRegistryAction(),
      ]);
      setV3Clients(v3);
      setV2Keys(v2);
      setWebhooks(wh);
      setDeviceTokens(tokens);
      setRegistries(regs);
    } catch (error) {
      console.error('Failed to load data', error);
    }
  };

  const handleCreateV3 = async () => {
    const res = await actions.createV3ApiClientAction({ name: newClientName });
    setV3Result(res);
    setNewClientName('');
    loadData();
  };

  const handleUpdateV3 = async () => {
    if (!editingV3Client) return;
    await actions.updateV3ApiClientAction(editingV3Client.id, {
        scopes: editingV3Client.scopes,
        corsOrigins: editingV3Client.corsOrigins,
        isActive: editingV3Client.isActive
    });
    setEditingV3Client(null);
    loadData();
  };

  const handleCreateWebhook = async () => {
      await actions.createWebhookSubscriptionAction(newWebhook);
      setShowWebhookModal(false);
      setNewWebhook({ name: '', url: '', events: [] });
      loadData();
  };

  const handleProvisionDevice = async () => {
      const res = await actions.createDeviceSetupTokenAction(newDevice);
      setDeviceTokenResult(res);
      loadData();
  };

  const handleCreateV2 = async () => {
    const res = await actions.createV2ApiKeyAction({ name: newKeyName });
    setV2Result(res);
    setNewKeyName('');
    loadData();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const tabs = [
    { id: 'v3', label: 'V3 API Clients', icon: Key },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook },
    { id: 'v2', label: 'V2 (Legacy & POS)', icon: Monitor },
  ];

  const availableEvents = ['order.created', 'order.updated', 'inventory.low', 'customer.created'];

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Integrations', href: '/integrations' },
          { label: 'Apps & API' },
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
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'v3' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">V3 API Clients</h2>
            <button
              onClick={() => setShowV3Modal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              Create Client
            </button>
          </div>

          <div className="grid gap-4">
            {v3Clients.map((client) => (
              <div key={client.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{client.name}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>Client ID: <code className="bg-gray-50 px-1 rounded">{client.clientId}</code></span>
                      <span className="flex items-center gap-1">
                          Status:
                          <button
                            onClick={() => actions.updateV3ApiClientAction(client.id, { isActive: !client.isActive }).then(loadData)}
                            className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", client.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}
                          >
                            {client.isActive ? 'Active' : 'Inactive'}
                          </button>
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                        onClick={() => setEditingV3Client(client)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Advanced Settings"
                    >
                        <Zap size={18} />
                    </button>
                    <button
                      onClick={async () => {
                        const secret = await actions.regenerateV3ClientSecretAction(client.id);
                        alert(`New Secret: ${secret}\nPLEASE COPY THIS NOW, IT WILL NOT BE SHOWN AGAIN.`);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Regenerate Secret"
                    >
                      <RefreshCw size={18} />
                    </button>
                    <button
                      onClick={() => actions.deleteV3ApiClientAction(client.id).then(loadData)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex gap-6 text-xs">
                    <div>
                        <span className="text-gray-400 font-bold uppercase block mb-1">Scopes</span>
                        <div className="flex gap-1">
                            {client.scopes.map((s: string) => <span key={s} className="bg-gray-100 px-2 py-0.5 rounded">{s}</span>)}
                        </div>
                    </div>
                    <div>
                        <span className="text-gray-400 font-bold uppercase block mb-1">CORS Origins</span>
                        <div className="flex gap-1">
                            {client.corsOrigins.length > 0 ? client.corsOrigins.map((o: string) => <span key={o} className="bg-gray-100 px-2 py-0.5 rounded">{o}</span>) : <span className="text-gray-300 italic">None</span>}
                        </div>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'v2' && (
        <div className="space-y-8">
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">V2 API Keys</h2>
              <button
                onClick={() => setShowV2Modal(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} />
                Create Key
              </button>
            </div>
            <div className="grid gap-4">
              {v2Keys.map((key) => (
                <div key={key.id} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center">
                  <div>
                    <span className="font-bold">{key.name}</span>
                    <span className="ml-3 text-[10px] bg-gray-100 px-2 py-0.5 rounded uppercase">{key.environment}</span>
                    <div className="text-xs text-gray-400 mt-1">Prefix: {key.keyPrefix}</div>
                  </div>
                  <button
                    onClick={() => actions.deleteV2ApiKeyAction(key.id).then(loadData)}
                    className="text-red-500 hover:text-red-700 p-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section>
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Device Provisioning (POS)</h2>
                <button
                    onClick={() => {
                        setShowDeviceModal(true);
                        setDeviceTokenResult(null);
                        setNewDevice({ deviceName: '', deviceType: 'POS_TERMINAL', locationId: 'default' });
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={18} />
                    Provision Device
                </button>
             </div>
             <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mb-6">
                <h3 className="font-bold text-blue-800 mb-2">How it works</h3>
                <p className="text-sm text-blue-700">
                    Generate a setup token to provision a new POS device. The token is valid for 24 hours and can only be used once.
                </p>
             </div>
             <div className="grid gap-4">
                {registries.length === 0 && deviceTokens.length === 0 && (
                    <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-center">
                        <Monitor className="w-12 h-12 text-gray-300 mb-4" />
                        <p className="text-gray-500">No devices provisioned yet.</p>
                    </div>
                )}
                {deviceTokens.filter(t => !t.usedAt && !t.revokedAt).map(token => (
                    <div key={token.id} className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Lock className="text-yellow-600" />
                            <div>
                                <div className="font-bold text-yellow-900">Pending Setup: {token.deviceName}</div>
                                <div className="text-xs text-yellow-700">Expires: {new Date(token.expiresAt).toLocaleString()}</div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                             <button onClick={() => { copyToClipboard(token.rawToken); alert('Token copied!'); }} className="p-2 text-yellow-700 hover:bg-yellow-100 rounded">
                                <Copy size={16} />
                            </button>
                        </div>
                    </div>
                ))}
                {registries.map(reg => (
                    <div key={reg.id} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-4">
                            <Monitor className="text-gray-400" />
                            <div>
                                <div className="font-bold">{reg.deviceName}</div>
                                <div className="text-xs text-gray-400">{reg.deviceType} • {reg.location?.name || 'Main Location'}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={cn("text-xs font-bold px-2 py-0.5 rounded-full inline-block", reg.status === 'ACTIVE' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                                {reg.status}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-1">Last seen: {reg.lastSeenAt ? new Date(reg.lastSeenAt).toLocaleString() : 'Never'}</div>
                        </div>
                    </div>
                ))}
             </div>
          </section>
        </div>
      )}

      {activeTab === 'webhooks' && (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Webhook Subscriptions</h2>
                <button
                    onClick={() => setShowWebhookModal(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={18} />
                    Add Webhook
                </button>
            </div>
            {webhooks.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-12 text-center border border-dashed">
                    <Webhook className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">No webhooks configured</h3>
                    <p className="text-gray-500 mt-2">Listen to real-time events from our API.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {webhooks.map(wh => (
                        <div key={wh.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                            <div>
                                <div className="font-bold">{wh.name || wh.url}</div>
                                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Globe size={12}/> {wh.url}</div>
                                <div className="flex gap-1 mt-3">
                                    {wh.events.map((e: string) => (
                                        <span key={e} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">{e}</span>
                                    ))}
                                </div>
                            </div>
                            <button onClick={() => actions.deleteWebhookSubscriptionAction(wh.id).then(loadData)} className="text-red-400 hover:text-red-600 p-2 transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
      )}

      {/* --- MODALS --- */}

      {/* V3 Client Advanced Settings Modal */}
      {editingV3Client && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white p-8 rounded-2xl w-full max-w-lg shadow-2xl">
                  <h2 className="text-2xl font-bold mb-2">Client Settings</h2>
                  <p className="text-gray-500 text-sm mb-6">{editingV3Client.name}</p>

                  <div className="space-y-6">
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-tight">Scopes</label>
                          <div className="flex flex-wrap gap-2">
                              {['read', 'write', 'admin', 'inventory', 'orders'].map(scope => (
                                  <button
                                    key={scope}
                                    onClick={() => {
                                        const scopes = editingV3Client.scopes.includes(scope)
                                            ? editingV3Client.scopes.filter((s: string) => s !== scope)
                                            : [...editingV3Client.scopes, scope];
                                        setEditingV3Client({...editingV3Client, scopes});
                                    }}
                                    className={cn("px-3 py-1 rounded-full text-xs font-medium border transition-colors", editingV3Client.scopes.includes(scope) ? "bg-blue-600 border-blue-600 text-white" : "bg-white text-gray-500 hover:border-gray-300")}
                                  >
                                      {scope}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-tight">CORS Origins</label>
                          <input
                            type="text"
                            placeholder="https://myapp.com, http://localhost:3000"
                            value={editingV3Client.corsOrigins.join(', ')}
                            onChange={(e) => setEditingV3Client({...editingV3Client, corsOrigins: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                            className="w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <p className="text-[10px] text-gray-400 mt-1">Comma-separated list of allowed origins.</p>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                              <div className="font-bold text-sm">Active Status</div>
                              <div className="text-[10px] text-gray-500">Enable or disable all access for this client.</div>
                          </div>
                          <button
                            onClick={() => setEditingV3Client({...editingV3Client, isActive: !editingV3Client.isActive})}
                            className={cn("w-12 h-6 rounded-full transition-colors relative", editingV3Client.isActive ? "bg-green-500" : "bg-gray-300")}
                          >
                              <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", editingV3Client.isActive ? "right-1" : "left-1")} />
                          </button>
                      </div>
                  </div>

                  <div className="flex gap-4 mt-8">
                      <button onClick={() => setEditingV3Client(null)} className="flex-1 border py-2.5 rounded-xl font-medium hover:bg-gray-50">Cancel</button>
                      <button onClick={handleUpdateV3} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors">Save Changes</button>
                  </div>
              </div>
          </div>
      )}

      {/* Webhook Modal */}
      {showWebhookModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
                  <h2 className="text-2xl font-bold mb-6">Add Webhook</h2>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium mb-1">Friendly Name</label>
                          <input type="text" value={newWebhook.name} onChange={e => setNewWebhook({...newWebhook, name: e.target.value})} className="w-full border rounded-xl px-4 py-2 outline-none" placeholder="My Production Webhook" />
                      </div>
                      <div>
                          <label className="block text-sm font-medium mb-1">Payload URL</label>
                          <input type="text" value={newWebhook.url} onChange={e => setNewWebhook({...newWebhook, url: e.target.value})} className="w-full border rounded-xl px-4 py-2 outline-none" placeholder="https://api.myapp.com/webhooks" />
                      </div>
                      <div>
                          <label className="block text-sm font-medium mb-2">Events to Subscribe</label>
                          <div className="grid grid-cols-2 gap-2">
                              {availableEvents.map(ev => (
                                  <label key={ev} className="flex items-center gap-2 text-xs cursor-pointer bg-gray-50 p-2 rounded-lg hover:bg-gray-100">
                                      <input
                                        type="checkbox"
                                        checked={newWebhook.events.includes(ev)}
                                        onChange={() => {
                                            const events = newWebhook.events.includes(ev) ? newWebhook.events.filter(e => e !== ev) : [...newWebhook.events, ev];
                                            setNewWebhook({...newWebhook, events});
                                        }}
                                      />
                                      {ev}
                                  </label>
                              ))}
                          </div>
                      </div>
                  </div>
                  <div className="flex gap-4 mt-8">
                      <button onClick={() => setShowWebhookModal(false)} className="flex-1 border py-2.5 rounded-xl">Cancel</button>
                      <button onClick={handleCreateWebhook} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl">Add Webhook</button>
                  </div>
              </div>
          </div>
      )}

      {/* Device Provisioning Modal */}
      {showDeviceModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
                  <h2 className="text-2xl font-bold mb-6">Provision Device</h2>
                  {!deviceTokenResult ? (
                      <div className="space-y-4">
                          <div>
                              <label className="block text-sm font-medium mb-1">Device Name</label>
                              <input type="text" value={newDevice.deviceName} onChange={e => setNewDevice({...newDevice, deviceName: e.target.value})} className="w-full border rounded-xl px-4 py-2 outline-none" placeholder="Front Desk Terminal" />
                          </div>
                          <div>
                              <label className="block text-sm font-medium mb-1">Device Type</label>
                              <select value={newDevice.deviceType} onChange={e => setNewDevice({...newDevice, deviceType: e.target.value as any})} className="w-full border rounded-xl px-4 py-2 outline-none bg-white">
                                  <option value="POS_TERMINAL">POS Terminal</option>
                                  <option value="MOBILE_POS">Mobile POS</option>
                                  <option value="KIOSK">Self-Service Kiosk</option>
                                  <option value="TABLET">Service Tablet</option>
                              </select>
                          </div>
                          <div className="flex gap-4 mt-8">
                            <button onClick={() => setShowDeviceModal(false)} className="flex-1 border py-2.5 rounded-xl">Cancel</button>
                            <button onClick={handleProvisionDevice} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl">Generate Token</button>
                          </div>
                      </div>
                  ) : (
                      <div className="space-y-6">
                           <div className="p-4 bg-green-50 text-green-800 rounded-lg text-sm border border-green-200">
                                Setup token generated successfully.
                            </div>
                            <div className="text-center p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">Setup Token</div>
                                <div className="text-2xl font-mono tracking-widest text-blue-600 break-all">{deviceTokenResult.rawToken}</div>
                                <button onClick={() => copyToClipboard(deviceTokenResult.rawToken)} className="mt-4 flex items-center gap-2 mx-auto text-blue-600 font-bold text-sm">
                                    <Copy size={14}/> Copy Token
                                </button>
                            </div>
                            <p className="text-[10px] text-center text-gray-400">Enter this token on the device within 24 hours.</p>
                            <button onClick={() => setShowDeviceModal(false)} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold">Done</button>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* V3 Creation Modal */}
      {showV3Modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Create V3 Client</h2>
            {!v3Result ? (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Client Name</label>
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., My Mobile App"
                  />
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setShowV3Modal(false)} className="flex-1 border py-2 rounded-xl">Cancel</button>
                  <button onClick={handleCreateV3} className="flex-1 bg-blue-600 text-white py-2 rounded-xl">Create</button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-200">
                  <strong>Important:</strong> Copy your Client Secret now. It will never be shown again.
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Client ID</label>
                  <div className="flex gap-2 mt-1">
                    <code className="flex-1 bg-gray-50 p-2 rounded text-sm">{v3Result.clientId}</code>
                    <button onClick={() => copyToClipboard(v3Result.clientId)} className="p-2 border rounded"><Copy size={14}/></button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Client Secret</label>
                  <div className="flex gap-2 mt-1">
                    <code className="flex-1 bg-gray-50 p-2 rounded text-sm">{v3Result.clientSecret}</code>
                    <button onClick={() => copyToClipboard(v3Result.clientSecret)} className="p-2 border rounded"><Copy size={14}/></button>
                  </div>
                </div>
                <button
                    onClick={() => { setShowV3Modal(false); setV3Result(null); }}
                    className="w-full bg-gray-900 text-white py-2 rounded-xl mt-4"
                >
                    Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* V2 Key Modal */}
      {showV2Modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">Create V2 API Key</h2>
            {!v2Result ? (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Key Name</label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full border rounded-xl px-4 py-2 outline-none"
                    placeholder="e.g., Development Key"
                  />
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setShowV2Modal(false)} className="flex-1 border py-2 rounded-xl">Cancel</button>
                  <button onClick={handleCreateV2} className="flex-1 bg-blue-600 text-white py-2 rounded-xl">Create</button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                 <div className="p-4 bg-green-50 text-green-800 rounded-lg text-sm border border-green-200">
                  Key created successfully.
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Full API Key</label>
                  <div className="flex gap-2 mt-1">
                    <code className="flex-1 bg-gray-50 p-2 rounded text-sm break-all">{v2Result.fullKey}</code>
                    <button onClick={() => copyToClipboard(v2Result.fullKey)} className="p-2 border rounded shrink-0"><Copy size={14}/></button>
                  </div>
                </div>
                <button
                    onClick={() => { setShowV2Modal(false); setV2Result(null); }}
                    className="w-full bg-gray-900 text-white py-2 rounded-xl mt-4"
                >
                    Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
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
