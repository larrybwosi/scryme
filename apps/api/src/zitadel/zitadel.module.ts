import { Module, Global } from '@nestjs/common';
import { ZitadelCustomerService } from './zitadel-customer.service';
import { CrmActivityService } from './crm-activity.service';
import { BullModule } from '@nestjs/bullmq';
import { ZitadelProcessor } from './zitadel.processor';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'zitadel-sync',
    }),
  ],
  providers: [ZitadelCustomerService, CrmActivityService, ZitadelProcessor],
  exports: [ZitadelCustomerService, BullModule],
})
export class ZitadelModule {}
