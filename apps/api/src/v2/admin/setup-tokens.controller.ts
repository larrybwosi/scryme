import { Controller, Get, Post, Delete, Body, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { PrismaService } from '@/prisma/prisma.service';
import { v2Context } from '@/common/decorators/v2-context.decorator';
import type { V2ApiContext } from '@repo/shared/api/v2/types';
import { Permissions } from '@/common/decorators/auth.decorator';
import {
  createDeviceSetupTokenCore as createDeviceSetupToken,
  getDeviceSetupTokensCore as listSetupTokens,
  revokeSetupTokenCore as revokeSetupToken,
} from '@repo/shared/lib/provisioning/common';

@ApiTags('Admin - Setup Tokens')
@ApiSecurity('x-api-key')
@ApiSecurity('x-member-token')
@Controller('admin/setup-tokens')
export class SetupTokensController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @Permissions('admin:devices:write')
  @ApiOperation({ summary: 'Create a new device setup token' })
  async create(@v2Context() ctx: V2ApiContext, @Body() body: any) {
    const result = await createDeviceSetupToken(this.prisma, {
      organizationId: ctx.organizationId,
      createdById: ctx.memberId!,
      deviceName: body.deviceName,
      deviceType: body.deviceType,
      locationId: body.locationId,
      permissions: body.permissions,
      allowedIps: body.allowedIps,
      environment: body.environment,
    });

    return {
      data: {
        ...result,
        setupToken: result.rawToken, // Maintain compatibility with old frontend/API response
      },
    };
  }

  @Get()
  @Permissions('admin:devices:read')
  @ApiOperation({ summary: 'List device setup tokens' })
  async list(
    @v2Context() ctx: V2ApiContext,
    @Query('includeUsed') includeUsed: string,
    @Query('includeExpired') includeExpired: string
  ) {
    return {
      data: {
        tokens: await listSetupTokens(this.prisma, ctx.organizationId, {
          includeUsed: includeUsed === 'true',
          includeExpired: includeExpired === 'true',
        }),
      },
    };
  }

  @Delete()
  @Permissions('admin:devices:write')
  @ApiOperation({ summary: 'Revoke a device setup token' })
  async revoke(@v2Context() ctx: V2ApiContext, @Query('tokenId') tokenId: string) {
    try {
      return {
        data: await revokeSetupToken(this.prisma, ctx.organizationId, tokenId),
      };
    } catch (err) {
      throw new BadRequestException(err instanceof Error ? err.message : 'Failed to revoke token');
    }
  }
}
