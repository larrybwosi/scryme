import { Controller, Get, Post, Body, Query, UseGuards } from "@nestjs/common";
import { AccountingService } from "../../application/services/accounting.service";
import { FinancialReportingService } from "../../application/services/financial-reporting.service";
import { V3AuthGuard } from "../../../../common/guards/v3-auth.guard";
import { MultiTenancyGuard } from "../../../../common/guards/multi-tenancy.guard";
import { PermissionsGuard } from "../../../../common/guards/permissions.guard";

@Controller("v3/finance/accounting")
@UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
export class AccountingController {
  constructor(
    private readonly accountingService: AccountingService,
    private readonly reportingService: FinancialReportingService,
  ) {}

  @Post("initialize")
  async initialize(@Body() body: { organizationId: string }) {
    return this.accountingService.initializeChartOfAccounts(body.organizationId);
  }

  @Get("reports/profit-loss")
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
  async getBalanceSheet(
    @Query("organizationId") organizationId: string,
    @Query("asOfDate") asOfDate: string,
  ) {
    return this.reportingService.getBalanceSheet(organizationId, new Date(asOfDate));
  }

  @Get("reports/cash-flow")
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
