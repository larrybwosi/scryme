import { Module, Global } from "@nestjs/common";
import { V3AuthCoreService } from "./infrastructure/services/v3-auth-core.service";
import { PrismaModule } from "../../../prisma/prisma.module";

@Global()
@Module({
  imports: [PrismaModule],
  providers: [V3AuthCoreService],
  exports: [V3AuthCoreService],
})
export class V3AuthCoreModule {}
