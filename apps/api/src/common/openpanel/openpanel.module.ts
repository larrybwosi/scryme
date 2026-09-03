import { Module, Global } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { OpenPanelService } from "./openpanel.service";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [OpenPanelService],
  exports: [OpenPanelService],
})
export class OpenPanelModule {}
