import { RealtimeProvider, PresenceMember } from './types';
import { SocketIORealtimeProvider } from './socketio.provider';

export class RealtimeService implements RealtimeProvider {
  private provider: RealtimeProvider;

  constructor() {
    this.provider = new SocketIORealtimeProvider();
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
