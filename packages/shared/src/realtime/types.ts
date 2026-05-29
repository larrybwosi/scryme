export interface RealtimeProvider {
  publish(channel: string, event: string, data: any): Promise<void>;
  // Additional methods like subscribe, presence could be added here if needed
}
