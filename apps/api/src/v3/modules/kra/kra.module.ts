import { Module } from "@nestjs/common";
import { V3CommonModule } from "../../common/v3-common.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { KraController } from "./interfaces/http/kra.controller";
import { KraUseCase } from "./application/use-cases/kra.use-case";

@Module({
  imports: [V3CommonModule, PrismaModule],
  controllers: [KraController],
  providers: [KraUseCase],
  exports: [KraUseCase],
})
export class KraModule {}
