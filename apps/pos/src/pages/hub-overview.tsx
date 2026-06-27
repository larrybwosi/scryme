import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@repo/ui/components/ui/card';
import { Badge } from '@repo/ui/components/ui/badge';
import { Button } from '@repo/ui/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/ui/table';
import {
  Monitor,
  ChefHat,
  Tablet,
  Activity,
  Wifi,
  RefreshCcw,
  Clock,
  ShieldCheck,
  Server,
  Users,
  UserMinus,
  UserCheck,
  ShoppingCart,
  Layout,
  MessageSquare,
  Timer,
  Play,
  Square,
} from 'lucide-react';
import { useAuthStore } from '@/store/pos-auth-store';
import { usePosStore } from '@/store/store';
import { useKdsStore } from '@/store/kds-store';
import { invoke } from '@tauri-apps/api/core';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { updateOrderStatusInKitchen, queryOrderEta, startHub, stopHub, HubStatus } from '@/lib/kds';

interface ConnectedDevice {
  id: string;
  name: string;
  device_type: string;
  ip: string;
  last_seen: number;
  status: string;
  current_user_id: string | null;
  current_user_name: string | null;
  assigned_user_id: string | null;
  assigned_user_name: string | null;
  station?: string;
  current_page?: string;
  table_number?: string;
  cart_item_count?: number;
}

