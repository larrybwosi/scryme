import { Module } from "@nestjs/common";
import { PrismaModule } from "../../../prisma/prisma.module";
import { CommonModule } from "../../../common/common.module";
import { ShiftsUseCase } from "./application/use-cases/shifts.use-case";
import { SchedulingUseCase } from "./application/use-cases/scheduling.use-case";
import { ShiftsController } from "./interfaces/http/shifts.controller";
import { SchedulingController } from "./interfaces/http/scheduling.controller";

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [ShiftsController, SchedulingController],
  providers: [ShiftsUseCase, SchedulingUseCase],
  exports: [ShiftsUseCase, SchedulingUseCase],
})
export class SchedulingModule {}
