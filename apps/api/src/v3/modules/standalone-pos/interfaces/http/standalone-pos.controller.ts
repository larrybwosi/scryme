import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Headers,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiParam } from "@nestjs/swagger";
import { StandalonePosService } from "../../infrastructure/services/standalone-pos.service";
import {
  CreateSetupKeyDto,
  ActivateDeviceDto,
  LinkOrganizationDto,
} from "../../application/dto/standalone-pos.dto";
import { SystemAdminGuard } from "../../../../common/guards/system-admin.guard";

@ApiTags("V3 Standalone POS")
@Controller("standalone-pos")
export class StandalonePosController {
  constructor(private readonly standalonePosService: StandalonePosService) {}

  @Post("setup-keys")
  @ApiOperation({
    summary: "Create a new setup key for a standalone POS device",
  })
  @UseGuards(SystemAdminGuard)
  async createSetupKey(@Body() dto: CreateSetupKeyDto) {
    return this.standalonePosService.createSetupKey(dto);
  }

  @Post("activate")
  @ApiOperation({
    summary: "Redeem a setup key to activate a standalone POS device",
  })
  async activateDevice(@Body() dto: ActivateDeviceDto) {
    return this.standalonePosService.activateDevice(dto);
  }

  @Get("validate")
  @ApiOperation({ summary: "Validate a long-lived standalone device key" })
  @ApiHeader({
    name: "X-Standalone-Key",
    description: "The long-lived standalone device key",
  })
  async validateKey(@Headers("x-standalone-key") key: string) {
    if (!key) {
      throw new UnauthorizedException("Missing X-Standalone-Key header");
    }
    return this.standalonePosService.validateKey(key);
  }

  @Patch("link-org")
  @ApiOperation({ summary: "Link a standalone device to an organization" })
  @UseGuards(SystemAdminGuard)
  async linkOrganization(@Body() dto: LinkOrganizationDto) {
    return this.standalonePosService.linkOrganization(dto);
  }
}
