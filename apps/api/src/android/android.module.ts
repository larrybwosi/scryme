import { Module } from "@nestjs/common";
import { AndroidController } from "./android.controller";
import { AndroidAuthGuard } from "./android.guard";
import { PrismaModule } from "@/prisma/prisma.module";
import { AuthModule } from "@/auth/auth.module";
import { MembersModule } from "../v3/modules/members/members.module";
import { FinanceModule } from "../v3/modules/finance/finance.module";
import { CatalogModule } from "../v3/modules/catalog/catalog.module";
import { InventoryModule } from "../v3/modules/inventory/inventory.module";
import { PosModule } from "../v3/modules/pos/pos.module";
import { ServicesModule } from "../v3/modules/services/services.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MembersModule,
    FinanceModule,
    CatalogModule,
    InventoryModule,
    PosModule,
    ServicesModule,
  ],
  controllers: [AndroidController],
  providers: [AndroidAuthGuard],
  exports: [AndroidAuthGuard],
})
export class AndroidModule {}
