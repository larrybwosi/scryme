import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { RealtimeRedisService } from "./realtime-redis.service";
import { verifyMemberToken } from "@repo/shared/api/v2/services/auth";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly redis: RealtimeRedisService) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.split(" ")[1];

      if (!token) {
        console.warn(`V2 WS connection rejected: Missing token for client ${client.id}`);
        client.disconnect();
        return;
      }

      const payload = await verifyMemberToken(token);
      if (!payload) {
        console.warn(`V2 WS connection rejected: Invalid token for client ${client.id}`);
        client.disconnect();
        return;
      }

      (client as any).v2Context = payload;
      console.log(`V2 Client connected: ${client.id} (Org: ${payload.organizationId})`);
    } catch (error: any) {
      console.error("V2 WS Connection error:", error.message);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    const clientId = client.handshake.auth.clientId || client.id;
    const presenceChannels = (client as any).presenceChannels as Set<string>;

    if (presenceChannels) {
      for (const channel of presenceChannels) {
        await this.redis.leavePresence(channel, clientId);
        const members = await this.redis.getPresence(channel);
        this.server.to(channel).emit("presence:update", { channel, members });
      }
      presenceChannels.clear();
    }
  }

  private validateChannelAccess(client: Socket, channel: string): boolean {
    const context = (client as any).v2Context;
    if (!context) return false;

    // organization:[id]:[type] or org:[id]:[type]
    if (channel.startsWith("organization:") || channel.startsWith("org:")) {
      const orgId = channel.split(":")[1];
      return orgId === context.organizationId;
    }

    // pos:[locationId]:sales
    if (channel.startsWith("pos:")) {
      // For now, we don't have locationId in the member token payload,
      // but we should at least ensure they belong to an organization.
      return !!context.organizationId;
    }

    return false;
  }

  @SubscribeMessage("join")
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channel: string; options?: { rewind?: number } },
  ) {
    if (!this.validateChannelAccess(client, data.channel)) {
      return { event: "error", message: "Unauthorized" };
    }

    client.join(data.channel);
    console.log(`Client ${client.id} joined room: ${data.channel}`);

    // Handle Rewind
    if (data.options?.rewind) {
      const history = await this.redis.getHistory(data.channel);
      const limit = data.options.rewind;
      const messagesToSend = history.slice(-limit);

      for (const msg of messagesToSend) {
        client.emit(msg.event, msg.data);
      }
    }

    return { event: "joined", data: data.channel };
  }

  @SubscribeMessage("leave")
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channel: string },
  ) {
    client.leave(data.channel);
    console.log(`Client ${client.id} left room: ${data.channel}`);
    return { event: "left", data: data.channel };
  }

  @SubscribeMessage("presence:enter")
  async handlePresenceEnter(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channel: string; metadata?: any },
  ) {
    if (!this.validateChannelAccess(client, data.channel)) {
      return { event: "error", message: "Unauthorized" };
    }

    const clientId = client.handshake.auth.clientId || client.id;
    await this.redis.enterPresence(data.channel, clientId, data.metadata);

    // Track presence channel on client for cleanup on disconnect
    if (!(client as any).presenceChannels) {
      (client as any).presenceChannels = new Set<string>();
    }
    (client as any).presenceChannels.add(data.channel);

    // Broadcast presence update to the room
    const members = await this.redis.getPresence(data.channel);
    this.server
      .to(data.channel)
      .emit("presence:update", { channel: data.channel, members });

    return { event: "presence:entered", members };
  }

  @SubscribeMessage("presence:leave")
  async handlePresenceLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channel: string },
  ) {
    const clientId = client.handshake.auth.clientId || client.id;
    await this.redis.leavePresence(data.channel, clientId);

    if ((client as any).presenceChannels) {
      (client as any).presenceChannels.delete(data.channel);
    }

    // Broadcast presence update
    const members = await this.redis.getPresence(data.channel);
    this.server
      .to(data.channel)
      .emit("presence:update", { channel: data.channel, members });

    return { event: "presence:left", members };
  }

  @SubscribeMessage("presence:get")
  async handlePresenceGet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channel: string },
  ) {
    const members = await this.redis.getPresence(data.channel);
    return members;
  }

  @SubscribeMessage("history:get")
  async handleHistoryGet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channel: string; limit?: number },
  ) {
    const history = await this.redis.getHistory(data.channel);
    const limit = data.limit || 100;
    return history.slice(-limit);
  }

  @SubscribeMessage("publish")
  async handlePublish(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channel: string; event: string; data: any },
  ) {
    if (!this.validateChannelAccess(client, data.channel)) {
      return { event: "error", message: "Unauthorized" };
    }

    console.log(`Client ${client.id} attempting to publish to ${data.channel}`);

    // Save to history
    await this.redis.saveMessage(data.channel, data.event, data.data);

    // Broadcast to the specific channel/room
    this.server.to(data.channel).emit(data.event, data.data);
    console.log(`Published event "${data.event}" to channel "${data.channel}"`);
  }

  /**
   * Helper to send messages from the server side
   */
  async sendToChannel(channel: string, event: string, data: any) {
    // Save to history
    await this.redis.saveMessage(channel, event, data);
    this.server.to(channel).emit(event, data);
  }
}
