import { Rest } from 'ably';
import { RealtimeProvider } from './types';

export class AblyRealtimeProvider implements RealtimeProvider {
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
}
