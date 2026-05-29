import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { V3AuthService } from '../../modules/auth/infrastructure/services/v3-auth.service';
import { UseGuards } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@WebSocketGateway({
  namespace: 'v3',
  cors: {
    origin: '*',
  },
})
export class V3RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly v3AuthService: V3AuthService,
    private readonly prisma: PrismaService
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.v3AuthService.verifyToken(token);
      (client as any).v3Context = payload;

      console.log(`V3 Client connected: ${client.id} (Org: ${payload.orgSlug})`);
    } catch (error: any) {
      console.error('V3 WS Connection error:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`V3 Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:order')
  async handleSubscribeOrder(@ConnectedSocket() client: Socket, @MessageBody() data: { orderId: string }) {
    const context = (client as any).v3Context;

    // Verify ownership
    const order = await this.prisma.client.transaction.findUnique({
      where: { id: data.orderId },
      select: { organizationId: true },
    });

    if (!order || order.organizationId !== context.organizationId) {
      return { event: 'error', message: 'Unauthorized or not found' };
    }

    const room = `order:${data.orderId}`;
    client.join(room);
    return { event: 'subscribed', room };
  }

  @SubscribeMessage('subscribe:inventory')
  handleSubscribeInventory(@ConnectedSocket() client: Socket) {
    const context = (client as any).v3Context;
    const room = `inventory:${context.organizationId}`;
    client.join(room);
    return { event: 'subscribed', room };
  }

  // Helper method to emit events from services
  sendToOrder(orderId: string, event: string, data: any) {
    this.server.to(`order:${orderId}`).emit(event, data);
  }

  sendToInventory(organizationId: string, event: string, data: any) {
    this.server.to(`inventory:${organizationId}`).emit(event, data);
  }
}
