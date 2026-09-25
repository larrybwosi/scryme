import { ProductVariantQueryDto } from "../../../catalog/application/dto/product.dto";
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
  Req,
  UseGuards,
  UseInterceptors,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from "@nestjs/swagger";
import { ProductionService } from "../../application/services/production.service";
import { ProductionReportService } from "../../reports/production-report.service";
import { v3Context } from "@/v3/common/decorators/v3-context.decorator";
import { Permissions } from "@/v3/common/decorators/permissions.decorator";
import { AllowPublic } from "@/v3/common/auth";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";
import { PermissionsGuard } from "@/v3/common/guards/permissions.guard";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import { AuditInterceptor } from "../../../../common/interceptors/audit.interceptor";
import type { V3ApiContext } from "@repo/shared/api/v3";
import {
  CreateRecipeDto,
  UpdateRecipeDto,
  CreateBatchDto,
  UpdateBatchDto,
  CompleteBatchDto,
  CreateTemplateDto,
  UpdateTemplateDto,
  CreateProductionCategoryDto,
  UpdateProductionCategoryDto,
  UpdateProductionSettingsDto,
  AddBakerDto,
  UpdateBakerDto,
  ReceiveIngredientsDto,
  CreateIngredientDto,
  UpdateIngredientDto,
  CreateQualityIncidentDto,
  UpdateQualityIncidentDto,
} from "../../application/dto/production.dto";

@ApiTags("V3 Production")
@ApiBearerAuth()
@Controller(":orgSlug/production")
@ApiParam({ name: "orgSlug", type: "string" })
@UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor, StandardResponseInterceptor)
export class ProductionController {
  constructor(
    private readonly productionService: ProductionService,
    private readonly productionReportService: ProductionReportService,
  ) {}

  @Get(["", "overview"])
  @Permissions("production:batch:read")
  @ApiOperation({ summary: "Get general production overview and metrics" })
  async getOverview(@v3Context() ctx: V3ApiContext) {
    return this.productionService.getProductionOverview(ctx.organizationId);
  }

  @Get("attendance/status")
  @Permissions("production:batch:read")
  @ApiOperation({ summary: "Get production attendance status" })
  async getAttendanceStatus(@v3Context() ctx: V3ApiContext) {
    return this.productionService.getAttendanceStatus(ctx);
  }

  // Ingredients
  @Get("ingredients")
  @Permissions("production:recipe:read")
  @ApiOperation({ summary: "List raw material ingredients" })
  async getIngredients(@v3Context() ctx: V3ApiContext) {
    return this.productionService.getIngredients(ctx.organizationId);
  }

  @Get("ingredients/records")
  @Permissions("production:recipe:read")
  @ApiOperation({ summary: "Get ingredient stock movement records" })
  async getIngredientRecords(@v3Context() ctx: V3ApiContext) {
    return this.productionService.getIngredientRecords(ctx.organizationId);
  }

  @Post("ingredients/receive")
  @Permissions("production:batch:write")
  @ApiOperation({ summary: "Receive stock ingredients" })
  async receiveIngredients(
    @v3Context() ctx: V3ApiContext,
    @Body() body: ReceiveIngredientsDto,
  ) {
    return this.productionService.receiveIngredients(ctx, body);
  }

  @Post("ingredients")
  @Permissions("production:recipe:write")
  @ApiOperation({ summary: "Create raw material ingredient product" })
  async createIngredient(
    @v3Context() ctx: V3ApiContext,
    @Body() body: CreateIngredientDto,
  ) {
    return this.productionService.createIngredient(ctx.organizationId, body);
  }

  @Patch("ingredients/:id")
  @Permissions("production:recipe:write")
  @ApiOperation({ summary: "Update raw material ingredient" })
  async updateIngredient(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
    @Body() body: UpdateIngredientDto,
  ) {
    return this.productionService.updateIngredient(ctx.organizationId, id, body);
  }

  @Delete("ingredients/:id")
  @Permissions("production:recipe:write")
  @ApiOperation({ summary: "Delete raw material ingredient" })
  async deleteIngredient(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
  ) {
    return this.productionService.deleteIngredient(ctx.organizationId, id);
  }

