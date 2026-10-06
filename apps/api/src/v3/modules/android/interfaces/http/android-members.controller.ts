import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
  ApiQuery,
} from "@nestjs/swagger";
import { V3AuthGuard } from "../../../../common/guards/v3-auth.guard";
import { StandardResponseInterceptor } from "../../../../common/interceptors/standard-response.interceptor";
import { AndroidMembersUseCase } from "../../application/use-cases/android-members.use-case";
import { AndroidUpdateMemberDto, AndroidUpdateMemberStatusDto } from "../../application/dto/android-auth.dto";

@ApiTags("V3 Android Members")
@Controller("v3/android/members")
@UseGuards(V3AuthGuard)
@UseInterceptors(StandardResponseInterceptor)
@ApiBearerAuth()
@ApiHeader({ name: "x-org-slug", required: false })
export class AndroidMembersController {
  constructor(private readonly androidMembersUseCase: AndroidMembersUseCase) {}

  @Get()
  @ApiOperation({ summary: "List organization staff members for Android" })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "role", required: false })
  @ApiResponse({ status: 200, description: "Members retrieved successfully" })
  async getMembers(
    @Req() req: any,
    @Query("search") search?: string,
    @Query("role") role?: string,
  ) {
    return this.androidMembersUseCase.getMembers(req.v3Context, search, role);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get member details by ID for Android" })
  @ApiResponse({ status: 200, description: "Member retrieved successfully" })
  async getMember(@Req() req: any, @Param("id") id: string) {
    return this.androidMembersUseCase.getMemberById(req.v3Context, id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update member profile details for Android" })
  @ApiResponse({ status: 200, description: "Member updated successfully" })
  async updateMember(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: AndroidUpdateMemberDto,
  ) {
    return this.androidMembersUseCase.updateMember(req.v3Context, id, dto);
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Update member duty status for Android" })
  @ApiResponse({ status: 200, description: "Member status updated successfully" })
  async updateStatus(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: AndroidUpdateMemberStatusDto,
  ) {
    return this.androidMembersUseCase.updateMemberStatus(req.v3Context, id, dto);
  }
}
