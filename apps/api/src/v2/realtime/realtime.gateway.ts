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
import { verifyMemberToken, ROLE_PERMISSIONS } from '@repo/shared/server';
import { PrismaService } from '@/prisma/prisma.service';
import { env } from '@repo/env';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private prisma: PrismaService) {}

  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.['authorization']?.split(' ')[1];

      // Allow internal connections with a secret
      const internalSecret = client.handshake.headers?.['x-realtime-secret'];
      if (internalSecret === env.INTERNAL_REALTIME_SECRET) {
        (client as any).auth = {
            memberId: 'system',
            organizationId: 'system',
            role: 'ADMIN',
            permissions: ['*'],
        };
        console.log(`Internal system client connected: ${client.id}`);
        return;
      }

      if (!token) {
        console.log(`Client ${client.id} connected without token, disconnecting`);
        client.disconnect();
        return;
      }

      const payload = await verifyMemberToken(token);
      if (!payload) {
        console.log(`Client ${client.id} connected with invalid token, disconnecting`);
        client.disconnect();
        return;
      }

      const member = await this.prisma.client.member.findUnique({
        where: { id: payload.memberId },
        select: {
          id: true,
          role: true,
          isActive: true,
          organizationId: true,
        },
      });

      if (!member || !member.isActive) {
        console.log(`Client ${client.id} - Member not found or inactive, disconnecting`);
        client.disconnect();
        return;
      }

      // Store auth info on the socket
      (client as any).auth = {
        memberId: member.id,
        organizationId: member.organizationId,
        role: member.role,
        permissions: ROLE_PERMISSIONS[member.role] || [],
      };

      console.log(`Client connected and authenticated: ${client.id} (Member: ${member.id})`);
    } catch (err) {
      console.error(`Error during socket connection for ${client.id}:`, err);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channel: string },
  ) {
    const auth = (client as any).auth;
    if (!auth) {
      return { error: 'Unauthorized' };
    }

    // Basic authorization
    if (auth.memberId !== 'system') {
        if (data.channel.startsWith('organization:')) {
            const orgId = data.channel.split(':')[1];
            if (orgId !== auth.organizationId) {
                console.log(`Client ${client.id} unauthorized join attempt to ${data.channel}`);
                return { error: 'Unauthorized' };
            }
        }
    }

    client.join(data.channel);
    console.log(`Client ${client.id} joined room: ${data.channel}`);
    return { event: 'joined', data: data.channel };
  }

  @SubscribeMessage('leave')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channel: string },
  ) {
    client.leave(data.channel);
    console.log(`Client ${client.id} left room: ${data.channel}`);
    return { event: 'left', data: data.channel };
  }

  @SubscribeMessage('publish')
  handlePublish(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channel: string, event: string, data: any },
  ) {
    const auth = (client as any).auth;
    if (!auth) {
      console.log(`Client ${client.id} unauthorized publish attempt`);
      return { error: 'Unauthorized' };
    }

    console.log(`Client ${client.id} publishing to ${data.channel}`);
    this.server.to(data.channel).emit(data.event, data.data);
  }

  sendToChannel(channel: string, event: string, data: any) {
    this.server.to(channel).emit(event, data);
  }
}
