import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { AndroidAuthUseCase } from "./android-auth.use-case";
import { AndroidUseCase } from "./android.use-case";
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
    return this.pairPosDevice(v3Context, {
      ...dto,
      sessionId,
    });
  }
}
