import { Module, Global } from "@nestjs/common";
import { SupplierService } from "./supplier.service";

@Global()
@Module({
  providers: [SupplierService],
  exports: [SupplierService],
})
export class SuppliersModule {}
