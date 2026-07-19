import { Global, Module } from "@nestjs/common";
import { ApiRealtimeService } from "./services/realtime.service";
import { RealtimeModule } from "../v2/realtime/realtime.module";

@Global()
@Module({
  imports: [RealtimeModule],
  providers: [ApiRealtimeService],
  exports: [ApiRealtimeService],
})
export class CommonModule {}
