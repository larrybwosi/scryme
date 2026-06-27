import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useKdsStore } from '@/store/kds-store';
import { usePosStore } from '@/store/store';

export interface HubStatus {
  is_running: boolean;
  active_connections: number;
}

// --- 1. Role Initialization (Run this on app startup) ---
export async function initializeNetworkRole() {
  const role = localStorage.getItem('DEVICE_ROLE'); // 'MAIN_HUB', 'TABLET', or 'KDS'

  // Listen for hub start/stop events if we are the hub
  if (role === 'MAIN_HUB') {
    listen('kds-hub-started', event => {
      const url = event.payload as string;
      localStorage.setItem('HUB_WS_URL', url);
      connectToHub(url);
    });

    listen('kds-hub-stopped', () => {
      localStorage.removeItem('HUB_WS_URL');
      if (socket) {
        socket.close();
        socket = null;
      }
    });

    // Check if the hub is already running (e.g., after page refresh)
    try {
      const status = await invoke<HubStatus>('get_hub_status');
      if (status.is_running) {
        const ip = await invoke<string>('get_local_ip_command');
        const wsUrl = `ws://${ip}:8080/kds-ws`;
        localStorage.setItem('HUB_WS_URL', wsUrl);
        connectToHub(wsUrl);
      }
    } catch (e) {
      console.error('Failed to check Hub status:', e);
    }
  } else if (role === 'TABLET' || role === 'KDS') {
    // For other devices, grab the IP of the Hub (Inputted during setup)
    const hubIp = localStorage.getItem('HUB_IP_ADDRESS');
    if (hubIp) {
      console.log(`Connecting to Hub at ${hubIp}...`);
      connectToHub(`ws://${hubIp}:8080/kds-ws`);
    }
  }
}

export async function startHub() {
  try {
    const wsUrl = await invoke<string>('start_kds_hub');
    localStorage.setItem('HUB_WS_URL', wsUrl);
    console.log('Hub started at:', wsUrl);
    // Wait a bit for the server to be fully ready before connecting
    setTimeout(() => connectToHub(wsUrl), 500);
    return wsUrl;
  } catch (e) {
    console.error('Failed to start Hub:', e);
    throw e;
  }
}

export async function stopHub() {
  try {
    await invoke('stop_kds_hub');
    localStorage.removeItem('HUB_WS_URL');
    if (socket) {
      socket.close();
      socket = null;
    }
    console.log('Hub stopped.');
  } catch (e) {
    console.error('Failed to stop Hub:', e);
    throw e;
  }
}

// --- 2. The WebSocket Client ---
let socket: WebSocket | null = null;
let reconnectTimeout: any = null;
let reconnectAttempts = 0;
let heartbeatInterval: any = null;

const MAX_RECONNECT_ATTEMPTS = 50;
const BASE_RECONNECT_DELAY = 1000; // 1s
const MAX_RECONNECT_DELAY = 30000; // 30s
const HEARTBEAT_INTERVAL = 10000; // 10s

function getOfflineQueue(): string[] {
  const stored = localStorage.getItem('KDS_OFFLINE_QUEUE');
  return stored ? JSON.parse(stored) : [];
}

function addToOfflineQueue(payload: string) {
  const queue = getOfflineQueue();
  // Simple deduplication based on ID if it's a JSON with an id
  try {
    const newMsg = JSON.parse(payload);
    if (newMsg.payload?.id) {
      if (
        queue.some(m => {
          try {
            return JSON.parse(m).payload?.id === newMsg.payload.id;
          } catch {
            return false;
          }
        })
      ) {
        return; // Skip duplicate
      }
    }
  } catch (e) {}

  queue.push(payload);
  localStorage.setItem('KDS_OFFLINE_QUEUE', JSON.stringify(queue));
}

function clearOfflineQueue() {
  localStorage.removeItem('KDS_OFFLINE_QUEUE');
}

function startHeartbeat() {
  stopHeartbeat();
  heartbeatInterval = setInterval(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'Ping' }));
    }
  }, HEARTBEAT_INTERVAL);
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

