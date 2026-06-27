import { io, Socket } from "socket.io-client";
import { RealtimeProvider, PresenceMember } from "./types";

export class SocketIORealtimeProvider implements RealtimeProvider {
  private socket: Socket | null = null;

  private getSocket() {
    if (this.socket) return this.socket;

    const url =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      process.env.SOCKET_URL ||
      "http://localhost:3001";
    this.socket = io(url, {
      transports: ["websocket"],
      autoConnect: true,
    });

    return this.socket;
  }

  async publish(channel: string, event: string, data: any): Promise<void> {
    const socket = this.getSocket();
    socket.emit("publish", { channel, event, data });
  }

  async getPresence(channel: string): Promise<PresenceMember[]> {
    const socket = this.getSocket();
    return new Promise((resolve) => {
      socket.emit("presence:get", { channel }, (response: PresenceMember[]) => {
        resolve(response);
      });
    });
  }

  async enterPresence(
    channel: string,
    clientId: string,
    data?: any,
  ): Promise<void> {
    const socket = this.getSocket();
    socket.emit("presence:enter", { channel, clientId, metadata: data });
  }

  async leavePresence(channel: string, clientId: string): Promise<void> {
    const socket = this.getSocket();
    socket.emit("presence:leave", { channel, clientId });
  }

  async getHistory(channel: string, limit: number = 100): Promise<any[]> {
    const socket = this.getSocket();
    return new Promise((resolve) => {
      socket.emit("history:get", { channel, limit }, (response: any[]) => {
        resolve(response);
      });
    });
  }
}
