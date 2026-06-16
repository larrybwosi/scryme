import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { IProductRepository } from './domain/repositories/product-repository.interface';
import { PrismaProductRepository } from './infrastructure/persistence/prisma-product.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: IProductRepository,
      useClass: PrismaProductRepository,
    },
  ],
  exports: [IProductRepository],
})
export class CatalogCoreModule {}
