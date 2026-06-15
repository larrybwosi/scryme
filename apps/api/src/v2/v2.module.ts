import {Module} from "@nestjs/common";
import {BakeryModule} from "./bakery/bakery.module";
import {CatalogModule} from "./catalog/catalog.module";
import {InventoryModule} from "./inventory/inventory.module";
import {PosModule} from "./pos/pos.module";
import {MembersModule} from "./members/members.module";
import {CustomersModule} from "./customers/customers.module";
import {OrdersModule} from "./orders/orders.module";
import {PaymentsModule} from "./payments/payments.module";
import {UsersModule} from "./users/users.module";
import {AnalyticsModule} from "./analytics/analytics.module";
import {RealtimeModule} from "./realtime/realtime.module";
import {DevicesModule} from "./devices/devices.module";
import {AdminModule} from "./admin/admin.module";
import {HealthModule} from "./health/health.module";
import {OAuthModule} from "./oauth/oauth.module";
import {PublicModule} from "./public/public.module";
import {UnitsModule} from "./units/units.module";
import {WorkflowsModule} from "./workflows/workflows.module";
import {ScrymeModule} from "./scryme/scryme.module";

export const V2_SUB_MODULES = [
  BakeryModule,
  CatalogModule,
  InventoryModule,
  PosModule,
  MembersModule,
  CustomersModule,
  OrdersModule,
  PaymentsModule,
  UsersModule,
  AnalyticsModule,
  RealtimeModule,
  DevicesModule,
  AdminModule,
  HealthModule,
  OAuthModule,
  PublicModule,
  UnitsModule,
  WorkflowsModule,
  ScrymeModule,
];

@Module({
  imports: V2_SUB_MODULES,
})
export class V2Module {}
