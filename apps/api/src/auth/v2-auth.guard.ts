import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ZitadelCustomerService } from '../zitadel/zitadel-customer.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { V2ApiContext, ROLE_PERMISSIONS } from '@repo/shared/api/v2/types';
import { validateDeviceKey, verifyMemberToken } from '@repo/shared/api/v2/services/auth';
import { verifyZitadelJwt } from '@repo/shared/api/v2/services/zitadel/jwks';
import { ALLOW_PUBLIC_KEY } from '../common/decorators/auth.decorator';
import { OpenObserveService } from '../common/services/openobserve.service';
import { FastifyRequest } from 'fastify';
import { db } from '@repo/db';
import { env } from '@repo/env';

@Injectable()
export class V2AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
    private redis: RedisService,
    private zitadelCustomer: ZitadelCustomerService,
    @InjectQueue('zitadel-sync') private zitadelSyncQueue: Queue,
    private openObserve: OpenObserveService,
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
      const zitadelDomain = env.ZITADEL_DOMAIN;
      const zitadelAudience = env.ZITADEL_CLIENT_ID;

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

    if (!isPublic && !deviceAuth && !memberAuth && !bearerAuth) {
      this.openObserve.logAuthFailure({
        ip: ipAddress,
        userAgent,
        reason: 'Authentication required',
        path: request.url,
        method: request.method,
        correlationId,
      });
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

    request.openObserveService = this.openObserve;

    request.v2Context = {
      openObserveService: this.openObserve,
      organizationId: deviceAuth?.organizationId || memberAuth?.organizationId || bearerAuth?.organizationId || '',
      deviceId: deviceAuth?.deviceId,
      locationId: deviceAuth?.locationId,
      memberId: memberAuth?.memberId,
      memberName: memberAuth?.memberName,
      zitadelUserId: bearerAuth?.zitadelUserId,
      customerId: bearerAuth?.customerId,
      authType,
      permissions: [...(deviceAuth?.permissions || []), ...(memberAuth?.permissions || [])],
      scopes: bearerAuth?.scopes || [],
      jwtPayload: bearerAuth?.jwtPayload,
      correlationId,
      ipAddress,
      userAgent,
      requestStartTime: Date.now(),
    };

    this.openObserve.logAuthSuccess({
      ip: ipAddress,
      userAgent,
      path: request.url,
      method: request.method,
      authType,
      organizationId: request.v2Context.organizationId,
      deviceId: request.v2Context.deviceId,
      memberId: request.v2Context.memberId,
      correlationId,
    });

    return true;
  }
}
