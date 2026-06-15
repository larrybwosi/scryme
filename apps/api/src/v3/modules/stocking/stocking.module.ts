import {V3AuthModule} from "../auth/auth.module";
import {Module, forwardRef} from "@nestjs/common";
import {PrismaModule} from "../../../prisma/prisma.module";
import {StockingController} from "./interfaces/http/stocking.controller";
import {PurchaseOrderUseCase} from "./application/use-cases/purchase-order.use-case";
import {StockTransferUseCase} from "./application/use-cases/stock-transfer.use-case";
import {StockRequestUseCase} from "./application/use-cases/stock-request.use-case";
import {DeliveryReconciliationUseCase} from "./application/use-cases/delivery-reconciliation.use-case";
import {DeliveryPartnerUseCase} from "./application/use-cases/delivery-partner.use-case";
import {PhysicalReconciliationUseCase} from "./application/use-cases/physical-reconciliation.use-case";
import {InventoryModule} from "../inventory/inventory.module";
import {CatalogModule} from "../catalog/catalog.module";
import {CycleCountingService} from "./application/services/cycle-counting.service";
import {DocumentModule} from "../../../common/documents/document.module";

@Module({
  imports: [
    forwardRef(() => V3AuthModule),
    PrismaModule,
    InventoryModule,
    CatalogModule,
    DocumentModule,
  ],
  controllers: [StockingController],
  providers: [
    PurchaseOrderUseCase,
    StockTransferUseCase,
    StockRequestUseCase,
    DeliveryReconciliationUseCase,
    DeliveryPartnerUseCase,
    PhysicalReconciliationUseCase,
    CycleCountingService,
  ],
  exports: [PurchaseOrderUseCase],
})
export class StockingModule {}
