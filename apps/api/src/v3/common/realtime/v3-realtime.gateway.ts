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
import { V3AuthService } from "../../modules/auth/infrastructure/services/v3-auth.service";
import { UseGuards } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { RealtimeRedisService } from "../../../v2/realtime/realtime-redis.service";

@WebSocketGateway({
  namespace: "v3",
  cors: {
    origin: "*",
  },
})
export class V3RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly v3AuthService: V3AuthService,
    private readonly prisma: PrismaService,
    private readonly redis: RealtimeRedisService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.split(" ")[1];
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.v3AuthService.verifyToken(token);
      (client as any).v3Context = payload;

      console.log(
        `V3 Client connected: ${client.id} (Org: ${payload.orgSlug})`,
      );
    } catch (error: any) {
      console.error("V3 WS Connection error:", error.message);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    console.log(`V3 Client disconnected: ${client.id}`);
    const context = (client as any).v3Context;
    const clientId = context?.memberId || client.id;
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

  private async validateChannelAccess(
    context: any,
    channel: string,
  ): Promise<boolean> {
    if (!context) return false;

    // Basic ownership check for common V3 patterns
    if (channel.startsWith("order:")) {
      const orderId = channel.split(":")[1];
      const order = await this.prisma.client.transaction.findUnique({
        where: { id: orderId },
        select: { organizationId: true },
      });
      return !!order && order.organizationId === context.organizationId;
    }

    if (channel.startsWith("inventory:") || channel.startsWith("org:")) {
      const orgId = channel.split(":")[1];
      return orgId === context.organizationId;
    }

    // Deny access to unknown channel patterns by default (Fail Securely)
    return false;
  }

  @SubscribeMessage("join")
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channel: string; options?: { rewind?: number } },
  ) {
    const context = (client as any).v3Context;
    if (!(await this.validateChannelAccess(context, data.channel))) {
      return { event: "error", message: "Unauthorized" };
    }

    client.join(data.channel);

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

  @SubscribeMessage("presence:enter")
  async handlePresenceEnter(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channel: string; metadata?: any },
  ) {
    const context = (client as any).v3Context;
    if (!(await this.validateChannelAccess(context, data.channel))) {
      return { event: "error", message: "Unauthorized" };
    }

    const clientId = context.memberId || client.id;
    await this.redis.enterPresence(data.channel, clientId, data.metadata);

    // Track presence channel on client for cleanup on disconnect
    if (!(client as any).presenceChannels) {
      (client as any).presenceChannels = new Set<string>();
    }
    (client as any).presenceChannels.add(data.channel);

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
    const context = (client as any).v3Context;
    const clientId = context?.memberId || client.id;
    await this.redis.leavePresence(data.channel, clientId);

    if ((client as any).presenceChannels) {
      (client as any).presenceChannels.delete(data.channel);
    }

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

  @SubscribeMessage("subscribe:order")
  async handleSubscribeOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ) {
    const context = (client as any).v3Context;

    // Verify ownership
    const order = await this.prisma.client.transaction.findUnique({
      where: { id: data.orderId },
      select: { organizationId: true },
    });

    if (!order || order.organizationId !== context.organizationId) {
      return { event: "error", message: "Unauthorized or not found" };
    }

    const room = `order:${data.orderId}`;
    client.join(room);
    return { event: "subscribed", room };
  }

  @SubscribeMessage("subscribe:inventory")
  handleSubscribeInventory(@ConnectedSocket() client: Socket) {
    const context = (client as any).v3Context;
    const room = `inventory:${context.organizationId}`;
    client.join(room);
    return { event: "subscribed", room };
  }

  @SubscribeMessage("publish")
  async handlePublish(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channel: string; event: string; data: any },
  ) {
    const context = (client as any).v3Context;
    if (!(await this.validateChannelAccess(context, data.channel))) {
      return { event: "error", message: "Unauthorized" };
    }

    await this.redis.saveMessage(data.channel, data.event, data.data);
    this.server.to(data.channel).emit(data.event, data.data);
  }

  // Helper method to emit events from services
  async sendToOrder(orderId: string, event: string, data: any) {
    const channel = `order:${orderId}`;
    await this.redis.saveMessage(channel, event, data);
    this.server.to(channel).emit(event, data);
  }

  async sendToInventory(organizationId: string, event: string, data: any) {
    const channel = `inventory:${organizationId}`;
    await this.redis.saveMessage(channel, event, data);
    this.server.to(channel).emit(event, data);
  }
}
