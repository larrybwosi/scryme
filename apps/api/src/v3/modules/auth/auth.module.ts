import { Module } from "@nestjs/common";
import { AuthController } from "./interfaces/http/auth.controller";
import { ExchangeTokenUseCase } from "./application/use-cases/exchange-token.use-case";
import { V3AuthService } from "./infrastructure/services/v3-auth.service";
import { V3AuthCoreModule } from "../auth-core/auth-core.module";
import { PrismaModule } from "../../../prisma/prisma.module";

@Module({
  imports: [PrismaModule, V3AuthCoreModule],
  controllers: [AuthController],
  providers: [ExchangeTokenUseCase, V3AuthService],
  exports: [V3AuthService],
})
export class V3AuthModule {}
