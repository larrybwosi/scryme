import { RealtimeProvider, PresenceMember } from './types';
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

  async getPresence(channel: string): Promise<PresenceMember[]> {
    return this.provider.getPresence(channel);
  }

  async enterPresence(channel: string, clientId: string, data?: any): Promise<void> {
    return this.provider.enterPresence(channel, clientId, data);
  }

  async leavePresence(channel: string, clientId: string): Promise<void> {
    return this.provider.leavePresence(channel, clientId);
  }

  async getHistory(channel: string, limit?: number): Promise<any[]> {
    return this.provider.getHistory(channel, limit);
  }
}

export const realtimeService = new RealtimeService();
