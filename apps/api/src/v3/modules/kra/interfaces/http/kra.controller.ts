import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { V3AuthGuard } from "../../../../common/guards/v3-auth.guard";
import { MultiTenancyGuard } from "../../../../common/guards/multi-tenancy.guard";
import { ModuleGuard } from "../../../../common/guards/module.guard";
import { RequireModule } from "../../../../common/decorators/module.decorator";
import { KraUseCase } from "../../application/use-cases/kra.use-case";
import { SaveKRAConfigDto, ValidatePinDto } from "../../application/dto/kra-config.dto";

@Controller("v3/kra")
@UseGuards(V3AuthGuard, MultiTenancyGuard, ModuleGuard)
@RequireModule("kra")
export class KraController {
  constructor(private readonly kraUseCase: KraUseCase) {}

  @Get("config")
  async getConfig(@Req() req: any) {
    return this.kraUseCase.getConfig(req.organization.id);
  }

  @Put("config")
  async saveConfig(@Req() req: any, @Body() dto: SaveKRAConfigDto) {
    return this.kraUseCase.saveConfig(req.organization.id, dto as any);
  }

  @Post("validate-pin")
  async validatePin(@Req() req: any, @Body() dto: ValidatePinDto) {
    return this.kraUseCase.validatePin(req.organization.id, dto.kraPin);
  }

  @Get("logs")
  async getComplianceLogs(
    @Req() req: any,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("status") status?: string,
  ) {
    return this.kraUseCase.getComplianceLogs(req.organization.id, {
      page,
      limit,
      status,
    });
  }

  @Post("logs/:id/retry")
  async retrySubmission(@Req() req: any, @Param("id") id: string) {
    return this.kraUseCase.retrySubmission(req.organization.id, id);
  }

  @Get("vat-summary")
  async getVatSummary(
    @Req() req: any,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.kraUseCase.getVatSummary(req.organization.id, startDate, endDate);
  }
}
