import { Module } from "@nestjs/common";
import { InventoryController } from "./inventory.controller";
import { InventoryService } from "./inventory.service";
import { DocumentModule } from "../../common/documents/document.module";
import { PurchaseOrderUseCase } from "../../v3/modules/stocking/application/use-cases/purchase-order.use-case";
import { StockTransferUseCase } from "../../v3/modules/stocking/application/use-cases/stock-transfer.use-case";
import { StockRequestUseCase } from "../../v3/modules/stocking/application/use-cases/stock-request.use-case";
import { InventoryModule as V3InventoryModule } from "../../v3/modules/inventory/inventory.module";
import { FinanceModule } from "../../v3/modules/finance/finance.module";
import { ScrymeModule } from "../scryme/scryme.module";

@Module({
  imports: [DocumentModule, V3InventoryModule, FinanceModule, ScrymeModule],
  controllers: [InventoryController],
  providers: [
    InventoryService,
    PurchaseOrderUseCase,
    StockTransferUseCase,
    StockRequestUseCase,
  ],
  exports: [InventoryService],
})
export class InventoryModule {}
