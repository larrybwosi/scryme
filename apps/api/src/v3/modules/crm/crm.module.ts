import { Module, Global, forwardRef } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { CrmController } from "./interfaces/http/crm.controller";
import { CrmRecordService } from "./application/use-cases/crm-record.service";
import { CrmNoteService } from "./application/use-cases/crm-note.service";
import { CrmDefinitionService } from "./application/use-cases/crm-definition.service";
import { CrmActivityService } from "./application/use-cases/crm-activity.service";
import { CrmRelationshipService } from "./application/use-cases/crm-relationship.service";
import { CrmSyncService } from "./infrastructure/services/crm-sync.service";
import { CrmSyncProcessor } from "./infrastructure/workers/crm-sync.processor";

@Module({
  imports: [
    BullModule.registerQueue({
      name: "crm-sync",
    }),
  ],
  controllers: [CrmController],
  providers: [
    CrmRecordService,
    CrmNoteService,
    CrmDefinitionService,
    CrmActivityService,
    CrmRelationshipService,
    CrmSyncService,
    CrmSyncProcessor,
  ],
  exports: [
    CrmRecordService,
    CrmNoteService,
    CrmDefinitionService,
    CrmActivityService,
    CrmRelationshipService,
    CrmSyncService,
  ],
})
export class CrmModule {}
