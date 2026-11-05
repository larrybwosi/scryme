import { Injectable, NotFoundException, BadRequestException, UnauthorizedException, Optional } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { AndroidAuthUseCase } from "./android-auth.use-case";
import { AndroidUseCase } from "./android.use-case";
import { PosPairingService } from "@/v3/modules/pos/application/services/pos-pairing.service";
import { ApiRealtimeService } from "@/common/services/realtime.service";
import {
  AndroidMemberLoginDto,
  AndroidTokenExchangeDto,
  AndroidPosPairDto,
} from "../dto/android-auth.dto";

@Injectable()
export class AndroidPosUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly androidAuthUseCase: AndroidAuthUseCase,
    private readonly androidUseCase: AndroidUseCase,
    @Optional() private readonly posPairingService?: PosPairingService,
    @Optional() private readonly realtimeService?: ApiRealtimeService,
  ) {}

  async loginMember(v3Context: any, dto: AndroidMemberLoginDto, orgSlugHeader?: string) {
    const effectiveOrgSlug = orgSlugHeader || v3Context?.orgSlug || "default";
    return this.androidAuthUseCase.loginMember(effectiveOrgSlug, undefined, dto);
  }

  async exchangeToken(dto: AndroidTokenExchangeDto) {
    return this.androidAuthUseCase.exchangeToken(dto);
  }

  async pairPosDevice(v3Context: any, dto: AndroidPosPairDto) {
    return this.androidUseCase.registerDevice(v3Context, {
      deviceId: dto.sessionId || dto.pairingCode || `ANDROID-POS-${Date.now()}`,
      modelName: dto.deviceName || "Android POS Terminal",
      appVersion: "1.0.0",
      metadata: {
        pairingCode: dto.pairingCode,
        sessionId: dto.sessionId,
        deviceType: dto.deviceType || "ANDROID_POS",
      },
    });
  }

  async authorizePosPairingSession(v3Context: any, sessionId: string, dto: AndroidPosPairDto) {
    const { organizationId, memberId } = v3Context || {};
    const identifier = sessionId || dto.sessionId || dto.pairingCode;

    let provisionPayload: any = null;

    if (this.posPairingService && identifier && organizationId && memberId) {
      const existingSession = this.posPairingService.findSession(identifier);
      if (existingSession) {
        provisionPayload = await this.posPairingService.authorizeSession(
          identifier,
          organizationId,
          memberId,
          this.prisma,
          {
            locationId: dto.locationId,
            deviceName: dto.deviceName,
            deviceType: dto.deviceType,
          }
        );

        if (this.realtimeService) {
          try {
            const session = this.posPairingService.getSession(identifier);
            const payload = {
              sessionId: session.sessionId,
              pairingCode: session.pairingCode,
              status: session.status,
              payload: provisionPayload,
            };

            await this.realtimeService.publish(`pos:pairing:${session.sessionId}`, "pairing:authorized", payload);
            await this.realtimeService.publish(`pos:pairing:${session.pairingCode}`, "pairing:authorized", payload);
            await this.realtimeService.publish(`v3:pos:pairing:${session.sessionId}`, "pairing:authorized", payload);
            await this.realtimeService.publish(`v3:pos:pairing:${session.pairingCode}`, "pairing:authorized", payload);
          } catch (e: any) {
            console.error("Failed to publish socket event for pos pairing authorization:", e?.message || e);
          }
        }
      }
    }

    const deviceRegistration = await this.pairPosDevice(v3Context, {
      ...dto,
      sessionId: identifier,
    });

    return {
      success: true,
      sessionId: identifier,
      device: deviceRegistration,
      provision: provisionPayload,
      authorized: true,
    };
  }
}
