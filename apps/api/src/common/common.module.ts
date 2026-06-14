import { Global, Module } from "@nestjs/common";
import { OpenObserveService } from "./services/openobserve.service";
import { ApiRealtimeService } from "./services/realtime.service";
import { RealtimeModule } from "../v2/realtime/realtime.module";

@Global()
@Module({
  imports: [RealtimeModule],
  providers: [OpenObserveService, ApiRealtimeService],
  exports: [OpenObserveService, ApiRealtimeService],
})
export class CommonModule {}
