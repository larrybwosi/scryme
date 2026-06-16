import { V3AuthModule } from "../auth/auth.module";
import { Module, Global } from "@nestjs/common";
import { ProductController } from "./interfaces/http/product.controller";
import { ProductResolver } from "./interfaces/graphql/product.resolver";
import { GetProductsUseCase } from "./application/use-cases/get-products.use-case";
import { CreateProductUseCase } from "./application/use-cases/create-product.use-case";
import { ReviewPriceChangeUseCase } from "./application/use-cases/review-price-change.use-case";
import { PrismaProductRepository } from "../catalog-core/infrastructure/persistence/prisma-product.repository";
import { IProductRepository } from "../catalog-core/domain/repositories/product-repository.interface";
import { PrismaModule } from "../../../prisma/prisma.module";
import { RedisModule } from "../../../redis/redis.module";
import { PricingResolverService } from "./application/services/pricing-resolver.service";
import { PricingManagementService } from "./application/services/pricing-management.service";
import { InventoryModule } from "../inventory/inventory.module";

@Global()
@Module({
  imports: [V3AuthModule, PrismaModule, RedisModule, InventoryModule],
  controllers: [ProductController],
  providers: [
    ProductResolver,
    GetProductsUseCase,
    CreateProductUseCase,
    ReviewPriceChangeUseCase,
    PricingResolverService,
    PricingManagementService,
    {
      provide: IProductRepository,
      useClass: PrismaProductRepository,
    },
  ],
  exports: [
    GetProductsUseCase,
    CreateProductUseCase,
    PricingResolverService,
    PricingManagementService,
  ],
})
export class CatalogModule {}
