import { Module } from "@nestjs/common";
import { SuppliersModule } from "@repo/suppliers/server";
import { CatalogController } from "./catalog.controller";
import { CatalogService } from "./catalog.service";
import { ApiRealtimeModule } from "../../common/services/realtime.module";
import { FavoritesController } from "./favorites.controller";
import { FavoritesService } from "./favorites.service";
import { ReviewsController } from "./reviews.controller";
import { ReviewsService } from "./reviews.service";
import { PrismaService } from "@/prisma/prisma.service";

@Module({
  imports: [SuppliersModule, ApiRealtimeModule],
  controllers: [CatalogController, FavoritesController, ReviewsController],
  providers: [
    CatalogService,
    FavoritesService,
    ReviewsService,
    {
      provide: "PRISMA_SERVICE",
      useExisting: PrismaService,
    },
  ],
})
export class CatalogModule {}