  // Recipes
  @Get("recipes")
  @Permissions("production:recipe:read")
  @ApiOperation({ summary: "List recipes" })
  async getRecipes(@v3Context() ctx: V3ApiContext) {
    return this.productionService.getRecipes(ctx.organizationId);
  }

  @Get("recipes/:id")
  @Permissions("production:recipe:read")
  @ApiOperation({ summary: "Get recipe details by ID" })
  async getRecipe(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
  ) {
    return this.productionService.getRecipe(ctx.organizationId, id);
  }

  @Post("recipes")
  @Permissions("production:recipe:write")
  @ApiOperation({ summary: "Create new recipe" })
  async createRecipe(
    @v3Context() ctx: V3ApiContext,
    @Body() body: CreateRecipeDto,
  ) {
    return this.productionService.createRecipe(ctx.organizationId, body);
  }

  @Patch("recipes/:id")
  @Permissions("production:recipe:write")
  @ApiOperation({ summary: "Update recipe" })
  async updateRecipe(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
    @Body() body: UpdateRecipeDto,
  ) {
    return this.productionService.updateRecipe(ctx.organizationId, id, body);
  }

  @Delete("recipes/:id")
  @Permissions("production:recipe:write")
  @ApiOperation({ summary: "Delete recipe" })
  async deleteRecipe(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
  ) {
    return this.productionService.deleteRecipe(ctx.organizationId, id);
  }

  @Post("recipes/:id/duplicate")
  @Permissions("production:recipe:write")
  @ApiOperation({ summary: "Duplicate existing recipe" })
  async duplicateRecipe(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
  ) {
    return this.productionService.duplicateRecipe(ctx.organizationId, id);
  }

  @Post("recipes/generate")
  @Permissions("production:recipe:write")
  @ApiOperation({ summary: "Generate recipe with AI" })
  async generateRecipeAi(
    @v3Context() ctx: V3ApiContext,
    @Body("prompt") prompt: string,
  ) {
    return this.productionService.generateRecipeAi(prompt);
  }

  // Batches
  @Get("batches")
  @Permissions("production:batch:read")
  @ApiOperation({ summary: "List production batches" })
  async getBatches(
    @v3Context() ctx: V3ApiContext,
    @Query() query: any,
  ) {
    return this.productionService.getBatches(ctx.organizationId, query);
  }

  @Get("batches/:id")
  @Permissions("production:batch:read")
  @ApiOperation({ summary: "Get batch details by ID" })
  async getBatch(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
  ) {
    return this.productionService.getBatch(ctx.organizationId, id);
  }

  @Get("batches/:id/traceability")
  @Permissions("production:batch:read")
  @ApiOperation({ summary: "Get full traceability for batch" })
  async getBatchTraceability(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
  ) {
    return this.productionService.getBatchTraceability(ctx.organizationId, id);
  }

  @Post("batches")
  @Permissions("production:batch:write")
  @ApiOperation({ summary: "Create batch" })
  async createBatch(
    @v3Context() ctx: V3ApiContext,
    @Body() body: CreateBatchDto,
  ) {
    return this.productionService.createBatch(ctx.organizationId, body);
  }

  @Patch("batches/:id")
  @Permissions("production:batch:write")
  @ApiOperation({ summary: "Update batch" })
  async updateBatch(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
    @Body() body: UpdateBatchDto,
  ) {
    return this.productionService.updateBatch(ctx.organizationId, id, body);
  }

  @Delete("batches/:id")
  @Permissions("production:batch:write")
  @ApiOperation({ summary: "Delete batch" })
  async deleteBatch(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
  ) {
    return this.productionService.deleteBatch(ctx.organizationId, id);
  }

  @Post("batches/:id/start")
  @Permissions("production:batch:write")
  @ApiOperation({ summary: "Start production batch" })
  async startBatch(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
  ) {
    return this.productionService.startBatch(ctx.organizationId, id);
  }

