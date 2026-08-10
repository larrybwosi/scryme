import { Global, Module } from "@nestjs/common";
import { ApiRealtimeService } from "./services/realtime.service";
import { RealtimeModule } from "../v2/realtime/realtime.module";
import { RabbitMQConsumerService } from "./rabbitmq-consumer.service";

@Global()
@Module({
  imports: [RealtimeModule],
  providers: [ApiRealtimeService, RabbitMQConsumerService],
  exports: [ApiRealtimeService, RabbitMQConsumerService],
})
export class CommonModule {}
