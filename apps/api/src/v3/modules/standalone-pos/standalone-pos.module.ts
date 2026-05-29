import { V3AuthModule } from '../auth/auth.module';
import { Module, Global, forwardRef } from '@nestjs/common';
import { StandalonePosController } from './interfaces/http/standalone-pos.controller';
import { StandalonePosService } from './infrastructure/services/standalone-pos.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [forwardRef(() => V3AuthModule), PrismaModule, AuthModule],
  controllers: [StandalonePosController],
  providers: [StandalonePosService],
  exports: [StandalonePosService],
})
export class StandalonePosModule {}
