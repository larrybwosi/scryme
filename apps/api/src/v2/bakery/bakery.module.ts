import { Module } from "@nestjs/common";
import { BakeryController } from "./bakery.controller";
import { BakeryAuthController } from "./bakery-auth.controller";
import { BakeryService } from "./bakery.service";
import { AuthModule } from "../../auth/auth.module";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [BakeryController, BakeryAuthController],
  providers: [BakeryService],
  exports: [BakeryService],
})
export class BakeryModule {}