export default function HubOverviewPage() {
  const { currentLocation, deviceType } = useAuthStore();
  const { employees } = usePosStore();
  const orders = useKdsStore(state => state.orders);
  const [devices, setDevices] = useState<ConnectedDevice[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hubIp, setHubIp] = useState<string>('Loading...');
  const [orderEtas, setOrderEtas] = useState<Record<string, number>>({});
  const [hubStatus, setHubStatus] = useState<HubStatus | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      const { orderId, etaMinutes } = e.detail;
      setOrderEtas(prev => ({ ...prev, [orderId]: etaMinutes }));
    };
    window.addEventListener('order-eta-response', handler);
    return () => window.removeEventListener('order-eta-response', handler);
  }, []);

  useEffect(() => {
    const handler = (e: any) => {
      const activity = e.detail;
      setDevices(prev =>
        prev.map(d =>
          d.id === activity.device_id
            ? {
                ...d,
                current_page: activity.current_page,
                table_number: activity.table_number,
                cart_item_count: activity.cart_items?.length || 0,
                last_seen: Date.now(),
              }
            : d
        )
      );
    };
    window.addEventListener('tablet-activity-update', handler);
    return () => window.removeEventListener('tablet-activity-update', handler);
  }, []);

  const fetchHubStatus = async () => {
    try {
      const status = await invoke<HubStatus>('get_hub_status');
      setHubStatus(status);
    } catch (error) {
      console.error('Failed to fetch hub status:', error);
    }
  };

  const fetchDevices = async () => {
    setIsRefreshing(true);
    try {
      const ip = await invoke<string>('get_local_ip_command').catch(() => '127.0.0.1');
      setHubIp(ip);

      await fetchHubStatus();

      const connectedDevices = await invoke<ConnectedDevice[]>('get_connected_devices');
      setDevices(connectedDevices);
    } catch (error) {
      // Failed to fetch devices
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStartHub = async () => {
    setIsActionPending(true);
    try {
      await startHub();
      toast.success('KDS Hub Server started successfully');
      await fetchDevices();
    } catch (error) {
      toast.error('Failed to start Hub server');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleStopHub = async () => {
    setIsActionPending(true);
    try {
      await stopHub();
      toast.success('KDS Hub Server stopped');
      await fetchDevices();
    } catch (error) {
      toast.error('Failed to stop Hub server');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleAssign = async (deviceId: string, userId: string | null) => {
    const user = employees.find(e => e.id === userId);
    try {
      await invoke('assign_user_to_device', {
        deviceId,
        userId,
        userName: user?.name || null,
      });
      toast.success(userId ? `Assigned ${user?.name} to device` : 'User unassigned');
      fetchDevices();
    } catch (_error) {
      toast.error('Failed to update assignment');
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'KDS':
        return <ChefHat className="w-5 h-5" />;
      case 'TABLET':
        return <Tablet className="w-5 h-5" />;
      case 'MAIN_HUB':
        return <Monitor className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const isRecentlySeen = (lastSeen: number) => {
    return Date.now() - lastSeen < 30000; // 30 seconds
  };

  const handleBump = (orderId: string) => {
    useKdsStore.getState().bumpOrder(orderId);
    updateOrderStatusInKitchen(orderId, 'done');
    toast.success('Order bumped');
  };

  const handleVoid = (orderId: string) => {
    useKdsStore.getState().updateOrderStatus(orderId, 'voided');
    updateOrderStatusInKitchen(orderId, 'voided');
    toast.error('Order voided');
  };

  const handleQueryEta = (orderId: string, station: string) => {
    queryOrderEta(orderId, station || 'all');
    toast.info('ETA query sent to kitchen');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">Hub Overview</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage terminals in <span className="font-bold text-foreground">{currentLocation?.name}</span>
          </p>
        </div>
        <div className="flex gap-2">
          {deviceType === 'MAIN_HUB' && (
            <>
              {hubStatus?.is_running ? (
                <Button variant="destructive" onClick={handleStopHub} disabled={isActionPending} className="gap-2">
                  <Square className="w-4 h-4" />
                  Stop Hub
                </Button>
              ) : (
                <Button
                  variant="default"
                  onClick={handleStartHub}
                  disabled={isActionPending}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Play className="w-4 h-4" />
                  Start Hub
                </Button>
              )}
            </>
          )}
          <Button variant="outline" onClick={fetchDevices} disabled={isRefreshing} className="gap-2">
            <RefreshCcw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="devices" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-[600px] mb-8">
          <TabsTrigger value="devices" className="gap-2">
            <Monitor className="w-4 h-4" />
            Devices
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="gap-2">
            <Activity className="w-4 h-4" />
            Live Monitoring
          </TabsTrigger>
          <TabsTrigger value="staff" className="gap-2">
            <Users className="w-4 h-4" />
            Staff Assignments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
          {/* Hub Status Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card
              className={cn(
                'md:col-span-2 text-white border-zinc-800 shadow-2xl transition-colors duration-500',
                hubStatus?.is_running ? 'bg-zinc-950' : 'bg-zinc-900 opacity-80'
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-400">
                  Hub Server Status
                </CardTitle>
                <Server className={cn('h-4 w-4', hubStatus?.is_running ? 'text-blue-500' : 'text-zinc-600')} />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex-1">
                    <div className="text-4xl font-black tracking-tighter uppercase">
                      {hubStatus?.is_running ? 'Active' : 'Stopped'}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-zinc-400 font-mono text-sm">
                      {hubStatus?.is_running ? (
                        <>
                          <Wifi className="w-4 h-4 text-green-500" />
                          Broadcasting on {hubIp}:8080
                        </>
                      ) : (
                        <>
                          <Wifi className="w-4 h-4 text-red-500" />
                          Offline - Start to enable tablet connectivity
                        </>
                      )}
                    </div>
                  </div>
                  <div className="hidden sm:block p-4 bg-zinc-900 border border-zinc-800 rounded-none">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Status</p>
                    <div
                      className={cn(
                        'flex items-center gap-2',
                        hubStatus?.is_running ? 'text-green-500' : 'text-zinc-500'
                      )}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">
                        {hubStatus?.is_running ? 'Encrypted' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  Active Connections
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black tracking-tighter">{hubStatus?.active_connections || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Connected devices via WebSocket</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Connected Terminals</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {devices.length === 0 ? (
                <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl bg-muted/20">
                  <p className="text-muted-foreground">No devices connected yet.</p>
                </div>
              ) : (
                devices.map(device => {
                  const active = isRecentlySeen(device.last_seen);
                  return (
                    <Card
                      key={device.id}
                      className={cn('transition-all shadow-sm hover:shadow-md', !active && 'opacity-60')}
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div
                            className={cn(
                              'p-3 rounded-none mb-4',
                              active
                                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20'
                                : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800'
                            )}
                          >
                            {getDeviceIcon(device.device_type)}
                          </div>
                          <Badge variant={active ? 'default' : 'secondary'} className="uppercase text-[10px] font-bold">
                            {active ? 'online' : 'offline'}
                          </Badge>
                        </div>

                        <h4 className="font-bold text-lg leading-tight truncate">{device.name}</h4>
                        {device.current_user_name && (
                          <div className="flex items-center gap-1.5 mt-1 text-green-600 font-bold uppercase text-[10px]">
                            <UserCheck className="w-3 h-3" />
                            Active: {device.current_user_name}
                          </div>
                        )}
                        {device.assigned_user_name && !device.current_user_name && (
                          <div className="flex items-center gap-1.5 mt-1 text-blue-600 font-bold uppercase text-[10px]">
                            <Users className="w-3 h-3" />
                            Assigned: {device.assigned_user_name}
                          </div>
                        )}

                        <div className="mt-6 space-y-2 border-t pt-4">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground uppercase font-bold tracking-tighter text-[10px]">
                              IP Address
                            </span>
                            <span className="font-mono">{device.ip}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground uppercase font-bold tracking-tighter text-[10px]">
                              Last Seen
                            </span>
                            <span className="flex items-center gap-1 font-medium">
                              <Clock className="w-3 h-3" />
                              {new Date(device.last_seen).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground uppercase font-bold tracking-tighter text-[10px]">
                              Role
                            </span>
                            <span className="font-bold text-blue-500">{device.device_type}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Active Orders Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold uppercase tracking-widest flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-orange-500" />
                Active Kitchen Orders
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {orders.filter(o => o.status !== 'done' && o.status !== 'voided').length === 0 ? (
                  <Card className="p-8 text-center text-muted-foreground border-dashed">
                    No active orders in kitchen
                  </Card>
                ) : (
                  orders
                    .filter(o => o.status !== 'done' && o.status !== 'voided')
                    .map(order => (
                      <Card key={order.id} className="overflow-hidden">
                        <div className="p-4 flex justify-between items-center bg-muted/30">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-lg">{order.num}</span>
                            <Badge variant="outline">{order.table}</Badge>
                            <Badge
                              className={cn(
                                order.status === 'urgent'
                                  ? 'bg-red-500'
                                  : order.status === 'in_progress'
                                    ? 'bg-blue-500'
                                    : 'bg-zinc-500'
                              )}
                            >
                              {order.status.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-mono">
                              {Math.floor((Date.now() - order.createdAt) / 60000)}m
                            </span>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <div className="space-y-1 mb-4">
                            {order.items.map(item => (
                              <div key={item.id} className="text-sm flex justify-between">
                                <span>
                                  {item.quantity}x {item.name}
                                </span>
                                <Badge className="text-[10px]">{item.status}</Badge>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 gap-1"
                              onClick={() => handleQueryEta(order.id, (order as any).station)}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              Query ETA
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 text-green-600 hover:text-green-700"
                              onClick={() => handleBump(order.id)}
                            >
                              Bump
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleVoid(order.id)}
                            >
                              Void
                            </Button>
                          </div>
                          {orderEtas[order.id] !== undefined && (
                            <div className="mt-3 p-2 bg-blue-50 text-blue-700 rounded-md flex items-center gap-2 text-sm font-bold">
                              <Timer className="w-4 h-4" />
                              ETA: {orderEtas[order.id]} minutes
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                )}
              </div>
            </div>

            {/* Tablet Activity Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold uppercase tracking-widest flex items-center gap-2">
                <Tablet className="w-5 h-5 text-blue-500" />
                Live Tablet Activity
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {devices.filter(d => d.device_type === 'TABLET' && isRecentlySeen(d.last_seen)).length === 0 ? (
                  <Card className="p-8 text-center text-muted-foreground border-dashed">No active tablets online</Card>
                ) : (
                  devices
                    .filter(d => d.device_type === 'TABLET' && isRecentlySeen(d.last_seen))
                    .map(tablet => (
                      <Card key={tablet.id}>
                        <CardHeader className="p-4 pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-base">{tablet.name}</CardTitle>
                              <CardDescription className="text-xs">
                                {tablet.current_user_name || 'Unassigned'}
                              </CardDescription>
                            </div>
                            <Badge variant="outline" className="text-[10px]">
                              LIVE
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Layout className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Current View:</span>
                            <span className="font-medium">{tablet.current_page || 'Home'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Cart Items:</span>
                            <span className="font-bold text-blue-600">{tablet.cart_item_count || 0} items</span>
                          </div>
                          {tablet.table_number && (
                            <div className="flex items-center gap-2 text-sm">
                              <Badge className="bg-indigo-500">Table {tablet.table_number}</Badge>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <Card>
            <CardHeader>
              <CardTitle>Staff Assignments</CardTitle>
              <CardDescription>Assign checked-in staff members to specific KDS or Tablet devices.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">
                        Terminal
                      </TableHead>
                      <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">
                        Current Operator
                      </TableHead>
                      <TableHead className="text-right font-bold uppercase text-[10px] tracking-widest text-muted-foreground">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {devices.map(device => (
                      <TableRow key={device.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted rounded-none">{getDeviceIcon(device.device_type)}</div>
                            <div>
                              <p className="font-bold leading-tight">{device.name}</p>
                              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                                {device.device_type} · {device.ip}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {device.current_user_name ? (
                              <Badge
                                variant="default"
                                className="gap-2 py-1 px-3 bg-green-500 text-white border-transparent w-fit"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                {device.current_user_name} (Logged In)
                              </Badge>
                            ) : device.assigned_user_name ? (
                              <Badge
                                variant="outline"
                                className="gap-2 py-1 px-3 bg-blue-50/50 text-blue-700 border-blue-200 w-fit"
                              >
                                <Users className="w-3.5 h-3.5" />
                                {device.assigned_user_name} (Assigned)
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground italic text-xs">Unassigned</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <select
                              className="h-8 rounded-none border border-input bg-background px-3 py-1 text-xs focus-visible:ring-1 focus-visible:ring-ring"
                              value={device.assigned_user_id || ''}
                              onChange={e => handleAssign(device.id, e.target.value || null)}
                            >
                              <option value="">Choose User...</option>
                              {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                  {emp.name} ({emp.role})
                                </option>
                              ))}
                            </select>
                            {device.assigned_user_id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleAssign(device.id, null)}
                              >
                                <UserMinus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {devices.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="py-10 text-center text-muted-foreground italic">
                          No terminals connected.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
