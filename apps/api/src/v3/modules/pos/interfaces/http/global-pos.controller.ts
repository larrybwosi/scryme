import { Controller, Post, Body, UseInterceptors, BadRequestException } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V3AuthCoreService } from "../../../auth-core/infrastructure/services/v3-auth-core.service";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import { ProvisionResponseDto } from "../../application/dto/pos.dto";
import { ApiErrorResponseDto } from "@/v3/common/dto/response.dto";
import { AllowPublic } from "@/common/decorators/auth.decorator";

@ApiTags("V3 Global POS")
@Controller(["global/pos", "pos"])
@UseInterceptors(StandardResponseInterceptor)
export class GlobalPosController {
  constructor(private readonly authCore: V3AuthCoreService) {}

  @AllowPublic()
  @Post("provision")
  @ApiOperation({
    summary: "Provision a new POS device using a setup token (Global endpoint)",
    operationId: "POS_GlobalProvision",
  })
  @ApiResponse({
    status: 201,
    type: ProvisionResponseDto,
    description: "Device provisioned",
  })
  @ApiResponse({
    status: 400,
    type: ApiErrorResponseDto,
    description: "Invalid token",
  })
  async provision(@Body() body: any) {
    const token = body?.token || body?.setupToken;
    if (!token) {
      throw new BadRequestException("token or setupToken is required");
    }
    return this.authCore.provisionDevice(token);
  }
}
