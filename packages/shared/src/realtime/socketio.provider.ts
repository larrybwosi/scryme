import { io, Socket } from 'socket.io-client';
import { RealtimeServerProvider } from './types';

export class SocketIORealtimeProvider implements RealtimeServerProvider {
  private socket: Socket | null = null;
  private subscriptions: Map<string, (data: any) => void> = new Map();

  private getSocket() {
    if (this.socket) return this.socket;

    const url = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.SOCKET_URL || 'http://localhost:3002';
    const secret = process.env.INTERNAL_REALTIME_SECRET;

    this.socket = io(url, {
      transports: ['websocket'],
      autoConnect: true,
      extraHeaders: secret ? { 'x-realtime-secret': secret } : undefined,
    });

    return this.socket;
  }

  async publish(channel: string, event: string, data: any): Promise<void> {
    const socket = this.getSocket();
    socket.emit('publish', { channel, event, data });
  }

  subscribe(channel: string, event: string, callback: (data: any) => void): void {
    const socket = this.getSocket();
    const subscriptionKey = `${channel}:${event}`;
    this.subscriptions.set(subscriptionKey, callback);

    socket.emit('join', { channel });
    socket.on(event, callback);
  }

  unsubscribe(channel: string, event: string): void {
    const socket = this.getSocket();
    const subscriptionKey = `${channel}:${event}`;
    const callback = this.subscriptions.get(subscriptionKey);

    if (callback) {
      socket.off(event, callback);
      this.subscriptions.delete(subscriptionKey);
    }
  }

  async presenceEnter(channel: string, data: any): Promise<void> {
    const socket = this.getSocket();
    socket.emit('join', { channel, presence: data });
  }

  async presenceLeave(channel: string): Promise<void> {
    const socket = this.getSocket();
    socket.emit('leave', { channel });
  }
}
