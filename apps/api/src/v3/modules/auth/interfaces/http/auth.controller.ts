import { Controller, Post, Body, UseInterceptors } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AllowPublic } from "../../../../../common/decorators/auth.decorator";
import { ExchangeTokenUseCase } from "../../application/use-cases/exchange-token.use-case";
import {
  TokenRequestDto,
  TokenResponseDto,
} from "../../application/dto/token.dto";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import {
  ApiErrorResponseDto,
  ApiResponseDto,
} from "@/v3/common/dto/response.dto";

@ApiTags("V3 Auth")
@Controller("auth")
@UseInterceptors(StandardResponseInterceptor)
export class AuthController {
  constructor(private readonly exchangeTokenUseCase: ExchangeTokenUseCase) {}

  @AllowPublic()
  @Post("token")
  @ApiOperation({
    summary: "Exchange client credentials for an access token",
    operationId: "Auth_ExchangeToken",
  })
  @ApiResponse({
    status: 201,
    type: TokenResponseDto,
    description: "Token successfully exchanged",
  })
  @ApiResponse({
    status: 401,
    type: ApiErrorResponseDto,
    description: "Invalid credentials",
  })
  async exchangeToken(@Body() body: TokenRequestDto) {
    return this.exchangeTokenUseCase.execute(body.clientId, body.clientSecret);
  }
}
