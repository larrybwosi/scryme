import { Module, Global } from "@nestjs/common";
import { AuditService } from "./services/audit.service";
import { QuotaService } from "./services/quota.service";
import { QuotaGuard } from "./guards/quota.guard";
import { ModuleAccessService } from "./services/module-access.service";
import { ModuleGuard } from "./guards/module.guard";
import { OrganizationModulesController } from "./controllers/organization-modules.controller";
import { V3RealtimeGateway } from "./realtime/v3-realtime.gateway";
import { RealtimeRedisService } from "./realtime/realtime-redis.service";
import { V3AuthModule } from "../modules/auth/auth.module";
import { V3AuthCoreModule } from "../modules/auth-core/auth-core.module";
import { V3AuthGuard } from "./guards/v3-auth.guard";

@Global()
@Module({
  imports: [V3AuthModule, V3AuthCoreModule],
  controllers: [OrganizationModulesController],
  providers: [
    AuditService,
    QuotaService,
    QuotaGuard,
    ModuleAccessService,
    ModuleGuard,
    V3RealtimeGateway,
    RealtimeRedisService,
    V3AuthGuard,
  ],
  exports: [
    AuditService,
    QuotaService,
    QuotaGuard,
    ModuleAccessService,
    ModuleGuard,
    V3RealtimeGateway,
    RealtimeRedisService,
    V3AuthModule,
    V3AuthCoreModule,
    V3AuthGuard,
  ],
})
export class V3CommonModule {}
