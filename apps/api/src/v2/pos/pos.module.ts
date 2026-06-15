import {Module} from "@nestjs/common";
import {PosController} from "./pos.controller";
import {PosService} from "./pos.service";
import {PosSaleService} from "./pos-sale.service";
import {InventoryModule} from "../inventory/inventory.module";
import {PosCustomerService} from "./pos-customer.service";

@Module({
  imports: [InventoryModule],
  controllers: [PosController],
  providers: [PosService, PosSaleService, PosCustomerService],
  exports: [PosCustomerService, PosService],
})
export class PosModule {}
