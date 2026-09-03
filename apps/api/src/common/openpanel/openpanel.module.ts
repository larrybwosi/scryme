import { Module, Global } from "@nestjs/common";
import { OpenPanelService } from "./openpanel.service";

@Global()
@Module({
  providers: [OpenPanelService],
  exports: [OpenPanelService],
})
export class OpenPanelModule {}
