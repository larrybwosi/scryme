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
  UseGuards,
  UseInterceptors,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth } from "@nestjs/swagger";
import { BakeryService } from "@/v2/bakery/bakery.service";
import { BakeryReportService } from "@/v2/bakery/reports/bakery-report.service";
import { v3Context } from "@/v3/common/decorators/v3-context.decorator";
import { type V3ApiContext, type V2ApiContext } from "@repo/shared/api/v2";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";
import { PermissionsGuard } from "@/v3/common/guards/permissions.guard";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import { AllowPublic } from "@/v3/common/auth";
import { Permissions } from "@/v3/common/decorators/permissions.decorator";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";
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
} from "@/v2/bakery/bakery.schema";

@ApiTags("V3 Bakery")
@ApiBearerAuth()
@Controller([":orgSlug/bakery", "bakery"])
@ApiParam({ name: "orgSlug", type: "string", required: false })
@UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
@UseInterceptors(StandardResponseInterceptor)
export class V3BakeryController {
  constructor(
    private readonly bakeryService: BakeryService,
    private readonly bakeryReportService: BakeryReportService,
  ) {}

  @Get()
  @Get("overview")
  @Permissions("bakery:batch:view")
  @ApiOperation({ summary: "Get bakery overview" })
  async getOverview(@v3Context() ctx: V3ApiContext) {
    return this.bakeryService.getBakeryOverview(ctx as unknown as V2ApiContext);
  }

  @Get("attendance/status")
  @Permissions("bakery:batch:view")
  @ApiOperation({ summary: "Get bakery attendance status" })
  async getAttendanceStatus(@v3Context() ctx: V3ApiContext) {
    return this.bakeryService.getAttendanceStatus(ctx as unknown as V2ApiContext);
  }

  // Ingredients
  @Get("ingredients")
  @Permissions("bakery:recipe:view")
  @ApiOperation({ summary: "Get bakery ingredients" })
  async getIngredients(@v3Context() ctx: V3ApiContext) {
    return this.bakeryService.getIngredients(ctx as unknown as V2ApiContext);
  }

  @Get("ingredients/records")
  @Permissions("bakery:recipe:view")
  @ApiOperation({ summary: "Get bakery ingredient records" })
  async getIngredientRecords(@v3Context() ctx: V3ApiContext) {
    return this.bakeryService.getIngredientRecords(ctx as unknown as V2ApiContext);
  }

  // Recipes
  @Get("recipes")
  @Permissions("bakery:recipe:view")
  @ApiOperation({ summary: "List bakery recipes" })
  async getRecipes(@v3Context() ctx: V3ApiContext) {
    return this.bakeryService.getRecipes(ctx as unknown as V2ApiContext);
  }

  @Get("recipes/:id")
  @Permissions("bakery:recipe:view")
  @ApiOperation({ summary: "Get single recipe by ID" })
  async getRecipe(@v3Context() ctx: V3ApiContext, @Param("id") id: string) {
    return this.bakeryService.getRecipe(ctx as unknown as V2ApiContext, id);
  }

  @Post("recipes")
  @Permissions("bakery:recipe:manage")
  @UsePipes(new ZodValidationPipe(CreateRecipeSchema))
  @ApiOperation({ summary: "Create a new recipe" })
  async createRecipe(@v3Context() ctx: V3ApiContext, @Body() data: any) {
    return this.bakeryService.createRecipe(ctx as unknown as V2ApiContext, data);
  }

  @Patch("recipes/:id")
  @Permissions("bakery:recipe:manage")
  @UsePipes(new ZodValidationPipe(UpdateRecipeSchema))
  @ApiOperation({ summary: "Update a recipe" })
  async updateRecipe(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.bakeryService.updateRecipe(ctx as unknown as V2ApiContext, id, data);
  }

  @Delete("recipes/:id")
  @Permissions("bakery:recipe:manage")
  @ApiOperation({ summary: "Delete a recipe" })
  async deleteRecipe(@v3Context() ctx: V3ApiContext, @Param("id") id: string) {
    return this.bakeryService.deleteRecipe(ctx as unknown as V2ApiContext, id);
  }

