import {Module} from "@nestjs/common";
import {SetupTokensController} from "./setup-tokens.controller";

@Module({
  controllers: [SetupTokensController],
})
export class AdminModule {}
