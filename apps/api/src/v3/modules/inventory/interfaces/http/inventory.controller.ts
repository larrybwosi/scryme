import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  Req,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from "@nestjs/swagger";
import { GetInventoryUseCase } from "../../application/use-cases/get-inventory.use-case";
import { TraceBatchUseCase } from "../../application/use-cases/trace-batch.use-case";
import { SplitBatchUseCase } from "../../application/use-cases/split-batch.use-case";
import { MergeBatchesUseCase } from "../../application/use-cases/merge-batches.use-case";
import {
  RequestStockAdjustmentUseCase,
  ApproveStockAdjustmentUseCase,
} from "../../application/use-cases/adjustment-workflow.use-case";
import { AssemblyUseCase } from "../../application/use-cases/assembly.use-case";
import {
  GetSupplierLeadTimeUseCase,
  GetWasteAnalysisUseCase,
} from "../../application/use-cases/inventory-analytics.use-case";
import { CheckB2BAvailabilityUseCase } from "../../application/use-cases/check-b2b-availability.use-case";
import {
  UnpackBatchUseCase,
  UnpackBatchDto,
} from "../../application/use-cases/unpack-batch.use-case";
import { ScanUnpackBatchUseCase } from "../../application/use-cases/scan-unpack-batch.use-case";
import { InventoryIntegrityService } from "../../application/services/inventory-integrity.service";
import { QuickStockInquiryUseCase } from "../../application/use-cases/quick-stock-inquiry.use-case";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";
import { PermissionsGuard } from "@/v3/common/guards/permissions.guard";
import { AuditInterceptor } from "@/v3/common/interceptors/audit.interceptor";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import { Permissions } from "@/v3/common/decorators/permissions.decorator";
import { InventoryResponseDto } from "../../application/dto/inventory.dto";
import { CheckB2BAvailabilityDto } from "../../application/dto/check-b2b-availability.dto";
import { ApiErrorResponseDto } from "@/v3/common/dto/response.dto";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { PaginationQueryDto } from "@/v3/common/utils/pagination";

@ApiTags("V3 Inventory")
@ApiBearerAuth()
@Controller(":orgSlug/inventory")
@UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor, StandardResponseInterceptor)
export class InventoryController {
  constructor(
    private readonly getInventoryUseCase: GetInventoryUseCase,
    private readonly traceBatchUseCase: TraceBatchUseCase,
    private readonly splitBatchUseCase: SplitBatchUseCase,
    private readonly mergeBatchesUseCase: MergeBatchesUseCase,
    private readonly requestAdjustmentUseCase: RequestStockAdjustmentUseCase,
    private readonly assemblyUseCase: AssemblyUseCase,
    private readonly approveAdjustmentUseCase: ApproveStockAdjustmentUseCase,
    private readonly getLeadTimeUseCase: GetSupplierLeadTimeUseCase,
    private readonly getWasteAnalysisUseCase: GetWasteAnalysisUseCase,
    private readonly checkB2BAvailabilityUseCase: CheckB2BAvailabilityUseCase,
    private readonly integrityService: InventoryIntegrityService,
    private readonly quickStockInquiryUseCase: QuickStockInquiryUseCase,
    private readonly unpackBatchUseCase: UnpackBatchUseCase,
    private readonly scanUnpackBatchUseCase: ScanUnpackBatchUseCase,
  ) {}

  @Get("integrity/verify")
  @Permissions("inventory:manage")
  @ApiOperation({
    summary: "Verify inventory integrity",
    operationId: "Inventory_VerifyIntegrity",
  })
  async verifyIntegrity(@Req() req: any) {
    return this.integrityService.verifyOrganizationIntegrity(
      req.organization.id,
    );
  }

  @Post("integrity/fix/:variantId")
  @Permissions("inventory:manage")
  @ApiOperation({
    summary: "Fix inventory integrity for a variant",
    operationId: "Inventory_FixIntegrity",
  })
  async fixIntegrity(
    @Req() req: any,
    @Param("variantId") variantId: string,
    @Query("locationId") locationId: string,
  ) {
    return this.integrityService.fixVariantIntegrity(
      req.organization.id,
      variantId,
      locationId,
    );
  }

  @Get()
  @Permissions("inventory:read")
  @ApiOperation({
    summary: "Get inventory for an organization",
    operationId: "Inventory_GetInventory",
  })
  @ApiResponse({
    status: 200,
    type: [InventoryResponseDto],
    description: "Inventory list",
  })
  @ApiResponse({
    status: 401,
    type: ApiErrorResponseDto,
    description: "Unauthorized",
  })
  async getInventory(
    @Req() req: any,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.getInventoryUseCase.execute(
      req.organization.id,
      paginationQuery,
    );
  }

  @Get("trace/:identifier")
  @Permissions("inventory:read")
  @ApiOperation({
    summary: "Trace a batch by ID or number",
    operationId: "Inventory_TraceBatch",
  })
  @ApiParam({ name: "identifier", description: "Batch ID or Batch Number" })
  async traceBatch(@Req() req: any, @Param("identifier") identifier: string) {
    return this.traceBatchUseCase.execute(req.organization.id, identifier);
  }