  @Post("recipes/:id/duplicate")
  @Permissions("bakery:recipe:manage")
  @ApiOperation({ summary: "Duplicate a recipe" })
  async duplicateRecipe(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
  ) {
    return this.bakeryService.duplicateRecipe(ctx as unknown as V2ApiContext, id);
  }

  @Post("recipes/generate")
  @Permissions("bakery:recipe:manage")
  @ApiOperation({ summary: "Generate recipe with AI" })
  async generateRecipeAi(
    @v3Context() ctx: V3ApiContext,
    @Body("prompt") prompt: string,
  ) {
    return this.bakeryService.generateRecipeAi(ctx as unknown as V2ApiContext, prompt);
  }

  // Batches
  @Get("batches")
  @Permissions("bakery:batch:view")
  @ApiOperation({ summary: "List bakery batches" })
  async getBatches(@v3Context() ctx: V3ApiContext, @Query() query: any) {
    return this.bakeryService.getBatches(ctx as unknown as V2ApiContext, query);
  }

  @Get("batches/:id")
  @Permissions("bakery:batch:view")
  @ApiOperation({ summary: "Get single batch details" })
  async getBatch(@v3Context() ctx: V3ApiContext, @Param("id") id: string) {
    return this.bakeryService.getBatch(ctx as unknown as V2ApiContext, id);
  }

  @Get("batches/:id/traceability")
  @Permissions("bakery:batch:view")
  @ApiOperation({ summary: "Get batch traceability report" })
  async getBatchTraceability(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
  ) {
    return this.bakeryService.getBatchTraceability(ctx as unknown as V2ApiContext, id);
  }

  @Post("batches")
  @Permissions("bakery:batch:manage")
  @UsePipes(new ZodValidationPipe(CreateBatchSchema))
  @ApiOperation({ summary: "Create a new production batch" })
  async createBatch(@v3Context() ctx: V3ApiContext, @Body() data: any) {
    return this.bakeryService.createBatch(ctx as unknown as V2ApiContext, data);
  }

  @Patch("batches/:id")
  @Permissions("bakery:batch:manage")
  @UsePipes(new ZodValidationPipe(UpdateBatchSchema))
  @ApiOperation({ summary: "Update batch details" })
  async updateBatch(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.bakeryService.updateBatch(ctx as unknown as V2ApiContext, id, data);
  }

  @Delete("batches/:id")
  @Permissions("bakery:batch:manage")
  @ApiOperation({ summary: "Delete a batch" })
  async deleteBatch(@v3Context() ctx: V3ApiContext, @Param("id") id: string) {
    return this.bakeryService.deleteBatch(ctx as unknown as V2ApiContext, id);
  }

  @Post("batches/:id/start")
  @Permissions("bakery:batch:manage")
  @ApiOperation({ summary: "Start a production batch" })
  async startBatch(@v3Context() ctx: V3ApiContext, @Param("id") id: string) {
    return this.bakeryService.startBatch(ctx as unknown as V2ApiContext, id);
  }

  @Post("batches/:id/complete")
  @Permissions("bakery:batch:manage")
  @UsePipes(new ZodValidationPipe(CompleteBatchSchema))
  @ApiOperation({ summary: "Complete a production batch" })
  async completeBatch(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.bakeryService.completeBatch(ctx as unknown as V2ApiContext, id, data);
  }

  @Post("batches/:id/cancel")
  @Permissions("bakery:batch:manage")
  @ApiOperation({ summary: "Cancel a batch" })
  async cancelBatch(@v3Context() ctx: V3ApiContext, @Param("id") id: string) {
    return this.bakeryService.cancelBatch(ctx as unknown as V2ApiContext, id);
  }

  @Post("batches/:id/duplicate")
  @Permissions("bakery:batch:manage")
  @ApiOperation({ summary: "Duplicate a batch" })
  async duplicateBatch(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
  ) {
    return this.bakeryService.duplicateBatch(ctx as unknown as V2ApiContext, id);
  }

