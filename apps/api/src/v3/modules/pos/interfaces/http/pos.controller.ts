import { Controller, Post, Get, Body, UseGuards, UseInterceptors, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { V3AuthService } from '../../../auth/infrastructure/services/v3-auth.service';
import { V3AuthGuard } from '@/v3/common/guards/v3-auth.guard';
import { v3Context } from '@/v3/common/decorators/v3-context.decorator';
import { type V3ApiContext } from '@repo/shared/server';
import { ProcessSaleDto } from '../../application/dto/sale.dto';
import { ProcessSaleUseCase } from '../../application/use-cases/process-sale.use-case';
import { SyncUseCase } from '../../application/use-cases/sync.use-case';
import { GetTransactionsUseCase } from '../../application/use-cases/get-transactions.use-case';
import { StandardResponseInterceptor } from '@/v3/common/interceptors/standard-response.interceptor';
import {
  ProvisionDeviceDto,
  PosLoginDto,
  PosLoginResponseDto,
  ProvisionResponseDto,
} from '../../application/dto/pos.dto';
import { ApiErrorResponseDto } from '@/v3/common/dto/response.dto';
import { MultiTenancyGuard } from '@/v3/common/guards/multi-tenancy.guard';

@ApiTags('V3 POS')
@Controller(':orgSlug/pos')
@UseInterceptors(StandardResponseInterceptor)
export class PosController {
  constructor(
    private readonly authService: V3AuthService,
    private readonly processSaleUseCase: ProcessSaleUseCase,
    private readonly syncUseCase: SyncUseCase,
    private readonly getTransactionsUseCase: GetTransactionsUseCase
  ) {}

  @Post('provision')
  @ApiOperation({
    summary: 'Provision a new POS device using a setup token',
    operationId: 'POS_Provision',
  })
  @ApiResponse({ status: 201, type: ProvisionResponseDto, description: 'Device provisioned' })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto, description: 'Invalid token' })
  async provision(@Body() body: ProvisionDeviceDto) {
    return this.authService.provisionDevice(body.token);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login staff member to a provisioned POS device',
    operationId: 'POS_Login',
  })
  @ApiResponse({ status: 200, type: PosLoginResponseDto, description: 'Login successful' })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto, description: 'Invalid credentials' })
  async login(@Body() body: PosLoginDto) {
    const accessToken = await this.authService.loginMember(body.clientId, body.pin);
    return { accessToken };
  }

  @Get('me')
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current POS device and staff context',
    operationId: 'POS_GetMe',
  })
  @ApiResponse({ status: 200, description: 'Current context' })
  async getMe(@v3Context() ctx: V3ApiContext) {
    return ctx;
  }

  @Post('sale')
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Process a new POS sale',
    operationId: 'POS_ProcessSale',
  })
  @ApiResponse({ status: 201, description: 'Sale processed' })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto, description: 'Invalid sale data' })
  async processSale(@v3Context() ctx: V3ApiContext, @Body() body: ProcessSaleDto) {
    return this.processSaleUseCase.execute(ctx, body);
  }

  @Get('sync')
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Full or delta POS sync',
    operationId: 'POS_Sync',
  })
  @ApiResponse({ status: 200, description: 'Sync data' })
  async sync(@v3Context() ctx: V3ApiContext, @Query() query: any) {
    return this.syncUseCase.execute(ctx, query);
  }

  @Get('transactions')
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List POS transactions',
    operationId: 'POS_GetTransactions',
  })
  @ApiResponse({ status: 200, description: 'Transactions' })
  async getTransactions(@v3Context() ctx: V3ApiContext, @Query() query: any) {
    return this.getTransactionsUseCase.execute(ctx, query);
  }
}
