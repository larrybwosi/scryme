import { Module, forwardRef } from "@nestjs/common";
import { WorkflowsController } from "./workflows.controller";
import { WorkflowsService } from "./workflows.service";
import { InventoryModule } from "../../v3/modules/inventory/inventory.module";

@Module({
  imports: [forwardRef(() => InventoryModule)],
  controllers: [WorkflowsController],
  providers: [WorkflowsService],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}
