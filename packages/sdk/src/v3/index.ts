import { ScrymeClient } from '../core/client';
import { InventoryModule } from './modules/inventory';
import { OrdersModule } from './modules/orders';
import { MembersModule } from './modules/members';

export class ScrymeV3 {
  public readonly inventory: InventoryModule;
  public readonly orders: OrdersModule;
  public readonly members: MembersModule;

  constructor(private readonly client: ScrymeClient) {
    this.inventory = new InventoryModule(client);
    this.orders = new OrdersModule(client);
    this.members = new MembersModule(client);
  }
}
