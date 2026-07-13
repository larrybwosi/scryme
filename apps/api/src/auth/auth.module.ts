import { Module, Global } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { WellKnownController } from "./well-known.controller";
import { AuthService } from "./auth.service";

@Global()
@Module({
  controllers: [AuthController, WellKnownController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
