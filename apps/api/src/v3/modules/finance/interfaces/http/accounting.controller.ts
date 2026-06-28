import { Controller, Get, Post, Body, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { AccountingService } from "../../application/services/accounting.service";
import { FinancialReportingService } from "../../application/services/financial-reporting.service";
import { V3AuthGuard } from "../../../../common/guards/v3-auth.guard";
import { MultiTenancyGuard } from "../../../../common/guards/multi-tenancy.guard";
import { PermissionsGuard } from "../../../../common/guards/permissions.guard";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import { ApiErrorResponseDto } from "@/v3/common/dto/response.dto";

@ApiTags("V3 Finance / Accounting")
@ApiBearerAuth()
@Controller(":orgSlug/finance/accounting")
@UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
@UseInterceptors(StandardResponseInterceptor)
export class AccountingController {
  constructor(
    private readonly accountingService: AccountingService,
    private readonly reportingService: FinancialReportingService,
  ) {}

  @Post("initialize")
  @ApiOperation({
    summary: "Initialize Chart of Accounts",
    description: "Sets up the default Chart of Accounts for an organization.",
    operationId: "Accounting_Initialize",
  })
  @ApiResponse({ status: 201, description: "Chart of Accounts initialized" })
  async initialize(@Body() body: { organizationId: string }) {
    return this.accountingService.initializeChartOfAccounts(body.organizationId);
  }

  @Get("reports/profit-loss")
  @ApiOperation({
    summary: "Get Profit and Loss Statement",
    operationId: "Accounting_GetProfitLoss",
  })
  @ApiQuery({ name: "startDate", example: "2023-01-01" })
  @ApiQuery({ name: "endDate", example: "2023-12-31" })
  @ApiResponse({ status: 200, description: "Profit and Loss data" })
  async getProfitLoss(
    @Query("organizationId") organizationId: string,
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
  @ApiOperation({
    summary: "Get Balance Sheet",
    operationId: "Accounting_GetBalanceSheet",
  })
  @ApiQuery({ name: "asOfDate", example: "2023-12-31" })
  @ApiResponse({ status: 200, description: "Balance Sheet data" })
  async getBalanceSheet(
    @Query("organizationId") organizationId: string,
    @Query("asOfDate") asOfDate: string,
  ) {
    return this.reportingService.getBalanceSheet(organizationId, new Date(asOfDate));
  }

  @Get("reports/cash-flow")
  @ApiOperation({
    summary: "Get Cash Flow Statement",
    operationId: "Accounting_GetCashFlow",
  })
  @ApiQuery({ name: "startDate", example: "2023-01-01" })
  @ApiQuery({ name: "endDate", example: "2023-12-31" })
  @ApiResponse({ status: 200, description: "Cash Flow data" })
  async getCashFlow(
    @Query("organizationId") organizationId: string,
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
  @ApiOperation({
    summary: "Get Kenyan Tax Summary",
    operationId: "Accounting_GetTaxSummary",
  })
  @ApiQuery({ name: "startDate", example: "2023-01-01" })
  @ApiQuery({ name: "endDate", example: "2023-12-31" })
  @ApiResponse({ status: 200, description: "Tax summary data" })
  async getTaxSummary(
    @Query("organizationId") organizationId: string,
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