  // Templates
  @Get("templates")
  @Permissions("bakery:template:view")
  @ApiOperation({ summary: "List bakery templates" })
  async getTemplates(@v3Context() ctx: V3ApiContext) {
    return this.bakeryService.getTemplates(ctx as unknown as V2ApiContext);
  }

  @Post("templates")
  @Permissions("bakery:template:manage")
  @UsePipes(new ZodValidationPipe(CreateTemplateSchema))
  @ApiOperation({ summary: "Create a template" })
  async createTemplate(@v3Context() ctx: V3ApiContext, @Body() data: any) {
    return this.bakeryService.createTemplate(ctx as unknown as V2ApiContext, data);
  }

  @Patch("templates/:id")
  @Permissions("bakery:template:manage")
  @UsePipes(new ZodValidationPipe(UpdateTemplateSchema))
  @ApiOperation({ summary: "Update a template" })
  async updateTemplate(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.bakeryService.updateTemplate(ctx as unknown as V2ApiContext, id, data);
  }

  @Delete("templates/:id")
  @Permissions("bakery:template:manage")
  @ApiOperation({ summary: "Delete a template" })
  async deleteTemplate(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
  ) {
    return this.bakeryService.deleteTemplate(ctx as unknown as V2ApiContext, id);
  }

  @Post("templates/:id/duplicate")
  @Permissions("bakery:template:manage")
  @ApiOperation({ summary: "Duplicate a template" })
  async duplicateTemplate(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
  ) {
    return this.bakeryService.duplicateTemplate(ctx as unknown as V2ApiContext, id);
  }

  @Post("templates/:id/create-batch")
  @Permissions("bakery:batch:manage")
  @ApiOperation({ summary: "Create a batch from template" })
  async createBatchFromTemplate(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
  ) {
    return this.bakeryService.createBatchFromTemplate(ctx as unknown as V2ApiContext, id);
  }

  // Categories / Classifications
  @Get("categories")
  @Permissions("bakery:recipe:view")
  @ApiOperation({ summary: "List bakery categories/classifications" })
  async getCategories(@v3Context() ctx: V3ApiContext) {
    return this.bakeryService.getCategories(ctx as unknown as V2ApiContext);
  }

  @Get("categories/:id")
  @Permissions("bakery:recipe:view")
  @ApiOperation({ summary: "Get single category by ID" })
  async getCategory(@v3Context() ctx: V3ApiContext, @Param("id") id: string) {
    return this.bakeryService.getCategory(ctx as unknown as V2ApiContext, id);
  }

  @Post("categories")
  @Permissions("bakery:recipe:manage")
  @UsePipes(new ZodValidationPipe(CreateBakeryCategorySchema))
  @ApiOperation({ summary: "Create a new bakery category/classification" })
  async createCategory(@v3Context() ctx: V3ApiContext, @Body() data: any) {
    return this.bakeryService.createCategory(ctx as unknown as V2ApiContext, data);
  }

  @Put("categories/:id")
  @Patch("categories/:id")
  @Permissions("bakery:recipe:manage")
  @UsePipes(new ZodValidationPipe(UpdateBakeryCategorySchema))
  @ApiOperation({ summary: "Update a bakery category/classification" })
  async updateCategory(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.bakeryService.updateCategory(ctx as unknown as V2ApiContext, id, data);
  }

  @Delete("categories/:id")
  @Permissions("bakery:recipe:manage")
  @ApiOperation({ summary: "Delete a bakery category/classification" })
  async deleteCategory(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
  ) {
    return this.bakeryService.deleteCategory(ctx as unknown as V2ApiContext, id);
  }

  // Settings & Bakers
  @Get("settings")
  @Permissions("bakery:settings:manage")
  @ApiOperation({ summary: "Get bakery settings" })
  async getSettings(@v3Context() ctx: V3ApiContext) {
    return this.bakeryService.getSettings(ctx as unknown as V2ApiContext);
  }

  @Put("settings")
  @Patch("settings")
  @Permissions("bakery:settings:manage")
  @UsePipes(new ZodValidationPipe(UpdateBakerySettingsSchema))
  @ApiOperation({ summary: "Update bakery settings" })
  async updateSettings(@v3Context() ctx: V3ApiContext, @Body() data: any) {
    return this.bakeryService.updateSettings(ctx as unknown as V2ApiContext, data);
  }

