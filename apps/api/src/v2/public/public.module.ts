import { Module } from "@nestjs/common";
import { PublicController } from "./public.controller";
import { BinariesController } from "./binaries.controller";
import { PublicService } from "./public.service";
import { PosReleaseService } from "./pos-release.service";

@Module({
  controllers: [PublicController, BinariesController],
  providers: [PublicService, PosReleaseService],
  exports: [PublicService, PosReleaseService],
})
export class PublicModule {}
