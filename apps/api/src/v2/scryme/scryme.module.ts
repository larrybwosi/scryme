import { Module, OnModuleInit } from '@nestjs/common';
import { ScrymeService } from './scryme.service';
import { ScrymeController } from './scryme.controller';

@Module({
  providers: [ScrymeService],
  controllers: [ScrymeController],
  exports: [ScrymeService],
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
