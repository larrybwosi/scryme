import { Module } from "@nestjs/common";
import { AuthController } from "./interfaces/http/auth.controller";
import { ExchangeTokenUseCase } from "./application/use-cases/exchange-token.use-case";
import { OAuthClientManagementUseCase } from "./application/use-cases/oauth-client-management.use-case";
import { V3AuthService } from "./infrastructure/services/v3-auth.service";
import { V3AuthCoreModule } from "../auth-core/auth-core.module";
import { PrismaModule } from "../../../prisma/prisma.module";
import { AuthModule } from "@/auth/auth.module";

@Module({
  imports: [PrismaModule, V3AuthCoreModule, AuthModule],
  controllers: [AuthController],
  providers: [ExchangeTokenUseCase, OAuthClientManagementUseCase, V3AuthService],
  exports: [V3AuthService, OAuthClientManagementUseCase],
})
export class V3AuthModule {}
