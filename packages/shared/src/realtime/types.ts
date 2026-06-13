export interface PresenceMember {
  clientId: string;
  timestamp: number;
  data?: any;
}

export interface RealtimeProvider {
  publish(channel: string, event: string, data: any): Promise<void>;

  // Presence
  getPresence(channel: string): Promise<PresenceMember[]>;
  enterPresence(channel: string, clientId: string, data?: any): Promise<void>;
  leavePresence(channel: string, clientId: string): Promise<void>;

  // History
  getHistory(channel: string, limit?: number): Promise<any[]>;
}
