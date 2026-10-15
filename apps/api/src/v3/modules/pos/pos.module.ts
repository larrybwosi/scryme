import { CrmModule } from "../crm/crm.module";
import { AutomationModule } from "../../../automation/automation.module";
import { Module, Global, forwardRef } from "@nestjs/common";
import { PrismaModule } from "../../../prisma/prisma.module";
import { PosController } from "./interfaces/http/pos.controller";
import { GlobalPosController } from "./interfaces/http/global-pos.controller";
import { PosPairingController } from "./interfaces/http/pos-pairing.controller";
import { PosPairingService } from "./application/services/pos-pairing.service";
import { V3PosService, PosService } from "./application/services/v3-pos.service";
import { V3PosSaleService, PosSaleService } from "./application/services/v3-pos-sale.service";
import { V3PosCustomerService, PosCustomerService } from "./application/services/v3-pos-customer.service";
import { ProcessSaleUseCase } from "./application/use-cases/process-sale.use-case";
import { SyncUseCase } from "./application/use-cases/sync.use-case";
import { GetTransactionsUseCase } from "./application/use-cases/get-transactions.use-case";
import { RegisterPettyCashUseCase } from "./application/use-cases/register-petty-cash.use-case";
import { InventoryModule } from "../inventory/inventory.module";
import { CatalogModule } from "../catalog/catalog.module";
import { LoyaltyModule } from "../loyalty/loyalty.module";
import { FinanceModule } from "../finance/finance.module";

@Global()
@Module({
  imports: [
    forwardRef(() => AutomationModule),
    PrismaModule,
    InventoryModule,
    CatalogModule,
    LoyaltyModule,
    FinanceModule,
    CrmModule,
  ],
  controllers: [PosController, GlobalPosController, PosPairingController],
  providers: [
    PosPairingService,
    V3PosService,
    PosService,
    V3PosSaleService,
    PosSaleService,
    V3PosCustomerService,
    PosCustomerService,
    ProcessSaleUseCase,
    SyncUseCase,
    GetTransactionsUseCase,
    RegisterPettyCashUseCase,
  ],
  exports: [
    PosPairingService,
    V3PosService,
    PosService,
    V3PosSaleService,
    PosSaleService,
    V3PosCustomerService,
    PosCustomerService,
    GetTransactionsUseCase,
    RegisterPettyCashUseCase,
  ],
})
export class PosModule {}
