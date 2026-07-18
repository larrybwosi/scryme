import { Module } from "@nestjs/common";
import { PublicController } from "./public.controller";
import { BinariesController } from "./binaries.controller";
import { PublicService } from "./public.service";

@Module({
  controllers: [PublicController, BinariesController],
  providers: [PublicService],
  exports: [PublicService],
})
export class PublicModule {}
