import { Resolver, Query, Args, Context } from "@nestjs/graphql";
import { UseGuards, UseInterceptors } from "@nestjs/common";
import { GetCustomersUseCase } from "../../application/use-cases/get-customers.use-case";
import { CustomerType } from "./customer.type";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";
import { PermissionsGuard } from "@/v3/common/guards/permissions.guard";
import { AuditInterceptor } from "@/v3/common/interceptors/audit.interceptor";
import { Permissions } from "@/v3/common/decorators/permissions.decorator";

@Resolver(() => CustomerType)
@UseGuards(MultiTenancyGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class CustomerResolver {
  constructor(private readonly getCustomersUseCase: GetCustomersUseCase) {}

  @Query(() => [CustomerType])
  @Permissions("customer:read")
  async customers(@Args("orgSlug") orgSlug: string, @Context() ctx: any) {
    return this.getCustomersUseCase.execute(ctx.reply.request.organization.id, {
      limit: 100,
      offset: 0,
    });
  }
}
