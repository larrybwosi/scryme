import {
  Controller,
  Post,
  Body,
  Get,
  Headers,
  NotFoundException,
  UseGuards,
} from "@nestjs/common";
import { ScrymeService } from "./scryme.service";
import { AllowPublic } from "@/common/decorators/auth.decorator";
import { v3Context } from "@/v3/common/decorators/v3-context.decorator";
import { type V3ApiContext } from "@repo/shared/api/v3";
import { PrismaService } from "@/prisma/prisma.service";
import { ScrymeApprovalService } from "./scryme-approval.service";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { PermissionsGuard } from "@/v3/common/guards/permissions.guard";
import { Permissions } from "@/v3/common/decorators/permissions.decorator";

@Controller("v3/scryme")
@UseGuards(V3AuthGuard, PermissionsGuard)
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
  @Permissions("settings:manage")
  async provision(@v3Context() ctx: V3ApiContext) {
    const org = await this.prisma.client.organization.findUnique({
      where: { id: ctx.organizationId },
    });

    if (!org) {
      throw new NotFoundException("Organization not found");
    }

    let ownerEmail: string | undefined;
    if (ctx.memberId) {
      const member = await this.prisma.client.member.findUnique({
        where: { id: ctx.memberId },
        include: { user: true },
      });
      ownerEmail = member?.user?.email || undefined;
    }

    const config = await this.scrymeService.provisionWorkspace(
      org.id,
      org.name,
      org.slug,
      ownerEmail,
    );

    await this.scrymeService.syncAllChannels(ctx.organizationId);

    return config;
  }

  @Post("sync-channels")
  @Permissions("settings:manage")
  async syncChannels(@v3Context() ctx: V3ApiContext) {
    await this.scrymeService.syncAllChannels(ctx.organizationId);
    return { status: "success", message: "Channel sync completed" };
  }

  @Post("notify")
  @Permissions("settings:manage")
  async notify(
    @v3Context() ctx: V3ApiContext,
    @Body("requestId") requestId: string,
  ) {
    return this.scrymeApprovalService.notifyApprovers(
      ctx.organizationId,
      requestId,
    );
  }

  @Post("update-messages")
  @Permissions("settings:manage")
  async updateMessages(
    @v3Context() ctx: V3ApiContext,
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
  @Permissions("settings:manage")
  async notifyRequester(
    @v3Context() ctx: V3ApiContext,
    @Body("requestId") requestId: string,
  ) {
    return this.scrymeApprovalService.notifyRequester(
      ctx.organizationId,
      requestId,
    );
  }

  @Get("config")
  @Permissions("settings:manage")
  async getConfig(@v3Context() ctx: V3ApiContext) {
    return this.scrymeService.getConfiguration(ctx.organizationId);
  }

  @Post("sync-users")
  @Permissions("settings:manage")
  async syncUsers(@v3Context() ctx: V3ApiContext) {
    await this.scrymeService.syncUsers(ctx.organizationId, true);
    return { status: "success", message: "User sync completed" };
  }
}
