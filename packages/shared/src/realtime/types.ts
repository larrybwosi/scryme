export interface RealtimeServerProvider {
  publish(channel: string, event: string, data: any): Promise<void>;
  subscribe(channel: string, event: string, callback: (data: any) => void): void;
  unsubscribe(channel: string, event: string): void;
  presenceEnter(channel: string, data: any): Promise<void>;
  presenceLeave(channel: string): Promise<void>;
}
