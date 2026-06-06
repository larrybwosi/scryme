import { V3AuthModule } from '../auth/auth.module';
import { Module, Global, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { PosController } from './interfaces/http/pos.controller';
import { ProcessSaleUseCase } from './application/use-cases/process-sale.use-case';
import { SyncUseCase } from './application/use-cases/sync.use-case';
import { GetTransactionsUseCase } from './application/use-cases/get-transactions.use-case';
import { RegisterPettyCashUseCase } from './application/use-cases/register-petty-cash.use-case';
import { InventoryModule } from '../inventory/inventory.module';
import { CatalogModule } from '../catalog/catalog.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { PosModule as V2PosModule } from '../../../v2/pos/pos.module';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [forwardRef(() => V3AuthModule), PrismaModule, InventoryModule, CatalogModule, LoyaltyModule, V2PosModule, FinanceModule],
  controllers: [PosController],
  providers: [ProcessSaleUseCase, SyncUseCase, GetTransactionsUseCase, RegisterPettyCashUseCase],
})
export class PosModule {}
