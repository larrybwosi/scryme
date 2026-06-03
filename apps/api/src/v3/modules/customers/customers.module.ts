import { V3AuthModule } from "../auth/auth.module";
import { Module, forwardRef } from "@nestjs/common";
import { CustomerController } from "./interfaces/http/customer.controller";
import { CustomerResolver } from "./interfaces/graphql/customer.resolver";
import { GetCustomersUseCase } from "./application/use-cases/get-customers.use-case";
import { RegisterCustomerUseCase } from "./application/use-cases/register-customer.use-case";
import { UpdateCustomerUseCase } from "./application/use-cases/update-customer.use-case";
import { PrismaCustomerRepository } from "./infrastructure/persistence/prisma-customer.repository";
import { ICustomerRepository } from "./domain/repositories/customer-repository.interface";
import { PrismaModule } from "@/prisma/prisma.module";
import { RedisModule } from "@/redis/redis.module";
import { BusinessAccountController } from "./interfaces/http/business-account.controller";
import { BusinessAccountService } from "./application/use-cases/business-account.service";
import { CrmModule } from "../crm/crm.module";

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    forwardRef(() => V3AuthModule),
    CrmModule,
  ],
  controllers: [CustomerController, BusinessAccountController],
  providers: [
    CustomerResolver,
    GetCustomersUseCase,
    RegisterCustomerUseCase,
    UpdateCustomerUseCase,
    BusinessAccountService,
    {
      provide: ICustomerRepository,
      useClass: PrismaCustomerRepository,
    },
  ],
  exports: [
    GetCustomersUseCase,
    RegisterCustomerUseCase,
    UpdateCustomerUseCase,
    BusinessAccountService,
    ICustomerRepository,
  ],
})
export class CustomersModule {}
