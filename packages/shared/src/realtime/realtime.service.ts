import { RealtimeServerProvider } from './types';
import { AblyRealtimeProvider } from './ably.provider';
import { SocketIORealtimeProvider } from './socketio.provider';

export class RealtimeService implements RealtimeServerProvider {
  private provider: RealtimeServerProvider;

  constructor() {
    const providerType = process.env.REALTIME_PROVIDER || 'ably';

    if (providerType === 'socketio') {
      this.provider = new SocketIORealtimeProvider();
    } else {
      this.provider = new AblyRealtimeProvider();
    }
  }

  async publish(channel: string, event: string, data: any) {
    return this.provider.publish(channel, event, data);
  }

  subscribe(channel: string, event: string, callback: (data: any) => void) {
    return this.provider.subscribe(channel, event, callback);
  }

  unsubscribe(channel: string, event: string) {
    return this.provider.unsubscribe(channel, event);
  }

  async presenceEnter(channel: string, data: any) {
    return this.provider.presenceEnter(channel, data);
  }

  async presenceLeave(channel: string) {
    return this.provider.presenceLeave(channel);
  }
}

export const realtimeService = new RealtimeService();
