import { Global, Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { FirebaseMessagingService } from "./firebase-messaging.service";

@Global()
@Module({
  imports: [PrismaModule],
  providers: [FirebaseMessagingService],
  exports: [FirebaseMessagingService],
})
export class FirebaseModule {}
