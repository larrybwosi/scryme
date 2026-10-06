import {
  Controller,
  Get,
  Post,
  Body,
  Req,
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
import { AndroidAuthUseCase } from "../../application/use-cases/android-auth.use-case";
import { AndroidUseCase } from "../../application/use-cases/android.use-case";
import {
  AndroidEmailLoginDto,
  AndroidEmailSignUpDto,
} from "../../application/dto/android-auth.dto";
import { SwitchOrgDto } from "../../application/dto/android.dto";

@ApiTags("V3 Android Auth")
@Controller("v3/android/auth")
@UseInterceptors(StandardResponseInterceptor)
export class AndroidAuthController {
  constructor(
    private readonly androidAuthUseCase: AndroidAuthUseCase,
    private readonly androidUseCase: AndroidUseCase,
  ) {}

  @AllowPublic()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Sign in Android user using Better Auth and return bearer token",
  })
  @ApiResponse({ status: 200, description: "Android authentication successful" })
  async login(@Body() dto: AndroidEmailLoginDto) {
    return this.androidAuthUseCase.loginWithEmail(dto);
  }

  @AllowPublic()
  @Post("signup")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Register new Android user using Better Auth and return bearer token",
  })
  @ApiResponse({ status: 201, description: "Android user registration successful" })
  async signup(@Body() dto: AndroidEmailSignUpDto) {
    return this.androidAuthUseCase.signUpWithEmail(dto);
  }

  @Get("me")
  @UseGuards(V3AuthGuard)
  @ApiBearerAuth()
  @ApiHeader({ name: "x-org-slug", required: false })
  @ApiOperation({
    summary: "Get authenticated Android user profile, active org context, and memberships",
  })
  @ApiResponse({ status: 200, description: "Android user profile retrieved successfully" })
  async getMe(@Req() req: any) {
    return this.androidUseCase.getMe(req.v3Context, req.user);
  }

  @Post("switch-org")
  @UseGuards(V3AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Switch active organization context for authenticated Android user",
  })
  @ApiResponse({ status: 200, description: "Organization switched successfully" })
  async switchOrganization(@Req() req: any, @Body() dto: SwitchOrgDto) {
    return this.androidUseCase.switchOrganization(req.v3Context, req.user, dto);
  }

  @Post("logout")
  @UseGuards(V3AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Sign out Android session and revoke active bearer token",
  })
  @ApiResponse({ status: 200, description: "Logged out successfully" })
  async logout(@Req() req: any) {
    return this.androidAuthUseCase.logout(req.user);
  }
}
