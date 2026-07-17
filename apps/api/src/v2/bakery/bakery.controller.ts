import {
  Controller,
  Get,
  Query,
  Param,
  Post,
  Body,
  Patch,
  Delete,
  Put,
  Res,
  UsePipes,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { BakeryService } from "./bakery.service";
import { BakeryReportService } from "./reports/bakery-report.service";
import { v2Context } from "../../common/decorators/v2-context.decorator";
import {
  RequirePermission,
  AllowPublic,
} from "../../common/decorators/auth.decorator";
import type { V2ApiContext } from "@repo/shared/api/v2";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import {
  CreateRecipeSchema,
  UpdateRecipeSchema,
  CreateBatchSchema,
  UpdateBatchSchema,
  CompleteBatchSchema,
  CreateTemplateSchema,
  UpdateTemplateSchema,
  CreateBakeryCategorySchema,
  UpdateBakeryCategorySchema,
  UpdateBakerySettingsSchema,
  AddBakerSchema,
  UpdateBakerSchema,
  CreateDeliveryPartnerSchema,
  UpdateDeliveryPartnerSchema,
  AdjustPartnerWalletSchema,
  ReceiveIngredientsSchema,
  DispatchDeliverySchema,
  ReconcileDeliverySchema,
} from "./bakery.schema";

@ApiTags("Bakery")
@Controller("bakery")
export class BakeryController {
  constructor(
    private readonly bakeryService: BakeryService,
    private readonly bakeryReportService: BakeryReportService,
  ) {}

  @Get()
  @RequirePermission("bakery:batch:view")
  async getOverview(@v2Context() ctx: V2ApiContext) {
    return this.bakeryService.getBakeryOverview(ctx);
  }

  @Get("attendance/status")
  @RequirePermission("bakery:batch:view")
  async getAttendanceStatus(@v2Context() ctx: V2ApiContext) {
    return this.bakeryService.getAttendanceStatus(ctx);
  }

  // Ingredients
  @Get("ingredients")
  @RequirePermission("bakery:recipe:view")
  async getIngredients(@v2Context() ctx: V2ApiContext) {
    return this.bakeryService.getIngredients(ctx);
  }

  @Get("ingredients/records")
  @RequirePermission("bakery:recipe:view")
  async getIngredientRecords(@v2Context() ctx: V2ApiContext) {
    return this.bakeryService.getIngredientRecords(ctx);
  }

  // Recipes
  @Get("recipes")
  @RequirePermission("bakery:recipe:view")
  async getRecipes(@v2Context() ctx: V2ApiContext) {
    return this.bakeryService.getRecipes(ctx);
  }

  @Get("recipes/:id")
  @RequirePermission("bakery:recipe:view")
  async getRecipe(@v2Context() ctx: V2ApiContext, @Param("id") id: string) {
    return this.bakeryService.getRecipe(ctx, id);
  }

  @Post("recipes")
  @RequirePermission("bakery:recipe:manage")
  @UsePipes(new ZodValidationPipe(CreateRecipeSchema))
  async createRecipe(@v2Context() ctx: V2ApiContext, @Body() data: any) {
    return this.bakeryService.createRecipe(ctx, data);
  }

  @Patch("recipes/:id")
  @RequirePermission("bakery:recipe:manage")
  @UsePipes(new ZodValidationPipe(UpdateRecipeSchema))
  async updateRecipe(
    @v2Context() ctx: V2ApiContext,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.bakeryService.updateRecipe(ctx, id, data);
  }

  @Delete("recipes/:id")
  @RequirePermission("bakery:recipe:manage")
  async deleteRecipe(@v2Context() ctx: V2ApiContext, @Param("id") id: string) {
    return this.bakeryService.deleteRecipe(ctx, id);
  }

  @Post("recipes/:id/duplicate")
  @RequirePermission("bakery:recipe:manage")
  async duplicateRecipe(
    @v2Context() ctx: V2ApiContext,
    @Param("id") id: string,
  ) {
    return this.bakeryService.duplicateRecipe(ctx, id);
  }

  @Post("recipes/generate")
  @RequirePermission("bakery:recipe:manage")
  async generateRecipeAi(
    @v2Context() ctx: V2ApiContext,
    @Body("prompt") prompt: string,
  ) {
    return this.bakeryService.generateRecipeAi(ctx, prompt);
  }

  // Batches
  @Get("batches")
  @RequirePermission("bakery:batch:view")
  async getBatches(@v2Context() ctx: V2ApiContext, @Query() query: any) {
    return this.bakeryService.getBatches(ctx, query);
  }

  @Get("batches/:id")
  @RequirePermission("bakery:batch:view")
  async getBatch(@v2Context() ctx: V2ApiContext, @Param("id") id: string) {
    return this.bakeryService.getBatch(ctx, id);
  }

  @Get("batches/:id/traceability")
  @RequirePermission("bakery:batch:view")
  async getBatchTraceability(
    @v2Context() ctx: V2ApiContext,
    @Param("id") id: string,
  ) {
    return this.bakeryService.getBatchTraceability(ctx, id);
  }

  @Post("batches")
  @RequirePermission("bakery:batch:manage")
  @UsePipes(new ZodValidationPipe(CreateBatchSchema))
  async createBatch(@v2Context() ctx: V2ApiContext, @Body() data: any) {
    return this.bakeryService.createBatch(ctx, data);
  }

  @Patch("batches/:id")
  @RequirePermission("bakery:batch:manage")
  @UsePipes(new ZodValidationPipe(UpdateBatchSchema))
  async updateBatch(
    @v2Context() ctx: V2ApiContext,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.bakeryService.updateBatch(ctx, id, data);
  }

  @Delete("batches/:id")
  @RequirePermission("bakery:batch:manage")
  async deleteBatch(@v2Context() ctx: V2ApiContext, @Param("id") id: string) {
    return this.bakeryService.deleteBatch(ctx, id);
  }

  @Post("batches/:id/start")
  @RequirePermission("bakery:batch:manage")
  async startBatch(@v2Context() ctx: V2ApiContext, @Param("id") id: string) {
    return this.bakeryService.startBatch(ctx, id);
  }

  @Post("batches/:id/complete")
  @RequirePermission("bakery:batch:manage")
  @UsePipes(new ZodValidationPipe(CompleteBatchSchema))
  async completeBatch(
    @v2Context() ctx: V2ApiContext,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.bakeryService.completeBatch(ctx, id, data);
  }

  @Post("batches/:id/cancel")
  @RequirePermission("bakery:batch:manage")
  async cancelBatch(@v2Context() ctx: V2ApiContext, @Param("id") id: string) {
    return this.bakeryService.cancelBatch(ctx, id);
  }

  @Post("batches/:id/duplicate")
  @RequirePermission("bakery:batch:manage")
  async duplicateBatch(
    @v2Context() ctx: V2ApiContext,
    @Param("id") id: string,
  ) {
    return this.bakeryService.duplicateBatch(ctx, id);
  }

  // Templates
  @Get("templates")
  @RequirePermission("bakery:template:view")
  async getTemplates(@v2Context() ctx: V2ApiContext) {
    return this.bakeryService.getTemplates(ctx);
  }

  @Post("templates")
  @RequirePermission("bakery:template:manage")
  @UsePipes(new ZodValidationPipe(CreateTemplateSchema))
  async createTemplate(@v2Context() ctx: V2ApiContext, @Body() data: any) {
    return this.bakeryService.createTemplate(ctx, data);
  }

  @Patch("templates/:id")
  @RequirePermission("bakery:template:manage")
  @UsePipes(new ZodValidationPipe(UpdateTemplateSchema))
  async updateTemplate(
    @v2Context() ctx: V2ApiContext,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.bakeryService.updateTemplate(ctx, id, data);
  }

  @Delete("templates/:id")
  @RequirePermission("bakery:template:manage")
  async deleteTemplate(
    @v2Context() ctx: V2ApiContext,
    @Param("id") id: string,
  ) {
    return this.bakeryService.deleteTemplate(ctx, id);
  }

  @Post("templates/:id/duplicate")
  @RequirePermission("bakery:template:manage")
  async duplicateTemplate(
    @v2Context() ctx: V2ApiContext,
    @Param("id") id: string,
  ) {
    return this.bakeryService.duplicateTemplate(ctx, id);
  }

  @Post("templates/:id/create-batch")
  @RequirePermission("bakery:batch:manage")
  async createBatchFromTemplate(
    @v2Context() ctx: V2ApiContext,
    @Param("id") id: string,
  ) {
    return this.bakeryService.createBatchFromTemplate(ctx, id);
  }

  // Categories
  @Get("categories")
  @RequirePermission("bakery:recipe:view")
  async getCategories(@v2Context() ctx: V2ApiContext) {
    return this.bakeryService.getCategories(ctx);
  }

  @Get("categories/:id")
  @RequirePermission("bakery:recipe:view")
  async getCategory(@v2Context() ctx: V2ApiContext, @Param("id") id: string) {
    return this.bakeryService.getCategory(ctx, id);
  }

  @Post("categories")
  @RequirePermission("bakery:recipe:manage")
  @UsePipes(new ZodValidationPipe(CreateBakeryCategorySchema))
  async createCategory(@v2Context() ctx: V2ApiContext, @Body() data: any) {
    return this.bakeryService.createCategory(ctx, data);
  }

  @Put("categories/:id")
  @RequirePermission("bakery:recipe:manage")
  @UsePipes(new ZodValidationPipe(UpdateBakeryCategorySchema))
  async updateCategory(
    @v2Context() ctx: V2ApiContext,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.bakeryService.updateCategory(ctx, id, data);
  }

  @Delete("categories/:id")
  @RequirePermission("bakery:recipe:manage")
  async deleteCategory(
    @v2Context() ctx: V2ApiContext,
    @Param("id") id: string,
  ) {
    return this.bakeryService.deleteCategory(ctx, id);
  }

  // Settings & Bakers
  @Get("settings")
  @RequirePermission("bakery:settings:manage")
  async getSettings(@v2Context() ctx: V2ApiContext) {
    return this.bakeryService.getSettings(ctx);
  }

  @Put("settings")
  @RequirePermission("bakery:settings:manage")
  @UsePipes(new ZodValidationPipe(UpdateBakerySettingsSchema))
  async updateSettings(@v2Context() ctx: V2ApiContext, @Body() data: any) {
    return this.bakeryService.updateSettings(ctx, data);
  }

  @Post("settings/test-report")
  @RequirePermission("bakery:settings:manage")
  async testReport(@v2Context() ctx: V2ApiContext) {
    const { organizationId } = ctx;
    await this.bakeryReportService.generateAndSendReport(organizationId, 7);
    return { status: "success", message: "Test report triggered" };
  }

  @Get("bakers")
  @RequirePermission("bakery:settings:manage")
  async getBakers(@v2Context() ctx: V2ApiContext) {
    return this.bakeryService.getBakers(ctx);
  }

  @Post("bakers")
  @RequirePermission("bakery:settings:manage")
  @UsePipes(new ZodValidationPipe(AddBakerSchema))
  async addBaker(@v2Context() ctx: V2ApiContext, @Body() data: any) {
    return this.bakeryService.addBaker(ctx, data);
  }

  @Patch("bakers/:id")
  @RequirePermission("bakery:settings:manage")
  @UsePipes(new ZodValidationPipe(UpdateBakerSchema))
  async updateBaker(
    @v2Context() ctx: V2ApiContext,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.bakeryService.updateBaker(ctx, id, data);
  }

  @Delete("bakers/:id")
  @RequirePermission("bakery:settings:manage")
  async removeBaker(@v2Context() ctx: V2ApiContext, @Param("id") id: string) {
    return this.bakeryService.removeBaker(ctx, id);
  }

  // Delivery Partners & Tracking
  @Get("partners")
  @RequirePermission("bakery:batch:view")
  async getPartners(@v2Context() ctx: V2ApiContext) {
    return this.bakeryService.getPartners(ctx);
  }

  @Post("partners")
  @RequirePermission("bakery:batch:manage")
  @UsePipes(new ZodValidationPipe(CreateDeliveryPartnerSchema))
  async createPartner(@v2Context() ctx: V2ApiContext, @Body() data: any) {
    return this.bakeryService.createPartner(ctx, data);
  }

  @Get("partners/:id")
  @RequirePermission("bakery:batch:view")
  async getPartner(@v2Context() ctx: V2ApiContext, @Param("id") id: string) {
    return this.bakeryService.getPartner(ctx, id);
  }

  @Patch("partners/:id")
  @RequirePermission("bakery:batch:manage")
  @UsePipes(new ZodValidationPipe(UpdateDeliveryPartnerSchema))
  async updatePartner(
    @v2Context() ctx: V2ApiContext,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.bakeryService.updatePartner(ctx, id, data);
  }

  @Post("partners/:id/wallet/adjust")
  @RequirePermission("bakery:batch:manage")
  @UsePipes(new ZodValidationPipe(AdjustPartnerWalletSchema))
  async adjustPartnerWallet(
    @v2Context() ctx: V2ApiContext,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.bakeryService.adjustPartnerWallet(ctx, id, data);
  }

  @Post("deliveries/dispatch")
  @RequirePermission("bakery:batch:manage")
  @UsePipes(new ZodValidationPipe(DispatchDeliverySchema))
  async dispatchDelivery(@v2Context() ctx: V2ApiContext, @Body() data: any) {
    return this.bakeryService.dispatchDelivery(ctx, data);
  }

  @Post("deliveries/reconcile")
  @RequirePermission("bakery:batch:manage")
  @UsePipes(new ZodValidationPipe(ReconcileDeliverySchema))
  async reconcileDelivery(@v2Context() ctx: V2ApiContext, @Body() data: any) {
    return this.bakeryService.reconcileDelivery(ctx, data);
  }

  @Get("deliveries/active")
  @RequirePermission("bakery:batch:view")
  async getActiveDeliveries(@v2Context() ctx: V2ApiContext) {
    return this.bakeryService.getActiveDeliveries(ctx);
  }

  @Post("ingredients/receive")
  @RequirePermission("bakery:batch:manage")
  @UsePipes(new ZodValidationPipe(ReceiveIngredientsSchema))
  async receiveIngredients(@v2Context() ctx: V2ApiContext, @Body() data: any) {
    return this.bakeryService.receiveIngredients(ctx, data);
  }

  @Post("ingredients")
  @RequirePermission("bakery:recipe:manage")
  async createIngredient(@v2Context() ctx: V2ApiContext, @Body() data: any) {
    return this.bakeryService.createIngredient(ctx, data);
  }

  @Patch("ingredients/:id")
  @RequirePermission("bakery:recipe:manage")
  async updateIngredient(
    @v2Context() ctx: V2ApiContext,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.bakeryService.updateIngredient(ctx, id, data);
  }

  @Delete("ingredients/:id")
  @RequirePermission("bakery:recipe:manage")
  async deleteIngredient(
    @v2Context() ctx: V2ApiContext,
    @Param("id") id: string,
  ) {
    return this.bakeryService.deleteIngredient(ctx, id);
  }

  @AllowPublic()
  @Get("update/:target/:current_version")
  @ApiOperation({ summary: "Get latest update for Bakery app" })
  async getUpdate(
    @Param("target") target: string,
    @Param("current_version") currentVersion: string,
    @Res() res: any,
  ) {
    const update = await this.bakeryService.getUpdate(target, currentVersion);
    if (!update) {
      return res.status(204).send();
    }
    return res.status(200).send(update);
  }
}
