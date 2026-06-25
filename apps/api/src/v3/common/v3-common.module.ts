import { Module, Global } from "@nestjs/common";
import { AuditService } from "./services/audit.service";
import { V3RealtimeGateway } from "./realtime/v3-realtime.gateway";
import { V3AuthModule } from "../modules/auth/auth.module";
import { V3AuthCoreModule } from "../modules/auth-core/auth-core.module";
import { RealtimeModule } from "../../v2/realtime/realtime.module";
import { V3AuthGuard } from "./guards/v3-auth.guard";

@Global()
@Module({
  imports: [V3AuthModule, V3AuthCoreModule, RealtimeModule],
  providers: [AuditService, V3RealtimeGateway, V3AuthGuard],
  exports: [
    AuditService,
    V3RealtimeGateway,
    V3AuthModule,
    V3AuthCoreModule,
    V3AuthGuard,
  ],
})
export class V3CommonModule {}
