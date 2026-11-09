import {
  Controller,
  Post,
  Req,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Query,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { AllowPublic } from "@/v3/common/auth";
import { GitHubReleaseService } from "../../infrastructure/services/github-release.service";

@ApiTags("V3 GitHub Webhook Receiver")
@Controller("webhooks/github")
export class GitHubWebhookController {
  private readonly logger = new Logger(GitHubWebhookController.name);

  constructor(private readonly gitHubReleaseService: GitHubReleaseService) {}

  @AllowPublic()
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Receive GitHub App webhooks (releases, tag pushes, tag creation) and sync binaries",
    operationId: "Webhooks_ReceiveGitHubWebhook",
  })
  @ApiResponse({ status: 200, description: "GitHub webhook processed successfully" })
  async receiveGitHubWebhook(
    @Req() req: any,
    @Headers("x-github-event") eventHeader: string,
    @Headers("x-hub-signature-256") signatureHeader: string,
    @Body() body: any,
  ) {
    const rawBody = req.rawBody ? req.rawBody.toString("utf-8") : JSON.stringify(body);
    const isValid = await this.gitHubReleaseService.verifyGithubSignature(
      rawBody,
      signatureHeader,
    );

    if (!isValid) {
      this.logger.error("Invalid GitHub webhook signature received");
      throw new UnauthorizedException("Invalid GitHub webhook signature");
    }

    return this.gitHubReleaseService.handleWebhookPayload(eventHeader, body);
  }

  @AllowPublic()
  @Post("sync-release")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Manually or programmatically trigger release binary synchronization from GitHub",
    operationId: "Webhooks_SyncGitHubRelease",
  })
  @ApiQuery({ name: "tag", required: false, type: String })
  async syncRelease(@Query("tag") tag?: string) {
    return this.gitHubReleaseService.syncReleaseFromGithub(tag);
  }
}