export function connectToHub(url: string) {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  // Clear any existing reconnect timeout
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  console.log(`Attempting connection to ${url}... (Attempt ${reconnectAttempts + 1})`);
  useKdsStore.getState().setConnectionStatus('connecting');

  socket = new WebSocket(url);

  socket.onopen = () => {
    console.log('Connected to Local POS Hub!');
    reconnectAttempts = 0;
    useKdsStore.getState().setConnectionStatus('connected');
    startHeartbeat();

    // Send initial status/heartbeat
    const role = localStorage.getItem('DEVICE_ROLE');
    const user = JSON.parse(localStorage.getItem('pos-auth-storage-v3') || '{}').state?.currentMember;

    socket?.send(
      JSON.stringify({
        type: 'DeviceStatus',
        payload: {
          id: localStorage.getItem('DEVICE_ID') || 'unknown',
          name: localStorage.getItem('DEVICE_NAME') || 'Terminal',
          device_type: role,
          status: 'online',
          last_seen: Date.now(),
          current_user_id: user?.id || null,
          current_user_name: user?.name || null,
          station: localStorage.getItem('KDS_STATION') || null,
        },
      })
    );

    // Process offline queue
    const queue = getOfflineQueue();
    if (queue.length > 0) {
      console.log(`Processing ${queue.length} offline messages...`);
      queue.forEach(msg => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(msg);
        }
      });
      clearOfflineQueue();
    }
  };

  socket.onmessage = event => {
    try {
      const message = JSON.parse(event.data);

      // Handle incoming broadcast messages
      if (message.type === 'NewOrder') {
        const order = message.payload;
        useKdsStore.getState().addOrder(order);
        console.log('KDS: New Ticket Arrived!', order);

        const role = localStorage.getItem('DEVICE_ROLE');
        const kdsConfig = usePosStore.getState().settings.kitchenTicketConfig;
        if (role === 'KDS' && kdsConfig.autoPrintKds) {
          usePosStore.getState().printReceipt(order.id);
        }
      }

      if (message.type === 'SyncOrders') {
        const orders = message.payload;
        useKdsStore.getState().setOrders(orders);
        console.log('KDS: Orders Synced', orders.length);
      }

      if (message.type === 'OrderStatusUpdated') {
        const { id, new_status } = message.payload;
        useKdsStore.getState().updateOrderStatus(id, new_status);

        let posStatus = 'pending';
        if (new_status === 'in_progress' || new_status === 'PREPARING') posStatus = 'cooking';
        if (new_status === 'done' || new_status === 'READY' || new_status === 'COMPLETED') posStatus = 'ready';
        usePosStore.getState().updateOrderStatus(id, posStatus as any);
      }

      if (message.type === 'AssignmentUpdate') {
        const { device_id, user_id, user_name } = message.payload;
        const myDeviceId = localStorage.getItem('DEVICE_ID');

        if (device_id === myDeviceId) {
          localStorage.setItem('ASSIGNED_USER_ID', user_id || '');
          localStorage.setItem('ASSIGNED_USER_NAME', user_name || '');

          window.dispatchEvent(
            new CustomEvent('assignment-updated', {
              detail: { userId: user_id, userName: user_name },
            })
          );
        }
      }

      if (message.type === 'OrderEtaQuery') {
        const { id, station } = message.payload;
        const myStation = localStorage.getItem('KDS_STATION') || 'all';
        if (station === 'all' || station === myStation) {
          window.dispatchEvent(
            new CustomEvent('order-eta-query', {
              detail: { orderId: id },
            })
          );
        }
      }

      if (message.type === 'OrderEtaResponse') {
        const { id, eta_minutes } = message.payload;
        window.dispatchEvent(
          new CustomEvent('order-eta-response', {
            detail: { orderId: id, etaMinutes: eta_minutes },
          })
        );
      }

      if (message.type === 'TabletActivity') {
        window.dispatchEvent(
          new CustomEvent('tablet-activity-update', {
            detail: message.payload,
          })
        );
      }
    } catch (e) {
      console.error('Failed to parse WebSocket message:', e);
    }
  };

  socket.onerror = error => {
    console.error('WebSocket Error:', error);
    useKdsStore.getState().setConnectionStatus('error');
  };

  socket.onclose = () => {
    console.warn('Lost connection to Hub.');
    useKdsStore.getState().setConnectionStatus('disconnected');
    socket = null;
    stopHeartbeat();

    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      const delay = Math.min(BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
      console.log(`Reconnecting in ${delay}ms...`);
      reconnectTimeout = setTimeout(() => {
        reconnectAttempts++;
        connectToHub(url);
      }, delay);
    } else {
      console.error('Max reconnect attempts reached.');
    }
  };
}

// --- 3. Sending an Order from a Tablet ---
export function sendOrderToKitchen(fullOrder: any) {
  const KdsOrderPayload = {
    id: fullOrder.id,
    num:
      fullOrder.orderNumber ||
      fullOrder.saleNumber ||
      fullOrder.id.substring(0, 6) ||
      `TKT-${Math.floor(Math.random() * 1000)}`,
    type: fullOrder.orderType === 'dine-in' ? 'dine' : fullOrder.orderType === 'delivery' ? 'delivery' : 'takeout',
    station: 'hot', // Route properly if you have logic later
    table: fullOrder.tableNumber || '',
    status: 'new',
    createdAt: Date.now(),
    items:
      fullOrder.items?.map((item: any) => ({
        id: item.productId + '-' + Math.random(),
        name: item.productName || item.name,
        quantity: item.quantity,
        modifiers: '',
        isAllergy: false,
        status: 'pending',
      })) || [],
    note: fullOrder.notes || '',
    server: fullOrder.customerName || 'Cashier',
    covers: null,
  };

  const payload = {
    type: 'NewOrder',
    payload: KdsOrderPayload,
  };

  const jsonPayload = JSON.stringify(payload);
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(jsonPayload);
  } else {
    console.error('Hub offline! Saving to local offline queue...');
    addToOfflineQueue(jsonPayload);
  }
}

export function updateOrderStatusInKitchen(orderId: string, status: string) {
  const payload = {
    type: 'OrderStatusUpdated',
    payload: {
      id: orderId,
      new_status: status,
    },
  };

  const jsonPayload = JSON.stringify(payload);
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(jsonPayload);
  } else {
    addToOfflineQueue(jsonPayload);
  }
}

export function sendTabletActivity(activity: { current_page: string; cart_items: any[]; table_number: string | null }) {
  const payload = {
    type: 'TabletActivity',
    payload: {
      device_id: localStorage.getItem('DEVICE_ID') || 'unknown',
      ...activity,
    },
  };

  const jsonPayload = JSON.stringify(payload);
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(jsonPayload);
  }
}

export function queryOrderEta(orderId: string, station: string = 'all') {
  const payload = {
    type: 'OrderEtaQuery',
    payload: {
      id: orderId,
      station: station,
    },
  };

  const jsonPayload = JSON.stringify(payload);
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(jsonPayload);
  }
}

export function sendOrderEtaResponse(orderId: string, etaMinutes: number) {
  const payload = {
    type: 'OrderEtaResponse',
    payload: {
      id: orderId,
      eta_minutes: etaMinutes,
    },
  };

  const jsonPayload = JSON.stringify(payload);
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(jsonPayload);
  }
}