  @Post("batches/:id/split")
  @Permissions("inventory:write")
  @ApiOperation({
    summary: "Split a stock batch into child batches",
    operationId: "Inventory_SplitBatch",
  })
  async splitBatch(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: { splits: { quantity: number; notes?: string }[] },
  ) {
    return this.splitBatchUseCase.execute(
      req.organization.id,
      id,
      req.user.memberId,
      body.splits,
    );
  }

  @Post("batches/merge")
  @Permissions("inventory:write")
  @ApiOperation({
    summary: "Merge multiple batches into one",
    operationId: "Inventory_MergeBatches",
  })
  async mergeBatches(
    @Req() req: any,
    @Body()
    body: { batchIds: string[]; targetLocationId: string; notes?: string },
  ) {
    return this.mergeBatchesUseCase.execute(
      req.organization.id,
      req.user.memberId,
      body.batchIds,
      body.targetLocationId,
      body.notes,
    );
  }

  @Post("assemblies")
  @Permissions("inventory:write")
  @ApiOperation({
    summary: "Create a new assembly/kit plan",
    operationId: "Inventory_CreateAssembly",
  })
  async createAssembly(@Req() req: any, @Body() body: any) {
    return this.assemblyUseCase.create(
      req.organization.id,
      req.user.memberId,
      body,
    );
  }

  @Post("assemblies/:id/complete")
  @Permissions("inventory:write")
  @ApiOperation({
    summary: "Complete an assembly and update stock",
    operationId: "Inventory_CompleteAssembly",
  })
  async completeAssembly(
    @Req() req: any,
    @Param("id") id: string,
    @Body("locationId") locationId: string,
  ) {
    return this.assemblyUseCase.complete(
      req.organization.id,
      req.user.memberId,
      id,
      locationId,
    );
  }

  @Post("adjustments/request")
  @Permissions("inventory:write")
  @ApiOperation({
    summary: "Request a stock adjustment (requires approval)",
    operationId: "Inventory_RequestAdjustment",
  })
  async requestAdjustment(@Req() req: any, @Body() body: any) {
    return this.requestAdjustmentUseCase.execute(
      req.organization.id,
      req.user.memberId,
      body,
    );
  }

  @Patch("adjustments/:id/approve")
  @Permissions("inventory:manage")
  @ApiOperation({
    summary: "Approve a pending stock adjustment",
    operationId: "Inventory_ApproveAdjustment",
  })
  async approveAdjustment(@Req() req: any, @Param("id") id: string) {
    return this.approveAdjustmentUseCase.execute(
      req.organization.id,
      req.user.memberId,
      id,
    );
  }

  @Get("analytics/supplier-lead-time")
  @Permissions("inventory:read")
  @ApiOperation({
    summary: "Get supplier lead time analytics",
    operationId: "Inventory_GetLeadTime",
  })
  async getLeadTime(@Req() req: any, @Query("supplierId") supplierId?: string) {
    return this.getLeadTimeUseCase.execute(req.organization.id, supplierId);
  }

  @Get("analytics/waste")
  @Permissions("inventory:read")
  @ApiOperation({
    summary: "Get waste and shrinkage analysis",
    operationId: "Inventory_GetWasteAnalysis",
  })
  async getWasteAnalysis(
    @Req() req: any,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.getWasteAnalysisUseCase.execute(req.organization.id, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Post("b2b/availability")
  @Permissions("inventory:read")
  @ApiOperation({
    summary: "Bulk check stock availability for B2B customers",
    operationId: "Inventory_CheckB2BAvailability",
  })
  @ApiResponse({ status: 200, description: "Availability report" })
  async checkB2BAvailability(
    @Req() req: any,
    @Body() dto: CheckB2BAvailabilityDto,
  ) {
    return this.checkB2BAvailabilityUseCase.execute(req.organization.id, dto);
  }

  @Post("batches/:id/unpack")
  @Permissions("inventory:write")
  @ApiOperation({
    summary: "Unpack a bulk batch into base units",
    operationId: "Inventory_UnpackBatch",
  })
  async unpackBatch(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: Omit<UnpackBatchDto, "batchId">,
  ) {
    return this.unpackBatchUseCase.execute(
      req.organization.id,
      req.user.memberId,
      {
        ...body,
        batchId: id,
      },
    );
  }

  @Post("batches/scan-unpack")
  @Permissions("inventory:write")
  @ApiOperation({
    summary: "Scan a batch QR code to receive and unpack it",
    operationId: "Inventory_ScanUnpackBatch",
  })
  async scanUnpackBatch(@Req() req: any, @Body() body: { batchId: string }) {
    return this.scanUnpackBatchUseCase.execute(
      req.organization.id,
      req.user.memberId,
      body.batchId,
    );
  }

  @Post("b2b/quick-inquiry")
  @Permissions("inventory:read")
  @ApiOperation({
    summary: "Quick stock inquiry using business account default location",
    operationId: "Inventory_QuickStockInquiry",
  })
  @ApiResponse({ status: 200, description: "Availability report" })
  async quickInquiry(
    @Req() req: any,
    @Body() body: { businessAccountId: string; variantIds: string[] },
  ) {
    return this.quickStockInquiryUseCase.execute(
      req.organization.id,
      body.businessAccountId,
      body.variantIds,
    );
  }
}
