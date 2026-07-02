import { Module } from "@nestjs/common";
import { ImageController } from "./image.controller";
import { ImageService } from "./image.service";
import { ShortUrlController } from "./short-url.controller";
import { RedisModule } from "../../redis/redis.module";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [RedisModule, PrismaModule],
  controllers: [ImageController, ShortUrlController],
  providers: [ImageService],
  exports: [ImageService],
})
export class ImageModule {}