  @Post("settings/test-report")
  @Permissions("bakery:settings:manage")
  @ApiOperation({ summary: "Trigger test bakery report" })
  async testReport(@v3Context() ctx: V3ApiContext) {
    const { organizationId } = ctx;
    await this.bakeryReportService.generateAndSendReport(organizationId, 7);
    return { status: "success", message: "Test report triggered" };
  }

  @Get("bakers")
  @Permissions("bakery:settings:manage")
  @ApiOperation({ summary: "List bakers" })
  async getBakers(@v3Context() ctx: V3ApiContext) {
    return this.bakeryService.getBakers(ctx as unknown as V2ApiContext);
  }

  @Post("bakers")
  @Permissions("bakery:settings:manage")
  @UsePipes(new ZodValidationPipe(AddBakerSchema))
  @ApiOperation({ summary: "Add a new baker" })
  async addBaker(@v3Context() ctx: V3ApiContext, @Body() data: any) {
    return this.bakeryService.addBaker(ctx as unknown as V2ApiContext, data);
  }

  @Patch("bakers/:id")
  @Permissions("bakery:settings:manage")
  @UsePipes(new ZodValidationPipe(UpdateBakerSchema))
  @ApiOperation({ summary: "Update baker details" })
  async updateBaker(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.bakeryService.updateBaker(ctx as unknown as V2ApiContext, id, data);
  }

  @Delete("bakers/:id")
  @Permissions("bakery:settings:manage")
  @ApiOperation({ summary: "Remove a baker" })
  async removeBaker(@v3Context() ctx: V3ApiContext, @Param("id") id: string) {
    return this.bakeryService.removeBaker(ctx as unknown as V2ApiContext, id);
  }

  // Delivery Partners & Tracking
  @Get("partners")
  @Permissions("bakery:batch:view")
  @ApiOperation({ summary: "List delivery partners" })
  async getPartners(@v3Context() ctx: V3ApiContext) {
    return this.bakeryService.getPartners(ctx as unknown as V2ApiContext);
  }

  @Post("partners")
  @Permissions("bakery:batch:manage")
  @UsePipes(new ZodValidationPipe(CreateDeliveryPartnerSchema))
  @ApiOperation({ summary: "Create delivery partner" })
  async createPartner(@v3Context() ctx: V3ApiContext, @Body() data: any) {
    return this.bakeryService.createPartner(ctx as unknown as V2ApiContext, data);
  }

  @Get("partners/:id")
  @Permissions("bakery:batch:view")
  @ApiOperation({ summary: "Get single partner details" })
  async getPartner(@v3Context() ctx: V3ApiContext, @Param("id") id: string) {
    return this.bakeryService.getPartner(ctx as unknown as V2ApiContext, id);
  }

  @Patch("partners/:id")
  @Permissions("bakery:batch:manage")
  @UsePipes(new ZodValidationPipe(UpdateDeliveryPartnerSchema))
  @ApiOperation({ summary: "Update delivery partner details" })
  async updatePartner(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.bakeryService.updatePartner(ctx as unknown as V2ApiContext, id, data);
  }

  @Post("partners/:id/wallet/adjust")
  @Permissions("bakery:batch:manage")
  @UsePipes(new ZodValidationPipe(AdjustPartnerWalletSchema))
  @ApiOperation({ summary: "Adjust partner wallet balance" })
  async adjustPartnerWallet(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.bakeryService.adjustPartnerWallet(ctx as unknown as V2ApiContext, id, data);
  }

  @Post("deliveries/dispatch")
  @Permissions("bakery:batch:manage")
  @UsePipes(new ZodValidationPipe(DispatchDeliverySchema))
  @ApiOperation({ summary: "Dispatch a delivery" })
  async dispatchDelivery(@v3Context() ctx: V3ApiContext, @Body() data: any) {
    return this.bakeryService.dispatchDelivery(ctx as unknown as V2ApiContext, data);
  }

