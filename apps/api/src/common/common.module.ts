import { Global, Module } from "@nestjs/common";
import { ApiRealtimeService } from "./services/realtime.service";
import { RabbitMQConsumerService } from "./rabbitmq-consumer.service";
import { FirebaseModule } from "./firebase/firebase.module";
import { V3CommonModule } from "../v3/common/v3-common.module";

@Global()
@Module({
  imports: [V3CommonModule, FirebaseModule],
  providers: [ApiRealtimeService, RabbitMQConsumerService],
  exports: [ApiRealtimeService, RabbitMQConsumerService, FirebaseModule],
})
export class CommonModule {}
