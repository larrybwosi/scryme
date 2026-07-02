import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  Query,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiSecurity } from "@nestjs/swagger";
import { MembersService } from "./members.service";
import { v2Context } from "../../common/decorators/v2-context.decorator";
import { type V2ApiContext } from "@repo/shared/api/v2";
import { Permissions, AllowPublic } from "../../common/decorators/auth.decorator";

@ApiTags("Members")
@ApiSecurity("x-api-key")
@Controller("members")
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  @Permissions("members:read")
  @ApiOperation({ summary: "List members" })
  async getMembers(@v2Context() ctx: V2ApiContext, @Query() query: any) {
    return this.membersService.getMembers(ctx, query);
  }

  @Get(":id")
  @Permissions("members:read")
  @ApiOperation({ summary: "Get member by ID" })
  async getMember(@v2Context() ctx: V2ApiContext, @Param("id") id: string) {
    return this.membersService.getMember(ctx, id);
  }

  @Post()
  @Permissions("members:write")
  @ApiOperation({ summary: "Create a new member" })
  async createMember(@v2Context() ctx: V2ApiContext, @Body() body: any) {
    return this.membersService.createMember(ctx, body);
  }

  @Patch(":id")
  @Permissions("members:write")
  @ApiOperation({ summary: "Update a member" })
  async updateMember(
    @v2Context() ctx: V2ApiContext,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.membersService.updateMember(ctx, id, body);
  }

  @Delete(":id")
  @Permissions("members:delete")
  @ApiOperation({ summary: "Delete a member" })
  async deleteMember(@v2Context() ctx: V2ApiContext, @Param("id") id: string) {
    return this.membersService.deleteMember(ctx, id);
  }

  @Post(":id/unban")
  @Permissions("members:write")
  @ApiOperation({ summary: "Unban a member" })
  async unbanMember(@v2Context() ctx: V2ApiContext, @Param("id") id: string) {
    return this.membersService.unbanMember(ctx, id);
  }

  @Post(":id/pin")
  @Permissions("members:write")
  @ApiOperation({ summary: "Change member PIN" })
  async changeMemberPin(
    @v2Context() ctx: V2ApiContext,
    @Param("id") id: string,
    @Body("pin") pin: string,
  ) {
    return this.membersService.changeMemberPin(ctx, id, pin);
  }

  @AllowPublic()
  @Post("login")
  @ApiOperation({ summary: "Login member via terminal" })
  async login(
    @v2Context() ctx: V2ApiContext,
    @Body() body: { cardId: string; pin: string; locationId?: string },
  ) {
    return this.membersService.login(
      ctx,
      body.cardId,
      body.pin,
      body.locationId,
    );
  }

  @Get("attendance/me/status")
  @ApiOperation({ summary: "Get status of the current member" })
  async getMyStatus(@v2Context() ctx: V2ApiContext) {
    if (!ctx.memberId) throw new UnauthorizedException("Member context required");
    return this.membersService.getMemberStatus(ctx, ctx.memberId);
  }
}
