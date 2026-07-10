import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  Headers,
  NotFoundException,
  UseGuards,
} from "@nestjs/common";
import { ScrymeService } from "./scryme.service";
import {
  AllowPublic,
  RequirePermission,
} from "../../common/decorators/auth.decorator";
import { v2Context } from "../../common/decorators/v2-context.decorator";
import { type V2ApiContext } from "@repo/shared/api/v2";
import { PrismaService } from "../../prisma/prisma.service";
import { ScrymeApprovalService } from "./scryme-approval.service";

@Controller("v2/scryme")
export class ScrymeController {
  constructor(
    private readonly scrymeService: ScrymeService,
    private readonly prisma: PrismaService,
    private readonly scrymeApprovalService: ScrymeApprovalService,
  ) {}

  @AllowPublic()
  @Post("webhook")
  async handleWebhook(
    @Body() payload: any,
    @Headers("x-scryme-signature") signature: string,
  ) {
    return this.scrymeService.handleWebhook(signature, payload);
  }

  @Post("provision")
  @RequirePermission("settings:manage")
  async provision(@v2Context() ctx: V2ApiContext) {
    // Fetch actual organization details
    const org = await this.prisma.client.organization.findUnique({
      where: { id: ctx.organizationId },
    });

    if (!org) {
      throw new NotFoundException("Organization not found");
    }

    return this.scrymeService.provisionWorkspace(org.id, org.name, org.slug);
  }

  @Post("notify")
  @RequirePermission("settings:manage")
  async notify(
    @v2Context() ctx: V2ApiContext,
    @Body("requestId") requestId: string,
  ) {
    return this.scrymeApprovalService.notifyApprovers(
      ctx.organizationId,
      requestId,
    );
  }

  @Post("update-messages")
  @RequirePermission("settings:manage")
  async updateMessages(
    @v2Context() ctx: V2ApiContext,
    @Body() data: { requestId: string; memberId: string; stepNumber: number },
  ) {
    return this.scrymeApprovalService.updateStepMessages(
      ctx.organizationId,
      data.requestId,
      data.memberId,
      data.stepNumber,
    );
  }

  @Post("notify-requester")
  @RequirePermission("settings:manage")
  async notifyRequester(
    @v2Context() ctx: V2ApiContext,
    @Body("requestId") requestId: string,
  ) {
    return this.scrymeApprovalService.notifyRequester(
      ctx.organizationId,
      requestId,
    );
  }

  @Get("config")
  @RequirePermission("settings:manage")
  async getConfig(@v2Context() ctx: V2ApiContext) {
    return this.scrymeService.getConfiguration(ctx.organizationId);
  }

  @Post("sync-users")
  @RequirePermission("settings:manage")
  async syncUsers(@v2Context() ctx: V2ApiContext) {
    await this.scrymeService.syncUsers(ctx.organizationId, true); // Force sync
    return { status: "success", message: "User sync completed" };
  }
}
