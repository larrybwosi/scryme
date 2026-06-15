import {V3AuthModule} from "../auth/auth.module";
import {Module, Global, forwardRef} from "@nestjs/common";
import {FavoritesController} from "./interfaces/http/favorites.controller";
import {FavoritesUseCase} from "./application/use-cases/favorites.use-case";
import {PrismaModule} from "../../../prisma/prisma.module";

@Module({
  imports: [forwardRef(() => V3AuthModule)],
  controllers: [FavoritesController],
  providers: [FavoritesUseCase],
  exports: [FavoritesUseCase],
})
export class FavoritesModule {}
