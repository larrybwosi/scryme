import { Realtime, AuthOptions } from 'ably';
import { io, Socket } from 'socket.io-client';

export type RealtimeProviderType = 'ably' | 'socketio';

export interface RealtimeClientOptions {
  provider: RealtimeProviderType;
  ablyAuthCallback?: AuthOptions['authCallback'];
  socketUrl?: string;
  socketToken?: string;
}

export class BaseRealtimeClient {
  public ably: Realtime | null = null;
  public socket: Socket | null = null;
  public provider: RealtimeProviderType;
  private isConnected = false;
  private onConnectionChangeCallbacks: ((connected: boolean) => void)[] = [];

  constructor(private options: RealtimeClientOptions) {
    this.provider = options.provider;
    this.initialize();
  }

  private initialize() {
    if (this.provider === 'socketio') {
      const url = this.options.socketUrl || 'http://localhost:3002';
      this.socket = io(url, {
        transports: ['websocket'],
        auth: this.options.socketToken ? { token: this.options.socketToken } : undefined,
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        this.notifyConnectionChange(true);
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
        this.notifyConnectionChange(false);
      });
    } else {
      this.ably = new Realtime({
        authCallback: this.options.ablyAuthCallback,
      });

      this.ably.connection.on('connected', () => {
        this.isConnected = true;
        this.notifyConnectionChange(true);
      });

      this.ably.connection.on('disconnected', () => {
        this.isConnected = false;
        this.notifyConnectionChange(false);
      });
    }
  }

  public onConnectionChange(callback: (connected: boolean) => void) {
    this.onConnectionChangeCallbacks.push(callback);
    callback(this.isConnected);
    return () => {
      this.onConnectionChangeCallbacks = this.onConnectionChangeCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifyConnectionChange(connected: boolean) {
    this.onConnectionChangeCallbacks.forEach(cb => cb(connected));
  }

  public subscribe(channelName: string, event: string, callback: (data: any) => void) {
    const { socket, ably, provider } = this;
    if (provider === 'socketio' && socket) {
      socket.emit('join', { channel: channelName });
      socket.on(event, callback);
      return () => {
        socket.off(event, callback);
      };
    } else if (provider === 'ably' && ably) {
      const channel = ably.channels.get(channelName);
      if (channel) {
        channel.subscribe(event, (message) => callback(message.data));
        return () => {
          channel.unsubscribe(event);
        };
      }
    }
    return () => {};
  }

  public async publish(channelName: string, event: string, data: any) {
    const { socket, ably, provider } = this;
    if (provider === 'socketio' && socket) {
      socket.emit('publish', { channel: channelName, event, data });
    } else if (provider === 'ably' && ably) {
      const channel = ably.channels.get(channelName);
      if (channel) {
        await channel.publish(event, data);
      }
    }
  }

  public async presenceEnter(channelName: string, data: any) {
    const { socket, ably, provider } = this;
    if (provider === 'socketio' && socket) {
      socket.emit('join', { channel: channelName, presence: data });
    } else if (provider === 'ably' && ably) {
      const channel = ably.channels.get(channelName);
      if (channel) {
        await channel.presence.enter(data);
      }
    }
  }

  public async presenceLeave(channelName: string) {
    const { socket, ably, provider } = this;
    if (provider === 'socketio' && socket) {
      socket.emit('leave', { channel: channelName });
    } else if (provider === 'ably' && ably) {
      const channel = ably.channels.get(channelName);
      if (channel) {
        await channel.presence.leave();
      }
    }
  }

  public close() {
    if (this.socket) {
      this.socket.disconnect();
    }
    if (this.ably) {
      this.ably.close();
    }
  }
}
