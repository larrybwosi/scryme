import { Global, Module } from "@nestjs/common";
import { ApiRealtimeService } from "./services/realtime.service";
import { RealtimeModule } from "../v2/realtime/realtime.module";
import { RabbitMQConsumerService } from "./rabbitmq-consumer.service";
import { FirebaseModule } from "./firebase/firebase.module";

@Global()
@Module({
  imports: [RealtimeModule, FirebaseModule],
  providers: [ApiRealtimeService, RabbitMQConsumerService],
  exports: [ApiRealtimeService, RabbitMQConsumerService, FirebaseModule],
})
export class CommonModule {}
