import { Resolver, Query, Mutation, Args, Context } from "@nestjs/graphql";
import { UseGuards, UseInterceptors } from "@nestjs/common";
import { GetProductsUseCase } from "../../application/use-cases/get-products.use-case";
import { CreateProductUseCase } from "../../application/use-cases/create-product.use-case";
import { ProductType, CreateProductInput } from "./product.type";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";
import { PermissionsGuard } from "@/v3/common/guards/permissions.guard";
import { AuditInterceptor } from "@/v3/common/interceptors/audit.interceptor";
import { Permissions } from "@/v3/common/decorators/permissions.decorator";

@Resolver(() => ProductType)
@UseGuards(MultiTenancyGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class ProductResolver {
  constructor(
    private readonly getProductsUseCase: GetProductsUseCase,
    private readonly createProductUseCase: CreateProductUseCase,
  ) {}

  @Query(() => [ProductType])
  @Permissions("catalog:product:read")
  async products(@Args("orgSlug") orgSlug: string, @Context() ctx: any) {
    return this.getProductsUseCase.execute(ctx.reply.request.organization.id, {
      limit: 100,
      offset: 0,
    });
  }

  @Mutation(() => ProductType)
  @Permissions("catalog:product:create")
  async createProduct(
    @Args("input") input: CreateProductInput,
    @Context() ctx: any,
  ) {
    return this.createProductUseCase.execute({
      name: input.name,
      description: input.description,
      price: 0, // Fallback for schema alignment
      organizationId: ctx.reply.request.organization.id,
    });
  }
}
