import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  Headers,
  NotFoundException,
} from "@nestjs/common";
import {ScrymeService} from "./scryme.service";
import {AllowPublic} from "../../common/decorators/auth.decorator";
import {PrismaService} from "../../prisma/prisma.service";

@Controller("v2/scryme")
export class ScrymeController {
  constructor(
    private readonly scrymeService: ScrymeService,
    private readonly prisma: PrismaService,
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
  async provision(@Req() req: any) {
    const ctx = req.v2Context;

    // Fetch actual organization details
    const org = await this.prisma.client.organization.findUnique({
      where: {id: ctx.organizationId},
    });

    if (!org) {
      throw new NotFoundException("Organization not found");
    }

    return this.scrymeService.provisionWorkspace(org.id, org.name, org.slug);
  }

  @Get("config")
  async getConfig(@Req() req: any) {
    const ctx = req.v2Context;
    return this.scrymeService.getConfiguration(ctx.organizationId);
  }
}
