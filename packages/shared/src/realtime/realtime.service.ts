import { RealtimeProvider } from './types';
import { AblyRealtimeProvider } from './ably.provider';
import { SocketIORealtimeProvider } from './socketio.provider';

export class RealtimeService implements RealtimeProvider {
  private provider: RealtimeProvider;

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
}

export const realtimeService = new RealtimeService();
