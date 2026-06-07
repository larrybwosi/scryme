import { Controller, Post, Body, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ExchangeTokenUseCase } from '../../application/use-cases/exchange-token.use-case';
import { TokenRequestDto, TokenResponseDto, ProvisionRequestDto, GlobalProvisionResponseDto } from '../../application/dto/token.dto';
import { StandardResponseInterceptor } from '@/v3/common/interceptors/standard-response.interceptor';
import { ApiErrorResponseDto } from '@/v3/common/dto/response.dto';
import { V3AuthService } from '../../infrastructure/services/v3-auth.service';

@ApiTags('V3 Auth')
@Controller('auth')
@UseInterceptors(StandardResponseInterceptor)
export class AuthController {
  constructor(
    private readonly exchangeTokenUseCase: ExchangeTokenUseCase,
    private readonly v3AuthService: V3AuthService,
  ) {}

  @Post('token')
  @ApiOperation({
    summary: 'Exchange client credentials for an access token',
    operationId: 'Auth_ExchangeToken',
  })
  @ApiResponse({ status: 201, type: TokenResponseDto, description: 'Token successfully exchanged' })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto, description: 'Invalid credentials' })
  async exchangeToken(@Body() body: TokenRequestDto) {
    return this.exchangeTokenUseCase.execute(body.clientId, body.clientSecret);
  }

  @Post('provision')
  @ApiOperation({
    summary: 'Provision a new device using a setup token',
    operationId: 'Auth_Provision',
  })
  @ApiResponse({ status: 201, type: GlobalProvisionResponseDto, description: 'Device provisioned' })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto, description: 'Invalid or expired setup token' })
  async provision(@Body() body: ProvisionRequestDto) {
    return this.v3AuthService.provisionDevice(body.token);
  }
}
