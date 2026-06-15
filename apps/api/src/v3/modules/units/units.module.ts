import {Module} from "@nestjs/common";
import {UnitsController} from "./interfaces/controllers/units.controller";
import {GetUnitsUseCase} from "./application/use-cases/get-units.use-case";
import {PrismaUnitsRepository} from "./infrastructure/persistence/prisma-units.repository";

@Module({
  controllers: [UnitsController],
  providers: [
    GetUnitsUseCase,
    {
      provide: "IUnitsRepository",
      useClass: PrismaUnitsRepository,
    },
  ],
  exports: [GetUnitsUseCase],
})
export class UnitsModule {}