  @Post("batches/:id/complete")
  @Permissions("production:batch:write")
  @ApiOperation({ summary: "Complete production batch" })
  async completeBatch(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
    @Body() body: CompleteBatchDto,
  ) {
    return this.productionService.completeBatch(ctx, id, body);
  }

  @Post("batches/:id/cancel")
  @Permissions("production:batch:write")
  @ApiOperation({ summary: "Cancel batch" })
  async cancelBatch(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
  ) {
    return this.productionService.cancelBatch(ctx.organizationId, id);
  }

  @Post("batches/:id/duplicate")
  @Permissions("production:batch:write")
  @ApiOperation({ summary: "Duplicate batch" })
  async duplicateBatch(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
  ) {
    return this.productionService.duplicateBatch(ctx.organizationId, id);
  }

  // Templates
  @Get("templates")
  @Permissions("production:template:read")
  @ApiOperation({ summary: "List templates" })
  async getTemplates(@v3Context() ctx: V3ApiContext) {
    return this.productionService.getTemplates(ctx.organizationId);
  }

  @Post("templates")
  @Permissions("production:template:write")
  @ApiOperation({ summary: "Create template" })
  async createTemplate(
    @v3Context() ctx: V3ApiContext,
    @Body() body: CreateTemplateDto,
  ) {
    return this.productionService.createTemplate(ctx.organizationId, body);
  }

  @Patch("templates/:id")
  @Permissions("production:template:write")
  @ApiOperation({ summary: "Update template" })
  async updateTemplate(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
    @Body() body: UpdateTemplateDto,
  ) {
    return this.productionService.updateTemplate(ctx.organizationId, id, body);
  }

  @Delete("templates/:id")
  @Permissions("production:template:write")
  @ApiOperation({ summary: "Delete template" })
  async deleteTemplate(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
  ) {
    return this.productionService.deleteTemplate(ctx.organizationId, id);
  }

  @Post("templates/:id/duplicate")
  @Permissions("production:template:write")
  @ApiOperation({ summary: "Duplicate template" })
  async duplicateTemplate(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
  ) {
    return this.productionService.duplicateTemplate(ctx.organizationId, id);
  }

  @Post("templates/:id/create-batch")
  @Permissions("production:batch:write")
  @ApiOperation({ summary: "Create batch from template" })
  async createBatchFromTemplate(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
  ) {
    return this.productionService.createBatchFromTemplate(ctx.organizationId, id);
  }

  // Categories
  @Get("categories")
  @Permissions("production:recipe:read")
  @ApiOperation({ summary: "List categories" })
  async getCategories(@v3Context() ctx: V3ApiContext) {
    return this.productionService.getCategories(ctx.organizationId);
  }

  @Get("categories/:id")
  @Permissions("production:recipe:read")
  @ApiOperation({ summary: "Get category by ID" })
  async getCategory(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
  ) {
    return this.productionService.getCategory(ctx.organizationId, id);
  }

  @Post("categories")
  @Permissions("production:recipe:write")
  @ApiOperation({ summary: "Create category" })
  async createCategory(
    @v3Context() ctx: V3ApiContext,
    @Body() body: CreateProductionCategoryDto,
  ) {
    return this.productionService.createCategory(ctx.organizationId, body);
  }

  @Put("categories/:id")
  @Permissions("production:recipe:write")
  @ApiOperation({ summary: "Update category (PUT)" })
  async updateCategoryPut(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
    @Body() body: UpdateProductionCategoryDto,
  ) {
    return this.productionService.updateCategory(ctx.organizationId, id, body);
  }

  @Patch("categories/:id")
  @Permissions("production:recipe:write")
  @ApiOperation({ summary: "Update category (PATCH)" })
  async updateCategory(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
    @Body() body: UpdateProductionCategoryDto,
  ) {
    return this.productionService.updateCategory(ctx.organizationId, id, body);
  }

  @Delete("categories/:id")
  @Permissions("production:recipe:write")
  @ApiOperation({ summary: "Delete category" })
  async deleteCategory(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
  ) {
    return this.productionService.deleteCategory(ctx.organizationId, id);
  }

