import {V3AuthModule} from "../auth/auth.module";
import {Module, Global, forwardRef} from "@nestjs/common";
import {SuppliersModule} from "@repo/suppliers/server";
import {InventoryController} from "./interfaces/http/inventory.controller";
import {InventoryResolver} from "./interfaces/graphql/inventory.resolver";
import {GetInventoryUseCase} from "./application/use-cases/get-inventory.use-case";
import {TraceBatchUseCase} from "./application/use-cases/trace-batch.use-case";
import {SplitBatchUseCase} from "./application/use-cases/split-batch.use-case";
import {MergeBatchesUseCase} from "./application/use-cases/merge-batches.use-case";
import {
  RequestStockAdjustmentUseCase,
  ApproveStockAdjustmentUseCase,
} from "./application/use-cases/adjustment-workflow.use-case";
import {
  GetSupplierLeadTimeUseCase,
  GetWasteAnalysisUseCase,
} from "./application/use-cases/inventory-analytics.use-case";
import {AssemblyUseCase} from "./application/use-cases/assembly.use-case";
import {CheckB2BAvailabilityUseCase} from "./application/use-cases/check-b2b-availability.use-case";
import {UnpackBatchUseCase} from "./application/use-cases/unpack-batch.use-case";
import {ScanUnpackBatchUseCase} from "./application/use-cases/scan-unpack-batch.use-case";
import {InventoryMovementService} from "./application/services/inventory-movement.service";
import {InventoryIntegrityService} from "./application/services/inventory-integrity.service";
import {QuickStockInquiryUseCase} from "./application/use-cases/quick-stock-inquiry.use-case";
import {PrismaInventoryRepository} from "./infrastructure/persistence/prisma-inventory.repository";
import {IInventoryRepository} from "./domain/repositories/inventory-repository.interface";
import {IStockBatchRepository} from "./domain/repositories/stock-batch-repository.interface";
import {PrismaStockBatchRepository} from "./infrastructure/persistence/prisma-stock-batch.repository";
import {PrismaModule} from "../../../prisma/prisma.module";
import {RedisModule} from "../../../redis/redis.module";
import {CatalogModule} from "../catalog/catalog.module";

@Global()
@Module({
  imports: [forwardRef(() => V3AuthModule)],
  controllers: [InventoryController],
  providers: [
    InventoryResolver,
    GetInventoryUseCase,
    TraceBatchUseCase,
    SplitBatchUseCase,
    MergeBatchesUseCase,
    RequestStockAdjustmentUseCase,
    ApproveStockAdjustmentUseCase,
    GetSupplierLeadTimeUseCase,
    GetWasteAnalysisUseCase,
    AssemblyUseCase,
    CheckB2BAvailabilityUseCase,
    UnpackBatchUseCase,
    ScanUnpackBatchUseCase,
    InventoryMovementService,
    InventoryIntegrityService,
    QuickStockInquiryUseCase,
    {
      provide: IInventoryRepository,
      useClass: PrismaInventoryRepository,
    },
    {
      provide: IStockBatchRepository,
      useClass: PrismaStockBatchRepository,
    },
  ],
  exports: [
    GetInventoryUseCase,
    InventoryMovementService,
    InventoryIntegrityService,
  ],
})
export class InventoryModule {}
