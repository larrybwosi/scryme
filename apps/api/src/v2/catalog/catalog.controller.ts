import { Controller, Get, Query, Param, Post, Body, Patch, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { v2Context } from '../../common/decorators/v2-context.decorator';
import { RequirePermission } from '../../common/decorators/auth.decorator';
import type { V2ApiContext } from '@repo/shared/server';

@ApiTags('Catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('products')
  @RequirePermission('product:read:all')
  async getProducts(@v2Context() ctx: V2ApiContext, @Query() query: any) {
    return this.catalogService.getProducts(ctx, query);
  }

  @Post('products')
  @RequirePermission('product:create')
  async createProduct(@v2Context() ctx: V2ApiContext, @Body() data: any) {
    return this.catalogService.createProduct(ctx, data);
  }

  @Get('products/:id')
  @RequirePermission('product:read:all')
  async getProduct(@v2Context() ctx: V2ApiContext, @Param('id') id: string) {
    return this.catalogService.getProduct(ctx, id);
  }

  @Patch('products/:id')
  @RequirePermission('product:update')
  async updateProduct(@v2Context() ctx: V2ApiContext, @Param('id') id: string, @Body() data: any) {
    return this.catalogService.updateProduct(ctx, id, data);
  }

  @Delete('products/:id')
  @RequirePermission('product:delete')
  async deleteProduct(@v2Context() ctx: V2ApiContext, @Param('id') id: string) {
    return this.catalogService.deleteProduct(ctx, id);
  }

  @Get('categories')
  @RequirePermission('product:read:all')
  async getCategories(@v2Context() ctx: V2ApiContext) {
    return this.catalogService.getCategories(ctx);
  }


  @Get('categories/:id')
  @RequirePermission('product:read:all')
  async getCategory(@v2Context() ctx: V2ApiContext, @Param('id') id: string) {
    return this.catalogService.getCategory(ctx, id);
  }

  @Patch('categories/:id')
  @RequirePermission('product:manage:categories')
  async updateCategory(@v2Context() ctx: V2ApiContext, @Param('id') id: string, @Body() data: any) {
    return this.catalogService.updateCategory(ctx, id, data);
  }

  @Delete('categories/:id')
  @RequirePermission('product:manage:categories')
  async deleteCategory(@v2Context() ctx: V2ApiContext, @Param('id') id: string) {
    return this.catalogService.deleteCategory(ctx, id);
  }

  @Get('variants')
  @RequirePermission('product:read:all')
  async getVariants(@v2Context() ctx: V2ApiContext, @Query() query: any) {
    return this.catalogService.getVariants(ctx, query);
  }

  @Get('suppliers')
  @RequirePermission('product:read:all')
  async getSuppliers(@v2Context() ctx: V2ApiContext) {
    return this.catalogService.getSuppliers(ctx);
  }

  @Get('suppliers/:id')
  @RequirePermission('product:read:all')
  async getSupplier(@v2Context() ctx: V2ApiContext, @Param('id') id: string) {
    return this.catalogService.getSupplier(ctx, id);
  }

  @Post('suppliers/:id/documents')
  @RequirePermission('product:update')
  async createSupplierDocument(@v2Context() ctx: V2ApiContext, @Param('id') id: string, @Body() data: any) {
    return this.catalogService.createSupplierDocument(ctx, id, data);
  }

  @Get('quality-incidents')
  @RequirePermission('bakery:batch:view')
  async getQualityIncidents(@v2Context() ctx: V2ApiContext, @Query() query: any) {
    return this.catalogService.getQualityIncidents(ctx, query);
  }

  @Post('quality-incidents')
  @RequirePermission('bakery:batch:manage')
  async createQualityIncident(@v2Context() ctx: V2ApiContext, @Body() data: any) {
    return this.catalogService.createQualityIncident(ctx, data);
  }

  @Get('recalls')
  @RequirePermission('product:read:all')
  async getRecalls(@v2Context() ctx: V2ApiContext) {
    return this.catalogService.getRecalls(ctx);
  }

  @Post('recalls')
  @RequirePermission('product:update')
  async initiateRecall(@v2Context() ctx: V2ApiContext, @Body() data: any) {
    return this.catalogService.initiateRecall(ctx, data);
  }

  @Get('recalls/:id')
  @RequirePermission('product:read:all')
  async getRecallImpact(@v2Context() ctx: V2ApiContext, @Param('id') id: string) {
    return this.catalogService.getRecallImpact(ctx, id);
  }
}
