import {V3AuthModule} from "../auth/auth.module";
import {Module, Global, forwardRef} from "@nestjs/common";
import {B2BController} from "./interfaces/controllers/b2b.controller";
import {B2BUseCase} from "./application/use-cases/b2b.use-case";
import {PrismaModule} from "@/prisma/prisma.module";

@Module({
  imports: [forwardRef(() => V3AuthModule), PrismaModule],
  controllers: [B2BController],
  providers: [B2BUseCase],
  exports: [B2BUseCase],
})
export class B2BModule {}
