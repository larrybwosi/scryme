import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { AuthModule } from "@/auth/auth.module";
import { AndroidController } from "./interfaces/http/android.controller";
import { AndroidUseCase } from "./application/use-cases/android.use-case";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AndroidController],
  providers: [AndroidUseCase],
  exports: [AndroidUseCase],
})
export class AndroidModule {}
