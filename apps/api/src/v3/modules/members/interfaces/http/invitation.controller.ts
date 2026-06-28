import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UnauthorizedException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from "@nestjs/swagger";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import { InvitationUseCase } from "../../application/use-cases/invitation.use-case";
import {
  CreateInvitationDto,
  InvitationQueryDto,
  InvitationResponseDto,
  AcceptInvitationDto,
} from "../../application/dto/invitation.dto";
import { Permissions } from "@/v3/common/decorators/permissions.decorator";
import { PermissionsGuard } from "@/v3/common/guards/permissions.guard";
import { ApiErrorResponseDto } from "@/v3/common/dto/response.dto";

@ApiTags("V3 Member Invitations")
@ApiBearerAuth()
@UseInterceptors(StandardResponseInterceptor)
@Controller(":orgSlug/members/invitations")
export class InvitationController {
  constructor(private readonly invitationUseCase: InvitationUseCase) {}

  @Get()
  @UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
  @Permissions("members:read")
  @ApiOperation({
    summary: "List pending invitations",
    operationId: "Invitations_List",
  })
  @ApiResponse({ status: 200, type: [InvitationResponseDto], description: "List of invitations" })
  async getInvitations(
    @Request() req: any,
    @Query() query: InvitationQueryDto,
  ) {
    return this.invitationUseCase.getInvitations(
      req.v3Context.organizationId,
      query,
    );
  }

  @Post()
  @UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
  @Permissions("members:write")
  @ApiOperation({
    summary: "Create and send an invitation",
    operationId: "Invitations_Create",
  })
  @ApiResponse({ status: 201, type: InvitationResponseDto })
  async createInvitation(
    @Request() req: any,
    @Body() dto: CreateInvitationDto,
  ) {
    const inviterId = req.v3Context.memberId;
    const inviterUserId = req.v3Context.userId || req.user?.id;
    if (!inviterUserId)
      throw new UnauthorizedException("Inviter user ID not found");

    return this.invitationUseCase.createInvitation(
      req.v3Context.organizationId,
      dto,
      inviterId,
      inviterUserId,
    );
  }

  @Delete(":id")
  @UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
  @Permissions("members:write")
  @ApiOperation({
    summary: "Revoke an invitation",
    operationId: "Invitations_Revoke",
  })
  @ApiResponse({ status: 200, description: "Invitation revoked" })
  async revokeInvitation(@Request() req: any, @Param("id") id: string) {
    const actorId = req.v3Context.memberId;
    return this.invitationUseCase.revokeInvitation(
      req.v3Context.organizationId,
      id,
      actorId,
    );
  }

  @Post("accept")
  @UseGuards(V3AuthGuard)
  @ApiOperation({
    summary: "Accept an invitation",
    operationId: "Invitations_Accept",
  })
  @ApiResponse({ status: 200, description: "Invitation accepted" })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto, description: "Invalid invitation" })
  async acceptInvitation(
    @Request() req: any,
    @Body() dto: AcceptInvitationDto,
  ) {
    const userId = req.v3Context.userId || req.user?.id;
    if (!userId) throw new UnauthorizedException("User not authenticated");
    return this.invitationUseCase.acceptInvitation(dto, userId);
  }
}
