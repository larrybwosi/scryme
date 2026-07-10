import { Module, Global, forwardRef } from "@nestjs/common";
import { B2BController } from "./interfaces/controllers/b2b.controller";
import { B2BUseCase } from "./application/use-cases/b2b.use-case";
import { PrismaModule } from "@/prisma/prisma.module";
import { CatalogModule } from "../catalog/catalog.module";

@Module({
  imports: [PrismaModule, CatalogModule],
  controllers: [B2BController],
  providers: [B2BUseCase],
  exports: [B2BUseCase],
})
export class B2BModule {}
