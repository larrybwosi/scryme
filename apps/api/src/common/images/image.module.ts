import { Module } from "@nestjs/common";
import { ImageController } from "./image.controller";
import { ImageService } from "./image.service";
import { ShortUrlController } from "./short-url.controller";
import { RedisModule } from "../../redis/redis.module";

@Module({
  imports: [RedisModule],
  controllers: [ImageController, ShortUrlController],
  providers: [ImageService],
  exports: [ImageService],
})
export class ImageModule {}
