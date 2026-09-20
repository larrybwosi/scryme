import { Module } from "@nestjs/common";
import { V3BakeryController } from "./interfaces/http/bakery.controller";
import { BakeryModule as V2BakeryModule } from "@/v2/bakery/bakery.module";
import { PrismaModule } from "@/prisma/prisma.module";

@Module({
  imports: [PrismaModule, V2BakeryModule],
  controllers: [V3BakeryController],
  providers: [],
})
export class V3BakeryModule {}
