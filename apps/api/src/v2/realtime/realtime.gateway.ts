import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import {Server, Socket} from "socket.io";
import {RealtimeRedisService} from "./realtime-redis.service";

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

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    const clientId = client.handshake.auth.clientId || client.id;

    // Cleanup presence in all rooms the client was in
    // For simplicity, we search all presence keys and remove this client
    const presenceKeys = await this.redis.keys("realtime:presence:*");
    for (const key of presenceKeys) {
      const channel = key.replace("realtime:presence:", "");
      await this.redis.leavePresence(channel, clientId);

      const members = await this.redis.getPresence(channel);
      this.server.to(channel).emit("presence:update", {channel, members});
    }
  }

  @SubscribeMessage("join")
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {channel: string; options?: {rewind?: number}},
  ) {
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

    return {event: "joined", data: data.channel};
  }

  @SubscribeMessage("leave")
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {channel: string},
  ) {
    client.leave(data.channel);
    console.log(`Client ${client.id} left room: ${data.channel}`);
    return {event: "left", data: data.channel};
  }

  @SubscribeMessage("presence:enter")
  async handlePresenceEnter(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {channel: string; metadata?: any},
  ) {
    const clientId = client.handshake.auth.clientId || client.id;
    await this.redis.enterPresence(data.channel, clientId, data.metadata);

    // Broadcast presence update to the room
    const members = await this.redis.getPresence(data.channel);
    this.server
      .to(data.channel)
      .emit("presence:update", {channel: data.channel, members});

    return {event: "presence:entered", members};
  }

  @SubscribeMessage("presence:leave")
  async handlePresenceLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {channel: string},
  ) {
    const clientId = client.handshake.auth.clientId || client.id;
    await this.redis.leavePresence(data.channel, clientId);

    // Broadcast presence update
    const members = await this.redis.getPresence(data.channel);
    this.server
      .to(data.channel)
      .emit("presence:update", {channel: data.channel, members});

    return {event: "presence:left", members};
  }

  @SubscribeMessage("presence:get")
  async handlePresenceGet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {channel: string},
  ) {
    const members = await this.redis.getPresence(data.channel);
    return members;
  }

  @SubscribeMessage("history:get")
  async handleHistoryGet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {channel: string; limit?: number},
  ) {
    const history = await this.redis.getHistory(data.channel);
    const limit = data.limit || 100;
    return history.slice(-limit);
  }

  @SubscribeMessage("publish")
  async handlePublish(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {channel: string; event: string; data: any},
  ) {
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
