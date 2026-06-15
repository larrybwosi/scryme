import {V3AuthModule} from "../auth/auth.module";
import {Module, Global, forwardRef} from "@nestjs/common";
import {LoyaltyService} from "./application/loyalty.service";
import {LoyaltyController} from "./interfaces/http/controllers/loyalty.controller";
import {PrismaModule} from "../../../prisma/prisma.module";

@Module({
  imports: [forwardRef(() => V3AuthModule), PrismaModule],
  controllers: [LoyaltyController],
  providers: [LoyaltyService],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
