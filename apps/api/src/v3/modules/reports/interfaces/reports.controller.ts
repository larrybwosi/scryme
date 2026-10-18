import { Controller, Get, Patch, Post, Body, UseGuards, Req } from "@nestjs/common";
import { V2AuthGuard } from "@/auth/v2-auth.guard";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { ReportsService } from "../application/services/reports.service";
import { UpdateReportSettingsDto, GenerateReportDto } from "../dto/reports.dto";

@Controller("reports")
@UseGuards(V3AuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("settings")
  async getSettings(@Req() req: any) {
    const orgId = req.organizationId;
    return this.reportsService.getReportSettings(orgId);
  }

  @Patch("settings")
  async updateSettings(@Req() req: any, @Body() dto: UpdateReportSettingsDto) {
    const orgId = req.organizationId;
    return this.reportsService.updateReportSettings(orgId, dto);
  }

  @Get()
  async getReportsList(@Req() req: any) {
    const orgId = req.organizationId;
    return this.reportsService.getReportsList(orgId);
  }

  @Post("generate")
  async generateAndDispatchReport(@Req() req: any, @Body() dto: GenerateReportDto) {
    const orgId = req.organizationId;
    const userEmail = req.user?.email;
    return this.reportsService.generateAndDispatchReport(orgId, dto, userEmail);
  }
}