  // Settings & Staff / Bakers / Operators
  @Get("settings")
  @Permissions("production:settings:read")
  @ApiOperation({ summary: "Get production settings" })
  async getSettings(@v3Context() ctx: V3ApiContext) {
    return this.productionService.getSettings(ctx.organizationId);
  }

  @Put("settings")
  @Permissions("production:settings:write")
  @ApiOperation({ summary: "Update production settings (PUT)" })
  async updateSettingsPut(
    @v3Context() ctx: V3ApiContext,
    @Body() body: UpdateProductionSettingsDto,
  ) {
    return this.productionService.updateSettings(ctx.organizationId, body);
  }

  @Patch("settings")
  @Permissions("production:settings:write")
  @ApiOperation({ summary: "Update production settings (PATCH)" })
  async updateSettings(
    @v3Context() ctx: V3ApiContext,
    @Body() body: UpdateProductionSettingsDto,
  ) {
    return this.productionService.updateSettings(ctx.organizationId, body);
  }

  @Post("settings/test-report")
  @Permissions("production:settings:write")
  @ApiOperation({ summary: "Trigger test production report" })
  async testReport(@v3Context() ctx: V3ApiContext) {
    const { organizationId } = ctx;
    await this.productionReportService.generateAndSendReport(organizationId, 7);
    return { status: "success", message: "Test report triggered" };
  }

  @Get(["bakers", "staff", "operators"])
  @Permissions("production:batch:read")
  @ApiOperation({ summary: "List production staff/bakers/operators" })
  async getBakers(@v3Context() ctx: V3ApiContext) {
    return this.productionService.getBakers(ctx.organizationId);
  }

  @Post(["bakers", "staff", "operators"])
  @Permissions("production:settings:write")
  @ApiOperation({ summary: "Add production staff/baker/operator" })
  async addBaker(
    @v3Context() ctx: V3ApiContext,
    @Body() body: AddBakerDto,
  ) {
    return this.productionService.addBaker(ctx.organizationId, body);
  }

  @Patch(["bakers/:id", "staff/:id", "operators/:id"])
  @Permissions("production:settings:write")
  @ApiOperation({ summary: "Update production staff/baker/operator" })
  async updateBaker(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
    @Body() body: UpdateBakerDto,
  ) {
    return this.productionService.updateBaker(ctx.organizationId, id, body);
  }

  @Delete(["bakers/:id", "staff/:id", "operators/:id"])
  @Permissions("production:settings:write")
  @ApiOperation({ summary: "Remove production staff/baker/operator" })
  async removeBaker(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
  ) {
    return this.productionService.removeBaker(ctx.organizationId, id);
  }

  // Quality Incidents
  @Get("quality-incidents")
  @Permissions("production:batch:read")
  @ApiOperation({ summary: "List quality incidents" })
  async getQualityIncidents(@v3Context() ctx: V3ApiContext) {
    return this.productionService.getQualityIncidents(ctx.organizationId);
  }

  @Get("quality-incidents/:id")
  @Permissions("production:batch:read")
  @ApiOperation({ summary: "Get quality incident details by ID" })
  async getQualityIncident(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
  ) {
    return this.productionService.getQualityIncident(ctx.organizationId, id);
  }

  @Post("quality-incidents")
  @Permissions("production:batch:write")
  @ApiOperation({ summary: "Create quality incident" })
  async createQualityIncident(
    @v3Context() ctx: V3ApiContext,
    @Body() body: CreateQualityIncidentDto,
  ) {
    return this.productionService.createQualityIncident(
      ctx.organizationId,
      ctx.memberId || "",
      body,
    );
  }

  @Patch("quality-incidents/:id")
  @Permissions("production:batch:write")
  @ApiOperation({ summary: "Update quality incident" })
  async updateQualityIncident(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
    @Body() body: UpdateQualityIncidentDto,
  ) {
    return this.productionService.updateQualityIncident(
      ctx.organizationId,
      id,
      body,
    );
  }

