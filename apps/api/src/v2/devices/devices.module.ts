import { Module } from "@nestjs/common";
import { DevicesController } from "./devices.controller";
import { DevicesService } from "./devices.service";
import { PosPairingService } from "../../v3/modules/pos/application/services/pos-pairing.service";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [DevicesController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}
