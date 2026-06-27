import { Realtime } from "ably";
import { RealtimeProvider, PresenceMember } from "./types";

export class AblyRealtimeProvider implements RealtimeProvider {
  private _ably: Realtime | null = null;

  private getAbly() {
    if (this._ably) return this._ably;

    const key = process.env.ABLY_API_KEY;
    if (!key) {
      throw new Error("ABLY_API_KEY is not set");
    }

    this._ably = new Realtime({ key, logLevel: 0 });
    return this._ably;
  }

  async publish(channel: string, event: string, data: any): Promise<void> {
    const ably = this.getAbly();
    await ably.channels.get(channel).publish(event, data);
  }

  async getPresence(channel: string): Promise<PresenceMember[]> {
    const ably = this.getAbly();
    const result = await ably.channels.get(channel).presence.get();
    // For Realtime presence, get() returns an array of PresenceMessage directly if using the callback-less version in newer SDKs,
    // but Ably 2.x returns a Promise<PresenceMessage[]> for Realtime.
    const messages = await (ably.channels.get(channel).presence.get() as any);
    return (Array.isArray(messages) ? messages : []).map((m: any) => ({
      clientId: m.clientId || "unknown",
      timestamp: m.timestamp,
      data: m.data,
    }));
  }

  async enterPresence(
    channel: string,
    clientId: string,
    data?: any,
  ): Promise<void> {
    const ably = this.getAbly();
    await (ably.channels.get(channel).presence as any).enterClient(
      clientId,
      data,
    );
  }

  async leavePresence(channel: string, clientId: string): Promise<void> {
    const ably = this.getAbly();
    await (ably.channels.get(channel).presence as any).leaveClient(clientId);
  }

  async getHistory(channel: string, limit: number = 100): Promise<any[]> {
    const ably = this.getAbly();
    const result = await ably.channels.get(channel).history({ limit });
    return result.items.map((m) => m.data);
  }
}