  @Delete("quality-incidents/:id")
  @Permissions("production:batch:write")
  @ApiOperation({ summary: "Delete quality incident" })
  async deleteQualityIncident(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
  ) {
    return this.productionService.deleteQualityIncident(ctx.organizationId, id);
  }


  @Get("variants")
  @Permissions("production:batch:read")
  @ApiOperation({ summary: "Get paginated product variants" })
  async getVariants(
    @v3Context() ctx: V3ApiContext,
    @Query() query: ProductVariantQueryDto,
  ) {
    return this.productionService.getVariants(ctx.organizationId, query);
  }

  // Production Auth & Device Compatibility
  @AllowPublic()
  @Post("auth/setup")
  @ApiOperation({ summary: "Setup production device authentication" })
  async authSetup(
    @Body("apiKey") apiKey: string,
    @Req() req: any,
    @Res() res: any,
  ) {
    if (!apiKey) {
      throw new BadRequestException("API key is required");
    }

    const ipAddress = (
      (req.headers["x-forwarded-for"] as string) ||
      (req.headers["x-real-ip"] as string) ||
      "unknown"
    )
      .split(",")[0]
      .trim();

    const deviceContext = await this.productionService.validateDevice(
      apiKey,
      ipAddress,
    );

    if (!deviceContext) {
      throw new UnauthorizedException("Invalid API key");
    }

    const cookieOptions = this.productionService.getCookieOptions(
      60 * 60 * 24 * 365,
    );

    res.setCookie("dealio_device_key", apiKey, cookieOptions);

    return res.send({
      success: true,
      data: {
        message: "Device configured successfully",
        organizationId: deviceContext.organizationId,
        locationId: deviceContext.locationId,
      },
    });
  }

  @AllowPublic()
  @Get("auth/status")
  @ApiOperation({ summary: "Check production authentication status" })
  async authStatus(@v3Context() ctx?: V3ApiContext) {
    const hasDeviceKey =
      !!ctx?.organizationId &&
      (ctx?.authType === "v3_client" || ctx?.authType === "v3_hybrid" || ctx?.authType === "device" || ctx?.authType === "hybrid");
    const hasMemberToken = !!ctx?.memberId;

    return {
      hasDeviceKey,
      hasMemberToken,
      authenticated: hasDeviceKey && hasMemberToken,
    };
  }

  @AllowPublic()
  @Post("auth/logout")
  @ApiOperation({ summary: "Logout from production app" })
  async authLogout(@Res() res: any) {
    const cookieOptions = this.productionService.getCookieOptions(0);

    res.clearCookie("dealio_device_key", cookieOptions);
    res.clearCookie("dealio_member_token", cookieOptions);

    return res.send({
      success: true,
      data: { message: "Logged out successfully" },
    });
  }

  @AllowPublic()
  @Post("auth/sso")
  @ApiOperation({ summary: "SSO login for dashboard users into production app" })
  async authSso(
    @v3Context() ctx: V3ApiContext,
    @Req() req: any,
    @Res() res: any,
  ) {
    const session = await this.productionService.getDashboardSession(req);

    if (
      !session ||
      !session.user ||
      (session.session as any).organizationId !== ctx.organizationId
    ) {
      if (!session)
        throw new UnauthorizedException("Invalid dashboard session");
      if ((session.session as any).organizationId !== ctx.organizationId) {
        throw new UnauthorizedException("Organization mismatch");
      }
    }

    const { token, member } = await this.productionService.processSSO(
      session,
      ctx.organizationId,
      ctx.locationId,
    );

    const cookieOptions = this.productionService.getCookieOptions(60 * 60 * 12);
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

  @AllowPublic()
  @Get("update/:target/:current_version")
  @ApiOperation({ summary: "Get latest update for production app" })
  async getUpdate(
    @Param("target") target: string,
    @Param("current_version") currentVersion: string,
    @Res() res: any,
  ) {
    const update = await this.productionService.getUpdate(target, currentVersion);
    if (!update) {
      return res.status(204).send();
    }
    return res.status(200).send(update);
  }
}
