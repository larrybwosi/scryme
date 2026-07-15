import { Module, OnModuleInit } from "@nestjs/common";
import { ScrymeService } from "./scryme.service";
import { ScrymeController } from "./scryme.controller";
import { ScrymeApprovalService } from "./scryme-approval.service";
import { ScrymeNotificationService } from "./scryme-notification.service";

@Module({
  providers: [ScrymeService, ScrymeApprovalService, ScrymeNotificationService],
  controllers: [ScrymeController],
  exports: [ScrymeService, ScrymeApprovalService, ScrymeNotificationService],
})
export class ScrymeModule implements OnModuleInit {
  constructor(private readonly scrymeService: ScrymeService) {}

  async onModuleInit() {
    const publicUrl = process.env.PUBLIC_API_URL;
    if (publicUrl) {
      await this.scrymeService.registerWebhook(publicUrl);
    }
  }
}
