import { Global, Module } from '@nestjs/common';
import { OpenObserveService } from './services/openobserve.service';

@Global()
@Module({
  providers: [OpenObserveService],
  exports: [OpenObserveService],
})
export class CommonModule {}
