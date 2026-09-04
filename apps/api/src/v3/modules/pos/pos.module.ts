import { Module, Global, forwardRef } from "@nestjs/common";
import { PrismaModule } from "../../../prisma/prisma.module";
import { PosController } from "./interfaces/http/pos.controller";
import { GlobalPosController } from "./interfaces/http/global-pos.controller";
import { PosPairingController } from "./interfaces/http/pos-pairing.controller";
import { PosPairingService } from "./application/services/pos-pairing.service";
import { ProcessSaleUseCase } from "./application/use-cases/process-sale.use-case";
import { SyncUseCase } from "./application/use-cases/sync.use-case";
import { GetTransactionsUseCase } from "./application/use-cases/get-transactions.use-case";
import { RegisterPettyCashUseCase } from "./application/use-cases/register-petty-cash.use-case";
import { InventoryModule } from "../inventory/inventory.module";
import { CatalogModule } from "../catalog/catalog.module";
import { LoyaltyModule } from "../loyalty/loyalty.module";
import { PosModule as V2PosModule } from "../../../v2/pos/pos.module";
import { FinanceModule } from "../finance/finance.module";

@Global()
@Module({
  imports: [
    PrismaModule,
    InventoryModule,
    CatalogModule,
    LoyaltyModule,
    V2PosModule,
    FinanceModule,
  ],
  controllers: [PosController, GlobalPosController, PosPairingController],
  providers: [
    PosPairingService,
    ProcessSaleUseCase,
    SyncUseCase,
    GetTransactionsUseCase,
    RegisterPettyCashUseCase,
  ],
  exports: [
    PosPairingService,
    GetTransactionsUseCase,
    RegisterPettyCashUseCase,
  ],
})
export class PosModule {}
