import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { V3AuthGuard } from '../../../../common/guards/v3-auth.guard';
import { MultiTenancyGuard } from '../../../../common/guards/multi-tenancy.guard';
import { PettyCashUseCase } from '../../application/use-cases/petty-cash.use-case';
import { CreatePettyCashFundDto, TopUpPettyCashFundDto } from '../../application/dto/finance.dto';
import { PermissionsGuard } from '../../../../common/guards/permissions.guard';
import { Permissions } from '../../../../common/decorators/permissions.decorator';

@ApiTags('Finance / Petty Cash')
@ApiBearerAuth()
@UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
@Controller('finance/petty-cash')
export class PettyCashController {
  constructor(private readonly pettyCashUseCase: PettyCashUseCase) {}

  @Post()
  @ApiOperation({ summary: 'Create a new petty cash fund' })
  @Permissions('expense:manage')
  async createFund(@Req() req, @Body() dto: CreatePettyCashFundDto) {
    return this.pettyCashUseCase.createFund(req.organization.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all petty cash funds' })
  @Permissions('expense:view')
  async getFunds(@Req() req) {
    return this.pettyCashUseCase.getFunds(req.organization.id);
  }

  @Post(':id/top-up')
  @ApiOperation({ summary: 'Top up a petty cash fund' })
  @Permissions('expense:manage')
  async topUpFund(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: TopUpPettyCashFundDto,
  ) {
    return this.pettyCashUseCase.topUpFund(req.organization.id, id, dto, req.user.memberId);
  }

  @Get(':id/transactions')
  @ApiOperation({ summary: 'Get petty cash fund transactions' })
  @Permissions('expense:view')
  async getFundTransactions(@Req() req, @Param('id') id: string) {
    return this.pettyCashUseCase.getFundTransactions(req.organization.id, id);
  }
}
