import { Rest } from 'ably';
import { RealtimeServerProvider } from './types';

export class AblyRealtimeProvider implements RealtimeServerProvider {
  private _ably: Rest | null = null;

  private getAbly() {
    if (this._ably) return this._ably;

    const key = process.env.ABLY_API_KEY;
    if (!key) {
      throw new Error("ABLY_API_KEY is not set");
    }

    this._ably = new Rest({ key, logLevel: 0 });
    return this._ably;
  }

  async publish(channel: string, event: string, data: any): Promise<void> {
    const ably = this.getAbly();
    await ably.channels.get(channel).publish(event, data);
  }

  subscribe(channel: string, event: string, callback: (data: any) => void): void {
    throw new Error("Subscribe not supported on Ably REST provider. Use Ably Realtime SDK for client-side subscriptions.");
  }

  unsubscribe(channel: string, event: string): void {
    throw new Error("Unsubscribe not supported on Ably REST provider.");
  }

  async presenceEnter(channel: string, data: any): Promise<void> {
     throw new Error("Presence Enter not supported on Ably REST provider.");
  }

  async presenceLeave(channel: string): Promise<void> {
     throw new Error("Presence Leave not supported on Ably REST provider.");
  }
}
