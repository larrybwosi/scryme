import { Controller, Get, Post, Body, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from "@nestjs/swagger";
import { AccountingService } from "../../application/services/accounting.service";
import { FinancialReportingService } from "../../application/services/financial-reporting.service";
import { V3AuthGuard } from "../../../../common/guards/v3-auth.guard";
import { MultiTenancyGuard } from "../../../../common/guards/multi-tenancy.guard";
import { PermissionsGuard } from "../../../../common/guards/permissions.guard";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import { ApiErrorResponseDto } from "@/v3/common/dto/response.dto";
import { v3Context } from "../../../../common/decorators/v3-context.decorator";
import { Permissions } from "../../../../common/decorators/permissions.decorator";

@ApiTags("V3 Finance / Accounting")
@ApiBearerAuth()
@Controller(":orgSlug/finance/accounting")
@ApiParam({ name: "orgSlug", type: "string" })
@UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
@UseInterceptors(StandardResponseInterceptor)
export class AccountingController {
  constructor(
    private readonly accountingService: AccountingService,
    private readonly reportingService: FinancialReportingService,
  ) {}

  @Post("initialize")
  @Permissions("accounting:manage")
  @ApiOperation({
    summary: "Initialize Chart of Accounts",
    description: "Sets up the default Chart of Accounts for an organization.",
    operationId: "Accounting_Initialize",
  })
  @ApiResponse({ status: 201, description: "Chart of Accounts initialized" })
  async initialize(@v3Context("organizationId") organizationId: string) {
    return this.accountingService.initializeChartOfAccounts(organizationId);
  }

  @Get("reports/profit-loss")
  @Permissions("accounting:report")
  @ApiOperation({
    summary: "Get Profit and Loss Statement",
    operationId: "Accounting_GetProfitLoss",
  })
  @ApiQuery({ name: "startDate", example: "2023-01-01" })
  @ApiQuery({ name: "endDate", example: "2023-12-31" })
  @ApiResponse({ status: 200, description: "Profit and Loss data" })
  async getProfitLoss(
    @v3Context("organizationId") organizationId: string,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ) {
    return this.reportingService.getProfitAndLoss(
      organizationId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get("reports/balance-sheet")
  @Permissions("accounting:report")
  @ApiOperation({
    summary: "Get Balance Sheet",
    operationId: "Accounting_GetBalanceSheet",
  })
  @ApiQuery({ name: "asOfDate", example: "2023-12-31" })
  @ApiResponse({ status: 200, description: "Balance Sheet data" })
  async getBalanceSheet(
    @v3Context("organizationId") organizationId: string,
    @Query("asOfDate") asOfDate: string,
  ) {
    return this.reportingService.getBalanceSheet(organizationId, new Date(asOfDate));
  }

  @Get("reports/cash-flow")
  @Permissions("accounting:report")
  @ApiOperation({
    summary: "Get Cash Flow Statement",
    operationId: "Accounting_GetCashFlow",
  })
  @ApiQuery({ name: "startDate", example: "2023-01-01" })
  @ApiQuery({ name: "endDate", example: "2023-12-31" })
  @ApiResponse({ status: 200, description: "Cash Flow data" })
  async getCashFlow(
    @v3Context("organizationId") organizationId: string,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ) {
    return this.reportingService.getCashFlowStatement(
      organizationId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get("reports/tax-summary")
  @Permissions("accounting:report")
  @ApiOperation({
    summary: "Get Kenyan Tax Summary",
    operationId: "Accounting_GetTaxSummary",
  })
  @ApiQuery({ name: "startDate", example: "2023-01-01" })
  @ApiQuery({ name: "endDate", example: "2023-12-31" })
  @ApiResponse({ status: 200, description: "Tax summary data" })
  async getTaxSummary(
    @v3Context("organizationId") organizationId: string,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ) {
    return this.reportingService.getKenyanTaxSummary(
      organizationId,
      new Date(startDate),
      new Date(endDate),
    );
  }
}
