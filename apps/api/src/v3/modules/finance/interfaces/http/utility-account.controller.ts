import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { V3AuthGuard } from "../../../../common/guards/v3-auth.guard";
import { MultiTenancyGuard } from "../../../../common/guards/multi-tenancy.guard";
import { UtilityAccountUseCase } from "../../application/use-cases/utility-account.use-case";
import { CreateUtilityAccountDto } from "../../application/dto/finance.dto";
import { PermissionsGuard } from "../../../../common/guards/permissions.guard";
import { Permissions } from "../../../../common/decorators/permissions.decorator";

@ApiTags("Finance / Utility Accounts")
@ApiBearerAuth()
@UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
@Controller("finance/utility-accounts")
export class UtilityAccountController {
  constructor(private readonly utilityAccountUseCase: UtilityAccountUseCase) {}

  @Post()
  @ApiOperation({ summary: "Create a new utility account" })
  @Permissions("expense:manage")
  async createAccount(@Req() req, @Body() dto: CreateUtilityAccountDto) {
    return this.utilityAccountUseCase.createAccount(req.organization.id, dto);
  }

  @Get()
  @ApiOperation({ summary: "List all utility accounts" })
  @Permissions("expense:view")
  async getAccounts(@Req() req) {
    return this.utilityAccountUseCase.getAccounts(req.organization.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get utility account details" })
  @Permissions("expense:view")
  async getAccount(@Req() req, @Param("id") id: string) {
    return this.utilityAccountUseCase.getAccount(req.organization.id, id);
  }
}
