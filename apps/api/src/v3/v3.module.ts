import {B2BModule} from "./modules/b2b/b2b.module";
import {Module} from "@nestjs/common";
import {CatalogModule} from "./modules/catalog/catalog.module";
import {CustomersModule} from "./modules/customers/customers.module";
import {InventoryModule} from "./modules/inventory/inventory.module";
import {OrdersModule} from "./modules/orders/orders.module";
import {PaymentsModule} from "./modules/payments/payments.module";
import {V3CommonModule} from "./common/v3-common.module";
import {V3AuthModule} from "./modules/auth/auth.module";
import {WebhooksModule} from "./modules/webhooks/webhooks.module";
import {PosModule} from "./modules/pos/pos.module";
import {LoyaltyModule} from "./modules/loyalty/loyalty.module";
import {MembersModule} from "./modules/members/members.module";
import {EcommerceCartModule} from "./modules/ecommerce-cart/ecommerce-cart.module";
import {FavoritesModule} from "./modules/favorites/favorites.module";
import {StockingModule} from "./modules/stocking/stocking.module";
import {CrmModule} from "./modules/crm/crm.module";
import {FinanceModule} from "./modules/finance/finance.module";
import {StandalonePosModule} from "./modules/standalone-pos/standalone-pos.module";
import {CrmIntegrationsModule} from "./modules/crm-integrations/crm-integrations.module";
import {UnitsModule} from "./modules/units/units.module";

export const V3_SUB_MODULES = [
  V3CommonModule,
  V3AuthModule,
  WebhooksModule,
  CatalogModule,
  CustomersModule,
  InventoryModule,
  OrdersModule,
  PaymentsModule,
  PosModule,
  LoyaltyModule,
  MembersModule,
  EcommerceCartModule,
  FavoritesModule,
  StockingModule,
  CrmModule,
  FinanceModule,
  StandalonePosModule,
  B2BModule,
  CrmIntegrationsModule,
  UnitsModule,
];

@Module({
  imports: V3_SUB_MODULES,
  controllers: [],
  providers: [],
})
export class V3Module {}
