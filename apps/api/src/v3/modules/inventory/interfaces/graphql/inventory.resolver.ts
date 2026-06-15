import {Resolver, Query, Args, Context} from "@nestjs/graphql";
import {UseGuards, UseInterceptors} from "@nestjs/common";
import {GetInventoryUseCase} from "../../application/use-cases/get-inventory.use-case";
import {InventoryItemType} from "./inventory-item.type";
import {MultiTenancyGuard} from "@/v3/common/guards/multi-tenancy.guard";
import {PermissionsGuard} from "@/v3/common/guards/permissions.guard";
import {AuditInterceptor} from "../../../../common/interceptors/audit.interceptor";
import {Permissions} from "@/v3/common/decorators/permissions.decorator";

@Resolver(() => InventoryItemType)
@UseGuards(MultiTenancyGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class InventoryResolver {
  constructor(private readonly getInventoryUseCase: GetInventoryUseCase) {}

  @Query(() => [InventoryItemType])
  @Permissions("inventory:read")
  async inventory(@Args("orgSlug") orgSlug: string, @Context() ctx: any) {
    return this.getInventoryUseCase.execute(ctx.reply.request.organization.id, {
      limit: 100,
      offset: 0,
    });
  }
}
