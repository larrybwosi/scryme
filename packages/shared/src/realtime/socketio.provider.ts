import { io, Socket } from 'socket.io-client';
import { RealtimeProvider } from './types';

export class SocketIORealtimeProvider implements RealtimeProvider {
  private socket: Socket | null = null;

  private getSocket() {
    if (this.socket) return this.socket;

    const url = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.SOCKET_URL || 'http://localhost:3001';
    this.socket = io(url, {
      transports: ['websocket'],
      autoConnect: true,
    });

    return this.socket;
  }

  async publish(channel: string, event: string, data: any): Promise<void> {
    const socket = this.getSocket();

    // We'll follow a pattern where we emit to a specific channel/room
    // The server will need to handle this and broadcast to the room
    socket.emit('publish', { channel, event, data });
  }
}
