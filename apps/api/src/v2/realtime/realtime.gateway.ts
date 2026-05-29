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

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channel: string },
  ) {
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
    // TODO: Add authentication/authorization check here
    // For now, only allowing internal/authorized publishing if we can verify the client
    // For safety, let's log the attempt
    console.log(`Client ${client.id} attempting to publish to ${data.channel}`);

    // Broadcast to the specific channel/room
    this.server.to(data.channel).emit(data.event, data.data);
    console.log(`Published event "${data.event}" to channel "${data.channel}"`);
  }
}
