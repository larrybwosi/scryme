import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { AuthModule } from "@/auth/auth.module";
import { AndroidController } from "./interfaces/http/android.controller";
import { AndroidAuthController } from "./interfaces/http/android-auth.controller";
import { AndroidMembersController } from "./interfaces/http/android-members.controller";
import { AndroidShiftsController } from "./interfaces/http/android-shifts.controller";
import { AndroidBranchController } from "./interfaces/http/android-branch.controller";
import { AndroidPosController } from "./interfaces/http/android-pos.controller";
import { AndroidUseCase } from "./application/use-cases/android.use-case";
import { AndroidAuthUseCase } from "./application/use-cases/android-auth.use-case";
import { AndroidMembersUseCase } from "./application/use-cases/android-members.use-case";
import { AndroidShiftsUseCase } from "./application/use-cases/android-shifts.use-case";
import { AndroidBranchUseCase } from "./application/use-cases/android-branch.use-case";
import { AndroidPosUseCase } from "./application/use-cases/android-pos.use-case";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    AndroidController,
    AndroidAuthController,
    AndroidMembersController,
    AndroidShiftsController,
    AndroidBranchController,
    AndroidPosController,
  ],
  providers: [
    AndroidUseCase,
    AndroidAuthUseCase,
    AndroidMembersUseCase,
    AndroidShiftsUseCase,
    AndroidBranchUseCase,
    AndroidPosUseCase,
  ],
  exports: [
    AndroidUseCase,
    AndroidAuthUseCase,
    AndroidMembersUseCase,
    AndroidShiftsUseCase,
    AndroidBranchUseCase,
    AndroidPosUseCase,
  ],
})
export class AndroidModule {}
