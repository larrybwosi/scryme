import { Controller, Get, Post, Body, Query, Param, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CommunicationIntegrationService } from '../../application/use-cases/communication-integration.service';
import { V3AuthGuard } from '@/v3/common/guards/v3-auth.guard';
import { CurrentUser } from '@/v3/common/decorators/current-user.decorator';

@ApiTags('v3/crm-integrations')
@Controller('crm-integrations')
export class CommunicationController {
  constructor(private readonly service: CommunicationIntegrationService) {}

  @Get(':provider/auth')
  @ApiOperation({ summary: 'Get OAuth2 authorization URL' })
  @UseGuards(V3AuthGuard)
  getAuthUrl(@Param('provider') provider: string, @CurrentUser() user: any) {
    return { url: this.service.getProvider(provider).getAuthUrl(user.organizationId) };
  }

  @Get(':provider/callback')
  @ApiOperation({ summary: 'OAuth2 callback' })
  async handleCallback(
    @Param('provider') provider: string,
    @Query('code') code: string,
    @Query('state') organizationId: string,
    @Res() res: any
  ) {
    const result = await this.service.getProvider(provider).handleCallback(code);

    // Redirect back to CRM UI
    res.redirect(`https://app.example.com/crm/integrations/${provider}?success=true`);
  }

  @Post(':provider/webhook')
  @ApiOperation({ summary: 'Generic webhook receiver for providers' })
  async handleWebhook(
    @Param('provider') provider: string,
    @Body() payload: any,
    @Query() query: any
  ) {
    // Special handling for Slack challenge
    if (payload.type === 'url_verification') {
      return { challenge: payload.challenge };
    }

    return this.service.handleWebhook(provider, payload, query);
  }

  @Post('activities/:id/reply')
  @ApiOperation({ summary: 'Reply to a communication activity' })
  @UseGuards(V3AuthGuard)
  async reply(
    @Param('id') activityId: string,
    @Body('text') text: string,
    @CurrentUser() user: any
  ) {
    return this.service.replyToActivity(user.organizationId, activityId, text);
  }
}
