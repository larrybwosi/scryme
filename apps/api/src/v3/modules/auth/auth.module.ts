import {Module} from "@nestjs/common";
import {AuthController} from "./interfaces/http/auth.controller";
import {ExchangeTokenUseCase} from "./application/use-cases/exchange-token.use-case";
import {V3AuthService} from "./infrastructure/services/v3-auth.service";
import {CustomersModule} from "../customers/customers.module";
import {forwardRef} from "@nestjs/common";
import {PrismaModule} from "../../../prisma/prisma.module";

@Module({
  imports: [PrismaModule, forwardRef(() => CustomersModule)],
  controllers: [AuthController],
  providers: [ExchangeTokenUseCase, V3AuthService],
  exports: [V3AuthService],
})
export class V3AuthModule {}
