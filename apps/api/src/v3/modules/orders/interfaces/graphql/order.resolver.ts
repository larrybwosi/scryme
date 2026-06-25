import { Resolver, Query, Args, Context } from "@nestjs/graphql";
import { UseGuards, UseInterceptors } from "@nestjs/common";
import { GetOrdersUseCase } from "../../application/use-cases/get-orders.use-case";
import { OrderType } from "./order.type";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";
import { PermissionsGuard } from "@/v3/common/guards/permissions.guard";
import { AuditInterceptor } from "../../../../common/interceptors/audit.interceptor";
import { Permissions } from "@/v3/common/decorators/permissions.decorator";

@Resolver(() => OrderType)
@UseGuards(MultiTenancyGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class OrderResolver {
  constructor(private readonly getOrdersUseCase: GetOrdersUseCase) {}

  @Query(() => [OrderType])
  @Permissions("order:read")
  async orders(@Args("orgSlug") orgSlug: string, @Context() ctx: any) {
    return this.getOrdersUseCase.execute(ctx.reply.request.organization.id, {
      limit: 100,
      offset: 0,
    });
  }
}
