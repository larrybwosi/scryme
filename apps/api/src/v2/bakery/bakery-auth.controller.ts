import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { BakeryService } from './bakery.service';
import { AllowPublic } from '../../common/decorators/auth.decorator';
import { v2Context } from '../../common/decorators/v2-context.decorator';
import { type V2ApiContext } from '@repo/shared/server';
import type { FastifyRequest, FastifyReply } from 'fastify';

@ApiTags('Bakery Auth')
@Controller('bakery/auth')
export class BakeryAuthController {
  constructor(private readonly bakeryService: BakeryService) {}

  @AllowPublic()
  @Post('setup')
  @ApiOperation({ summary: 'Setup bakery device authentication' })
  @ApiBody({ schema: { type: 'object', properties: { apiKey: { type: 'string' } }, required: ['apiKey'] } })
  async setup(
    @Body('apiKey') apiKey: string,
    @Req() req: any,
    @Res() res: any,
  ) {
    if (!apiKey) {
      throw new BadRequestException('API key is required');
    }

    const ipAddress = ((req.headers['x-forwarded-for'] as string) || (req.headers['x-real-ip'] as string) || 'unknown').split(',')[0].trim();

    const deviceContext = await this.bakeryService.validateDevice(apiKey, ipAddress);

    if (!deviceContext) {
      throw new UnauthorizedException('Invalid API key');
    }

    const cookieOptions = this.bakeryService.getCookieOptions(60 * 60 * 24 * 365); // 1 year

    res.setCookie('dealio_device_key', apiKey, cookieOptions);

    return res.send({
      success: true,
      data: {
        message: 'Device configured successfully',
        organizationId: deviceContext.organizationId,
        locationId: deviceContext.locationId,
      },
    });
  }

  @AllowPublic()
  @Get('status')
  @ApiOperation({ summary: 'Check bakery authentication status' })
  async status(@v2Context() ctx: V2ApiContext) {
    const hasDeviceKey = !!ctx.organizationId && (ctx.authType === 'device' || ctx.authType === 'hybrid');
    const hasMemberToken = !!ctx.memberId;

    return {
      hasDeviceKey,
      hasMemberToken,
      authenticated: hasDeviceKey && hasMemberToken,
    };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout from bakery app' })
  async logout(@Res() res: any) {
    const cookieOptions = this.bakeryService.getCookieOptions(0);

    res.clearCookie('dealio_device_key', cookieOptions);
    res.clearCookie('dealio_member_token', cookieOptions);

    return res.send({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  }

  @Post('sso')
  @ApiOperation({ summary: 'SSO login for dashboard users into bakery app' })
  async sso(
    @v2Context() ctx: V2ApiContext,
    @Req() req: any,
    @Res() res: any,
  ) {
    // 1. Get current dashboard session auth
    const session = await this.bakeryService.getDashboardSession(req);

    if (!session || !session.user || (session.session as any).organizationId !== ctx.organizationId) {
       // We might need to check how organizationId is stored in the session by better-auth
       // For now let's assume it matches what we expect or we'll refine it
       if (!session) throw new UnauthorizedException('Invalid dashboard session');
       if ((session.session as any).organizationId !== ctx.organizationId) {
          throw new UnauthorizedException('Organization mismatch');
       }
    }

    // 2. Process SSO login (attendance, token generation)
    const { token, member } = await this.bakeryService.processSSO(session, ctx);

    const cookieOptions = this.bakeryService.getCookieOptions(60 * 60 * 12); // 12 hours
    res.setCookie('dealio_member_token', token, cookieOptions);

    return res.send({
      success: true,
      data: {
        member: {
          id: member.id,
          role: member.role,
          user: member.user,
        },
        token,
      },
    });
  }
}
