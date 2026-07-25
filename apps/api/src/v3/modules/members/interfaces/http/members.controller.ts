import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from "@nestjs/swagger";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import { MemberUseCase } from "../../application/use-cases/member.use-case";
import {
  CreateMemberDto,
  UpdateMemberDto,
  MemberQueryDto,
  MemberResponseDto,
  TerminalLoginDto,
  TerminalLoginResponseDto,
} from "../../application/dto/member.dto";
import { Status } from "@repo/db";
import { Permissions } from "@/v3/common/decorators/permissions.decorator";
import { PermissionsGuard } from "@/v3/common/guards/permissions.guard";
import { AllowPublic } from "@/common/decorators/auth.decorator";
import { PrismaService } from "@/prisma/prisma.service";

@ApiTags("V3 Members")
@ApiBearerAuth()
@UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
@UseInterceptors(StandardResponseInterceptor)
@Controller(":orgSlug/members")
@ApiParam({ name: "orgSlug", type: "string" })
export class MembersController {
  constructor(private readonly memberUseCase: MemberUseCase) {}

  @Get()
  @Permissions("members:read")
  @ApiOperation({ summary: "List members with pagination and filtering" })
  @ApiResponse({ status: 200, type: [MemberResponseDto] })
  async getMembers(@Request() req: any, @Query() query: MemberQueryDto) {
    return this.memberUseCase.getMembers(req.v3Context.organizationId, query);
  }

  @Get(":id")
  @Permissions("members:read")
  @ApiOperation({ summary: "Get member by ID" })
  @ApiResponse({ status: 200, type: MemberResponseDto })
  async getMember(@Request() req: any, @Param("id") id: string) {
    return this.memberUseCase.getMember(req.v3Context.organizationId, id);
  }

  @Post()
  @Permissions("members:write")
  @ApiOperation({ summary: "Create a new member directly" })
  @ApiResponse({ status: 201, type: MemberResponseDto })
  async createMember(@Request() req: any, @Body() dto: CreateMemberDto) {
    const inviterId = req.v3Context.memberId;
    return this.memberUseCase.createMember(
      req.v3Context.organizationId,
      dto,
      inviterId,
    );
  }

  @Patch(":id")
  @Permissions("members:write")
  @ApiOperation({ summary: "Update member details" })
  @ApiResponse({ status: 200, type: MemberResponseDto })
  async updateMember(
    @Request() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateMemberDto,
  ) {
    const actorId = req.v3Context.memberId;
    return this.memberUseCase.updateMember(
      req.v3Context.organizationId,
      id,
      dto,
      actorId,
    );
  }

  @Delete(":id")
  @Permissions("members:delete")
  @ApiOperation({ summary: "Soft-delete a member" })
  @ApiResponse({ status: 200 })
  async deleteMember(@Request() req: any, @Param("id") id: string) {
    const actorId = req.v3Context.memberId;
    return this.memberUseCase.deleteMember(
      req.v3Context.organizationId,
      id,
      actorId,
    );
  }

  @Get(":id/activity")
  @Permissions("members:read")
  @ApiOperation({ summary: "Get audit logs for a specific member" })
  async getMemberActivity(
    @Request() req: any,
    @Param("id") id: string,
    @Query() query: any,
  ) {
    return this.memberUseCase.getMemberAuditLogs(
      req.v3Context.organizationId,
      id,
      query,
    );
  }

  @Patch(":id/status")
  @Permissions("members:write")
  @ApiOperation({ summary: "Update member real-time status" })
  async updateStatus(
    @Request() req: any,
    @Param("id") id: string,
    @Body("status") status: Status,
  ) {
    const actorId = req.v3Context.memberId;
    return this.memberUseCase.updateMemberStatus(
      req.v3Context.organizationId,
      id,
      status,
      actorId,
    );
  }
}

@ApiTags("V3 Members Terminal")
@UseGuards(V3AuthGuard)
@UseInterceptors(StandardResponseInterceptor)
@Controller("members")
export class TerminalMembersController {
  constructor(
    private readonly memberUseCase: MemberUseCase,
    private readonly prisma: PrismaService,
  ) {}

  @AllowPublic()
  @Post("login")
  @ApiOperation({ summary: "Login member via terminal" })
  @ApiResponse({ status: 200, type: TerminalLoginResponseDto })
  async login(@Request() req: any, @Body() dto: TerminalLoginDto) {
    let organizationId = req.v3Context?.organizationId;
    if (!organizationId) {
      const orgSlug = req.headers["x-organization-slug"] || req.headers["x-org-slug"];
      const orgIdHeader = req.headers["x-organization-id"] || req.headers["x-org-id"];

      if (orgIdHeader) {
        organizationId = Array.isArray(orgIdHeader) ? orgIdHeader[0] : orgIdHeader;
      } else if (orgSlug) {
        const slugStr = Array.isArray(orgSlug) ? orgSlug[0] : orgSlug;
        const org = await this.prisma.client.organization.findUnique({
          where: { slug: slugStr },
        });
        if (org) {
          organizationId = org.id;
        }
      }
    }

    let locationId = req.v3Context?.locationId || req.headers["x-location-id"];
    if (Array.isArray(locationId)) {
      locationId = locationId[0];
    }
    if (!locationId && organizationId) {
      const firstLoc = await this.prisma.client.inventoryLocation.findFirst({
        where: { organizationId, isActive: true },
      });
      if (firstLoc) {
        locationId = firstLoc.id;
      }
    }

    return this.memberUseCase.login(
      organizationId,
      locationId,
      dto.cardId,
      dto.pin,
    );
  }
}
