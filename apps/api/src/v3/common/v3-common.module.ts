import {Module, Global} from "@nestjs/common";
import {AuditService} from "./services/audit.service";
import {V3RealtimeGateway} from "./realtime/v3-realtime.gateway";
import {V3AuthModule} from "../modules/auth/auth.module";
import {RealtimeModule} from "../../v2/realtime/realtime.module";

@Global()
@Module({
  imports: [V3AuthModule, RealtimeModule],
  providers: [AuditService, V3RealtimeGateway],
  exports: [AuditService, V3RealtimeGateway, V3AuthModule],
})
export class V3CommonModule {}
