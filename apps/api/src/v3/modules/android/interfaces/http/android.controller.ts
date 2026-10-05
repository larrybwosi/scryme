import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from "@nestjs/swagger";
import { V3AuthGuard } from "../../../../common/guards/v3-auth.guard";
import { AndroidUseCase } from "../../application/use-cases/android.use-case";
import { RegisterDeviceDto, SwitchOrgDto } from "../../application/dto/android.dto";

@ApiTags("V3 Android")
@ApiBearerAuth()
@ApiHeader({
  name: "x-org-slug",
  description: "Target Organization Slug Context (optional if active in session)",
  required: false,
})
@Controller("v3/android")
@UseGuards(V3AuthGuard)
export class AndroidController {
  constructor(private readonly androidUseCase: AndroidUseCase) {}

  @Get("me")
  @ApiOperation({
    summary: "Get authenticated Android user profile, active org context, and memberships",
  })
  @ApiResponse({ status: 200, description: "Android user profile & org context retrieved successfully" })
  async getMe(@Req() req: any) {
    return this.androidUseCase.getMe(req.v3Context, req.user);
  }

  @Post("switch-org")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Switch active organization context for the authenticated Android user",
  })
  @ApiResponse({ status: 200, description: "Organization switched successfully" })
  async switchOrganization(@Req() req: any, @Body() dto: SwitchOrgDto) {
    return this.androidUseCase.switchOrganization(req.v3Context, req.user, dto);
  }

  @Post("register-device")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Register or update Android mobile device specs and FCM push token",
  })
  @ApiResponse({ status: 200, description: "Android device registered successfully" })
  async registerDevice(@Req() req: any, @Body() dto: RegisterDeviceDto) {
    return this.androidUseCase.registerDevice(req.v3Context, dto);
  }

  @Post("device-token")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Dedicated endpoint to update FCM device token for authenticated member/user",
  })
  @ApiResponse({ status: 200, description: "FCM device token updated successfully" })
  async updateDeviceToken(@Req() req: any, @Body() dto: RegisterDeviceDto) {
    return this.androidUseCase.registerDevice(req.v3Context, dto);
  }

  @Get("dashboard")
  @ApiOperation({
    summary: "Get mobile operational summary and dashboard metrics for the active org",
  })
  @ApiResponse({ status: 200, description: "Dashboard summary retrieved successfully" })
  async getDashboardSummary(@Req() req: any) {
    return this.androidUseCase.getDashboardSummary(req.v3Context);
  }
}
