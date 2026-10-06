import {
  Controller,
  Post,
  Body,
  Param,
  Req,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from "@nestjs/swagger";
import { V3AuthGuard } from "../../../../common/guards/v3-auth.guard";
import { AllowPublic } from "../../../../common/decorators/auth.decorator";
import { StandardResponseInterceptor } from "../../../../common/interceptors/standard-response.interceptor";
import { AndroidPosUseCase } from "../../application/use-cases/android-pos.use-case";
import {
  AndroidMemberLoginDto,
  AndroidTokenExchangeDto,
  AndroidPosPairDto,
} from "../../application/dto/android-auth.dto";

@ApiTags("V3 Android POS")
@Controller("v3/android/pos")
@UseInterceptors(StandardResponseInterceptor)
export class AndroidPosController {
  constructor(private readonly androidPosUseCase: AndroidPosUseCase) {}

  @AllowPublic()
  @Post("members/login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Terminal login for staff members on Android POS" })
  @ApiResponse({ status: 200, description: "Terminal member login successful" })
  async loginMember(
    @Req() req: any,
    @Headers("x-org-slug") orgSlug: string,
    @Body() dto: AndroidMemberLoginDto,
  ) {
    return this.androidPosUseCase.loginMember(req.v3Context, dto, orgSlug);
  }

  @AllowPublic()
  @Post("token")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Exchange API client credentials for Android token" })
  @ApiResponse({ status: 200, description: "Token exchange successful" })
  async exchangeToken(@Body() dto: AndroidTokenExchangeDto) {
    return this.androidPosUseCase.exchangeToken(dto);
  }

  @UseGuards(V3AuthGuard)
  @ApiBearerAuth()
  @ApiHeader({ name: "x-org-slug", required: false })
  @Post("pair")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Pair Android POS device with organization" })
  @ApiResponse({ status: 200, description: "Device paired successfully" })
  async pairPosDevice(@Req() req: any, @Body() dto: AndroidPosPairDto) {
    return this.androidPosUseCase.pairPosDevice(req.v3Context, dto);
  }

  @UseGuards(V3AuthGuard)
  @ApiBearerAuth()
  @ApiHeader({ name: "x-org-slug", required: false })
  @Post("pairing/session/:sessionId/authorize")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Authorize Android POS pairing session" })
  @ApiResponse({ status: 200, description: "Pairing session authorized" })
  async authorizePosPairingSession(
    @Req() req: any,
    @Param("sessionId") sessionId: string,
    @Body() dto: AndroidPosPairDto,
  ) {
    return this.androidPosUseCase.authorizePosPairingSession(req.v3Context, sessionId, dto);
  }
}