  @Post("deliveries/reconcile")
  @Permissions("bakery:batch:manage")
  @UsePipes(new ZodValidationPipe(ReconcileDeliverySchema))
  @ApiOperation({ summary: "Reconcile a delivery" })
  async reconcileDelivery(@v3Context() ctx: V3ApiContext, @Body() data: any) {
    return this.bakeryService.reconcileDelivery(ctx as unknown as V2ApiContext, data);
  }

  @Get("deliveries/active")
  @Permissions("bakery:batch:view")
  @ApiOperation({ summary: "List active deliveries" })
  async getActiveDeliveries(@v3Context() ctx: V3ApiContext) {
    return this.bakeryService.getActiveDeliveries(ctx as unknown as V2ApiContext);
  }

  @Post("ingredients/receive")
  @Permissions("bakery:batch:manage")
  @UsePipes(new ZodValidationPipe(ReceiveIngredientsSchema))
  @ApiOperation({ summary: "Receive ingredient shipment" })
  async receiveIngredients(@v3Context() ctx: V3ApiContext, @Body() data: any) {
    return this.bakeryService.receiveIngredients(ctx as unknown as V2ApiContext, data);
  }

  @Post("ingredients")
  @Permissions("bakery:recipe:manage")
  @ApiOperation({ summary: "Create raw material ingredient" })
  async createIngredient(@v3Context() ctx: V3ApiContext, @Body() data: any) {
    return this.bakeryService.createIngredient(ctx as unknown as V2ApiContext, data);
  }

  @Patch("ingredients/:id")
  @Permissions("bakery:recipe:manage")
  @ApiOperation({ summary: "Update raw material ingredient" })
  async updateIngredient(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.bakeryService.updateIngredient(ctx as unknown as V2ApiContext, id, data);
  }

  @Delete("ingredients/:id")
  @Permissions("bakery:recipe:manage")
  @ApiOperation({ summary: "Delete raw material ingredient" })
  async deleteIngredient(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
  ) {
    return this.bakeryService.deleteIngredient(ctx as unknown as V2ApiContext, id);
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

  @AllowPublic()
  @Get("auth/status")
  @ApiOperation({ summary: "Check bakery auth status" })
  async authStatus(@v3Context() ctx: V3ApiContext) {
    const hasDeviceKey =
      !!ctx.organizationId &&
      (ctx.authType === "v3_client" || ctx.authType === "v3_hybrid");
    const hasMemberToken = !!ctx.memberId;

    return {
      hasDeviceKey,
      hasMemberToken,
      authenticated: hasDeviceKey && hasMemberToken,
    };
  }

  @AllowPublic()
  @Post("auth/logout")
  @ApiOperation({ summary: "Logout from bakery app" })
  async authLogout(@Res() res: any) {
    const cookieOptions = this.bakeryService.getCookieOptions(0);
    res.clearCookie("dealio_device_key", cookieOptions);
    res.clearCookie("dealio_member_token", cookieOptions);
    return res.send({
      success: true,
      data: { message: "Logged out successfully" },
    });
  }

  @AllowPublic()
  @Post("auth/sso")
  @ApiOperation({ summary: "SSO login for dashboard users into bakery app" })
  async authSso(@v3Context() ctx: V3ApiContext, @Req() req: any, @Res() res: any) {
    const session = await this.bakeryService.getDashboardSession(req);
    if (
      !session ||
      !session.user ||
      (session.session as any).organizationId !== ctx.organizationId
    ) {
      if (!session) throw new Error("Invalid dashboard session");
      if ((session.session as any).organizationId !== ctx.organizationId) {
        throw new Error("Organization mismatch");
      }
    }
    const { token, member } = await this.bakeryService.processSSO(session, ctx as unknown as V2ApiContext);
    const cookieOptions = this.bakeryService.getCookieOptions(60 * 60 * 12);
    res.setCookie("dealio_member_token", token, cookieOptions);
    return res.send({
      success: true,
      data: {
        member: {
          id: member.id,
          role: member.role,
          user: member.user,
        },
        token,
      },
    });
  }
}
