import { Controller, Get, Patch, Param, Body } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { v2Context } from "../../common/decorators/v2-context.decorator";
import type { V2ApiContext } from "@repo/shared/api/v2";

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // --- Profile & Account Section ---

  @Get(":id/profile")
  async getProfile(@v2Context() ctx: V2ApiContext, @Param("id") id: string) {
    return this.usersService.getProfile(ctx, id);
  }

  @Patch(":id/profile")
  async updateProfile(
    @v2Context() ctx: V2ApiContext,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.usersService.updateProfile(ctx, id, body);
  }
}
