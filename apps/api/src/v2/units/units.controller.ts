import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { UnitsService } from "./units.service";
import { v2Context } from "../../common/decorators/v2-context.decorator";
import {
  RequirePermission,
  AllowPublic,
} from "../../common/decorators/auth.decorator";
import type { V2ApiContext } from "@repo/shared/server";

@ApiTags("Units")
@Controller("units")
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get("system")
  @RequirePermission("product:read:all")
  async getSystemUnits() {
    return this.unitsService.getSystemUnits();
  }

  @Get("public/system")
  @AllowPublic()
  async getPublicSystemUnits() {
    return this.unitsService.getSystemUnits();
  }

  @Get("organization")
  @RequirePermission("product:read:all")
  async getOrganizationUnits(@v2Context() ctx: V2ApiContext) {
    return this.unitsService.getOrganizationUnits(ctx);
  }

  @Post("organization")
  @RequirePermission("product:manage:stock")
  async createOrganizationUnit(
    @v2Context() ctx: V2ApiContext,
    @Body() data: any,
  ) {
    return this.unitsService.createOrganizationUnit(ctx, data);
  }

  @Patch("organization/:id")
  @RequirePermission("product:manage:stock")
  async updateOrganizationUnit(
    @v2Context() ctx: V2ApiContext,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.unitsService.updateOrganizationUnit(ctx, id, data);
  }

  @Delete("organization/:id")
  @RequirePermission("product:manage:stock")
  async deleteOrganizationUnit(
    @v2Context() ctx: V2ApiContext,
    @Param("id") id: string,
  ) {
    return this.unitsService.deleteOrganizationUnit(ctx, id);
  }

  @Get("sync")
  @RequirePermission("product:read:all")
  @ApiOperation({ summary: "Delta sync units and conversions" })
  async syncUnits(
    @v2Context() ctx: V2ApiContext,
    @Query("lastSync") lastSync?: string,
  ) {
    return this.unitsService.syncUnits(ctx, lastSync);
  }
}
