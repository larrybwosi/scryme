import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ZitadelCustomerService } from '../zitadel/zitadel-customer.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { validateDeviceKey, verifyMemberToken, verifyZitadelJwt, ROLE_PERMISSIONS, V2ApiContext } from '@repo/shared/server';
import { verifyToken as verifyV2Token } from '../lib/api/v2/security/tokens';
import { ALLOW_PUBLIC_KEY } from '../common/decorators/auth.decorator';
import { FastifyRequest } from 'fastify';
import { db } from '@repo/db';

@Injectable()
export class V2AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
    private redis: RedisService,
    private zitadelCustomer: ZitadelCustomerService,
    @InjectQueue('zitadel-sync') private zitadelSyncQueue: Queue
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(ALLOW_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<any>();
    const correlationId = (request.headers['x-correlation-id'] as string) || 'unknown';
    const ipAddress = (
      (request.headers['x-forwarded-for'] as string) ||
      (request.headers['x-real-ip'] as string) ||
      'unknown'
    )
      .split(',')[0]
      .trim();
    const userAgent = request.headers['user-agent'] || 'unknown';

    // 1. Authenticate Device
    let apiKey = request.headers['x-api-key'] as string;
    if (!apiKey) {
      apiKey = (request as any).cookies?.['dealio_device_key'];
    }

    let deviceAuth = null;
    if (apiKey) {
      deviceAuth = await validateDeviceKey(this.prisma.client, apiKey, ipAddress);
    }

    // 2. Authenticate Member
    let memberToken = request.headers['x-member-token'] as string;
    if (!memberToken) {
      memberToken = (request as any).cookies?.['dealio_member_token'];
    }

    let memberAuth = null;
    if (memberToken) {
      try {
        const payload = await verifyMemberToken(memberToken);
        if (payload) {
          const member = await this.prisma.client.member.findUnique({
            where: { id: payload.memberId },
            select: {
              id: true,
              role: true,
              isActive: true,
              user: { select: { name: true } },
              customRoles: { select: { permissions: true } },
            },
          });

          if (member && member.isActive) {
            const basePermissions = ROLE_PERMISSIONS[member.role] ?? [];
            const customPermissions = member.customRoles.flatMap((r: any) => r.permissions);
            const permissions = [...new Set([...basePermissions, ...customPermissions])];

            memberAuth = {
              memberId: payload.memberId,
              organizationId: payload.organizationId,
              memberName: member.user ? `${member.user.name}` : undefined,
              permissions,
            };
          }
        }
      } catch (err) {}
    }

    // 3. Authenticate Bearer (Zitadel or OAuth)
    let bearerAuth = null;
    const authHeader = request.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      // Check for V2 API Token first
      const v2TokenResult = verifyV2Token(token);
      if (v2TokenResult.valid) {
        bearerAuth = {
          organizationId: v2TokenResult.organizationId,
          deviceId: v2TokenResult.deviceId,
          locationId: v2TokenResult.locationId,
          permissions: v2TokenResult.permissions,
          authType: 'oauth' as const,
          jwtPayload: v2TokenResult.jwtPayload,
          scopes: [], // OAuth tokens use permissions directly in this context
        };
      } else {
        // Fallback to Zitadel
        const zitadelDomain = process.env.ZITADEL_DOMAIN;
        const zitadelAudience = process.env.ZITADEL_CLIENT_ID;

        if (zitadelDomain && zitadelAudience) {
          try {
            const zitadelPayload = await verifyZitadelJwt(token, this.redis, zitadelDomain, zitadelAudience);
            const zitadelOrgId = zitadelPayload['urn:zitadel:iam:org:id'];
            if (zitadelPayload && zitadelOrgId) {
              const cfg = await this.prisma.client.zitadelConfiguration.findUnique({
                where: { zitadelOrgId: zitadelOrgId },
                select: { organizationId: true, isActive: true },
              });
              if (cfg?.isActive) {
                // Offload sync to queue for high traffic
                await this.zitadelSyncQueue.add('sync', {
                  organizationId: cfg.organizationId,
                  zitadelUserId: zitadelPayload.sub,
                  jwtPayload: zitadelPayload,
                });

                // Try to get existing mapping immediately if available, without waiting for full sync
                const mapping = await db.externalMapping.findFirst({
                  where: {
                    organizationId: cfg.organizationId,
                    provider: 'ZITADEL',
                    externalId: zitadelPayload.sub,
                    entityType: 'CRM_RECORD',
                  },
                });

                bearerAuth = {
                  organizationId: cfg.organizationId,
                  zitadelUserId: zitadelPayload.sub,
                  customerId: mapping?.internalId,
                  scopes: (zitadelPayload.scope ?? '').split(' ').filter(Boolean),
                  authType: 'zitadel' as const,
                  jwtPayload: zitadelPayload,
                };
              }
            }
          } catch (err) {}
        }
      }
    }

    if (!isPublic && !deviceAuth && !memberAuth && !bearerAuth) {
      throw new UnauthorizedException('Authentication required');
    }

    let authType: V2ApiContext['authType'] = 'device';
    if (deviceAuth && memberAuth) {
      authType = 'hybrid';
    } else if (memberAuth) {
      authType = 'member';
    } else if (bearerAuth) {
      authType = bearerAuth.authType;
    }

    request.v2Context = {
      organizationId: deviceAuth?.organizationId || memberAuth?.organizationId || bearerAuth?.organizationId || '',
      deviceId: deviceAuth?.deviceId || bearerAuth?.deviceId,
      locationId: deviceAuth?.locationId || bearerAuth?.locationId,
      memberId: memberAuth?.memberId,
      memberName: memberAuth?.memberName,
      zitadelUserId: bearerAuth?.zitadelUserId,
      customerId: bearerAuth?.customerId,
      authType,
      permissions: [...(deviceAuth?.permissions || []), ...(memberAuth?.permissions || []), ...(bearerAuth?.permissions || [])],
      scopes: bearerAuth?.scopes || [],
      jwtPayload: bearerAuth?.jwtPayload,
      correlationId,
      ipAddress,
      userAgent,
      requestStartTime: Date.now(),
    };

    return true;
  }
}
